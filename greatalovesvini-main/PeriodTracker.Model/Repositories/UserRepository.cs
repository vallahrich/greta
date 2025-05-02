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
            // Test database connection on startup
            TestConnection();
        }

        // Test connection to verify settings are correct
        private void TestConnection()
        {
            try
            {
                using (var conn = new NpgsqlConnection(ConnectionString))
                {
                    conn.Open();
                    Console.WriteLine("[UserRepository] Database connection test successful");
                    conn.Close();
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[UserRepository] DATABASE CONNECTION ERROR: {ex.Message}");
                Console.WriteLine($"[UserRepository] Connection string: {ConnectionString.Replace("Password=", "Password=***")}");
            }
        }

        public User GetUserById(int id)
        {
            NpgsqlConnection dbConn = null;
            try
            {
                Console.WriteLine($"[UserRepository] Getting user by ID: {id}");
                dbConn = new NpgsqlConnection(ConnectionString);
                var cmd = dbConn.CreateCommand();
                cmd.CommandText = "SELECT * FROM Users WHERE user_id = @id";
                cmd.Parameters.Add("@id", NpgsqlDbType.Integer).Value = id;
                
                var data = GetData(dbConn, cmd);
                if (data != null && data.Read())
                {
                    var user = new User(Convert.ToInt32(data["user_id"]))
                    {
                        name = data["name"].ToString(),
                        email = data["email"].ToString(),
                        pw = data["pw"].ToString(),
                        createdAt = Convert.ToDateTime(data["created_at"])
                    };
                    Console.WriteLine($"[UserRepository] Found user by ID: {id}, Name: {user.name}");
                    return user;
                }
                Console.WriteLine($"[UserRepository] No user found with ID: {id}");
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
                    var user = new User(Convert.ToInt32(data["user_id"]))
                    {
                        name = data["name"].ToString(),
                        email = data["email"].ToString(),
                        pw = data["pw"].ToString(),
                        createdAt = Convert.ToDateTime(data["created_at"])
                    };
                    Console.WriteLine($"[UserRepository] Found user by email: {email}, ID: {user.userId}");
                    return user;
                }
                Console.WriteLine($"[UserRepository] No user found with email: {email}");
                return null;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[UserRepository] Error getting user by email {email}: {ex.Message}");
                Console.WriteLine($"[UserRepository] Stack trace: {ex.StackTrace}");
                return null;
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
                Console.WriteLine("[UserRepository] Getting all users");
                dbConn = new NpgsqlConnection(ConnectionString);
                var cmd = dbConn.CreateCommand();
                cmd.CommandText = "SELECT * FROM Users";
                
                var data = GetData(dbConn, cmd);
                if (data != null)
                {
                    while (data.Read())
                    {
                        User user = new User(Convert.ToInt32(data["user_id"]))
                        {
                            name = data["name"].ToString(),
                            email = data["email"].ToString(),
                            pw = data["pw"].ToString(),
                            createdAt = Convert.ToDateTime(data["created_at"])
                        };
                        users.Add(user);
                    }
                }
                Console.WriteLine($"[UserRepository] Retrieved {users.Count} users");
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
                Console.WriteLine($"[UserRepository] Inserting user: {user.email}");
                dbConn = new NpgsqlConnection(ConnectionString);
                var cmd = dbConn.CreateCommand();
                cmd.CommandText = @"
                    INSERT INTO Users 
                    (name, email, pw, created_at)
                    VALUES 
                    (@name, @email, @pw, @createdAt)
                    RETURNING user_id";
                
                cmd.Parameters.AddWithValue("@name", NpgsqlDbType.Text, user.name);
                cmd.Parameters.AddWithValue("@email", NpgsqlDbType.Text, user.email);
                cmd.Parameters.AddWithValue("@pw", NpgsqlDbType.Text, user.pw);
                cmd.Parameters.AddWithValue("@createdAt", NpgsqlDbType.TimestampTz, DateTime.UtcNow);
                
                dbConn.Open();
                // Get the newly created user ID
                var userId = Convert.ToInt32(cmd.ExecuteScalar());
                user.userId = userId;
                
                Console.WriteLine($"[UserRepository] User inserted successfully: {user.email}, ID: {userId}");
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
                Console.WriteLine($"[UserRepository] Updating user: {user.userId}");
                dbConn = new NpgsqlConnection(ConnectionString);
                var cmd = dbConn.CreateCommand();
                cmd.CommandText = @"
                    UPDATE Users SET
                    name = @name,
                    email = @email
                    WHERE user_id = @userId";
                
                cmd.Parameters.AddWithValue("@name", NpgsqlDbType.Text, user.name);
                cmd.Parameters.AddWithValue("@email", NpgsqlDbType.Text, user.email);
                cmd.Parameters.AddWithValue("@userId", NpgsqlDbType.Integer, user.userId);
                
                bool result = UpdateData(dbConn, cmd);
                Console.WriteLine($"[UserRepository] User update result: {result}");
                return result;
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
                Console.WriteLine($"[UserRepository] Updating password for user ID: {userId}");
                dbConn = new NpgsqlConnection(ConnectionString);
                var cmd = dbConn.CreateCommand();
                cmd.CommandText = @"
                    UPDATE Users SET
                    pw = @pw
                    WHERE user_id = @userId";
                
                cmd.Parameters.AddWithValue("@pw", NpgsqlDbType.Text, password);
                cmd.Parameters.AddWithValue("@userId", NpgsqlDbType.Integer, userId);
                
                bool result = UpdateData(dbConn, cmd);
                Console.WriteLine($"[UserRepository] Password update result: {result}");
                return result;
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
                Console.WriteLine($"[UserRepository] Deleting user ID: {id}");
                dbConn = new NpgsqlConnection(ConnectionString);
                var cmd = dbConn.CreateCommand();
                cmd.CommandText = "DELETE FROM Users WHERE user_id = @id";
                cmd.Parameters.AddWithValue("@id", NpgsqlDbType.Integer, id);
                
                bool result = DeleteData(dbConn, cmd);
                Console.WriteLine($"[UserRepository] User deletion result: {result}");
                return result;
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
                Console.WriteLine($"[UserRepository] Checking if email exists: {email}");
                dbConn = new NpgsqlConnection(ConnectionString);
                var cmd = dbConn.CreateCommand();
                cmd.CommandText = "SELECT COUNT(*) FROM Users WHERE email = @email";
                cmd.Parameters.AddWithValue("@email", NpgsqlDbType.Text, email);
                
                dbConn.Open();
                var count = Convert.ToInt32(cmd.ExecuteScalar());
                Console.WriteLine($"[UserRepository] Email exists check result: {count > 0}");
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