/// <summary>
/// BaseRepository - Abstract base class for database access
/// 
/// This class provides common database operations for all repositories:
/// - Establishing database connections
/// - Executing queries and commands
/// - Handling basic CRUD operations
/// 
/// All specific repositories inherit from this class to share connection 
/// handling and common database operation patterns.
/// </summary>

using Microsoft.Extensions.Configuration;
using Npgsql;

// Base class that all repositories inherit from
public class BaseRepository
{
    // Protected property accessible to derived classes
    protected string ConnectionString { get; }
    
    // Constructor reads the connection string from app configuration
    public BaseRepository(IConfiguration configuration)
    {
        var connString = configuration.GetConnectionString("gretaDB");
        if (string.IsNullOrEmpty(connString))
        {
            // Fail fast if the connection string is missing
            throw new InvalidOperationException("Database connection string is not configured.");
        }
        ConnectionString = connString;
    }
    
    // Executes a SQL SELECT query and returns a DataReader
    // Caller must dispose the connection when done with the reader
    protected NpgsqlDataReader GetData(NpgsqlConnection conn, NpgsqlCommand cmd)
    {
        conn.Open();            // Open the connection
        return cmd.ExecuteReader(); // Execute and return results
    }
    
    // Executes an INSERT command
    protected bool InsertData(NpgsqlConnection conn, NpgsqlCommand cmd)
    {
        try
        {
            conn.Open();
            cmd.ExecuteNonQuery(); // Run the command
            return true;           // Success
        }
        catch
        {
            // Swallow exception and return failure
            return false;
        }
    }
    
    // Executes an UPDATE command
    protected bool UpdateData(NpgsqlConnection conn, NpgsqlCommand cmd)
    {
        try
        {
            conn.Open();
            cmd.ExecuteNonQuery();
            return true;
        }
        catch
        {
            return false;
        }
    }
    
    // Executes a DELETE command
    protected bool DeleteData(NpgsqlConnection conn, NpgsqlCommand cmd)
    {
        try
        {
            conn.Open();
            cmd.ExecuteNonQuery();
            return true;
        }
        catch
        {
            return false;
        }
    }
}