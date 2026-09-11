import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

type RoleState = "loading" | "operator" | "none";

interface OperatorAuthValue {
  session: Session | null;
  user: User | null;
  sessionLoading: boolean;
  roleState: RoleState;
  signOut: () => Promise<void>;
}

const OperatorAuthContext = createContext<OperatorAuthValue | undefined>(undefined);

export const OperatorAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [roleState, setRoleState] = useState<RoleState>("loading");
  const queryClient = useQueryClient();

  // Guards against stale role responses: every lookup carries a sequence number
  // and the user id it was issued for. Anything else is discarded.
  const requestSeq = useRef(0);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setSessionLoading(false);
    });

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setSessionLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const userId = session?.user?.id ?? null;
    const seq = ++requestSeq.current;

    if (!userId) {
      setRoleState("none");
      return;
    }

    setRoleState("loading");

    (async () => {
      // Re-validate the user against the auth server before trusting the role.
      const { data: userData } = await supabase.auth.getUser();
      if (seq !== requestSeq.current) return;
      if (userData.user?.id !== userId) {
        setRoleState("none");
        return;
      }

      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      if (seq !== requestSeq.current) return;

      if (error || !data) {
        setRoleState("none");
        return;
      }

      const allowed = data.some((r) => r.role === "admin" || r.role === "operator");
      setRoleState(allowed ? "operator" : "none");
    })();
  }, [session?.user?.id]);

  const signOut = async () => {
    requestSeq.current++; // invalidate any in-flight role lookup
    setRoleState("none");
    await supabase.auth.signOut();
    setSession(null);
    queryClient.clear();
  };

  const value = useMemo<OperatorAuthValue>(
    () => ({
      session,
      user: session?.user ?? null,
      sessionLoading,
      roleState,
      signOut,
    }),
    [session, sessionLoading, roleState]
  );

  return <OperatorAuthContext.Provider value={value}>{children}</OperatorAuthContext.Provider>;
};

export function useOperatorAuth() {
  const ctx = useContext(OperatorAuthContext);
  if (!ctx) throw new Error("useOperatorAuth must be used inside OperatorAuthProvider");
  return ctx;
}
