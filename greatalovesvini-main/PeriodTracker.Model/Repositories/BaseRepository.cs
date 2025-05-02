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
            // Log warning about missing connection string
            Console.WriteLine("[WARNING] Database connection string is missing or empty!");
            
            // Provide a default connection string for development
            connString = "Host=localhost;Username=postgres;Password=postgres;Database=period_tracker_db";
            Console.WriteLine($"[WARNING] Using default connection string: {connString.Replace("Password=", "Password=***")}");
        }
        
        ConnectionString = connString;
        
        // Test connection on startup
        TestConnection();
    }
    
    private void TestConnection()
    {
        try
        {
            using (var conn = new NpgsqlConnection(ConnectionString))
            {
                conn.Open();
                Console.WriteLine("[DB] Database connection test successful");
                conn.Close();
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine("[DB ERROR] Failed to connect to database: " + ex.Message);
            Console.WriteLine($"[DB] Connection string (masked): {ConnectionString.Replace("Password=", "Password=***")}");
            
            if (ex.InnerException != null)
            {
                Console.WriteLine("[DB ERROR] Inner exception: " + ex.InnerException.Message);
            }
        }
    }
    
    protected NpgsqlDataReader GetData(NpgsqlConnection conn, NpgsqlCommand cmd)
    {
        try
        {
            conn.Open();
            Console.WriteLine($"[DB] Executing query: {cmd.CommandText}");
            return cmd.ExecuteReader();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[DB ERROR] Error executing query: {ex.Message}");
            Console.WriteLine($"[DB] Query: {cmd.CommandText}");
            throw;
        }
    }
    
    protected bool InsertData(NpgsqlConnection conn, NpgsqlCommand cmd)
    {
        try
        {
            conn.Open();
            Console.WriteLine($"[DB] Executing insert: {cmd.CommandText}");
            cmd.ExecuteNonQuery();
            return true;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[DB ERROR] Error inserting data: {ex.Message}");
            Console.WriteLine($"[DB] Query: {cmd.CommandText}");
            return false;
        }
    }
    
    protected bool UpdateData(NpgsqlConnection conn, NpgsqlCommand cmd)
    {
        try
        {
            conn.Open();
            Console.WriteLine($"[DB] Executing update: {cmd.CommandText}");
            cmd.ExecuteNonQuery();
            return true;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[DB ERROR] Error updating data: {ex.Message}");
            Console.WriteLine($"[DB] Query: {cmd.CommandText}");
            return false;
        }
    }
    
    protected bool DeleteData(NpgsqlConnection conn, NpgsqlCommand cmd)
    {
        try
        {
            conn.Open();
            Console.WriteLine($"[DB] Executing delete: {cmd.CommandText}");
            cmd.ExecuteNonQuery();
            return true;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[DB ERROR] Error deleting data: {ex.Message}");
            Console.WriteLine($"[DB] Query: {cmd.CommandText}");
            return false;
        }
    }
}