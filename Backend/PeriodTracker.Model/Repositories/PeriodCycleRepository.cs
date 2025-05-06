using Microsoft.Extensions.Configuration;
using Npgsql;
using NpgsqlTypes;

// Repository for PeriodCycle: handles retrieval, insertion, and deletion of cycle records
public class PeriodCycleRepository : BaseRepository
{
    // Constructor passes IConfiguration to BaseRepository to set up the connection string
    public PeriodCycleRepository(IConfiguration configuration) : base(configuration)
    {
    }

    // Retrieves a PeriodCycle by its ID or returns null if not found
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
            if (data.Read())
            {
                // Map database columns to PeriodCycle properties
                return new PeriodCycle
                {
                    CycleId   = Convert.ToInt32(data["cycle_id"]),
                    UserId    = Convert.ToInt32(data["user_id"]),
                    StartDate = Convert.ToDateTime(data["start_date"]),
                    EndDate   = Convert.ToDateTime(data["end_date"]),
                    Notes     = data["notes"] != DBNull.Value ? data["notes"].ToString() : null,
                    CreatedAt = Convert.ToDateTime(data["created_at"])
                };
            }
            return null;
        }
        finally
        {
            // Ensure connection is closed after operation
            dbConn?.Close();
        }
    }

    // Retrieves all PeriodCycle records for a given user, ordered by most recent start date
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
            while (data.Read())
            {
                // Build a new PeriodCycle for each row
                cycles.Add(new PeriodCycle
                {
                    CycleId   = Convert.ToInt32(data["cycle_id"]),
                    UserId    = Convert.ToInt32(data["user_id"]),
                    StartDate = Convert.ToDateTime(data["start_date"]),
                    EndDate   = Convert.ToDateTime(data["end_date"]),
                    Notes     = data["notes"] != DBNull.Value ? data["notes"].ToString() : null,
                    CreatedAt = Convert.ToDateTime(data["created_at"])
                });
            }
            return cycles;
        }
        finally
        {
            // Close the connection to avoid leaks
            dbConn?.Close();
        }
    }

    // Inserts a new PeriodCycle record, sets its generated ID on the entity, and returns success status
    public bool InsertCycle(PeriodCycle cycle)
    {
        NpgsqlConnection dbConn = null;
        try
        {
            dbConn = new NpgsqlConnection(ConnectionString);
            var cmd = dbConn.CreateCommand();
            cmd.CommandText = @"
                INSERT INTO PeriodCycle (user_id, start_date, end_date, notes, created_at)
                VALUES (@userId, @startDate, @endDate, @notes, @createdAt)
                RETURNING cycle_id";

            // Bind parameters from the PeriodCycle object
            cmd.Parameters.AddWithValue("@userId", NpgsqlDbType.Integer, cycle.UserId);
            cmd.Parameters.AddWithValue("@startDate", NpgsqlDbType.Date, cycle.StartDate);
            cmd.Parameters.AddWithValue("@endDate", NpgsqlDbType.Date, cycle.EndDate);
            cmd.Parameters.AddWithValue("@notes", NpgsqlDbType.Text, (object)cycle.Notes ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@createdAt", NpgsqlDbType.TimestampTz, DateTime.UtcNow);

            dbConn.Open();
            // Execute and capture the generated ID
            cycle.CycleId = Convert.ToInt32(cmd.ExecuteScalar());
            return true;
        }
        catch (Exception ex)
        {
            // Log the error and return failure
            Console.WriteLine($"[PeriodCycleRepository] Error inserting cycle: {ex.Message}");
            return false;
        }
        finally
        {
            dbConn?.Close();
        }
    }

    // Deletes a PeriodCycle record if it belongs to the specified user
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

            // Use the common DeleteData helper from BaseRepository
            return DeleteData(dbConn, cmd);
        }
        finally
        {
            dbConn?.Close();
        }
    }
}