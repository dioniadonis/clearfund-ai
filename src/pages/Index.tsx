
import React from 'react';
import Header from '../components/Header';
import Hero from '../components/Hero';
import Features from '../components/Features';
import WorkingCapitalSection from '../components/WorkingCapitalSection';
import QualificationSection from '../components/QualificationSection';
import WhatDoYouNeedSection from '../components/WhatDoYouNeedSection';
import FundingPartners from '../components/FundingPartners';
import Footer from '../components/Footer';

const Index: React.FC = () => {
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
