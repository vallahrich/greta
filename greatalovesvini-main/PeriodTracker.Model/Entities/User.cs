namespace PeriodTracker.Model.Entities;

using System.Text.Json.Serialization;

public class User
{
    public User(int id)
    {
        UserId = id;
    }
    
    [JsonConstructor]
    public User()
    {
    }

    public int UserId { get; set; }
    public string Name { get; set; }
    public string Email { get; set; }
    public string Pw { get; set; } // Or better: Password
    public DateTime CreatedAt { get; set; } = DateTime.Now;
}