export type AssessmentType = 
  | "COURSEWORK"
  | "EXAM"
  | "QUIZ"
  | "PRESENTATION"
  | "PRACTICAL"
  | "FORMATIVE"
  | "SUMMATIVE"
  | "OTHER";

export interface Assessment {
  id: number;
  title: string;
  module: string;
  assessment_type: AssessmentType;
  due_date: string;
  length_of_assessment?: number | null;
  weighting_of_assessment?: number;
  notes?: string;
  reminder_offset?: number | null;
  linked_event: number | null;
  created_at: string;
  updated_at: string;
}

export interface AssessmentDetails {
  title: string;
  module: string;
  assessment_type: AssessmentType;
  due_date: string;
  length_of_assessment?: number | null;
  weighting_of_assessment?: number;
  notes?: string;
  reminder_offset?: number | null;
}