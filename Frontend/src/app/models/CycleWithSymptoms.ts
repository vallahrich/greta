/**
 * CycleWithSymptoms - Models period cycle records with associated symptoms
 * 
 * This interface defines the data structure for period cycles including:
 * - Basic cycle information (start/end dates)
 * - Associated symptoms with their intensity levels
 * - Optional computed properties like duration
 */
export interface CycleWithSymptoms {
  cycleId: number;     // Unique identifier
  userId: number;      // Owner of the cycle
  startDate: Date;     // When the period started
  endDate: Date;       // When the period ended
  notes?: string;      // Optional notes about the cycle
  duration?: number;   // Computed property - days between start and end
  symptoms: CycleSymptom[]; // Associated symptoms
}

/**
 * CycleSymptom - Models a symptom occurrence within a cycle
 * 
 * Links symptoms to specific cycles with intensity information
 */
export interface CycleSymptom {
  symptomId: number;   // Which symptom type
  name: string;        // Name of the symptom
  intensity: number;   // Severity on a scale of 1-5
  date: Date;          // When the symptom occurred
}