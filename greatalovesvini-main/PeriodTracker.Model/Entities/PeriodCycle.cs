using System.Text.Json.Serialization;
using PeriodTracker.Model.Entities;

public class PeriodCycle
{
    public PeriodCycle(int id)
    {
        CycleId = id;
    }

    [JsonConstructor]
    public PeriodCycle()
    {
    }

    public int CycleId { get; set; }
    public int UserId { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int Duration => (int)(EndDate - StartDate).TotalDays + 1;
    public string Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.Now;

    [JsonIgnore]
    public User User { get; set; }
    
    [JsonIgnore]
    public List<CycleSymptom> CycleSymptoms { get; set; } = new List<CycleSymptom>();
}