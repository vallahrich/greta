export interface Periodcycle {
    cycle_id: number;
    user_id: number;
    start_date: Date;
    end_date: Date;
    duration: number;
    notes?: string;
    created_at: Date;
}