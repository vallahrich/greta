/// <summary>
/// CycleSymptom.cs - Maps symptoms to period cycles
/// 
/// This is a join entity that connects PeriodCycle and Symptom entities,
/// recording when a user experienced a specific symptom during a cycle,
/// along with its intensity.
/// </summary>

using System.Text.Json.Serialization;

// Represents a symptom recorded during a specific menstrual cycle
public class CycleSymptom
{
    // Constructor for when ID is known
    public CycleSymptom(int id)
    {
        CycleSymptomId = id;
    }

    // Parameterless constructor for JSON deserialization
    [JsonConstructor]
    public CycleSymptom() { }

    // Primary key - uniquely identifies this symptom entry
    public int CycleSymptomId { get; set; }

    // Foreign key to the associated cycle 
    public int CycleId { get; set; }

    // Foreign key to the symptom type
    public int SymptomId { get; set; }

    // Intensity rating (1-5 scale) of the symptom
    public int Intensity { get; set; }

    // Date when the symptom was experienced
    public DateTime Date { get; set; }

    // When this record was created
    public DateTime CreatedAt { get; set; } = DateTime.Now;

    // Navigation property to the parent cycle
    public PeriodCycle PeriodCycle { get; set; }

    // Navigation property to the symptom definition
    public Symptom Symptom { get; set; }
}