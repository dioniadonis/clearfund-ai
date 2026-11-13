import GetStarted from "./pages/GetStarted";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import WorkingCapital from "./pages/WorkingCapital";
import GigFunding from "./pages/GigFunding";
import Blog from "./pages/Blog";
import RestorationFunding from "./pages/RestorationFunding";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsAndConditions from "./pages/TermsAndConditions";
import BrokerDisclosure from "./pages/BrokerDisclosure";
import Disclaimers from "./pages/Disclaimers";
import NotFound from "./pages/NotFound";
import Apply from "./pages/Apply";
import ContractFinancing from "./pages/ContractFinancing";
import CashGapCalculatorPage from "./pages/CashGapCalculatorPage";
import { OperatorAuthProvider } from "./hooks/useOperatorAuth";
import RequireOperator from "./components/operator/RequireOperator";
import OperatorLogin from "./pages/operator/Login";
import OperatorLayout from "./pages/operator/Layout";
import OperatorOverview from "./pages/operator/Overview";
import OperatorLeads from "./pages/operator/Leads";
import OperatorMarketing from "./pages/operator/Marketing";
import OperatorVoice from "./pages/operator/Voice";
import OperatorIntegrations from "./pages/operator/Integrations";
import OperatorApplications from "./pages/operator/Applications";
import OperatorCallbacks from "./pages/operator/Callbacks";
import OperatorAudits from "./pages/operator/Audits";
import OperatorAuditDetail from "./pages/operator/AuditDetail";
import FreeAuditLanding from "./pages/FreeAuditLanding";
import FreeAuditFlow from "./pages/FreeAuditFlow";
import FreeAuditResults from "./pages/FreeAuditResults";
import OperatorFreeAudits from "./pages/operator/FreeAudits";
import Awarded from "./pages/Awarded";
import Crm from "./pages/crm/Crm";
import OAuthConsent from "./pages/OAuthConsent";
import Agents from "./pages/Agents";
import AgentReferral from "./pages/AgentReferral";
import AgentPortal from "./pages/AgentPortal";
import Careers from "./pages/Careers";
import AiFundingHome from "./pages/AiFundingHome";
import { useEffect, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { backofficeRedirect, getSite } from "@/lib/site";

const queryClient = new QueryClient();

const HomeRoute = () => {
  useLocation();
  return getSite() === "ai" ? <AiFundingHome /> : <Index />;
};

const BackofficeHostGuard = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const destination = backofficeRedirect(window.location.hostname, location.pathname, location.search, location.hash);
  useEffect(() => {
    if (destination) window.location.replace(destination);
  }, [destination]);
  return destination ? null : children;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <OperatorAuthProvider>
        <Routes>
          <Route path="/" element={<HomeRoute />} />
          <Route path="/ai-funding" element={<AiFundingHome />} />
          <Route path="/working-capital" element={<WorkingCapital />} />
          <Route path="/gig-funding" element={<GigFunding />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/funding/insurance-restoration" element={<RestorationFunding />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
          <Route path="/broker-disclosure" element={<BrokerDisclosure />} />
          <Route path="/disclaimers" element={<Disclaimers />} />
          <Route path="/apply" element={<Apply />} />
          <Route path="/get-started" element={<GetStarted />} />
          <Route path="/contract-financing" element={<ContractFinancing />} />
          <Route path="/cash-gap-calculator" element={<CashGapCalculatorPage />} />
          <Route path="/automation-audit" element={<FreeAuditLanding />} />
          <Route path="/automation-audit/start" element={<FreeAuditFlow />} />
          <Route path="/results/:token" element={<FreeAuditResults />} />
          <Route path="/awarded" element={<Awarded />} />
          <Route path="/agents" element={<Agents />} />
          <Route path="/r/:code" element={<AgentReferral />} />
          <Route path="/agent" element={<AgentPortal />} />
          <Route path="/careers" element={<Careers />} />
          <Route path="/crm" element={<Crm />} />
          <Route path="/.lovable/oauth/consent" element={<OAuthConsent />} />
          <Route path="/operator/login" element={<OperatorLogin />} />
          <Route
            path="/operator"
            element={
              <RequireOperator>
                <OperatorLayout />
              </RequireOperator>
            }
          >
            <Route index element={<OperatorOverview />} />
            <Route path="leads" element={<OperatorLeads />} />
            <Route path="applications" element={<OperatorApplications />} />
            <Route path="callbacks" element={<OperatorCallbacks />} />
            <Route path="audits" element={<OperatorAudits />} />
            <Route path="audits/:id" element={<OperatorAuditDetail />} />
            <Route path="free-audits" element={<OperatorFreeAudits />} />
            <Route path="marketing" element={<OperatorMarketing />} />
            <Route path="voice" element={<OperatorVoice />} />
            <Route path="integrations" element={<OperatorIntegrations />} />
          </Route>
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </OperatorAuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
