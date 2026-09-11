import React, { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import OperatorSidebar from "@/components/operator/OperatorSidebar";
import { useOperatorAuth } from "@/hooks/useOperatorAuth";

const OperatorLayout: React.FC = () => {
  const { user, signOut } = useOperatorAuth();

  useEffect(() => {
    document.title = "ClearFund Operator";
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    document.head.appendChild(meta);
    return () => {
      document.head.removeChild(meta);
    };
  }, []);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <OperatorSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b px-2 sm:px-4 gap-2">
            <SidebarTrigger />
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-sm text-muted-foreground truncate max-w-[45vw]">
                {user?.email}
              </span>
              <Button size="sm" variant="outline" onClick={signOut}>
                Sign out
              </Button>
            </div>
          </header>
          <main className="flex-1 p-4 sm:p-6 min-w-0">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default OperatorLayout;
