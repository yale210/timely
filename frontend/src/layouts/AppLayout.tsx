import { type ReactNode } from "react";
import Navbar from "../components/Navbar";

interface AppLayoutProps {
  children: ReactNode;
  showNavbar?: boolean;
}

const AppLayout = ({ children, showNavbar = true }: AppLayoutProps) => {
  return (
    <div className="bg-white text-black transition-colors duration-200 h-screen flex flex-col overflow-hidden">
      {showNavbar && <Navbar />}
      <main className={`flex-1 flex flex-col min-w-0 overflow-hidden bg-white ${showNavbar ? "pt-16" : ""}`}>
        {children}
      </main>
    </div>
  );
};

export default AppLayout;
