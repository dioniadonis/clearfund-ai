import React from "react";
import { useSearchParams } from "react-router-dom";
import { parseAmount } from "@/lib/amount";
import Header from "../components/Header";
import Footer from "../components/Footer";
import CashGapCalculator from "../components/CashGapCalculator";
import { usePageMeta } from "@/lib/usePageMeta";

const CashGapCalculatorPage: React.FC = () => {
  const [params] = useSearchParams();
  const amount = parseAmount(params.get("amount"));
  usePageMeta(
    "Mobilization Cash-Gap Calculator for Contractors | ClearFund AI",
    "Free calculator: see how much cash a new government contract needs before the first payment arrives.",
    "/cash-gap-calculator",
  );
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        <section className="py-16 md:py-20 bg-gradient-to-br from-white via-clearfund-pale-blue to-white">
          <div className="container-custom max-w-3xl text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold text-clearfund-dark-blue">How much cash does your new contract need up front?</h1>
            <p className="text-lg text-gray-700">
              Public agencies generally pay after work is done and invoiced. Estimate the gap you'll carry before the first payment.
            </p>
          </div>
        </section>
        <section className="py-12 md:py-16 bg-white">
          <div className="container-custom">
            <CashGapCalculator initialAmount={amount ?? undefined} />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default CashGapCalculatorPage;
