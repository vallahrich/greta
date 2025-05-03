export interface Periodcycle {
    cycleId: number;
    userId: number;
    startDate: Date;
    endDate: Date;
    duration: number;
    notes?: string;
    createdAt: Date;
}