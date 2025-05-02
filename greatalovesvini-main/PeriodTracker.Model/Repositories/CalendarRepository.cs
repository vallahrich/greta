using Microsoft.Extensions.Configuration;
using PeriodTracker.Model.Entities;
using Npgsql;
using NpgsqlTypes;
using System.Globalization;

namespace PeriodTracker.Model.Repositories
{
    public class CalendarRepository : BaseRepository
    {
        public CalendarRepository(IConfiguration configuration) : base(configuration)
        {
        }

        // Helper method to convert numeric month to month name
        private string GetMonthName(short monthNumber)
        {
            return new DateTime(2000, monthNumber, 1)
                .ToString("MMMM", CultureInfo.InvariantCulture);
        }

        // Helper method to convert month name to numeric month
        private short GetMonthNumber(string monthName)
        {
            return (short)DateTime.ParseExact(monthName, "MMMM", CultureInfo.InvariantCulture).Month;
        }

        public PeriodTracker.Model.Entities.Calendar GetById(int id)
        {
            NpgsqlConnection dbConn = null;
            try
            {
                dbConn = new NpgsqlConnection(ConnectionString);
                var cmd = dbConn.CreateCommand();
                cmd.CommandText = "SELECT * FROM Calendar WHERE calendar_id = @id";
                cmd.Parameters.Add("@id", NpgsqlDbType.Integer).Value = id;
                
                var data = GetData(dbConn, cmd);
                if (data != null && data.Read())
                {
                    return new PeriodTracker.Model.Entities.Calendar(Convert.ToInt32(data["calendar_id"]))
                    {
                        userId = Convert.ToInt32(data["user_id"]),
                        month = data["month"].ToString(),
                        year = Convert.ToInt16(data["year"]),
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

        // Overloaded method for numeric month
        public PeriodTracker.Model.Entities.Calendar GetByUserAndMonthYear(int userId, short numericMonth, short year)
        {
            // Convert numeric month to month name for database query
            string monthName = GetMonthName(numericMonth);
            return GetByUserAndMonthYear(userId, monthName, year);
        }

        // Original method for month name
        public PeriodTracker.Model.Entities.Calendar GetByUserAndMonthYear(int userId, string month, short year)
        {
            // Check if month is a numeric value (1-12)
            short numericMonth;
            if (short.TryParse(month, out numericMonth) && numericMonth >= 1 && numericMonth <= 12)
            {
                month = GetMonthName(numericMonth);
            }
            
            NpgsqlConnection dbConn = null;
            try
            {
                dbConn = new NpgsqlConnection(ConnectionString);
                var cmd = dbConn.CreateCommand();
                cmd.CommandText = "SELECT * FROM Calendar WHERE user_id = @userId AND month = @month AND year = @year";
                cmd.Parameters.Add("@userId", NpgsqlDbType.Integer).Value = userId;
                cmd.Parameters.Add("@month", NpgsqlDbType.Varchar).Value = month;
                cmd.Parameters.Add("@year", NpgsqlDbType.Smallint).Value = year;
                
                var data = GetData(dbConn, cmd);
                if (data != null && data.Read())
                {
                    return new PeriodTracker.Model.Entities.Calendar(Convert.ToInt32(data["calendar_id"]))
                    {
                        userId = Convert.ToInt32(data["user_id"]),
                        month = data["month"].ToString(),
                        year = Convert.ToInt16(data["year"]),
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

        public List<PeriodTracker.Model.Entities.Calendar> GetCalendarsByUserId(int userId)
        {
            NpgsqlConnection dbConn = null;
            var calendars = new List<PeriodTracker.Model.Entities.Calendar>();
            try
            {
                dbConn = new NpgsqlConnection(ConnectionString);
                var cmd = dbConn.CreateCommand();
                cmd.CommandText = @"SELECT * FROM Calendar WHERE user_id = @userId 
                                   ORDER BY year DESC, CASE month
                                   WHEN 'January' THEN 1 WHEN 'February' THEN 2 WHEN 'March' THEN 3
                                   WHEN 'April' THEN 4 WHEN 'May' THEN 5 WHEN 'June' THEN 6
                                   WHEN 'July' THEN 7 WHEN 'August' THEN 8 WHEN 'September' THEN 9
                                   WHEN 'October' THEN 10 WHEN 'November' THEN 11 WHEN 'December' THEN 12
                                   END DESC";
                cmd.Parameters.Add("@userId", NpgsqlDbType.Integer).Value = userId;
                
                var data = GetData(dbConn, cmd);
                if (data != null)
                {
                    while (data.Read())
                    {
                        PeriodTracker.Model.Entities.Calendar calendar = new PeriodTracker.Model.Entities.Calendar(Convert.ToInt32(data["calendar_id"]))
                        {
                            userId = Convert.ToInt32(data["user_id"]),
                            month = data["month"].ToString(),
                            year = Convert.ToInt16(data["year"]),
                            createdAt = Convert.ToDateTime(data["created_at"])
                        };
                        calendars.Add(calendar);
                    }
                }
                return calendars;
            }
            finally
            {
                dbConn?.Close();
            }
        }

        public bool InsertCalendar(PeriodTracker.Model.Entities.Calendar calendar)
        {
            // If calendar.month is passed as a numeric value (frontend sends 1-12), 
            // we need to convert it to a month name
            if (short.TryParse(calendar.month, out short numericMonth) && numericMonth >= 1 && numericMonth <= 12)
            {
                calendar.month = GetMonthName(numericMonth);
            }
            
            NpgsqlConnection dbConn = null;
            try
            {
                dbConn = new NpgsqlConnection(ConnectionString);
                var cmd = dbConn.CreateCommand();
                cmd.CommandText = @"
                    INSERT INTO Calendar 
                    (user_id, month, year, created_at)
                    VALUES 
                    (@userId, @month, @year, @createdAt)
                    RETURNING calendar_id";
                
                cmd.Parameters.AddWithValue("@userId", NpgsqlDbType.Integer, calendar.userId);
                cmd.Parameters.AddWithValue("@month", NpgsqlDbType.Varchar, calendar.month);
                cmd.Parameters.AddWithValue("@year", NpgsqlDbType.Smallint, calendar.year);
                cmd.Parameters.AddWithValue("@createdAt", NpgsqlDbType.TimestampTz, DateTime.UtcNow);
                
                dbConn.Open();
                // Get the newly created calendar ID
                var calendarId = Convert.ToInt32(cmd.ExecuteScalar());
                calendar.calendarId = calendarId;
                
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error inserting calendar: {ex.Message}");
                return false;
            }
            finally
            {
                dbConn?.Close();
            }
        }

        public bool DeleteCalendar(int id, int userId)
        {
            NpgsqlConnection dbConn = null;
            try
            {
                dbConn = new NpgsqlConnection(ConnectionString);
                var cmd = dbConn.CreateCommand();
                cmd.CommandText = "DELETE FROM Calendar WHERE calendar_id = @id AND user_id = @userId";
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
    }
}