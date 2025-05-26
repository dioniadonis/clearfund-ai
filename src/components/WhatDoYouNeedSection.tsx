
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
          <p className="text-sm text-gray-500 mt-2">
            *Funding options include MCAs, equipment financing, and business loans. Terms vary by product and provider.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
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
                *Funding as fast as 24 hours subject to provider approval
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

          {/* Credit Repair */}
          <Card className="border border-gray-200 hover:border-clearfund-blue transition-colors hover:shadow-lg flex flex-col">
            <CardHeader className="text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-4">
                <CreditCard size={32} />
              </div>
              <CardTitle className="text-xl text-clearfund-dark-blue">Credit Repair</CardTitle>
              <CardDescription className="text-gray-600">
                Improve your credit score to qualify for better funding options and get your credit professionally fixed
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col">
              <div className="mb-4">
                <div className="space-y-3 text-sm text-gray-700">
                  <div className="flex items-center">
                    <Check size={16} className="text-green-600 flex-shrink-0" />
                    <span className="ml-3">Free consultation available</span>
                  </div>
                  <div className="flex items-center">
                    <Check size={16} className="text-green-600 flex-shrink-0" />
                    <span className="ml-3">73% success rate*</span>
                  </div>
                  <div className="flex items-center">
                    <Check size={16} className="text-green-600 flex-shrink-0" />
                    <span className="ml-3">One-time payment</span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-500 mb-4">
                *Based on partner data. Individual results vary. Services provided by licensed third-party partners. ClearFund AI receives commissions for referrals.
              </p>
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
          <div className="px-6 pb-4">
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-4">
              <p className="text-sm text-yellow-800">
                By submitting this application, you authorize ClearFund AI and its funding partners to review your business and financial information. 
                You agree to our Terms & Conditions and Privacy Policy.
              </p>
              <div className="mt-3 flex items-start">
                <input type="checkbox" required className="mt-1 mr-2" />
                <label className="text-xs text-yellow-700">
                  I acknowledge that ClearFund AI is a broker service that will match me with appropriate funding providers. 
                  I understand that different funding products have different terms.
                </label>
              </div>
            </div>
          </div>
          <iframe 
            src="https://form.jotform.com/251378086816062" 
            className="w-full h-[450px] border-none"
            title="Clearfund Application Form"
            data-clearfund-form="application"
          />
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default WhatDoYouNeedSection;
