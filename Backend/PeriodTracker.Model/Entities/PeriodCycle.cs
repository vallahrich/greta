using System.Text.Json.Serialization;
using PeriodTracker.Model.Entities;

// Represents a menstrual cycle record belonging to a specific user
public class PeriodCycle
{
    // Constructor for manual instantiation with ID
    public PeriodCycle(int id)
    {
        CycleId = id;
    }

    // Parameterless constructor used during JSON deserialization
    [JsonConstructor]
    public PeriodCycle() { }

    // Primary key of the cycle record
    public int CycleId { get; set; }

    // Foreign key: ID of the user who owns this cycle
    public int UserId { get; set; }

    // Start date of the cycle period
    public DateTime StartDate { get; set; }

    // End date of the cycle period
    public DateTime EndDate { get; set; }

    // Computed duration in days (inclusive)
    public int Duration => (int)(EndDate - StartDate).TotalDays + 1;

    // Optional notes for the cycle (e.g., symptoms summary)
    public string Notes { get; set; }

    // Timestamp when the record was created
    public DateTime CreatedAt { get; set; } = DateTime.Now; 

    // Navigation property to the owning user (ignored in JSON)
    [JsonIgnore]
    public User User { get; set; }
    
    // Navigation to associated symptoms (ignored in JSON)
    [JsonIgnore]
    public List<CycleSymptom> CycleSymptoms { get; set; } = new List<CycleSymptom>();
}