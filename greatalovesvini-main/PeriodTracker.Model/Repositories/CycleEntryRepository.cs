using Microsoft.Extensions.Configuration;
using PeriodTracker.Model.Entities;
using Npgsql;
using NpgsqlTypes;

namespace PeriodTracker.Model.Repositories
{
    public class CycleEntryRepository : BaseRepository
    {
        public CycleEntryRepository(IConfiguration configuration) : base(configuration)
        {
        }

        public CycleEntry GetById(int id)
        {
            NpgsqlConnection dbConn = null;
            try
            {
                dbConn = new NpgsqlConnection(ConnectionString);
                var cmd = dbConn.CreateCommand();
                cmd.CommandText = "SELECT * FROM CycleEntry WHERE entry_id = @id";
                cmd.Parameters.Add("@id", NpgsqlDbType.Integer).Value = id;
                
                var data = GetData(dbConn, cmd);
                if (data != null && data.Read())
                {
                    return new CycleEntry(Convert.ToInt32(data["entry_id"]))
                    {
                        cycleId = Convert.ToInt32(data["cycle_id"]),
                        calendarId = Convert.ToInt32(data["calendar_id"]),
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

        public List<CycleEntry> GetEntriesByCycleId(int cycleId)
        {
            NpgsqlConnection dbConn = null;
            var entries = new List<CycleEntry>();
            try
            {
                dbConn = new NpgsqlConnection(ConnectionString);
                var cmd = dbConn.CreateCommand();
                cmd.CommandText = "SELECT * FROM CycleEntry WHERE cycle_id = @cycleId ORDER BY Date";
                cmd.Parameters.Add("@cycleId", NpgsqlDbType.Integer).Value = cycleId;
                
                var data = GetData(dbConn, cmd);
                if (data != null)
                {
                    while (data.Read())
                    {
                        CycleEntry entry = new CycleEntry(Convert.ToInt32(data["entry_id"]))
                        {
                            cycleId = Convert.ToInt32(data["cycle_id"]),
                            calendarId = Convert.ToInt32(data["calendar_id"]),
                            date = Convert.ToDateTime(data["date"]),
                            createdAt = Convert.ToDateTime(data["created_at"])
                        };
                        entries.Add(entry);
                    }
                }
                return entries;
            }
            finally
            {
                dbConn?.Close();
            }
        }

        public List<CycleEntry> GetEntriesByCalendarId(int calendarId)
        {
            NpgsqlConnection dbConn = null;
            var entries = new List<CycleEntry>();
            try
            {
                dbConn = new NpgsqlConnection(ConnectionString);
                var cmd = dbConn.CreateCommand();
                cmd.CommandText = "SELECT * FROM CycleEntry WHERE calendar_id = @calendarId ORDER BY Date";
                cmd.Parameters.Add("@calendarId", NpgsqlDbType.Integer).Value = calendarId;
                
                var data = GetData(dbConn, cmd);
                if (data != null)
                {
                    while (data.Read())
                    {
                        CycleEntry entry = new CycleEntry(Convert.ToInt32(data["entry_id"]))
                        {
                            cycleId = Convert.ToInt32(data["cycle_id"]),
                            calendarId = Convert.ToInt32(data["calendar_id"]),
                            date = Convert.ToDateTime(data["date"]),
                            createdAt = Convert.ToDateTime(data["created_at"])
                        };
                        entries.Add(entry);
                    }
                }
                return entries;
            }
            finally
            {
                dbConn?.Close();
            }
        }

        public bool InsertEntry(CycleEntry entry)
        {
            NpgsqlConnection dbConn = null;
            try
            {
                dbConn = new NpgsqlConnection(ConnectionString);
                var cmd = dbConn.CreateCommand();
                cmd.CommandText = @"
                    INSERT INTO CycleEntry 
                    (cycle_id, calendar_id, date, created_at)
                    VALUES 
                    (@cycleId, @calendarId, @date, @createdAt)
                    RETURNING entry_id";
                
                cmd.Parameters.AddWithValue("@cycleId", NpgsqlDbType.Integer, entry.cycleId);
                cmd.Parameters.AddWithValue("@calendarId", NpgsqlDbType.Integer, entry.calendarId);
                cmd.Parameters.AddWithValue("@date", NpgsqlDbType.Date, entry.date);
                cmd.Parameters.AddWithValue("@createdAt", NpgsqlDbType.TimestampTz, DateTime.UtcNow);
                
                dbConn.Open();
                // Get the newly created entry ID
                var entryId = Convert.ToInt32(cmd.ExecuteScalar());
                entry.entryId = entryId;
                
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

        public bool DeleteEntry(int id)
        {
            NpgsqlConnection dbConn = null;
            try
            {
                dbConn = new NpgsqlConnection(ConnectionString);
                var cmd = dbConn.CreateCommand();
                cmd.CommandText = "DELETE FROM CycleEntry WHERE entry_id = @id";
                cmd.Parameters.AddWithValue("@id", NpgsqlDbType.Integer, id);
                
                bool result = DeleteData(dbConn, cmd);
                return result;
            }
            finally
            {
                dbConn?.Close();
            }
        }

        public List<CycleEntry> GetEntriesByDate(DateTime date)
        {
            NpgsqlConnection dbConn = null;
            var entries = new List<CycleEntry>();
            try
            {
                dbConn = new NpgsqlConnection(ConnectionString);
                var cmd = dbConn.CreateCommand();
                cmd.CommandText = "SELECT * FROM CycleEntry WHERE Date = @date";
                cmd.Parameters.Add("@date", NpgsqlDbType.Date).Value = date;
                
                var data = GetData(dbConn, cmd);
                if (data != null)
                {
                    while (data.Read())
                    {
                        CycleEntry entry = new CycleEntry(Convert.ToInt32(data["entry_id"]))
                        {
                            cycleId = Convert.ToInt32(data["cycle_id"]),
                            calendarId = Convert.ToInt32(data["calendar_id"]),
                            date = Convert.ToDateTime(data["date"])
                        };
                        entries.Add(entry);
                    }
                }
                return entries;
            }
            finally
            {
                dbConn?.Close();
            }
        }
    }
}