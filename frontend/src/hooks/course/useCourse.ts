import {useCallback, useEffect, useMemo, useState} from "react";
import * as courseService from "@/services/courseService";
import type {Course, CourseCreation, CourseStaff, CourseUpdate, UseCoursesReturn} from "@/types/course";
import {authStore} from "@/services/authService.ts";

/**
 * Provides state and actions for the courses feature.
 */
export const useCourses = (): UseCoursesReturn => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [staff, setStaff] = useState<CourseStaff[] | null>(null);
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await courseService.getCourses();
      setCourses(data);
      setError(null);
    } catch (refreshError) {
      console.error(refreshError);
      setError("Failed to load courses.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

    const getStaff = useCallback(async (courseId: number) => {
    try {
      const data = await courseService.getStaff(courseId);
      setStaff(data);
      setError(null);
      return data;
    } catch (staffError) {
      console.error(staffError);
      setError("Failed to load staff.");
      return [];
    }
  }, []);

  const createCourse = useCallback(async (data: CourseCreation) => {
    try {
      const created = await courseService.createCourse(data);
      setCourses((prev) => [...prev, created]);
      return created;
    } catch (createError) {
      console.error(createError);
      setError("Failed to create course.");
      return null;
    }
  }, []);

  const updateCourse = useCallback(async (id: number, data: CourseUpdate) => {
    try {
      const updated = await courseService.updateCourse(id, data);
      setCourses((prev) => prev.map((course) => (course.id === id ? updated : course)));
      setSelectedCourse((prev) => (prev?.id === id ? updated : prev));
      return updated;
    } catch (updateError) {
      console.error(updateError);
      setError("Failed to update course.");
      return null;
    }
  }, []);

  const deleteCourse = useCallback(async (id: number) => {
    try {
      await courseService.deleteCourse(id);
      setCourses((prev) => prev.filter((course) => course.id !== id));
      setSelectedCourse((prev) => (prev?.id === id ? null : prev));
    } catch (deleteError) {
      console.error(deleteError);
      setError("Failed to delete course.");
    }
  }, []);

  const joinCourse = useCallback(async (joinCode: string) => {
    try {
      const updated = await courseService.joinCourse(joinCode);
      const id = updated.id;
      setCourses((prev) => prev.map((course) => (course.id === id ? updated : course)));
      setSelectedCourse((prev) => (prev?.id === id ? updated : prev));
      return updated;
    } catch (joinError) {
      console.error(joinError);
      setError("Failed to join course.");
      return null;
    }
  }, []);

  const leaveCourse = useCallback(async (id: number) => {
    try {
      const updated = await courseService.leaveCourse(id);
      setCourses((prev) => prev.map((course) => (course.id === id ? updated : course)));
      setSelectedCourse((prev) => (prev?.id === id ? updated : prev));
      return updated;
    } catch (leaveError) {
      console.error(leaveError);
      setError("Failed to leave course.");
      return null;
    }
  }, []);

  const filteredCourses = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return courses;
    }
    return courses.filter((course) => {
      const nameMatch = course.name.toLowerCase().includes(query);
      const descriptionMatch = course.description.toLowerCase().includes(query);
      return nameMatch || descriptionMatch;
    });
  }, [courses, search]);


  const managedFilteredCourses = useMemo(()=>{
    const query = search.trim().toLowerCase();
    if(!query) return courses.filter(course =>{return course.lead == authStore.getUser()?.id?.toString() || authStore.getUser()?.is_staff;});
    return courses.filter((course) => {
      const nameMatch = course.name.toLowerCase().includes(query);
      const descriptionMatch = course.description.toLowerCase().includes(query);
      const isLead = (course.lead == authStore.getUser()?.id?.toString()) || authStore.getUser()?.is_staff;
      return isLead && (nameMatch || descriptionMatch);
    });
  }, [courses,search]);

 return {
   state: {
      courses,
      selectedCourse,
      search,
      staff,
    },
    filteredCourses,
    managedFilteredCourses,
    loading,
    error,
    actions: {
      setSearch,
      selectCourse: setSelectedCourse,
      refresh,
      createCourse,
      updateCourse,
      deleteCourse,
      joinCourse,
      leaveCourse,
      getStaff,
    }
 };
};