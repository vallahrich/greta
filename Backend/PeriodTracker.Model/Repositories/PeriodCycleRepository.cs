/// <summary>
/// PeriodCycleRepository - Handles data access for PeriodCycle entities
/// 
/// This repository manages:
/// - Retrieving cycles by ID or user ID
/// - Creating new cycle records
/// - Deleting cycle records with user ownership verification
/// 
/// It's central to the app's core functionality of tracking periods.
/// </summary>

using Microsoft.Extensions.Configuration;
using Npgsql;
using NpgsqlTypes;

// Repository for period cycle database operations
public class PeriodCycleRepository : BaseRepository
{
    // Constructor inherits connection setup from BaseRepository
    public PeriodCycleRepository(IConfiguration configuration) : base(configuration)
    {
    }

    // Retrieves a specific cycle by ID
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
                // Map database row to PeriodCycle entity
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
            return null; // No cycle found
        }
        finally
        {
            // Ensure connection is closed even if an error occurs
            dbConn?.Close();
        }
    }

    // Retrieves all cycles for a specific user
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
                // Add each cycle to the list
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
            // Always close the connection 
            dbConn?.Close();
        }
    }

    // Creates a new cycle record
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

            // Add parameters to prevent SQL injection
            cmd.Parameters.AddWithValue("@userId", NpgsqlDbType.Integer, cycle.UserId);
            cmd.Parameters.AddWithValue("@startDate", NpgsqlDbType.Date, cycle.StartDate);
            cmd.Parameters.AddWithValue("@endDate", NpgsqlDbType.Date, cycle.EndDate);
            cmd.Parameters.AddWithValue("@notes", NpgsqlDbType.Text, (object)cycle.Notes ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@createdAt", NpgsqlDbType.TimestampTz, DateTime.UtcNow);

            dbConn.Open();
            // Execute and get the generated ID
            cycle.CycleId = Convert.ToInt32(cmd.ExecuteScalar());
            return true;
        }
        catch (Exception ex)
        {
            // Log error
            Console.WriteLine($"[PeriodCycleRepository] Error inserting cycle: {ex.Message}");
            return false;
        }
        finally
        {
            dbConn?.Close();
        }
    }

    // Deletes a cycle record with owner verification
    public bool DeleteCycle(int id, int userId)
    {
        NpgsqlConnection dbConn = null;
        try
        {
            dbConn = new NpgsqlConnection(ConnectionString);
            var cmd = dbConn.CreateCommand();
            // Only delete if the cycle belongs to the specified user (security check)
            cmd.CommandText = "DELETE FROM PeriodCycle WHERE cycle_id = @id AND user_id = @userId";
            cmd.Parameters.AddWithValue("@id", NpgsqlDbType.Integer, id);
            cmd.Parameters.AddWithValue("@userId", NpgsqlDbType.Integer, userId);

            // Use the common DeleteData helper
            return DeleteData(dbConn, cmd);
        }
        finally
        {
            dbConn?.Close();
        }
    }
}