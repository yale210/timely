import { render, screen, waitFor, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi, type MockInstance } from "vitest";

interface MockRoot {
  render: (tree: ReactNode) => void;
};

type ServiceWorkerRegister = (
  scriptURL: string | URL,
  options?: RegistrationOptions,
) => Promise<unknown>;

const { createRootMock, renderMock, registerMock } = vi.hoisted(() => ({
  createRootMock: vi.fn<(container: Element | DocumentFragment) => MockRoot>(),
  renderMock: vi.fn<(tree: ReactNode) => void>(),
  registerMock: vi.fn<ServiceWorkerRegister>(),
}));

vi.mock("react-dom/client", () => ({
  createRoot: createRootMock,
}));

vi.mock("@/App", () => ({
  default: () => <div data-testid="app">App</div>,
}));

vi.mock("@/context/NotificationContext", () => ({
  NotificationProvider: ({ children }: { children: ReactNode }) => (
    <div data-testid="notification-provider">{children}</div>
  ),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...(actual as object),
    BrowserRouter: ({ children }: { children: ReactNode }) => (
      <div data-testid="browser-router">{children}</div>
    ),
  };
});

const importMain = async () => import("@/main");

const getLoadHandler = (
  addEventListenerSpy: MockInstance<typeof window.addEventListener>,
): EventListener => {
  const handler = addEventListenerSpy.mock.calls.find(([eventName]) => eventName === "load")?.[1];
  expect(handler).toBeTypeOf("function");
  return handler as EventListener;
};

describe("main.tsx", () => {
  beforeEach(() => {
    vi.resetModules();
    createRootMock.mockReset();
    renderMock.mockReset();
    registerMock.mockReset();

    createRootMock.mockReturnValue({ render: renderMock });
    registerMock.mockResolvedValue({});

    document.body.innerHTML = '<div id="root"></div>';
    Object.defineProperty(window.navigator, "serviceWorker", {
      configurable: true,
      writable: true,
      value: {
        register: registerMock,
      } as Partial<ServiceWorkerContainer>,
    });
  });

  it("creates the React root and renders the app inside its providers", async () => {
    await importMain();

    expect(createRootMock).toHaveBeenCalledWith(document.getElementById("root"));
    expect(renderMock).toHaveBeenCalledTimes(1);

    const renderedTree = renderMock.mock.calls[0][0];
    expect(renderedTree).toBeDefined();
    render(renderedTree);

    const router = screen.getByTestId("browser-router");
    const provider = within(router).getByTestId("notification-provider");
    expect(within(provider).getByTestId("app")).toBeInTheDocument();
  });

  it("registers the service worker after the window load event", async () => {
    const addEventListenerSpy = vi.spyOn(window, "addEventListener");

    await importMain();

    const loadHandler = getLoadHandler(addEventListenerSpy);
    loadHandler(new Event("load"));

    await waitFor(() => {
      expect(registerMock).toHaveBeenCalledWith("/sw.js");
    });
  });

  it("logs service worker registration failures", async () => {
    const failure = new Error("registration failed");
    const addEventListenerSpy = vi.spyOn(window, "addEventListener");
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    registerMock.mockRejectedValueOnce(failure);

    await importMain();

    const loadHandler = getLoadHandler(addEventListenerSpy);
    loadHandler(new Event("load"));

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Service worker registration failed:",
        failure,
      );
    });
  });
});
