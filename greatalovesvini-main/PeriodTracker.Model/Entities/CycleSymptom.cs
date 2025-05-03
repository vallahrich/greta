using System.Text.Json.Serialization;
using PeriodTracker.Model.Entities;
using System;

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
    public PeriodCycle PeriodCycle { get; set; }
    public Symptom Symptom { get; set; }
}