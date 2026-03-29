import api from "@/services/api";
import type {
  CachedPermissionsEntry,
  Course,
  CourseCreation, CourseJoinCode,
  CourseStaff,
  CourseStudent,
  CourseUpdate
} from "@/types/course";
import type {Event} from "@/types/event";
import type {Teacher} from "@/types/teacher.ts";
import {authStore} from "@/services/authService.ts";
import type {CoursePermissions} from "@/types/course.ts";


const COURSE_PERMISSIONS_TTL_MS = 5 * 60 * 1000;



const coursePermissionsCache = new Map<string, CachedPermissionsEntry>();

const getCoursePermissionsCacheKey = (courseId: number | null | undefined, userId: number | string) =>
  `course:${courseId}:user:${userId}`;

const isCacheEntryValid = (entry: CachedPermissionsEntry) => Date.now() < entry.expiresAt;


const getCurrentUserId = (): number | string | null => {
  return authStore.getUser()?.id ?? null;
};

const clearCourseCacheEntries = (courseId: number) => {
  for (const key of coursePermissionsCache.keys()) {
    if (key.startsWith(`course:${courseId}:user:`)) {
      coursePermissionsCache.delete(key);
    }
  }
};

/**
 * Clears cached permissions for a course and/or a specific user.
 * The function provides the capability to remove permission entries from the
 * course permissions cache based on the provided course ID, user ID, or both.
 * If no arguments are provided, the entire course permissions cache is cleared.
 * @param [courseId] - The ID of the course. If provided, it determines
 *                              which course's cache entries are to be removed.
 * @param [userId] - The ID of the user. Can be a number or a string.
 *                                   If both `courseId` and `userId` are provided,
 *                                   the cache for the specific course-user combination
 *                                   is cleared. If only `courseId` is provided, all
 *                                   user-specific cache entries for that course are deleted.
 */
export const clearCoursePermissionsCache = (courseId?: number, userId?: number | string) => {
  if (typeof courseId === "number" && (typeof userId === "number" || typeof userId === "string")) {
    coursePermissionsCache.delete(getCoursePermissionsCacheKey(courseId, userId));
    return;
  }

  if (typeof courseId === "number") {
    clearCourseCacheEntries(courseId);
    return;
  }

  coursePermissionsCache.clear();
};

/**
 * Fetches a list of courses based on the provided query parameters.
 * @param [params] - Optional filtering parameters for the courses.
 * @param [params.name] - The name of the course to filter by.
 * @param [params.lead] - The lead instructor's name to filter by.
 * @returns  A promise that resolves to an array of courses.
 */
export const getCourses = async (
  params?: { name?: string; lead?: string },
): Promise<Course[]> => {
  const response = await api.get<Course[]>("/api/courses/", { params });
  return response.data;
};

/**
 * Retrieves a course by its unique identifier.
 * This function sends an asynchronous GET request to fetch
 * course data associated with the provided ID. The retrieved
 * course data is then returned as a promise.
 * @param id - The unique identifier of the course to retrieve.
 * @returns A promise that resolves to the course object.
 */
export const getCourse = async (id: number): Promise<Course> => {
  const response = await api.get<Course>(`/api/courses/${id}/`);
  return response.data;
};

/**
 * Asynchronously creates a new course with the provided data.
 * This function sends a POST request to the server to create a course
 * using the specified course creation data. Upon successful creation,
 * it returns the created course information.
 * @param data - The data required to create a new course.
 * @returns A promise that resolves to the created course object.
 */
export const createCourse = async (data: CourseCreation): Promise<Course> => {
  const response = await api.post<Course>("/api/courses/", data);
  return response.data;
};

/**
 * Asynchronously retrieves the course permissions for a given course ID.
 * Utilizes a caching mechanism to store and reuse permissions data for subsequent calls.
 * Optionally allows bypassing the cache through the `forceRefresh` option.
 * Throws an error if the current user is not authenticated.
 * @param id - The ID of the course for which to fetch permissions.
 *                                         If null or undefined, the operation will not proceed.
 * @param [options] - Optional configuration for the request.
 * @param  [options.forceRefresh] - If true, bypasses the cache and fetches fresh permissions.
 * @returns } A promise that resolves to the permissions data for the specified course.
 * @throws {Error} If no authenticated user is available or if an error occurs during the fetch operation.
 */
