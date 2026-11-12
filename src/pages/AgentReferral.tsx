import React, { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { saveAgentReferral } from "@/lib/agentProgram";

const AgentReferral: React.FC = () => {
  const { code = "" } = useParams();
  const navigate = useNavigate();
  useEffect(() => {
    document.title = "ClearFund AI referral";
    const meta = document.createElement("meta"); meta.name = "robots"; meta.content = "noindex, nofollow"; document.head.appendChild(meta);
    let live = true;
    supabase.rpc("track_agent_referral", { _code: code }).then(({ data, error }) => {
      if (!live) return;
      if (!error && data === true) saveAgentReferral(code);
      navigate("/get-started?cta=agent_referral", { replace: true });
    });
    return () => { live = false; meta.remove(); };
  }, [code, navigate]);
  return <div className="min-h-screen flex items-center justify-center gap-3"><Loader2 className="h-5 w-5 animate-spin" /><p>Opening the ClearFund questionnaire…</p></div>;
};
export default AgentReferral;
