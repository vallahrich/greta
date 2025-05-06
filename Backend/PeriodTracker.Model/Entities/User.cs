using System.Text.Json.Serialization;

namespace PeriodTracker.Model.Entities
{
    // Represents an application user account
    public class User
    {
        // Constructor for manual instantiation with known ID
        public User(int id)
        {
            UserId = id;
        }
        
        // Parameterless constructor for JSON deserialization
        [JsonConstructor]
        public User() { }

        // Primary key
        public int UserId { get; set; }

        // Full name of the user
        public string Name { get; set; }

        // Email address used as username/login
        public string Email { get; set; }

        // Password hash 
        public string Pw { get; set; }

        // Record creation timestamp 
        public DateTime CreatedAt { get; set; } = DateTime.Now;
    }
}