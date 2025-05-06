using Microsoft.Extensions.Configuration;
using Npgsql;
using NpgsqlTypes;

// Repository for Symptom: handles retrieval of symptom definitions
public class SymptomRepository : BaseRepository
{
    // Constructor passes IConfiguration to BaseRepository to retrieve the connection string
    public SymptomRepository(IConfiguration configuration) : base(configuration)
    {
    }

    // Retrieves a single Symptom by its ID, or returns null if not found
    public Symptom GetById(int id)
    {
        // Validate input parameter
        if (id <= 0) throw new ArgumentOutOfRangeException(nameof(id), "Id must be greater than zero");

        // Open and dispose connection/command with using blocks
        using var conn = new NpgsqlConnection(ConnectionString);
        using var cmd  = conn.CreateCommand();
        cmd.CommandText = "SELECT * FROM Symptoms WHERE symptom_id = @id";
        cmd.Parameters.AddWithValue("@id", NpgsqlDbType.Integer, id);

        // Execute query and dispose reader
        using var reader = GetData(conn, cmd);
        if (reader.Read())
        {
            // Map database columns to Symptom entity
            return new Symptom(Convert.ToInt32(reader["symptom_id"]))
            {
                Name = reader["name"].ToString(),
                Icon = reader["icon"]?.ToString()
            };
        }
        return null;
    }

    // Retrieves all Symptom definitions, ordered alphabetically by name
    public List<Symptom> GetAllSymptoms()
    {
        var symptoms = new List<Symptom>();

        using var conn = new NpgsqlConnection(ConnectionString);
        using var cmd  = conn.CreateCommand();
        cmd.CommandText = "SELECT * FROM Symptoms ORDER BY name";

        // Execute reader and iterate rows
        using var reader = GetData(conn, cmd);
        while (reader.Read())
        {
            symptoms.Add(new Symptom(Convert.ToInt32(reader["symptom_id"]))
            {
                Name = reader["name"].ToString(),
                Icon = reader["icon"]?.ToString()
            });
        }
        return symptoms;
    }
}