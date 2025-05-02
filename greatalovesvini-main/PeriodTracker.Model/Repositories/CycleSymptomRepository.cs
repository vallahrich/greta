using Microsoft.Extensions.Configuration;
using PeriodTracker.Model.Entities;
using Npgsql;
using NpgsqlTypes;

namespace PeriodTracker.Model.Repositories
{
    public class CycleSymptomRepository : BaseRepository
    {
        public CycleSymptomRepository(IConfiguration configuration) : base(configuration)
        {
        }

        public CycleSymptom GetById(int id)
        {
            NpgsqlConnection dbConn = null;
            try
            {
                dbConn = new NpgsqlConnection(ConnectionString);
                var cmd = dbConn.CreateCommand();
                cmd.CommandText = "SELECT * FROM CycleSymptoms WHERE cycle_symptom_id = @id";
                cmd.Parameters.Add("@id", NpgsqlDbType.Integer).Value = id;
                
                var data = GetData(dbConn, cmd);
                if (data != null && data.Read())
                {
                    return new CycleSymptom(Convert.ToInt32(data["cycle_symptom_id"]))
                    {
                        cycleId = Convert.ToInt32(data["cycle_id"]),
                        symptomId = Convert.ToInt32(data["symptom_id"]),
                        intensity = Convert.ToInt32(data["intensity"]),
                        date = Convert.ToDateTime(data["date"]),
                        createdAt = Convert.ToDateTime(data["created_at"])
                    };
                }
                return null;
            }
            finally
            {
                dbConn?.Close();
            }
        }

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
                cmd.Parameters.Add("@cycleId", NpgsqlDbType.Integer).Value = cycleId;
                
                var data = GetData(dbConn, cmd);
                if (data != null)
                {
                    while (data.Read())
                    {
                        CycleSymptom symptom = new CycleSymptom(Convert.ToInt32(data["cycle_symptom_id"]))
                        {
                            cycleId = Convert.ToInt32(data["cycle_id"]),
                            symptomId = Convert.ToInt32(data["symptom_id"]),
                            intensity = Convert.ToInt32(data["intensity"]),
                            date = Convert.ToDateTime(data["date"]),
                            createdAt = Convert.ToDateTime(data["created_at"]),
                            // Create the associated Symptom object
                            Symptom = new Symptom(Convert.ToInt32(data["symptom_id"]))
                            {
                                name = data["name"].ToString(),
                                icon = data["icon"]?.ToString()
                            }
                        };
                        symptoms.Add(symptom);
                    }
                }
                return symptoms;
            }
            finally
            {
                dbConn?.Close();
            }
        }

        public List<CycleSymptom> GetSymptomsByDate(DateTime date)
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
                    WHERE cs.date = @date
                    ORDER BY s.name";
                cmd.Parameters.Add("@date", NpgsqlDbType.Date).Value = date;
                
                var data = GetData(dbConn, cmd);
                if (data != null)
                {
                    while (data.Read())
                    {
                        CycleSymptom symptom = new CycleSymptom(Convert.ToInt32(data["cycle_symptom_id"]))
                        {
                            cycleId = Convert.ToInt32(data["cycle_id"]),
                            symptomId = Convert.ToInt32(data["symptom_id"]),
                            intensity = Convert.ToInt32(data["intensity"]),
                            date = Convert.ToDateTime(data["date"]),
                            createdAt = Convert.ToDateTime(data["created_at"]),
                            // Create the associated Symptom object
                            Symptom = new Symptom(Convert.ToInt32(data["symptom_id"]))
                            {
                                name = data["name"].ToString(),
                                icon = data["icon"]?.ToString()
                            }
                        };
                        symptoms.Add(symptom);
                    }
                }
                return symptoms;
            }
            finally
            {
                dbConn?.Close();
            }
        }

        public bool InsertCycleSymptom(CycleSymptom cycleSymptom)
        {
            NpgsqlConnection dbConn = null;
            try
            {
                dbConn = new NpgsqlConnection(ConnectionString);
                var cmd = dbConn.CreateCommand();
                cmd.CommandText = @"
                    INSERT INTO CycleSymptoms 
                    (cycle_id, symptom_id, intensity, date)
                    VALUES 
                    (@cycleId, @symptomId, @intensity, @date)
                    RETURNING cycle_symptom_id";
                
                cmd.Parameters.AddWithValue("@cycleId", NpgsqlDbType.Integer, cycleSymptom.cycleId);
                cmd.Parameters.AddWithValue("@symptomId", NpgsqlDbType.Integer, cycleSymptom.symptomId);
                cmd.Parameters.AddWithValue("@intensity", NpgsqlDbType.Integer, cycleSymptom.intensity);
                cmd.Parameters.AddWithValue("@date", NpgsqlDbType.Date, cycleSymptom.date);
                
                dbConn.Open();
                // Get the newly created cycle symptom ID
                var cycleSymptomId = Convert.ToInt32(cmd.ExecuteScalar());
                cycleSymptom.cycleSymptomId = cycleSymptomId;
                
                return true;
            }
            catch (Exception)
            {
                return false;
            }
            finally
            {
                dbConn?.Close();
            }
        }

        public bool UpdateCycleSymptom(CycleSymptom cycleSymptom)
        {
            NpgsqlConnection dbConn = null;
            try
            {
                dbConn = new NpgsqlConnection(ConnectionString);
                var cmd = dbConn.CreateCommand();
                cmd.CommandText = @"
                    UPDATE CycleSymptoms SET
                    intensity = @intensity,
                    date = @date
                    WHERE cycle_symptom_id = @cycleSymptomId";
                
                cmd.Parameters.AddWithValue("@intensity", NpgsqlDbType.Integer, cycleSymptom.intensity);
                cmd.Parameters.AddWithValue("@date", NpgsqlDbType.Date, cycleSymptom.date);
                cmd.Parameters.AddWithValue("@cycleSymptomId", NpgsqlDbType.Integer, cycleSymptom.cycleSymptomId);
                
                bool result = UpdateData(dbConn, cmd);
                return result;
            }
            finally
            {
                dbConn?.Close();
            }
        }

        public bool DeleteCycleSymptom(int id)
        {
            NpgsqlConnection dbConn = null;
            try
            {
                dbConn = new NpgsqlConnection(ConnectionString);
                var cmd = dbConn.CreateCommand();
                cmd.CommandText = "DELETE FROM CycleSymptoms WHERE cycle_symptom_id = @id";
                cmd.Parameters.AddWithValue("@id", NpgsqlDbType.Integer, id);
                
                bool result = DeleteData(dbConn, cmd);
                return result;
            }
            finally
            {
                dbConn?.Close();
            }
        }

        public bool DeleteCycleSymptomsByCycleId(int cycleId)
        {
            NpgsqlConnection dbConn = null;
            try
            {
                dbConn = new NpgsqlConnection(ConnectionString);
                var cmd = dbConn.CreateCommand();
                cmd.CommandText = "DELETE FROM CycleSymptoms WHERE cycle_id = @cycleId";
                cmd.Parameters.AddWithValue("@cycleId", NpgsqlDbType.Integer, cycleId);
                
                bool result = DeleteData(dbConn, cmd);
                return result;
            }
            finally
            {
                dbConn?.Close();
            }
        }
    }
}