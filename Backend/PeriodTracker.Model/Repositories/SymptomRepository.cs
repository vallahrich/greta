/// <summary>
/// SymptomRepository - Handles data access for Symptom entities
/// 
/// This repository manages:
/// - Retrieving a specific symptom by ID
/// - Retrieving the complete list of available symptoms
/// 
/// It's a simpler repository since symptoms are essentially a lookup table
/// with predefined values that rarely change.
/// </summary>

using Microsoft.Extensions.Configuration;
using Npgsql;
using NpgsqlTypes;

// Repository for symptom reference data
public class SymptomRepository : BaseRepository
{
    // Constructor inherits connection setup from BaseRepository
    public SymptomRepository(IConfiguration configuration) : base(configuration)
    {
    }

    // Retrieves a specific symptom by ID
    public Symptom GetById(int id)
    {
        // Input validation
        if (id <= 0) throw new ArgumentOutOfRangeException(nameof(id), "Id must be greater than zero");

        // Open database connection
        using var conn = new NpgsqlConnection(ConnectionString);
        using var cmd  = conn.CreateCommand();
        cmd.CommandText = "SELECT * FROM Symptoms WHERE symptom_id = @id";
        cmd.Parameters.AddWithValue("@id", NpgsqlDbType.Integer, id);

        // Execute query and map result
        using var reader = GetData(conn, cmd);
        if (reader.Read())
        {
            // Map database row to Symptom entity
            return new Symptom(Convert.ToInt32(reader["symptom_id"]))
            {
                Name = reader["name"].ToString(),
                Icon = reader["icon"]?.ToString() // Icon is optional
            };
        }
        return null; // No symptom found
    }

    // Retrieves all available symptoms
    public List<Symptom> GetAllSymptoms()
    {
        var symptoms = new List<Symptom>();

        using var conn = new NpgsqlConnection(ConnectionString);
        using var cmd  = conn.CreateCommand();
        cmd.CommandText = "SELECT * FROM Symptoms ORDER BY name";

        // Execute query and iterate through results
        using var reader = GetData(conn, cmd);
        while (reader.Read())
        {
            // Add each symptom to the list
            symptoms.Add(new Symptom(Convert.ToInt32(reader["symptom_id"]))
            {
                Name = reader["name"].ToString(),
                Icon = reader["icon"]?.ToString()
            });
        }
        return symptoms;
    }
}