/**
 * Symptom Model - Represents a type of symptom
 * 
 * This interface defines symptom types that can be tracked during periods.
 * It's essentially a reference/lookup table for symptom types.
 */
export interface Symptom {
    symptomId: number;   // Primary key
    name: string;        // Display name (e.g., "Headache", "Cramps")
    icon?: string;       // Optional icon identifier
}