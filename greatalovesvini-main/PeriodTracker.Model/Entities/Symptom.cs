using System.Text.Json.Serialization;

public class Symptom
{
    public Symptom(int id)
    {
        SymptomId = id;
    }

    [JsonConstructor]
    public Symptom()
    {
    }

    public int SymptomId { get; set; }
    public string Name { get; set; }
    public string Icon { get; set; }

    [JsonIgnore]
    public List<CycleSymptom> CycleSymptoms { get; set; } = new List<CycleSymptom>();
}