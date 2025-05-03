using System.Text.Json.Serialization;
using PeriodTracker.Model.Entities;

public class CycleSymptom
{
    public CycleSymptom(int id)
    {
        CycleSymptomId = id;
    }

    [JsonConstructor]
    public CycleSymptom()
    {
    }

    public int CycleSymptomId { get; set; }
    public int CycleId { get; set; }
    public int SymptomId { get; set; }
    public int Intensity { get; set; }
    public DateTime Date { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.Now;

    [JsonIgnore]
    public PeriodCycle PeriodCycle { get; set; }
    
    [JsonIgnore]
    public Symptom Symptom { get; set; }
}