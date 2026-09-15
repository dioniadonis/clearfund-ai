import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import CreditRepair from "./pages/CreditRepair";
import WorkingCapital from "./pages/WorkingCapital";
import GigFunding from "./pages/GigFunding";
import Blog from "./pages/Blog";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsAndConditions from "./pages/TermsAndConditions";
import BrokerDisclosure from "./pages/BrokerDisclosure";
import Disclaimers from "./pages/Disclaimers";
import NotFound from "./pages/NotFound";
import Apply from "./pages/Apply";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <OperatorAuthProvider>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/credit-repair" element={<CreditRepair />} />
          <Route path="/working-capital" element={<WorkingCapital />} />
          <Route path="/gig-funding" element={<GigFunding />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
          <Route path="/broker-disclosure" element={<BrokerDisclosure />} />
          <Route path="/disclaimers" element={<Disclaimers />} />
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
