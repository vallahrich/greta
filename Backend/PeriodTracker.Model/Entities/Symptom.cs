/// <summary>
/// Symptom.cs - Defines types of symptoms that can be tracked
/// 
/// This entity represents predefined symptom types like headaches,
/// cramps, mood changes, etc. that users can select when logging
/// their period symptoms.
/// </summary>

using System.Text.Json.Serialization;

// Represents a type of symptom that can be tracked during periods
public class Symptom
{
    // Constructor for when ID is known
    public Symptom(int id)
    {
        SymptomId = id;
    }

    // Parameterless constructor for JSON deserialization
    [JsonConstructor]
    public Symptom() { }

    // Primary key - uniquely identifies this symptom type
    public int SymptomId { get; set; }

    // Display name of the symptom (e.g., "Headache", "Cramps")
    public string Name { get; set; }

    // Optional icon name or path for UI display
    public string Icon { get; set; }

    // Navigation property to link to CycleSymptom records
    // This creates a one-to-many relationship with CycleSymptom
    [JsonIgnore]
    public List<CycleSymptom> CycleSymptoms { get; set; } = new List<CycleSymptom>();
}