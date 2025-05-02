using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace PeriodTracker.Model.Entities;

public class Calendar
{
    public Calendar(int id)
    {
        calendarId = id;
    }

    public int calendarId { get; set; } // Using camelCase to match frontend expectations
    public int userId { get; set; }

    [Required]
    public string month { get; set; } // Database uses month names like "January", "February", etc.

    public short year { get; set; }
    
    public DateTime createdAt { get; set; } = DateTime.Now;

    // Navigation properties
    [JsonIgnore] // Prevent circular references
    public User User { get; set; }
    
    [JsonIgnore] // Prevent circular references
    public List<CycleEntry> CycleEntries { get; set; } = new List<CycleEntry>();
}