/// <summary>
/// User.cs - Represents a user account in the period tracking application
/// 
/// This entity class maps to the Users table in the database and stores
/// essential user information including authentication credentials.
/// </summary>

using System.Text.Json.Serialization;

namespace PeriodTracker.Model.Entities
{
    // Represents a user account for the application
    public class User
    {
        // Constructor for when you know the user ID (e.g., from database)
        public User(int id)
        {
            UserId = id;
        }
        
        // Parameterless constructor needed for JSON deserialization
        [JsonConstructor]
        public User() { }

        // Primary key - uniquely identifies the user
        public int UserId { get; set; }

        // User's display name
        public string Name { get; set; }

        // Email address (also used as username for login)
        public string Email { get; set; }

        // Password - should be hashed in a production app
        // Named Pw to match database column
        public string Pw { get; set; }

        // When the account was created
        // Default to current time for new accounts
        public DateTime CreatedAt { get; set; } = DateTime.Now;
    }
}