import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi, describe, it, expect, beforeEach } from "vitest";
import App from "@/App";

// Mock the components used in routes to avoid deep rendering issues
vi.mock("@/pages/index", () => ({
  Home: () => <div>Home Page</div>,
  Login: () => <div>Login Page</div>,
  Signup: () => <div>Signup Page</div>,
  Logout: () => <div>Logout Page</div>,
  CalendarPage: () => <div>Calendar Page</div>,
  TaskList: () => <div>Task List Page</div>,
  Gradebook: () => <div>Gradebook Page</div>,
  Dashboard: () => <div>Dashboard Page</div>,
  Settings: () => <div>Settings Page</div>,
}));

vi.mock("@/pages/Notification/Notifications", () => ({
  Notifications: () => <div>Notifications Page</div>,
}));

vi.mock("@/pages/Notification/NotificationDetail", () => ({
  NotificationDetail: () => <div>Notification Detail Page</div>,
}));

vi.mock("@/pages/Admin/Notifications/AdminNotifications", () => ({
  AdminNotifications: () => <div>Admin Notifications Page</div>,
}));

vi.mock("@/pages/Admin/Notifications/AdminNotificationHistory", () => ({
  AdminNotificationHistory: () => <div>Admin Notification History Page</div>,
}));

vi.mock("@/pages/Admin/Notifications/AdminNotificationHistoryDetail", () => ({
  AdminNotificationHistoryDetail: () => <div>Admin Notification History Detail Page</div>,
}));

// Mock Auth components
vi.mock("@/components/auth/RequireAuth", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/auth/RedirectAuth", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/auth/RequireAdmin", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe("App Component", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    // Reset document element dataset
    delete document.documentElement.dataset.theme;
    delete document.documentElement.dataset.font;
  });

  it("should render and apply saved theme and font from localStorage on protected routes", () => {
    localStorage.setItem("theme", "dark");
    localStorage.setItem("font", "open-dyslexic");

    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <App />
      </MemoryRouter>
    );

    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(document.documentElement.dataset.font).toBe("open-dyslexic");
  });

  it("should apply default theme and font on public routes", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>
    );

    expect(document.documentElement.dataset.theme).toBe("light");
    expect(document.documentElement.dataset.font).toBe("poppins");
  });

  it("should render Home page at root path", () => {
    const { getByText } = render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>
    );
    expect(getByText("Home Page")).toBeDefined();
  });

  it("should render Login page", () => {
    const { getByText } = render(
      <MemoryRouter initialEntries={["/login"]}>
        <App />
      </MemoryRouter>
    );
    expect(getByText("Login Page")).toBeDefined();
  });

  it("should render Signup page", () => {
    const { getByText } = render(
      <MemoryRouter initialEntries={["/signup"]}>
        <App />
      </MemoryRouter>
    );
    expect(getByText("Signup Page")).toBeDefined();
  });

  it("should render Logout page", () => {
    const { getByText } = render(
      <MemoryRouter initialEntries={["/logout"]}>
        <App />
      </MemoryRouter>
    );
    expect(getByText("Logout Page")).toBeDefined();
  });

  it("should render Calendar page", () => {
    const { getByText } = render(
      <MemoryRouter initialEntries={["/calendar"]}>
        <App />
      </MemoryRouter>
    );
    expect(getByText("Calendar Page")).toBeDefined();
  });

  it("should render Task List page", () => {
    const { getByText } = render(
      <MemoryRouter initialEntries={["/tasks"]}>
        <App />
      </MemoryRouter>
    );
    expect(getByText("Task List Page")).toBeDefined();
  });

  it("should render Gradebook page", () => {
    const { getByText } = render(
      <MemoryRouter initialEntries={["/gradebook"]}>
        <App />
      </MemoryRouter>
    );
    expect(getByText("Gradebook Page")).toBeDefined();
  });

  it("should render Dashboard page", () => {
    const { getByText } = render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <App />
      </MemoryRouter>
    );
    expect(getByText("Dashboard Page")).toBeDefined();
  });

  it("should render Notifications page", () => {
    const { getByText } = render(
      <MemoryRouter initialEntries={["/notifications"]}>
        <App />
      </MemoryRouter>
    );
    expect(getByText("Notifications Page")).toBeDefined();
  });

  it("should render Notification Detail page", () => {
    const { getByText } = render(
      <MemoryRouter initialEntries={["/notifications/1"]}>
        <App />
      </MemoryRouter>
    );
    expect(getByText("Notification Detail Page")).toBeDefined();
  });

  it("should render Admin Notifications page", () => {
    const { getByText } = render(
      <MemoryRouter initialEntries={["/admin/notifications"]}>
        <App />
      </MemoryRouter>
    );
    expect(getByText("Admin Notifications Page")).toBeDefined();
  });

  it("should render Admin Notification History page", () => {
    const { getByText } = render(
      <MemoryRouter initialEntries={["/admin/notifications/history"]}>
        <App />
      </MemoryRouter>
    );
    expect(getByText("Admin Notification History Page")).toBeDefined();
  });

  it("should render Admin Notification History Detail page", () => {
    const { getByText } = render(
      <MemoryRouter initialEntries={["/admin/notifications/history/1"]}>
        <App />
      </MemoryRouter>
    );
    expect(getByText("Admin Notification History Detail Page")).toBeDefined();
  });

  it("should render Settings page", () => {
    const { getByText } = render(
      <MemoryRouter initialEntries={["/settings"]}>
        <App />
      </MemoryRouter>
    );
    expect(getByText("Settings Page")).toBeDefined();
  });

});
