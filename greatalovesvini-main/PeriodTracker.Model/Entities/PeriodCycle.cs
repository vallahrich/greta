using System.Text.Json.Serialization;

namespace PeriodTracker.Model.Entities;

public class PeriodCycle
{
    public PeriodCycle(int id)
    {
        cycleId = id;
    }

    public int cycleId { get; set; } // Using camelCase to match frontend expectations
    public int userId { get; set; }
    public DateTime startDate { get; set; }
    public DateTime endDate { get; set; }
    // Duration is a computed column in the database (interval type)
    // We'll use this property to convert to days for the frontend
    public int duration => (int)(endDate - startDate).TotalDays + 1;
    public DateTime createdAt { get; set; } = DateTime.Now;

    // Navigation properties
    [JsonIgnore] // Prevent circular references
    public User User { get; set; }
    
    [JsonIgnore] // Prevent circular references
    public List<CycleEntry> CycleEntries { get; set; } = new List<CycleEntry>();
}