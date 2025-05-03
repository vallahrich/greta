using Npgsql;
using Microsoft.Extensions.Configuration;

namespace PeriodTracker.Model.Repositories;

public class BaseRepository
{
    protected string ConnectionString { get; }
    
    public BaseRepository(IConfiguration configuration)
    {
        // Get connection string from configuration
        var connString = configuration.GetConnectionString("gretaDB");
        
        if (string.IsNullOrEmpty(connString))
        {
            throw new InvalidOperationException("Database connection string is not configured.");
        }
        
        ConnectionString = connString;
    }
    
    protected NpgsqlDataReader GetData(NpgsqlConnection conn, NpgsqlCommand cmd)
    {
        conn.Open();
        return cmd.ExecuteReader();
    }
    
    protected bool InsertData(NpgsqlConnection conn, NpgsqlCommand cmd)
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