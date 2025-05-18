
import React from 'react';
import Header from '../components/Header';
import Hero from '../components/Hero';
import Features from '../components/Features';
import AIChat from '../components/AIChat';
import QualificationSection from '../components/QualificationSection';
import Footer from '../components/Footer';

const Index: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        <Hero />
        <Features />
        <QualificationSection />
        <AIChat />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
