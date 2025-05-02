import { Symptom } from './Symptom';

export interface CycleSymptom {
    cycle_symptom_id: number;
    cycle_id: number;
    symptom_id: number;
    intensity: number;
    date: Date;
    created_at: Date;
    symptom?: Symptom; // Optional reference to the full symptom object
}