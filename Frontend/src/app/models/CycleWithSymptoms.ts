export interface CycleWithSymptoms {
  cycleId: number;
  userId: number;
  startDate: Date;
  endDate: Date;
  notes?: string;
  duration?: number; // Computed property
  symptoms: {
    symptomId: number;
    name: string;  // Changed from symptomName to match the template
    intensity: number;
    date: Date;
  }[];
}

export interface CycleSymptom {
  symptomId: number;
  name: string;  // Changed from symptomName to match the template
  intensity: number;
  date: Date;
}