namespace PeriodTracker.Model.Entities;

using System.Text.Json.Serialization;

public class User
{
    // Keep the existing constructor
    public User(int id)
    {
        userId = id;
    }
    
    // Add a parameterless constructor for JSON deserialization
    [JsonConstructor]
    public User()
    {
        // Parameterless constructor for deserialization
    }

    public int userId { get; set; }
    public string name { get; set; }
    public string email { get; set; }
    public string pw { get; set; } // Database column name is pw
    public DateTime createdAt { get; set; } = DateTime.Now;

    // Navigation properties
    [JsonIgnore] // Prevent circular references
    public List<PeriodCycle> PeriodCycles { get; set; } = new List<PeriodCycle>();
    
    [JsonIgnore] // Prevent circular references
    public List<Calendar> Calendars { get; set; } = new List<Calendar>();
}