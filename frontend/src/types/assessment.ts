import type { Category } from "./category";
import type { Event } from "./event";

export type AssessmentType =
  | "COURSEWORK"
  | "EXAM"
  | "QUIZ"
  | "PRESENTATION"
  | "PRACTICAL"
  | "FORMATIVE"
  | "SUMMATIVE"
  | "OTHER";

export interface AssessmentEventDetails {
  start_time: string;
  end_time: string;
  location?: string;
}

export interface Assessment {
  id: number;
  title: string;
  assessment_type: AssessmentType;
  due_date: string;
  length_of_assessment?: number | null;
  weighting_of_assessment: number;
  notes?: string;
  reminder_offset?: number | null;
  assessment_category?: Category | null;
  module_category?: Category | null;
  categories: Category[];
  completed: boolean;
  linked_event?: number | null;
  linked_event_details?: Event | null;
  created_at: string;
  updated_at: string;
}

export interface AssessmentSubmission
  extends Omit<Partial<Assessment>, "categories" | "linked_event_details" | "assessment_category" | "module_category"> {
  categories?: number[];
  assessment_category?: number | null;
  module_category?: number | null;
  event_details?: AssessmentEventDetails | null;
}
