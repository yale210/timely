import { type ReactNode } from "react";

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <div className="bg-white text-black transition-colors duration-200 h-screen flex overflow-hidden">
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-white">
        {children}
      </main>
    </div>
  );
};

export default AppLayout;