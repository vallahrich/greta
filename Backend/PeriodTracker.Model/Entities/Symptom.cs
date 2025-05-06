using System.Text.Json.Serialization;

// Represents a symptom type (e.g., headache, cramps) that users can report
public class Symptom
{
    // Constructor for manual instantiation when you know the ID
    public Symptom(int id)
    {
        SymptomId = id;
    }

    // Parameterless constructor for JSON deserialization
    [JsonConstructor]
    public Symptom() { }

    // Primary key for the symptom record
    public int SymptomId { get; set; }

    // Display name of the symptom
    public string Name { get; set; }

    // Icon name or URL used in the UI
    public string Icon { get; set; }

    // Related cycle-symptom entries (ignored in JSON payloads)
    [JsonIgnore]
    public List<CycleSymptom> CycleSymptoms { get; set; } = new List<CycleSymptom>();
}
