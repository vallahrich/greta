using Microsoft.Extensions.Configuration;
using Npgsql;

// Base class for database repositories, provides common DB operations
public class BaseRepository
{
    // Holds the PostgreSQL connection string
    protected string ConnectionString { get; }
    
    // Constructor reads the connection string from configuration
    public BaseRepository(IConfiguration configuration)
    {
        var connString = configuration.GetConnectionString("PeriodDB");
        if (string.IsNullOrEmpty(connString))
        {
            // Fail early if configuration is missing
            throw new InvalidOperationException("Database connection string is not configured.");
        }
        ConnectionString = connString;
    }
    
    // Executes a query command and returns a data reader (caller must dispose)
    protected NpgsqlDataReader GetData(NpgsqlConnection conn, NpgsqlCommand cmd)
    {
        conn.Open();                 // Open DB connection
        return cmd.ExecuteReader();  // Execute query and return results
    }
    
    // Executes an INSERT command, returns true on success, false on error
    protected bool InsertData(NpgsqlConnection conn, NpgsqlCommand cmd)
    {
        try
        {
            conn.Open();             // Open DB connection
            cmd.ExecuteNonQuery();   // Perform insert
            return true;
        }
        catch
        {
            // Suppress exception and return failure flag
            return false;
        }
    }
    
    // Executes an UPDATE command, returns true on success, false on error
    protected bool UpdateData(NpgsqlConnection conn, NpgsqlCommand cmd)
    {
        try
        {
            conn.Open();             // Open DB connection
            cmd.ExecuteNonQuery();   // Perform update
            return true;
        }
        catch
        {
            return false;
        }
    }
    
    // Executes a DELETE command, returns true on success, false on error
    protected bool DeleteData(NpgsqlConnection conn, NpgsqlCommand cmd)
    {
        try
        {
            conn.Open();             // Open DB connection
            cmd.ExecuteNonQuery();   // Perform delete
            return true;
        }
        catch
        {
            return false;
        }
    }
}