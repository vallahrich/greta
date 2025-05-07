import { Symptom } from "./Symptom";

/**
 * CycleSymptom Model - Maps symptoms to period cycles
 * 
 * This interface represents a symptom experienced during a specific cycle,
 * creating a many-to-many relationship between cycles and symptoms.
 */
export interface CycleSymptom {
  cycleSymptomId: number;  // Primary key
  cycleId: number;         // Foreign key to cycle
  symptomId: number;       // Foreign key to symptom
  intensity: number;       // Severity rating (1-5)
  date: string;            // Date symptom was experienced
  createdAt: string;       // Record creation timestamp
  symptom?: Symptom;       // Optional nested symptom object
}

/**
* Data transfer object for creating new cycle symptoms
* Simplified version of CycleSymptom for API requests
*/
export interface CreateCycleSymptomDto {
  cycleId: number;         // Which cycle
  symptomId: number;       // Which symptom
  intensity: number;       // How severe (1-5)
  date: string;            // When experienced (YYYY-MM-DD)
}