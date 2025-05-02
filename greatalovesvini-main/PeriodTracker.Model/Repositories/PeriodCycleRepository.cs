using Microsoft.Extensions.Configuration;
using PeriodTracker.Model.Entities;
using Npgsql;
using NpgsqlTypes;

namespace PeriodTracker.Model.Repositories
{
    public class PeriodCycleRepository : BaseRepository
    {
        public PeriodCycleRepository(IConfiguration configuration) : base(configuration)
        {
        }

        public PeriodCycle GetById(int id)
        {
            NpgsqlConnection dbConn = null;
            try
            {
                dbConn = new NpgsqlConnection(ConnectionString);
                var cmd = dbConn.CreateCommand();
                cmd.CommandText = "SELECT * FROM PeriodCycle WHERE cycle_id = @id";
                cmd.Parameters.Add("@id", NpgsqlDbType.Integer).Value = id;
                
                var data = GetData(dbConn, cmd);
                if (data != null && data.Read())
                {
                    return new PeriodCycle(Convert.ToInt32(data["cycle_id"]))
                    {
                        userId = Convert.ToInt32(data["user_id"]),
                        startDate = Convert.ToDateTime(data["start_date"]),
                        endDate = Convert.ToDateTime(data["end_date"]),
                        notes = data["notes"] != DBNull.Value ? data["notes"].ToString() : null,
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

        public List<PeriodCycle> GetCyclesByUserId(int userId)
        {
            NpgsqlConnection dbConn = null;
            var cycles = new List<PeriodCycle>();
            try
            {
                dbConn = new NpgsqlConnection(ConnectionString);
                var cmd = dbConn.CreateCommand();
                cmd.CommandText = "SELECT * FROM PeriodCycle WHERE user_id = @userId ORDER BY start_date DESC";
                cmd.Parameters.Add("@userId", NpgsqlDbType.Integer).Value = userId;
                
                var data = GetData(dbConn, cmd);
                if (data != null)
                {
                    while (data.Read())
                    {
                        PeriodCycle cycle = new PeriodCycle(Convert.ToInt32(data["cycle_id"]))
                        {
                            userId = Convert.ToInt32(data["user_id"]),
                            startDate = Convert.ToDateTime(data["start_date"]),
                            endDate = Convert.ToDateTime(data["end_date"]),
                            notes = data["notes"] != DBNull.Value ? data["notes"].ToString() : null,
                            createdAt = Convert.ToDateTime(data["created_at"])
                        };
                        cycles.Add(cycle);
                    }
                }
                return cycles;
            }
            finally
            {
                dbConn?.Close();
            }
        }

        public bool InsertCycle(PeriodCycle cycle)
        {
            NpgsqlConnection dbConn = null;
            try
            {
                dbConn = new NpgsqlConnection(ConnectionString);
                var cmd = dbConn.CreateCommand();
                cmd.CommandText = @"
                    INSERT INTO PeriodCycle 
                    (user_id, start_date, end_date, notes, created_at)
                    VALUES 
                    (@userId, @startDate, @endDate, @notes, @createdAt)
                    RETURNING cycle_id";
                
                cmd.Parameters.AddWithValue("@userId", NpgsqlDbType.Integer, cycle.userId);
                cmd.Parameters.AddWithValue("@startDate", NpgsqlDbType.Date, cycle.startDate);
                cmd.Parameters.AddWithValue("@endDate", NpgsqlDbType.Date, cycle.endDate);
                cmd.Parameters.AddWithValue("@notes", NpgsqlDbType.Text, (object)cycle.notes ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@createdAt", NpgsqlDbType.TimestampTz, DateTime.UtcNow);
                
                dbConn.Open();
                // Get the newly created cycle ID
                var cycleId = Convert.ToInt32(cmd.ExecuteScalar());
                cycle.cycleId = cycleId;
                
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

        public bool UpdateCycle(PeriodCycle cycle)
        {
            NpgsqlConnection dbConn = null;
            try
            {
                dbConn = new NpgsqlConnection(ConnectionString);
                var cmd = dbConn.CreateCommand();
                cmd.CommandText = @"
                    UPDATE PeriodCycle SET
                    start_date = @startDate,
                    end_date = @endDate,
                    notes = @notes
                    WHERE cycle_id = @cycleId AND user_id = @userId";
                
                cmd.Parameters.AddWithValue("@startDate", NpgsqlDbType.Date, cycle.startDate);
                cmd.Parameters.AddWithValue("@endDate", NpgsqlDbType.Date, cycle.endDate);
                cmd.Parameters.AddWithValue("@notes", NpgsqlDbType.Text, (object)cycle.notes ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@cycleId", NpgsqlDbType.Integer, cycle.cycleId);
                cmd.Parameters.AddWithValue("@userId", NpgsqlDbType.Integer, cycle.userId);
                
                bool result = UpdateData(dbConn, cmd);
                return result;
            }
            finally
            {
                dbConn?.Close();
            }
        }

        public bool DeleteCycle(int id, int userId)
        {
            NpgsqlConnection dbConn = null;
            try
            {
                dbConn = new NpgsqlConnection(ConnectionString);
                var cmd = dbConn.CreateCommand();
                cmd.CommandText = "DELETE FROM PeriodCycle WHERE cycle_id = @id AND user_id = @userId";
                cmd.Parameters.AddWithValue("@id", NpgsqlDbType.Integer, id);
                cmd.Parameters.AddWithValue("@userId", NpgsqlDbType.Integer, userId);
                
                bool result = DeleteData(dbConn, cmd);
                return result;
            }
            finally
            {
                dbConn?.Close();
            }
        }

        public double GetAverageCycleDuration(int userId)
        {
            NpgsqlConnection dbConn = null;
            try
            {
                dbConn = new NpgsqlConnection(ConnectionString);
                var cmd = dbConn.CreateCommand();
                cmd.CommandText = "SELECT AVG(duration) FROM PeriodCycle WHERE user_id = @userId";
                cmd.Parameters.Add("@userId", NpgsqlDbType.Integer).Value = userId;
                
                dbConn.Open();
                var result = cmd.ExecuteScalar();
                
                if (result == DBNull.Value)
                {
                    return 0;
                }
                
                return Convert.ToDouble(result);
            }
            finally
            {
                dbConn?.Close();
            }
        }
    }
}