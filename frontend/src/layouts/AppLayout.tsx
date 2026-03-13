import { type ReactNode } from "react";
import { AppNavbar } from "@/components/index";

interface AppLayoutProps {
  children: ReactNode;
  showNavbar?: boolean;
  disableMainScroll?: boolean;
}

const AppLayout = ({ children, showNavbar = true, disableMainScroll = false }: AppLayoutProps) => {
  return (
    <div className="bg-white text-black transition-colors duration-200 h-screen flex flex-col">
      {showNavbar && <AppNavbar />}
      <div className="app-shell flex-1 flex flex-col min-w-0">
        <main className={`flex-1 flex flex-col min-w-0 bg-white overflow-x-hidden ${disableMainScroll ? "overflow-hidden" : "overflow-auto"} ${showNavbar ? "pt-10" : ""}`}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
