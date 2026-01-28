export interface Category {
  id: number;
  text: string;
}

export interface Task {
  id: number;
  title: string;
  description?: string;
  start_time: string;
  deadline: string;
  importance: number;
  completed: boolean;
  categories: Category[];
  estimated_minutes: number;
  parent_task?: number | null;
}
