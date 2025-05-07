/// <summary>
/// PeriodCycle.cs - Represents a single menstrual cycle record
/// 
/// This entity records a period with start and end dates, belonging to a specific user.
/// It's the core data object for the period tracking functionality.
/// </summary>

using System.Text.Json.Serialization;
using PeriodTracker.Model.Entities;

// Represents a record of a menstrual cycle
public class PeriodCycle
{
    // Constructor for when ID is known
    public PeriodCycle(int id)
    {
        CycleId = id;
    }

    // Parameterless constructor for JSON deserialization
    [JsonConstructor]
    public PeriodCycle() { }

    // Primary key - uniquely identifies this cycle
    public int CycleId { get; set; }

    // Foreign key - links to the user who owns this cycle
    public int UserId { get; set; }

    // Start date of the period/cycle
    public DateTime StartDate { get; set; }

    // End date of the period/cycle 
    public DateTime EndDate { get; set; }

    // Computed property: Duration in days (inclusive of start and end)
    // This is calculated on-the-fly rather than stored
    public int Duration => (int)(EndDate - StartDate).TotalDays + 1;

    // Optional notes about the cycle
    public string Notes { get; set; }

    // When this record was created
    public DateTime CreatedAt { get; set; } = DateTime.Now; 

    // Navigation property to the user who owns this cycle
    // [JsonIgnore] prevents circular references in JSON serialization
    [JsonIgnore]
    public User User { get; set; }
    
    // Navigation property to associated symptoms
    // This creates a one-to-many relationship with CycleSymptom
    [JsonIgnore]
    public List<CycleSymptom> CycleSymptoms { get; set; } = new List<CycleSymptom>();
}