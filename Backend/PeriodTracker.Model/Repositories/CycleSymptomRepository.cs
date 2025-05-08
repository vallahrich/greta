/// <summary>
/// CycleSymptomRepository - Handles data access for CycleSymptom entities
/// 
/// This repository manages:
/// - Retrieving symptoms by ID or cycle ID
/// - Creating new symptom records for a cycle
/// - Updating existing symptom records
/// - Deleting symptom records (individually or all for a cycle)
/// 
/// It implements the many-to-many relationship between cycles and symptoms.
/// </summary>

using Microsoft.Extensions.Configuration;
using Npgsql;
using NpgsqlTypes;


// Repository for symptom tracking within cycles
public class CycleSymptomRepository : BaseRepository
{
    // Constructor inherits connection setup from BaseRepository
    public CycleSymptomRepository(IConfiguration configuration) : base(configuration)
    {
    }

    // Retrieves a specific cycle-symptom record by ID
    public CycleSymptom GetById(int id)
    {
        NpgsqlConnection dbConn = null;
        try
        {
            dbConn = new NpgsqlConnection(ConnectionString);
            var cmd = dbConn.CreateCommand();
            cmd.CommandText = "SELECT * FROM CycleSymptoms WHERE cycle_symptom_id = @id";
            cmd.Parameters.Add("@id", NpgsqlDbType.Integer).Value = id;

            // Execute query and map result
            var data = GetData(dbConn, cmd);
            if (data.Read())
            {
                // Map database row to CycleSymptom entity
                return new CycleSymptom
                {
                    CycleSymptomId = Convert.ToInt32(data["cycle_symptom_id"]),
                    CycleId        = Convert.ToInt32(data["cycle_id"]),
                    SymptomId      = Convert.ToInt32(data["symptom_id"]),
                    Intensity      = Convert.ToInt32(data["intensity"]),
                    Date           = Convert.ToDateTime(data["date"])
                };
            }
            return null; // No record found
        }
        finally
        {
            // Ensure connection is closed
            dbConn?.Close();
        }
    }

    // Updates an existing symptom record
    public bool UpdateCycleSymptom(CycleSymptom cycleSymptom)
    {
        NpgsqlConnection dbConn = null;
        try
        {
            dbConn = new NpgsqlConnection(ConnectionString);
            var cmd = dbConn.CreateCommand();
            cmd.CommandText = @"
                UPDATE CycleSymptoms 
                SET cycle_id = @cycleId, 
                    symptom_id = @symptomId,
                    intensity = @intensity, 
                    date = @date
                WHERE cycle_symptom_id = @id";
            
            cmd.Parameters.AddWithValue("@cycleId", NpgsqlDbType.Integer, cycleSymptom.CycleId);
            cmd.Parameters.AddWithValue("@symptomId", NpgsqlDbType.Integer, cycleSymptom.SymptomId);
            cmd.Parameters.AddWithValue("@intensity", NpgsqlDbType.Integer, cycleSymptom.Intensity);
            cmd.Parameters.AddWithValue("@date", NpgsqlDbType.Date, cycleSymptom.Date);
            cmd.Parameters.AddWithValue("@id", NpgsqlDbType.Integer, cycleSymptom.CycleSymptomId);

            return UpdateData(dbConn, cmd);
        }
        finally
        {
            dbConn?.Close();
        }
    }

    // Retrieves all symptoms for a specific cycle, joined with symptom details
    public List<CycleSymptom> GetSymptomsByCycleId(int cycleId)
    {
        NpgsqlConnection dbConn = null;
        var symptoms = new List<CycleSymptom>();
        try
        {
            dbConn = new NpgsqlConnection(ConnectionString);
            var cmd = dbConn.CreateCommand();
            // Join with Symptoms table to get symptom names
            cmd.CommandText = @"
                SELECT cs.*, s.name, s.icon 
                FROM CycleSymptoms cs
                JOIN Symptoms s ON cs.symptom_id = s.symptom_id
                WHERE cs.cycle_id = @cycleId
                ORDER BY cs.date";
            cmd.Parameters.AddWithValue("@cycleId", NpgsqlDbType.Integer, cycleId);

            // Execute query and map results
            var data = GetData(dbConn, cmd);
            while (data.Read())
            {
                // Create CycleSymptom with nested Symptom object
                symptoms.Add(new CycleSymptom
                {
                    CycleSymptomId = Convert.ToInt32(data["cycle_symptom_id"]),
                    CycleId        = Convert.ToInt32(data["cycle_id"]),
                    SymptomId      = Convert.ToInt32(data["symptom_id"]),
                    Intensity      = Convert.ToInt32(data["intensity"]),
                    Date           = Convert.ToDateTime(data["date"]),
                    Symptom        = new Symptom(Convert.ToInt32(data["symptom_id"]))
                    {
                        Name = data["name"].ToString(),
                        Icon = data["icon"].ToString()
                    }
                });
            }
            return symptoms;
        }
        finally
        {
            dbConn?.Close();
        }
    }

    // Creates a new symptom record for a cycle
    public bool InsertCycleSymptom(CycleSymptom cycleSymptom)
    {
        NpgsqlConnection dbConn = null;
        try
        {
            dbConn = new NpgsqlConnection(ConnectionString);
            var cmd = dbConn.CreateCommand();
            cmd.CommandText = @"
                INSERT INTO CycleSymptoms (cycle_id, symptom_id, intensity, date)
                VALUES (@cycleId, @symptomId, @intensity, @date)
                RETURNING cycle_symptom_id";
            cmd.Parameters.AddWithValue("@cycleId", NpgsqlDbType.Integer, cycleSymptom.CycleId);
            cmd.Parameters.AddWithValue("@symptomId", NpgsqlDbType.Integer, cycleSymptom.SymptomId);
            cmd.Parameters.AddWithValue("@intensity", NpgsqlDbType.Integer, cycleSymptom.Intensity);
            cmd.Parameters.AddWithValue("@date", NpgsqlDbType.Date, cycleSymptom.Date);

            dbConn.Open();
            // Execute and get the generated ID
            cycleSymptom.CycleSymptomId = Convert.ToInt32(cmd.ExecuteScalar());
            return true;
        }
        catch
        {
            return false;
        }
        finally
        {
            dbConn?.Close();
        }
    }

    // Deletes a single symptom record
    public bool DeleteCycleSymptom(int id)
    {
        NpgsqlConnection dbConn = null;
        try
        {
            dbConn = new NpgsqlConnection(ConnectionString);
            var cmd = dbConn.CreateCommand();
            cmd.CommandText = "DELETE FROM CycleSymptoms WHERE cycle_symptom_id = @id";
            cmd.Parameters.AddWithValue("@id", NpgsqlDbType.Integer, id);

            return DeleteData(dbConn, cmd);
        }
        finally
        {
            dbConn?.Close();
        }
    }

    // Deletes all symptoms for a cycle (used when deleting a cycle)
    public bool DeleteCycleSymptomsByCycleId(int cycleId)
    {
        NpgsqlConnection dbConn = null;
        try
        {
            dbConn = new NpgsqlConnection(ConnectionString);
            var cmd = dbConn.CreateCommand();
            cmd.CommandText = "DELETE FROM CycleSymptoms WHERE cycle_id = @cycleId";
            cmd.Parameters.AddWithValue("@cycleId", NpgsqlDbType.Integer, cycleId);

            return DeleteData(dbConn, cmd);
        }
        catch (Exception ex)
        {
            // Log error in a real application
            return false;
        }
        finally
        {
            dbConn?.Close();
        }
    }
}