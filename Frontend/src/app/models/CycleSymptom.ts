import { Symptom } from "./Symptom";

export interface CycleSymptom {
    cycleSymptomId: number;
    cycleId: number;
    symptomId: number;
    intensity: number;
    date: Date;
    createdAt: Date;
    symptom?: Symptom;
}