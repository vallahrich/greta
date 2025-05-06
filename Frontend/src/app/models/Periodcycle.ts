/**
 * Periodcycle interface models a user’s menstrual cycle record.
 * Captures the start and end dates of the cycle, computes duration,
 * and includes optional notes and metadata.
 */

export interface Periodcycle {
    cycleId: number;
    userId: number;
    startDate: Date;
    endDate: Date;
    duration: number;
    notes?: string;
    createdAt: Date;
}