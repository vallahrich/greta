using Microsoft.Extensions.Configuration;
using PeriodTracker.Model.Entities;
using Npgsql;
using NpgsqlTypes;

namespace PeriodTracker.Model.Repositories
{
    public class SymptomRepository : BaseRepository
    {
        public SymptomRepository(IConfiguration configuration) : base(configuration)
        {
        }

        public Symptom GetById(int id)
        {
            NpgsqlConnection dbConn = null;
            try
            {
                dbConn = new NpgsqlConnection(ConnectionString);
                var cmd = dbConn.CreateCommand();
                cmd.CommandText = "SELECT * FROM Symptoms WHERE symptom_id = @id";
                cmd.Parameters.Add("@id", NpgsqlDbType.Integer).Value = id;
                
                var data = GetData(dbConn, cmd);
                if (data != null && data.Read())
                {
                    return new Symptom(Convert.ToInt32(data["symptom_id"]))
                    {
                        name = data["name"].ToString(),
                        icon = data["icon"]?.ToString()
                    };
                }
                return null;
            }
            finally
            {
                dbConn?.Close();
            }
        }

        public List<Symptom> GetAllSymptoms()
        {
            NpgsqlConnection dbConn = null;
            var symptoms = new List<Symptom>();
            try
            {
                dbConn = new NpgsqlConnection(ConnectionString);
                var cmd = dbConn.CreateCommand();
                cmd.CommandText = "SELECT * FROM Symptoms ORDER BY name";
                
                var data = GetData(dbConn, cmd);
                if (data != null)
                {
                    while (data.Read())
                    {
                        Symptom symptom = new Symptom(Convert.ToInt32(data["symptom_id"]))
                        {
                            name = data["name"].ToString(),
                            icon = data["icon"]?.ToString()
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

        public bool InsertSymptom(Symptom symptom)
        {
            NpgsqlConnection dbConn = null;
            try
            {
                dbConn = new NpgsqlConnection(ConnectionString);
                var cmd = dbConn.CreateCommand();
                cmd.CommandText = @"
                    INSERT INTO Symptoms 
                    (name, icon)
                    VALUES 
                    (@name, @icon)
                    RETURNING symptom_id";
                
                cmd.Parameters.AddWithValue("@name", NpgsqlDbType.Varchar, symptom.name);
                cmd.Parameters.AddWithValue("@icon", NpgsqlDbType.Varchar, (object)symptom.icon ?? DBNull.Value);
                
                dbConn.Open();
                // Get the newly created symptom ID
                var symptomId = Convert.ToInt32(cmd.ExecuteScalar());
                symptom.symptomId = symptomId;
                
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

        public bool UpdateSymptom(Symptom symptom)
        {
            NpgsqlConnection dbConn = null;
            try
            {
                dbConn = new NpgsqlConnection(ConnectionString);
                var cmd = dbConn.CreateCommand();
                cmd.CommandText = @"
                    UPDATE Symptoms SET
                    name = @name,
                    icon = @icon
                    WHERE symptom_id = @symptomId";
                
                cmd.Parameters.AddWithValue("@name", NpgsqlDbType.Varchar, symptom.name);
                cmd.Parameters.AddWithValue("@icon", NpgsqlDbType.Varchar, (object)symptom.icon ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@symptomId", NpgsqlDbType.Integer, symptom.symptomId);
                
                bool result = UpdateData(dbConn, cmd);
                return result;
            }
            finally
            {
                dbConn?.Close();
            }
        }

        public bool DeleteSymptom(int id)
        {
            NpgsqlConnection dbConn = null;
            try
            {
                dbConn = new NpgsqlConnection(ConnectionString);
                var cmd = dbConn.CreateCommand();
                cmd.CommandText = "DELETE FROM Symptoms WHERE symptom_id = @id";
                cmd.Parameters.AddWithValue("@id", NpgsqlDbType.Integer, id);
                
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