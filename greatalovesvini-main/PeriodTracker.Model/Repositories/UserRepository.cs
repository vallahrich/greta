using Microsoft.Extensions.Configuration;
using PeriodTracker.Model.Entities;
using Npgsql;
using NpgsqlTypes;

namespace PeriodTracker.Model.Repositories
{
    public class UserRepository : BaseRepository
    {
        public UserRepository(IConfiguration configuration) : base(configuration)
        {
        }

        public User GetUserById(int id)
        {
            NpgsqlConnection dbConn = null;
            try
            {
                dbConn = new NpgsqlConnection(ConnectionString);
                var cmd = dbConn.CreateCommand();
                cmd.CommandText = "SELECT * FROM Users WHERE user_id = @id";
                cmd.Parameters.Add("@id", NpgsqlDbType.Integer).Value = id;

                var data = GetData(dbConn, cmd);
                if (data != null && data.Read())
                {
                    return new User
                    {
                        UserId = Convert.ToInt32(data["user_id"]),
                        Name = data["name"].ToString(),
                        Email = data["email"].ToString(),
                        Pw = data["pw"].ToString(),
                        CreatedAt = Convert.ToDateTime(data["created_at"])
                    };
                }
                return null;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[UserRepository] Error getting user by ID {id}: {ex.Message}");
                return null;
            }
            finally
            {
                dbConn?.Close();
            }
        }

        public User GetUserByEmail(string email)
        {
            NpgsqlConnection dbConn = null;
            try
            {
                Console.WriteLine($"[UserRepository] Getting user by email: {email}");
                dbConn = new NpgsqlConnection(ConnectionString);
                var cmd = dbConn.CreateCommand();
                cmd.CommandText = "SELECT * FROM Users WHERE email = @email";
                cmd.Parameters.Add("@email", NpgsqlDbType.Text).Value = email;

                var data = GetData(dbConn, cmd);
                if (data != null && data.Read())
                {
                    var user = new User
                    {
                        UserId = Convert.ToInt32(data["user_id"]),
                        Name = data["name"].ToString(),
                        Email = data["email"].ToString(),
                        Pw = data["pw"].ToString(),
                        CreatedAt = Convert.ToDateTime(data["created_at"])
                    };
                    Console.WriteLine($"[UserRepository] User found: ID={user.UserId}, Email={user.Email}");
                    return user;
                }
                Console.WriteLine($"[UserRepository] No user found with email: {email}");
                return null;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[UserRepository] ERROR getting user by email {email}: {ex.Message}");
                throw; // Re-throw to let the controller handle it
            }
            finally
            {
                dbConn?.Close();
            }
        }

        public List<User> GetUsers()
        {
            NpgsqlConnection dbConn = null;
            var users = new List<User>();
            try
            {
                dbConn = new NpgsqlConnection(ConnectionString);
                var cmd = dbConn.CreateCommand();
                cmd.CommandText = "SELECT * FROM Users";

                var data = GetData(dbConn, cmd);
                if (data != null)
                {
                    while (data.Read())
                    {
                        users.Add(new User
                        {
                            UserId = Convert.ToInt32(data["user_id"]),
                            Name = data["name"].ToString(),
                            Email = data["email"].ToString(),
                            Pw = data["pw"].ToString(),
                            CreatedAt = Convert.ToDateTime(data["created_at"])
                        });
                    }
                }
                return users;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[UserRepository] Error getting all users: {ex.Message}");
                return users;
            }
            finally
            {
                dbConn?.Close();
            }
        }

        public bool InsertUser(User user)
        {
            NpgsqlConnection dbConn = null;
            try
            {
                dbConn = new NpgsqlConnection(ConnectionString);
                var cmd = dbConn.CreateCommand();
                cmd.CommandText = @"
                    INSERT INTO Users (name, email, pw, created_at)
                    VALUES (@name, @email, @pw, @createdAt)
                    RETURNING user_id";

                cmd.Parameters.AddWithValue("@name", NpgsqlDbType.Varchar, user.Name);
                cmd.Parameters.AddWithValue("@email", NpgsqlDbType.Varchar, user.Email);
                cmd.Parameters.AddWithValue("@pw", NpgsqlDbType.Varchar, user.Pw);
                cmd.Parameters.AddWithValue("@createdAt", NpgsqlDbType.TimestampTz, DateTime.UtcNow);

                dbConn.Open();
                var userId = Convert.ToInt32(cmd.ExecuteScalar());
                user.UserId = userId;

                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[UserRepository] Error inserting user: {ex.Message}");
                return false;
            }
            finally
            {
                dbConn?.Close();
            }
        }

        public bool UpdateUser(User user)
        {
            NpgsqlConnection dbConn = null;
            try
            {
                dbConn = new NpgsqlConnection(ConnectionString);
                var cmd = dbConn.CreateCommand();
                cmd.CommandText = @"
                    UPDATE Users SET
                    name = @name,
                    email = @email
                    WHERE user_id = @userId";

                cmd.Parameters.AddWithValue("@name", NpgsqlDbType.Varchar, user.Name);
                cmd.Parameters.AddWithValue("@email", NpgsqlDbType.Varchar, user.Email);
                cmd.Parameters.AddWithValue("@userId", NpgsqlDbType.Integer, user.UserId);

                return UpdateData(dbConn, cmd);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[UserRepository] Error updating user: {ex.Message}");
                return false;
            }
            finally
            {
                dbConn?.Close();
            }
        }

        public bool UpdateUserPassword(int userId, string password)
        {
            NpgsqlConnection dbConn = null;
            try
            {
                dbConn = new NpgsqlConnection(ConnectionString);
                var cmd = dbConn.CreateCommand();
                cmd.CommandText = @"
                    UPDATE Users SET
                    pw = @pw
                    WHERE user_id = @userId";

                cmd.Parameters.AddWithValue("@pw", NpgsqlDbType.Varchar, password);
                cmd.Parameters.AddWithValue("@userId", NpgsqlDbType.Integer, userId);

                return UpdateData(dbConn, cmd);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[UserRepository] Error updating password: {ex.Message}");
                return false;
            }
            finally
            {
                dbConn?.Close();
            }
        }

        public bool DeleteUser(int id)
        {
            NpgsqlConnection dbConn = null;
            try
            {
                dbConn = new NpgsqlConnection(ConnectionString);
                var cmd = dbConn.CreateCommand();
                cmd.CommandText = "DELETE FROM Users WHERE user_id = @id";
                cmd.Parameters.AddWithValue("@id", NpgsqlDbType.Integer, id);

                return DeleteData(dbConn, cmd);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[UserRepository] Error deleting user: {ex.Message}");
                return false;
            }
            finally
            {
                dbConn?.Close();
            }
        }

        public bool EmailExists(string email)
        {
            NpgsqlConnection dbConn = null;
            try
            {
                dbConn = new NpgsqlConnection(ConnectionString);
                var cmd = dbConn.CreateCommand();
                cmd.CommandText = "SELECT COUNT(*) FROM Users WHERE email = @email";
                cmd.Parameters.AddWithValue("@email", NpgsqlDbType.Varchar, email);

                dbConn.Open();
                var count = Convert.ToInt32(cmd.ExecuteScalar());
                return count > 0;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[UserRepository] Error checking email existence: {ex.Message}");
                return false;
            }
            finally
            {
                dbConn?.Close();
            }
        }
    }
}