export const getCoursePermissions = async (
    id: number | null | undefined,
    options?: { forceRefresh?: boolean },
): Promise<CoursePermissions> => {
  const currentUserId = getCurrentUserId();

  if (currentUserId === null) {
    throw new Error("Cannot load course permissions without an authenticated user.");
  }

  const cacheKey = getCoursePermissionsCacheKey(id, currentUserId);

  if (!options?.forceRefresh) {
    const cached = coursePermissionsCache.get(cacheKey);
    if (cached && isCacheEntryValid(cached)) {
      return cached.value;
    }

    if (cached) {
      coursePermissionsCache.delete(cacheKey);
    }
  }

  const response = await api.get<CoursePermissions>(`/api/courses/${id}/permissions/`);

  coursePermissionsCache.set(cacheKey, {
    value: response.data,
    expiresAt: Date.now() + COURSE_PERMISSIONS_TTL_MS,
  });

  return response.data;
};


/**
 * Updates the details of an existing course by its unique identifier.
 * @param id - The unique identifier of the course to be updated.
 * @param data - An object containing the updated course details.
 * @returns A promise that resolves to the updated course object.
 * @throws {Error} Throws an error if the update operation fails.
 * This function sends a PUT request to update the specified course with the provided data.
 * Additionally, it clears the course permissions cache for the current user, if available.
 */
export const updateCourse = async (id: number, data: CourseUpdate): Promise<Course> => {
  const response = await api.put<Course>(`/api/courses/${id}/`, data);
  const currentUserId = getCurrentUserId();
  if (currentUserId !== null) clearCoursePermissionsCache(id, currentUserId);
  return response.data;
};

/**
 * Deletes a course with the specified ID and clears any related permissions cache for the current user.
 * @param id - The unique identifier of the course to be deleted.
 * @returns A promise that resolves when the course has been successfully deleted.
 * This function communicates with the API endpoint to remove the course and performs
 * cleanup by clearing cached permissions associated with the course for the signed-in user.
 */
export const deleteCourse = async (id: number): Promise<void> => {
  await api.delete(`/api/courses/${id}/`);
  const currentUserId = getCurrentUserId();
  if (currentUserId !== null) clearCoursePermissionsCache(id, currentUserId);
};

/**
 * Joins the course with the specified code by making an API call and updates relevant permissions cache.
 * @param code - The unique join code of the course to join.
 * @returns A promise that resolves to the joined course data.
 * @throws {Error} If the API call fails or the response data is invalid.
 */
export const joinCourse = async (code: string): Promise<Course> => {
  const response = await api.post<Course>(`/api/courses/join-by-code/`, {"code": code});
  const currentUserId = getCurrentUserId();
  if (currentUserId !== null) clearCoursePermissionsCache(response.data.id, currentUserId);
  return response.data;
};

/**
 * Asynchronously leaves a course based on the provided course ID.
 * This function sends a request to the API to leave the specified course.
 * If the operation is successful and the current user ID is available,
 * it clears the cached permissions associated with the course for the user.
 * @param id - The unique identifier of the course to leave.
 * @returns A promise that resolves to the course data returned from the API.
 * @throws {Error} Throws an error if the API call fails or the response indicates an error.
 */
export const leaveCourse = async (id: number): Promise<Course> => {
  const response = await api.post<Course>(`/api/courses/${id}/leave/`);
  const currentUserId = getCurrentUserId();
  if (currentUserId !== null) clearCoursePermissionsCache(id, currentUserId);
  return response.data;
};

/**
 * Retrieves a list of events associated with a specific course.
 * This asynchronous function fetches events for a course identified by the provided course ID.
 * It makes an API request to the `/api/courses/{id}/events/` endpoint and returns the resulting
 * data containing an array of events.
 * @param id - The unique identifier of the course whose events are to be fetched.
 * @returns A Promise that resolves to an array of Event objects associated with the course.
 * @throws {Error} May throw an error if the request fails or if the API response is invalid.
 */
export const getCourseEvents = async (id: number): Promise<Event[]> => {
  const response = await api.get<Event[]>(`/api/courses/${id}/events/`);
  return response.data;
};

