
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowRight, Building, Zap, CreditCard } from 'lucide-react';

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
          <Card className="border border-gray-200 hover:border-clearfund-blue transition-colors hover:shadow-lg">
            <CardHeader className="text-center">
              <div className="w-16 h-16 rounded-full bg-clearfund-blue/10 text-clearfund-blue flex items-center justify-center mx-auto mb-4">
                <Building size={32} />
              </div>
              <CardTitle className="text-xl text-clearfund-dark-blue">Working Capital</CardTitle>
              <CardDescription className="text-gray-600">
                For established businesses looking to expand operations, purchase inventory, or manage cash flow
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="space-y-2 mb-6 text-sm text-gray-700">
                <p>• $10K - $2M funding range</p>
                <p>• 1+ year in business required</p>
                <p>• $120K+ annual revenue</p>
              </div>
              <Button 
                onClick={handleWorkingCapital}
                className="w-full bg-clearfund-blue hover:bg-clearfund-dark-blue text-white"
              >
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          {/* Instant Micro Funding */}
          <Card className="border border-gray-200 hover:border-clearfund-blue transition-colors hover:shadow-lg">
            <CardHeader className="text-center">
              <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-4">
                <Zap size={32} />
              </div>
              <CardTitle className="text-xl text-clearfund-dark-blue">Instant Micro Funding</CardTitle>
              <CardDescription className="text-gray-600">
                Perfect for small businesses, gig workers, and entrepreneurs who need quick access to smaller amounts
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="space-y-2 mb-6 text-sm text-gray-700">
                <p>• Fast approval process</p>
                <p>• Ideal for gig workers</p>
                <p>• Small business friendly</p>
              </div>
              <Button 
                onClick={handleInstantMicro}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white"
              >
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          {/* Credit Repair */}
          <Card className="border border-gray-200 hover:border-clearfund-blue transition-colors hover:shadow-lg">
            <CardHeader className="text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-4">
                <CreditCard size={32} />
              </div>
              <CardTitle className="text-xl text-clearfund-dark-blue">Credit Repair</CardTitle>
              <CardDescription className="text-gray-600">
                Improve your credit score to qualify for better funding options and lower interest rates
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="space-y-2 mb-6 text-sm text-gray-700">
                <p>• Free consultation available</p>
                <p>• 73% success rate</p>
                <p>• One-time payment</p>
              </div>
              <Button 
                onClick={handleCreditRepair}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
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
