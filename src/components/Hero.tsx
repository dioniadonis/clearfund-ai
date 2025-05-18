
import React from 'react';
import { Button } from "@/components/ui/button";
import { ArrowRight } from 'lucide-react';

const Hero: React.FC = () => {
  const openAminosChat = () => {
    if (typeof window !== 'undefined' && window.AminosAI) {
      window.AminosAI.open();
    } else {
      console.error('Aminos AI chat plugin not loaded');
    }
  };
  
  return <section className="py-16 md:py-24 bg-gradient-to-br from-white via-clearfund-pale-blue to-white">
      <div className="container-custom grid md:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-clearfund-dark-blue leading-tight">
            Funding Tools for the <br />
            <span className="text-clearfund-blue">AI-Driven Business</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-700 max-w-lg">
            Fast Capital. Smart Resources. <br />
            Transparent Options from $5K to $2M
          </p>
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Button 
              onClick={openAminosChat}
              className="bg-clearfund-blue hover:bg-clearfund-dark-blue text-white text-lg py-6 px-8 rounded-lg transition-colors">
              Chat with AI Advisor
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button variant="outline" className="border-clearfund-blue text-clearfund-blue hover:bg-clearfund-pale-blue text-lg py-6 px-8 rounded-lg transition-colors">
              Learn More
            </Button>
          </div>
          <div className="pt-6">
            <p className="text-sm text-gray-500">Trusted by over <span className="font-semibold">10,000+ AI-driven businesses</span> nationwide</p>
          </div>
        </div>
        <div className="relative hidden md:block">
          <div className="absolute -top-16 -right-16 w-64 h-64 bg-clearfund-pale-blue rounded-full opacity-50 blur-3xl"></div>
          <div className="relative bg-white shadow-xl rounded-xl p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="h-10 w-10 bg-clearfund-blue rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">AI</span>
                </div>
                <div className="ml-3">
                  <h3 className="font-medium">Clearfund AI Advisor</h3>
                  <p className="text-xs text-gray-500">Online now</p>
                </div>
              </div>
              <div className="h-3 w-3 bg-green-500 rounded-full"></div>
            </div>
            <div className="space-y-4">
              <div className="bg-clearfund-pale-blue p-3 rounded-lg rounded-tl-none max-w-[80%]">
                <p className="text-sm">Hello! I'm your Clearfund AI advisor. How can I help with your business financing needs today?</p>
              </div>
              <div className="bg-gray-100 p-3 rounded-lg rounded-tr-none max-w-[80%] ml-auto">
                <p className="text-sm">I'm looking for funding, I want to implement AI to scale our operations.</p>
              </div>
              <div className="bg-clearfund-pale-blue p-3 rounded-lg rounded-tl-none max-w-[80%]">
                <p className="text-sm">I can help with that! Based on your business profile, I recommend our Fast Capital option with transparent terms and flexible repayments...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>;
};

export default Hero;
