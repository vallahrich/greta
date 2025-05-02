using System.Text.Json.Serialization;

namespace PeriodTracker.Model.Entities;

public class Symptom
{
    public Symptom(int id)
    {
        symptomId = id;
    }

    // Parameterless constructor for JSON deserialization
    [JsonConstructor]
    public Symptom()
    {
        // Parameterless constructor for deserialization
    }

    public int symptomId { get; set; }
    public string name { get; set; }
    public string icon { get; set; }

    // Navigation properties
    [JsonIgnore] // Prevent circular references
    public List<CycleSymptom> CycleSymptoms { get; set; } = new List<CycleSymptom>();
}