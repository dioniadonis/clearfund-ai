import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOperatorAuth } from "@/hooks/useOperatorAuth";

const RequireOperator: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session, sessionLoading, roleState, signOut } = useOperatorAuth();
  const location = useLocation();

  if (sessionLoading || (session && roleState === "loading")) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="sr-only">Checking access</span>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/operator/login" replace state={{ from: location.pathname }} />;
  }

  if (roleState !== "operator") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-md w-full border rounded-lg p-6 text-center space-y-4">
          <ShieldAlert className="h-8 w-8 mx-auto text-destructive" />
          <h1 className="text-xl font-semibold">Not authorised</h1>
          <p className="text-sm text-muted-foreground">
            This account is signed in but has not been granted operator access.
          </p>
          <Button variant="outline" onClick={signOut}>
            Sign out
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default RequireOperator;
