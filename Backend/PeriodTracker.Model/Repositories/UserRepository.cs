using Microsoft.Extensions.Configuration;
using Npgsql;
using NpgsqlTypes;
using PeriodTracker.Model.Entities;

// Repository handling CRUD operations for User entities
public class UserRepository : BaseRepository
{
    // Passes configuration to BaseRepository to set up the database connection string
    public UserRepository(IConfiguration configuration) : base(configuration)
    {
    }

    // Retrieves a user by their unique ID or returns null if not found
    public User GetUserById(int id)
    {
        using var conn = new NpgsqlConnection(ConnectionString);
        using var cmd  = conn.CreateCommand();
        cmd.CommandText = "SELECT * FROM Users WHERE user_id = @id";
        cmd.Parameters.AddWithValue("@id", NpgsqlDbType.Integer, id);

        using var reader = GetData(conn, cmd);
        if (reader.Read())
        {
            return new User(Convert.ToInt32(reader["user_id"]))
            {
                Name      = reader["name"].ToString(),
                Email     = reader["email"].ToString(),
                Pw        = reader["pw"].ToString(),
                CreatedAt = Convert.ToDateTime(reader["created_at"])
            };
        }
        return null;
    }

    // Retrieves a user by email; throws on DB error to let controllers handle
    public User GetUserByEmail(string email)
    {
        using var conn = new NpgsqlConnection(ConnectionString);
        using var cmd  = conn.CreateCommand();
        cmd.CommandText = "SELECT * FROM Users WHERE email = @email";
        cmd.Parameters.AddWithValue("@email", NpgsqlDbType.Varchar, email);

        using var reader = GetData(conn, cmd);
        if (reader.Read())
        {
            return new User(Convert.ToInt32(reader["user_id"]))
            {
                Name      = reader["name"].ToString(),
                Email     = reader["email"].ToString(),
                Pw        = reader["pw"].ToString(),
                CreatedAt = Convert.ToDateTime(reader["created_at"])
            };
        }
        return null;
    }

    // Inserts a new user, sets its generated ID, and returns success flag
    public bool InsertUser(User user)
    {
        using var conn = new NpgsqlConnection(ConnectionString);
        using var cmd  = conn.CreateCommand();
        cmd.CommandText = @"
            INSERT INTO Users (name, email, pw, created_at)
            VALUES (@name, @email, @pw, @createdAt)
            RETURNING user_id";

        cmd.Parameters.AddWithValue("@name", NpgsqlDbType.Varchar, user.Name);
        cmd.Parameters.AddWithValue("@email", NpgsqlDbType.Varchar, user.Email);
        cmd.Parameters.AddWithValue("@pw", NpgsqlDbType.Varchar, user.Pw);
        cmd.Parameters.AddWithValue("@createdAt", NpgsqlDbType.TimestampTz, DateTime.UtcNow);

        try
        {
            conn.Open();
            user.UserId = Convert.ToInt32(cmd.ExecuteScalar());
            return true;
        }
        catch (Exception ex)
        {
            // TODO: Inject ILogger<UserRepository> to log errors
            Console.WriteLine($"[UserRepository] Error inserting user: {ex.Message}");
            return false;
        }
    }

    // Updates user name and email; returns success
    public bool UpdateUser(User user)
    {
        using var conn = new NpgsqlConnection(ConnectionString);
        using var cmd  = conn.CreateCommand();
        cmd.CommandText = @"
            UPDATE Users SET
                name = @name,
                email = @email
            WHERE user_id = @userId";

        cmd.Parameters.AddWithValue("@name", NpgsqlDbType.Varchar, user.Name);
        cmd.Parameters.AddWithValue("@email", NpgsqlDbType.Varchar, user.Email);
        cmd.Parameters.AddWithValue("@userId", NpgsqlDbType.Integer, user.UserId);

        return UpdateData(conn, cmd);
    }

    // Updates only the user’s password
    public bool UpdateUserPassword(int userId, string password)
    {
        using var conn = new NpgsqlConnection(ConnectionString);
        using var cmd  = conn.CreateCommand();
        cmd.CommandText = @"
            UPDATE Users SET
                pw = @pw
            WHERE user_id = @userId";

        cmd.Parameters.AddWithValue("@pw", NpgsqlDbType.Varchar, password);
        cmd.Parameters.AddWithValue("@userId", NpgsqlDbType.Integer, userId);

        return UpdateData(conn, cmd);
    }

    // Deletes a user by ID
    public bool DeleteUser(int id)
    {
        using var conn = new NpgsqlConnection(ConnectionString);
        using var cmd  = conn.CreateCommand();
        cmd.CommandText = "DELETE FROM Users WHERE user_id = @id";
        cmd.Parameters.AddWithValue("@id", NpgsqlDbType.Integer, id);

        return DeleteData(conn, cmd);
    }

    // Checks if an email is already registered
    public bool EmailExists(string email)
    {
        using var conn = new NpgsqlConnection(ConnectionString);
        using var cmd  = conn.CreateCommand();
        cmd.CommandText = "SELECT COUNT(*) FROM Users WHERE email = @email";
        cmd.Parameters.AddWithValue("@email", NpgsqlDbType.Varchar, email);

        conn.Open();
        var count = Convert.ToInt32(cmd.ExecuteScalar());
        return count > 0;
    }
}