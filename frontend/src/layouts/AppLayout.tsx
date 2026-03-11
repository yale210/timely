import { type ReactNode } from "react";
import { AppNavbar } from "@/components/index";

interface AppLayoutProps {
  children: ReactNode;
  showNavbar?: boolean;
}

const AppLayout = ({ children, showNavbar = true }: AppLayoutProps) => {
  return (
    <div className="bg-white text-black transition-colors duration-200 h-screen flex flex-col">
      {showNavbar && <AppNavbar />}
      <div className="app-shell flex-1 flex flex-col min-w-0">
        <main className={`flex-1 flex flex-col min-w-0 overflow-auto bg-white ${showNavbar ? "pt-10" : ""}`}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
