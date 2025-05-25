
import React from 'react';
import { Button } from "@/components/ui/button";
import { ArrowRight } from 'lucide-react';

const WorkingCapitalSection: React.FC = () => {
  return (
    <section className="py-16 md:py-24 bg-gray-50">
      <div className="container-custom">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-clearfund-dark-blue mb-4">
            Working Capital Solutions
          </h2>
          <p className="text-lg text-gray-700 max-w-3xl mx-auto">
            Get the working capital you need to manage cash flow, cover expenses, and grow your business. 
            Our flexible funding options are designed to support your day-to-day operations.
          </p>
        </div>
        
        <div className="flex justify-center">
          <Button 
            asChild
            className="bg-clearfund-blue hover:bg-clearfund-dark-blue text-white text-lg py-6 px-8 rounded-lg transition-colors"
          >
            <a href="/working-capital">
              Learn More
              <ArrowRight className="ml-2 h-5 w-5" />
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default WorkingCapitalSection;
