
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowRight, Building, Zap, CreditCard, Check } from 'lucide-react';

const WhatDoYouNeedSection: React.FC = () => {
  const [isApplicationDialogOpen, setIsApplicationDialogOpen] = useState(false);

  const handleWorkingCapital = () => {
    setIsApplicationDialogOpen(true);
  };

  const handleInstantMicro = () => {
    window.open('https://davidallencapital.com/clearfund', '_blank');
  };

  const handleCreditRepair = () => {
    window.open('https://portal.asapcreditrepairusa.com/client-signup-client.php?afcode=1328', '_blank');
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
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Working Capital */}
          <Card className="border border-gray-200 hover:border-clearfund-blue transition-colors hover:shadow-lg flex flex-col h-full">
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
              <div className="flex flex-col justify-center flex-grow mb-4">
                <div className="flex justify-center">
                  <div className="text-left">
                    <div className="space-y-3 text-sm text-gray-700">
                      <div className="flex items-center">
                        <div className="w-4 flex justify-center">
                          <Check size={16} className="text-green-600 flex-shrink-0" />
                        </div>
                        <span className="ml-3">$10K - $2M funding range</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-4 flex justify-center">
                          <Check size={16} className="text-green-600 flex-shrink-0" />
                        </div>
                        <span className="ml-3">1+ year in business required</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-4 flex justify-center">
                          <Check size={16} className="text-green-600 flex-shrink-0" />
                        </div>
                        <span className="ml-3">$120K+ annual revenue</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
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
          <Card className="border border-gray-200 hover:border-clearfund-blue transition-colors hover:shadow-lg flex flex-col h-full">
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
              <div className="flex flex-col justify-center flex-grow mb-6">
                <div className="flex justify-center">
                  <div className="text-left">
                    <div className="space-y-3 text-sm text-gray-700">
                      <div className="flex items-center">
                        <div className="w-4 flex justify-center">
                          <Check size={16} className="text-green-600 flex-shrink-0" />
                        </div>
                        <span className="ml-3">Fast approval process</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-4 flex justify-center">
                          <Check size={16} className="text-green-600 flex-shrink-0" />
                        </div>
                        <span className="ml-3">Ideal for gig workers</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-4 flex justify-center">
                          <Check size={16} className="text-green-600 flex-shrink-0" />
                        </div>
                        <span className="ml-3">Small business friendly</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <Button 
                onClick={handleInstantMicro}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white mt-auto"
              >
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          {/* Credit Repair */}
          <Card className="border border-gray-200 hover:border-clearfund-blue transition-colors hover:shadow-lg flex flex-col h-full">
            <CardHeader className="text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-4">
                <CreditCard size={32} />
              </div>
              <CardTitle className="text-xl text-clearfund-dark-blue">Credit Repair</CardTitle>
              <CardDescription className="text-gray-600">
                Improve your credit score to qualify for better funding options and lower interest rates
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col">
              <div className="flex flex-col justify-center flex-grow mb-6">
                <div className="flex justify-center">
                  <div className="text-left">
                    <div className="space-y-3 text-sm text-gray-700">
                      <div className="flex items-center">
                        <div className="w-4 flex justify-center">
                          <Check size={16} className="text-green-600 flex-shrink-0" />
                        </div>
                        <span className="ml-3">Free consultation available</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-4 flex justify-center">
                          <Check size={16} className="text-green-600 flex-shrink-0" />
                        </div>
                        <span className="ml-3">73% success rate</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-4 flex justify-center">
                          <Check size={16} className="text-green-600 flex-shrink-0" />
                        </div>
                        <span className="ml-3">One-time payment</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <Button 
                onClick={handleCreditRepair}
                className="w-full bg-green-600 hover:bg-green-700 text-white mt-auto"
              >
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Application Dialog */}
      <Dialog 
        open={isApplicationDialogOpen} 
        onOpenChange={(open) => setIsApplicationDialogOpen(open)}
      >
        <DialogContent className="sm:max-w-[800px] h-[600px] p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-xl font-bold text-clearfund-dark-blue">Credit Application</DialogTitle>
          </DialogHeader>
          <iframe 
            src="https://form.jotform.com/251378086816062" 
            className="w-full h-[550px] border-none"
            title="Clearfund Application Form"
            data-clearfund-form="application"
          />
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default WhatDoYouNeedSection;
