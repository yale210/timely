import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "@/App";
import { NotificationProvider } from "@/context/NotificationContext";
import { PomodoroProvider } from "@/context/PomodoroContext";
import "@/index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <NotificationProvider>
        <PomodoroProvider>
          <App />
        </PomodoroProvider>
      </NotificationProvider>
    </BrowserRouter>
  </StrictMode>,
);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    void navigator.serviceWorker.register("/sw.js").catch((error) => {
      console.error("Service worker registration failed:", error);
    });
  });
}
