using System.Text.Json.Serialization;

namespace PeriodTracker.Model.Entities;

public class CycleEntry
{
    public CycleEntry(int id)
    {
        entryId = id;
    }

    public int entryId { get; set; } // Using camelCase to match frontend expectations
    public int cycleId { get; set; }
    public int calendarId { get; set; }
    public DateTime date { get; set; }
    public DateTime createdAt { get; set; } = DateTime.Now;

    // Navigation properties
    [JsonIgnore] // Prevent circular references
    public PeriodCycle PeriodCycle { get; set; }
    
    [JsonIgnore] // Prevent circular references
    public Calendar Calendar { get; set; }
}