/**
 * Creates a new course event for the given course ID by sending a POST request to the server.
 * If the current user is identified, clears the cached permissions for the course to ensure updated access rights.
 * @param id - The ID of the course for which the event is being created.
 * @param  data - The event data to be sent in the request body.
 * @returns A promise that resolves to the response data from the server.
 * @throws {Error} - Throws an error if the request fails.
 */
    export const createCourseEvent = async (id: number, data: unknown): Promise<Event> => {
      const response = await api.post<Event>(`/api/courses/${id}/events/`, data);
      const currentUserId = getCurrentUserId();
      if (currentUserId !== null) {
        clearCoursePermissionsCache(id, currentUserId);
      }
      return response.data;
    };


/**
 * Fetches the list of students enrolled in a specific course.
 * @param id - The unique identifier of the course.
 * @returns A promise that resolves to an array of students enrolled in the course.
 */
export const getCourseStudents = async (id: number): Promise<CourseStudent[]> => {
  return getCourse(id).then(course => {
    if (!course) {
      throw new Error(`Course with ID ${id} not found.`);
    }
    return course.students;
  });
};

/**
 * Removes a user from a course.
 * This function sends a POST request to the backend to remove a specified user
 * from a given course by their respective IDs. Once the request is successfully
 * completed, the user will no longer be associated with the course.
 * @param courseId - The unique identifier of the course from which the user is to be removed.
 * @param userId - The unique identifier of the user to be removed from the course.
 * @returns A promise that resolves when the user is successfully removed from the course.
 */
export const removeUserFromCourse = async (
  courseId: number,
  userId: number,
): Promise<void> => {
  await api.post(`/api/courses/${courseId}/remove-user/`, {
    user_id: userId,
  });
};

/**
 * Retrieves the staff members associated with a specific course.
 * @param id - The unique identifier of the course.
 * @returns A promise that resolves to an array of CourseStaff objects.
 */
export const getStaff = async (id: number): Promise<CourseStaff[]> => {
  const response = await api.get<CourseStaff[]>(`/api/courses/${id}/staff/`);
  return response.data;
};

/**
 * Retrieves the current teacher's information from the server.
 * This asynchronous function makes a network request to the `/api/teachers/`
 * endpoint, then selects the current user's teacher record from the returned list.
 * @returns A promise that resolves to the current teacher's information, or null if
 * the current user is not an active teacher.
 */
export const getCurrentTeacher = async (): Promise<Teacher | null> => {
  const currentUserId = getCurrentUserId();

  if (currentUserId === null) {
    return null;
  }

  const response = await api.get<Teacher[]>("/api/teachers/");
  return response.data.find(
    (teacherEntry) => teacherEntry.user_id === Number(currentUserId),
  ) ?? null;
};
/**
 * Generates a join code for a specified course.
 * @param id - The unique identifier of the course.
 * @param data - Additional data to be sent with the join code request (non currently)
 * @param data.expires_at - The expiration date of the join code. Set to `null` for no expiration.
 * @returns A promise that resolves to the generated join code as a string.
 * Notes:
 * - The join code is created by making a POST request to the API endpoint associated with the specified course ID.
 * - If a user is currently logged in, the course permission cache for the current user will be cleared to ensure permissions remain consistent.
 */
export const createJoinCode = async (id: number, data: { expires_at: string | null }): Promise<CourseJoinCode> => {
  const response = await api.post<string>(`/api/courses/${id}/join-code/`, data);
  const currentUserId = authStore.getUser()?.id;
  clearCoursePermissionsCache(id, currentUserId);
  return response.data as unknown as CourseJoinCode;
};


/**
 * Asynchronously creates a teacher profile for the currently authenticated user.
 *
 * This function sends a POST request to the server to create a teacher profile
 * associated with the logged-in user's ID. It utilizes the `api.post` method
 * to communicate with the backend and retrieve a response after the profile is created.
 * @function
 * @returns A promise that resolves once the teacher profile creation request is completed.
 * @throws {Error} Throws an error if the API call fails or the server responds with an error.
 */
export const makeMyTeacherProfile = async (): Promise<void> => {
  await api.post("/api/teachers/create_teacher/", {
    "user_id": getCurrentUserId()
  });
};

/**
 * Unregisters the user's teacher profile from the system.
 *
 * This asynchronous function sends a POST request to the server to remove
 * the teacher's profile. It does not take any arguments and returns a Promise
 * that resolves once the operation is complete.
 * @returns A Promise that resolves when the teacher profile has been successfully unregistered.
 */
export const unregisterMyTeacherProfile = async (): Promise<void> => {
  await api.post("/api/teachers/unregister_teacher/");
};
