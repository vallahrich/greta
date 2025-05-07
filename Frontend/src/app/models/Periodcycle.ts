/**
 * Period Cycle Model - Represents one menstrual cycle
 * 
 * This interface defines the structure of period cycle data.
 * It's the core data model for the period tracking functionality.
 */
export interface Periodcycle {
    cycleId: number;     // Primary key
    userId: number;      // Foreign key to user
    startDate: Date;     // First day of period
    endDate: Date;       // Last day of period
    duration: number;    // Length in days (computed)
    notes?: string;      // Optional notes
    createdAt: Date;     // Record creation timestamp
}