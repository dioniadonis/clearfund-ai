
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Building, Zap, Check } from 'lucide-react';

const WhatDoYouNeedSection: React.FC = () => {
  const navigate = useNavigate();

  const handleWorkingCapital = () => {
    navigate('/apply?interest=working_capital&cta=home_need_working_capital');
  };

  const handleInstantMicro = () => {
    window.open('https://davidallencapital.com/clearfund', '_blank');
  };


  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="container-custom">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-clearfund-dark-blue mb-4">
            What Do You Need?
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Choose the funding solution that best fits your business needs
          </p>
          <p className="text-sm text-gray-500 mt-2">
            *Funding options include MCAs, equipment financing, and business loans. Terms vary by product and provider.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Working Capital */}
          <Card className="border border-gray-200 hover:border-clearfund-blue transition-colors hover:shadow-lg flex flex-col">
            <CardHeader className="text-center">
              <div className="w-16 h-16 rounded-full bg-clearfund-blue/10 text-clearfund-blue flex items-center justify-center mx-auto mb-4">
                <Building size={32} />
              </div>
              <CardTitle className="text-xl text-clearfund-dark-blue">Working Capital</CardTitle>
              <CardDescription className="text-gray-600">
                For established businesses looking to expand operations, purchase inventory, or manage cash flow
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col">
              <div className="mb-4">
                <div className="space-y-3 text-sm text-gray-700">
                  <div className="flex items-center">
                    <Check size={16} className="text-green-600 flex-shrink-0" />
                    <span className="ml-3">$10K - $2M funding range</span>
                  </div>
                  <div className="flex items-center">
                    <Check size={16} className="text-green-600 flex-shrink-0" />
                    <span className="ml-3">1+ year in business required</span>
                  </div>
                  <div className="flex items-center">
                    <Check size={16} className="text-green-600 flex-shrink-0" />
                    <span className="ml-3">$120K+ annual revenue</span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-500 mb-4">
                *Subject to funding partner approval and verification
              </p>
              <Button 
                onClick={handleWorkingCapital}
                className="w-full bg-clearfund-blue hover:bg-clearfund-dark-blue text-white mt-auto"
              >
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          {/* Instant Micro Funding */}
          <Card className="border border-gray-200 hover:border-clearfund-blue transition-colors hover:shadow-lg flex flex-col">
            <CardHeader className="text-center">
              <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-4">
                <Zap size={32} />
              </div>
              <CardTitle className="text-xl text-clearfund-dark-blue">Instant Micro Funding</CardTitle>
              <CardDescription className="text-gray-600">
                Perfect for small businesses, gig workers, and entrepreneurs who need quick access to smaller amounts
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col">
              <div className="mb-4">
                <div className="space-y-3 text-sm text-gray-700">
                  <div className="flex items-center">
                    <Check size={16} className="text-green-600 flex-shrink-0" />
                    <span className="ml-3">Quick MCA provider matching</span>
                  </div>
                  <div className="flex items-center">
                    <Check size={16} className="text-green-600 flex-shrink-0" />
                    <span className="ml-3">Ideal for gig workers</span>
                  </div>
                  <div className="flex items-center">
                    <Check size={16} className="text-green-600 flex-shrink-0" />
                    <span className="ml-3">Small business friendly</span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-500 mb-4">
                *Fast funding decisions, subject to provider approval. Provided by David Allen Capital; ClearFund AI may receive compensation if you are funded.
              </p>
              <Button 
                onClick={handleInstantMicro}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white mt-auto"
              >
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

        </div>
      </div>

    </section>
  );
};

export default WhatDoYouNeedSection;
