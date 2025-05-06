import { Symptom } from "./Symptom";

/**
 * CycleSymptom interface models the relationship between a period cycle and a symptom entry.
 * Each record captures which symptom was logged on which day of a specific cycle,
 * along with its intensity and metadata like creation timestamp.
 */
export interface CycleSymptom {
    cycleSymptomId: number;
    cycleId: number;
    symptomId: number;
    intensity: number;
    date: Date;
    createdAt: Date;
    symptom?: Symptom;
}