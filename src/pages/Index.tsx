
import React from 'react';
import Header from '../components/Header';
import Hero from '../components/Hero';
import Features from '../components/Features';
import WorkingCapitalSection from '../components/WorkingCapitalSection';
import QualificationSection from '../components/QualificationSection';
import WhatDoYouNeedSection from '../components/WhatDoYouNeedSection';
import FundingPartners from '../components/FundingPartners';
import Footer from '../components/Footer';
import { usePageMeta } from "@/lib/usePageMeta";

const Index: React.FC = () => {
  usePageMeta(
    "ClearFund | Business Funding for Small Businesses",
    "Explore business funding options for your small business. Start with a short questionnaire; providers decide whether to make an offer and set all terms.",
    "/",
    "https://myclearfund.com",
  );
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        <Hero />
        <Features />
        <WorkingCapitalSection />
        <QualificationSection />
        <WhatDoYouNeedSection />
        <FundingPartners />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
