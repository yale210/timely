// Authentication Components
export { default as LoginForm } from "./auth/LoginForm"
export { default as SignupForm } from "./auth/SignupForm"
export { default as LogoutMessage } from "./auth/LogoutMessage"
export { default as RedirectAuth } from "./auth/RedirectAuth"
export { default as RequireAuth } from "./auth/RequireAuth"
export { default as RequireAdmin } from "./auth/RequireAdmin"

// Chart Components
export { default as CompletionPieChart } from "./charts/CompletionPieChart"
export { default as DailyTasksBarChart } from "./charts/DailyTasksBarChart"
export { default as DailyTimeBarChart } from "./charts/DailyTimeBarChart"
export { default as ImportanceBarChart } from "./charts/ImportanceBarChart"

// Dashboard Components
export { default as StatCard } from "./dashboard/StatCard"
export { default as WeeklySummaryWidget } from "./dashboard/WeeklySummaryWidget"

// Event Components
export { default as EventForm } from "./events/EventForm";
export { default as EventSidebar } from "./events/EventSidebar";
export { default as EventCard } from "./events/EventCard";

// Home Components
export { default as HomeNavbar } from "./home/HomeNavbar";
export { default as HeroSection } from "./home/HeroSection"

// Layout Components
export { default as AppNavbar } from "./layout/AppNavbar"
export { default as BlurBackground } from "./layout/BlurBackground"
export { default as Footer } from "./layout/Footer";

// Modal Components
export { default as ConfirmationModal } from "./modals/ConfirmationModal";
export { default as CreateGradeModal } from "./modals/CreateGradeModal";
export { default as RecurrenceScopeModal } from "./modals/RecurrenceScopeModal";
export { default as ScopeActionModal } from "./modals/ScopeActionModal";

// Notification Components -> Cannot be exported due to no exported member 'default'

// Setting Components
export { default as ThemeButton} from "./settings/ThemeButton";
export { default as FontButton} from "./settings/FontButton"

// Task Components
export { default as TaskForm } from "./tasks/TaskForm";
export { default as TaskSidebar } from "./tasks/TaskSidebar";
export { default as TaskCard } from "./tasks/TaskCard";
export { default as TaskListSection } from "./tasks/TaskListSection";
export { default as UnifiedSidebar } from "./tasks/UnifiedSidebar";
