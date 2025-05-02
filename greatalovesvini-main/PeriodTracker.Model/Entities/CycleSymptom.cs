using System.Text.Json.Serialization;

namespace PeriodTracker.Model.Entities;

public class CycleSymptom
{
    public CycleSymptom(int id)
    {
        cycleSymptomId = id;
    }

    // Parameterless constructor for JSON deserialization
    [JsonConstructor]
    public CycleSymptom()
    {
        // Parameterless constructor for deserialization
    }

    public int cycleSymptomId { get; set; }
    public int cycleId { get; set; }
    public int symptomId { get; set; }
    public int intensity { get; set; }
    public DateTime date { get; set; }
    public DateTime createdAt { get; set; } = DateTime.Now;

    // Navigation properties
    [JsonIgnore] // Prevent circular references
    public PeriodCycle PeriodCycle { get; set; }
    
    [JsonIgnore] // Prevent circular references
    public Symptom Symptom { get; set; }
}