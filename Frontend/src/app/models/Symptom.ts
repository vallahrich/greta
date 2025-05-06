/**
 * Symptom interface defines a symptom type that can be associated with a period cycle.
 * Each symptom has an identifier, a display name, and an optional icon URL or identifier.
 */

export interface Symptom {
    symptomId: number;
    name: string;
    icon?: string;
}