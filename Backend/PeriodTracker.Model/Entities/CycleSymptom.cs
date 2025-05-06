using System.Text.Json.Serialization;

// Represents a symptom entry tied to a specific menstrual cycle
public class CycleSymptom
{
    // Primary constructor for tests or manual instantiation with ID
    public CycleSymptom(int id)
    {
        CycleSymptomId = id;
    }

    // Parameterless constructor for JSON deserialization
    [JsonConstructor]
    public CycleSymptom() { }

    // Primary key
    public int CycleSymptomId { get; set; }

    // Foreign key: the associated cycle
    public int CycleId { get; set; }

    // Foreign key: the reported symptom type
    public int SymptomId { get; set; }

    // Intensity of the symptom (e.g., scale 1-5)
    public int Intensity { get; set; }

    // Date when the symptom was observed
    public DateTime Date { get; set; }

    // Timestamp when this entry was created (defaults to now)
    public DateTime CreatedAt { get; set; } = DateTime.Now;

    // Navigation property to the parent cycle
    public PeriodCycle PeriodCycle { get; set; }

    // Navigation property to the symptom definition
    public Symptom Symptom { get; set; }
}