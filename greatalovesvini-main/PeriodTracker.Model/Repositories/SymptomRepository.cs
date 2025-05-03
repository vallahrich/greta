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
                    return new Symptom
                    {
                        SymptomId = Convert.ToInt32(data["symptom_id"]),
                        Name = data["name"].ToString(),
                        Icon = data["icon"]?.ToString()
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
                        symptoms.Add(new Symptom
                        {
                            SymptomId = Convert.ToInt32(data["symptom_id"]),
                            Name = data["name"].ToString(),
                            Icon = data["icon"]?.ToString()
                        });
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
                    INSERT INTO Symptoms (name, icon)
                    VALUES (@name, @icon)
                    RETURNING symptom_id";
                
                cmd.Parameters.AddWithValue("@name", NpgsqlDbType.Varchar, symptom.Name);
                cmd.Parameters.AddWithValue("@icon", NpgsqlDbType.Varchar, (object)symptom.Icon ?? DBNull.Value);
                
                dbConn.Open();
                var symptomId = Convert.ToInt32(cmd.ExecuteScalar());
                symptom.SymptomId = symptomId;
                
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
                
                cmd.Parameters.AddWithValue("@name", NpgsqlDbType.Varchar, symptom.Name);
                cmd.Parameters.AddWithValue("@icon", NpgsqlDbType.Varchar, (object)symptom.Icon ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@symptomId", NpgsqlDbType.Integer, symptom.SymptomId);
                
                return UpdateData(dbConn, cmd);
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
                
                return DeleteData(dbConn, cmd);
            }
            finally
            {
                dbConn?.Close();
            }
        }
    }
}