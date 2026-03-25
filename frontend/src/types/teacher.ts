/**
 *
 */
export interface TeacherInfo {
  id: number;
  user_id: number;
  username: string;
  active: boolean;
  courses: {
    id: number;
    name: string;
    description: string;
    created_at: string;
    active: boolean;
  }[];
}

/**
 *
 */
export interface TeacherCourse {
  id: number;
  name: string;
  description: string;
  created_at: string;
  active: boolean;
}

/**
 *
 */
export interface Teacher {
  id: number;
  user_id: number;
  username: string;
  active: boolean;
  courses: TeacherCourse[];
}