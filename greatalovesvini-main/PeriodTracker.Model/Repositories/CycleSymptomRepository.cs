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
                    return new CycleSymptom
                    {
                        CycleSymptomId = Convert.ToInt32(data["cycle_symptom_id"]),
                        CycleId = Convert.ToInt32(data["cycle_id"]),
                        SymptomId = Convert.ToInt32(data["symptom_id"]),
                        Intensity = Convert.ToInt32(data["intensity"]),
                        Date = Convert.ToDateTime(data["date"])
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
                        var symptom = new CycleSymptom
                        {
                            CycleSymptomId = Convert.ToInt32(data["cycle_symptom_id"]),
                            CycleId = Convert.ToInt32(data["cycle_id"]),
                            SymptomId = Convert.ToInt32(data["symptom_id"]),
                            Intensity = Convert.ToInt32(data["intensity"]),
                            Date = Convert.ToDateTime(data["date"]),
                            Symptom = new Symptom
                            {
                                SymptomId = Convert.ToInt32(data["symptom_id"]),
                                Name = data["name"].ToString(),
                                Icon = data["icon"]?.ToString()
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
                    INSERT INTO CycleSymptoms (cycle_id, symptom_id, intensity, date)
                    VALUES (@cycleId, @symptomId, @intensity, @date)
                    RETURNING cycle_symptom_id";
                
                cmd.Parameters.AddWithValue("@cycleId", NpgsqlDbType.Integer, cycleSymptom.CycleId);
                cmd.Parameters.AddWithValue("@symptomId", NpgsqlDbType.Integer, cycleSymptom.SymptomId);
                cmd.Parameters.AddWithValue("@intensity", NpgsqlDbType.Integer, cycleSymptom.Intensity);
                cmd.Parameters.AddWithValue("@date", NpgsqlDbType.Date, cycleSymptom.Date);
                
                dbConn.Open();
                var cycleSymptomId = Convert.ToInt32(cmd.ExecuteScalar());
                cycleSymptom.CycleSymptomId = cycleSymptomId;
                
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
                
                cmd.Parameters.AddWithValue("@intensity", NpgsqlDbType.Integer, cycleSymptom.Intensity);
                cmd.Parameters.AddWithValue("@date", NpgsqlDbType.Date, cycleSymptom.Date);
                cmd.Parameters.AddWithValue("@cycleSymptomId", NpgsqlDbType.Integer, cycleSymptom.CycleSymptomId);
                
                return UpdateData(dbConn, cmd);
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
                
                return DeleteData(dbConn, cmd);
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
                
                return DeleteData(dbConn, cmd);
            }
            finally
            {
                dbConn?.Close();
            }
        }
    }
}