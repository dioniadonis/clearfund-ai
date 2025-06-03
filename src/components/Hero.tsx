
import React from 'react';
import { Button } from "@/components/ui/button";
import { ArrowRight, Play } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import FinancingEducationSlideShow from './FinancingEducationSlideShow';

const Hero: React.FC = () => {
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isEducationSlideShowOpen, setIsEducationSlideShowOpen] = React.useState(false);

  return (
    <section className="py-16 md:py-24 bg-gradient-to-br from-white via-clearfund-pale-blue to-white">
      <div className="container-custom grid md:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-clearfund-dark-blue leading-tight">
            Funding Tools for the <br />
            <span className="text-clearfund-blue">Growth-Driven Business</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-700 max-w-lg">
            Fast Capital. Smart Resources. <br />
            Transparent Options from $300 to $2M*
          </p>
          <p className="text-sm text-gray-600">
            *Subject to funding partner approval and bank verification
          </p>
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Button onClick={() => setIsDialogOpen(true)} className="bg-clearfund-blue hover:bg-clearfund-dark-blue text-white text-lg py-6 px-8 rounded-lg transition-colors">
              Apply Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button variant="outline" className="border-clearfund-blue text-clearfund-blue hover:bg-clearfund-pale-blue text-lg py-6 px-8 rounded-lg transition-colors" onClick={() => setIsEducationSlideShowOpen(true)}>
              What We Do
              <Play className="ml-2 h-5 w-5" />
            </Button>
          </div>
          <div className="pt-6">
            <p className="text-sm text-gray-500">Trusted by AI-driven businesses nationwide</p>
          </div>
        </div>
        
        {/* Right side content - AI chat preview */}
        <div className="relative hidden md:block ml-8">
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
                <p className="text-sm">I can help with that! I recommend our instant capital options with transparent terms and flexible repayments. I'll outline options that work best for your business!</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Application Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={open => setIsDialogOpen(open)}>
        <DialogContent className="sm:max-w-[800px] h-[600px] p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-xl font-bold text-clearfund-dark-blue">Credit Application</DialogTitle>
          </DialogHeader>
          <div className="px-6 pb-4">
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-4">
              <p className="text-sm text-yellow-800">
                By submitting this application, you authorize ClearFund AI and its funding partners to review your business and financial information. 
                This may result in credit inquiries. You agree to our Terms & Conditions and Privacy Policy.
              </p>
            </div>
          </div>
          <iframe src="https://form.jotform.com/251378086816062" className="w-full h-[450px] border-none" title="Clearfund Application Form" data-clearfund-form="application" />
        </DialogContent>
      </Dialog>

      {/* Educational Slideshow Dialog */}
      <Dialog open={isEducationSlideShowOpen} onOpenChange={open => setIsEducationSlideShowOpen(open)}>
        <DialogContent className="sm:max-w-[900px] h-[700px] p-0">
          <FinancingEducationSlideShow onClose={() => setIsEducationSlideShowOpen(false)} />
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default Hero;
