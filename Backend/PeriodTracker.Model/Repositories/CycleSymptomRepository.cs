using Microsoft.Extensions.Configuration;
using Npgsql;
using NpgsqlTypes;


// Repository for CRUD operations on CycleSymptom entities
public class CycleSymptomRepository : BaseRepository
{
    // Inherit connection setup from BaseRepository
    public CycleSymptomRepository(IConfiguration configuration) : base(configuration)
    {
    }

    // Retrieves a single CycleSymptom by its ID
    public CycleSymptom GetById(int id)
    {
        NpgsqlConnection dbConn = null;
        try
        {
            dbConn = new NpgsqlConnection(ConnectionString);
            var cmd = dbConn.CreateCommand();
            cmd.CommandText = "SELECT * FROM CycleSymptoms WHERE cycle_symptom_id = @id";
            cmd.Parameters.Add("@id", NpgsqlDbType.Integer).Value = id;

            // Execute reader and map first row to entity
            var data = GetData(dbConn, cmd);
            if (data.Read())
            {
                return new CycleSymptom
                {
                    CycleSymptomId = Convert.ToInt32(data["cycle_symptom_id"]),
                    CycleId        = Convert.ToInt32(data["cycle_id"]),
                    SymptomId      = Convert.ToInt32(data["symptom_id"]),
                    Intensity      = Convert.ToInt32(data["intensity"]),
                    Date           = Convert.ToDateTime(data["date"]),
                    CreatedAt      = Convert.ToDateTime(data["created_at"])
                };
            }
            return null;
        }
        finally
        {
            // Ensure connection is closed
            dbConn?.Close();
        }
    }

    // Retrieves all symptoms for a specific cycle
    public List<CycleSymptom> GetSymptomsByCycleId(int cycleId)
    {
        NpgsqlConnection dbConn = null;
        var symptoms = new List<CycleSymptom>();
        try
        {
            dbConn = new NpgsqlConnection(ConnectionString);
            var cmd = dbConn.CreateCommand();
            cmd.CommandText = @"
                SELECT cs.*, s.name, s.icon 
                FROM CycleSymptoms cs
                JOIN Symptoms s ON cs.symptom_id = s.symptom_id
                WHERE cs.cycle_id = @cycleId
                ORDER BY cs.date";
            cmd.Parameters.AddWithValue("@cycleId", NpgsqlDbType.Integer, cycleId);

            // Iterate all rows and map to CycleSymptom with nested Symptom
            var data = GetData(dbConn, cmd);
            while (data.Read())
            {
                symptoms.Add(new CycleSymptom
                {
                    CycleSymptomId = Convert.ToInt32(data["cycle_symptom_id"]),
                    CycleId        = Convert.ToInt32(data["cycle_id"]),
                    SymptomId      = Convert.ToInt32(data["symptom_id"]),
                    Intensity      = Convert.ToInt32(data["intensity"]),
                    Date           = Convert.ToDateTime(data["date"]),
                    CreatedAt      = Convert.ToDateTime(data["created_at"]),
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

    // Inserts a new CycleSymptom and sets its generated ID
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
            // Retrieve the generated ID and assign back
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

    // Updates intensity or date of an existing CycleSymptom
    public bool UpdateCycleSymptom(CycleSymptom cycleSymptom)
    {
        NpgsqlConnection dbConn = null;
        try
        {
            dbConn = new NpgsqlConnection(ConnectionString);
            var cmd = dbConn.CreateCommand();
            cmd.CommandText = @"
                UPDATE CycleSymptoms 
                SET intensity = @intensity, date = @date
                WHERE cycle_symptom_id = @id";
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

    // Deletes a single CycleSymptom by ID
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

    // Deletes all CycleSymptom entries for a given cycle
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
            Console.WriteLine($"Error deleting cycle symptoms for cycle {cycleId}: {ex.Message}");
            return false;
        }
        finally
        {
            dbConn?.Close();
        }
    }
}