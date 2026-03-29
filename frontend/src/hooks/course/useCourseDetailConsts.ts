import { useNavigate, useParams } from "react-router-dom";
import { authStore } from "@/services/authService";

/**
 * Returns route and auth values used by the course detail page.
 */
export function useCourseDetailConsts(){
    const { id } = useParams();
    const navigate = useNavigate();
    const currentUser = authStore.getUser();
    return {
        id,
        navigate,
        currentUser,
    }
}