
import React from 'react';
import { Button } from "@/components/ui/button";
import { ArrowRight, Play } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const Hero: React.FC = () => {
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isVideoDialogOpen, setIsVideoDialogOpen] = React.useState(false);

  return <section className="py-16 md:py-24 bg-gradient-to-br from-white via-clearfund-pale-blue to-white">
      <div className="container-custom grid md:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-clearfund-dark-blue leading-tight">
            Funding Tools for the <br />
            <span className="text-clearfund-blue">AI-Driven Business</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-700 max-w-lg">
            Fast Capital. Smart Resources. <br />
            Transparent Options from $300 to $2M
          </p>
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Button 
              onClick={() => setIsDialogOpen(true)}
              className="bg-clearfund-blue hover:bg-clearfund-dark-blue text-white text-lg py-6 px-8 rounded-lg transition-colors"
            >
              Apply Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              variant="outline" 
              className="border-clearfund-blue text-clearfund-blue hover:bg-clearfund-pale-blue text-lg py-6 px-8 rounded-lg transition-colors"
              onClick={() => setIsVideoDialogOpen(true)}
            >
              What We Do
              <Play className="ml-2 h-5 w-5" />
            </Button>
          </div>
          <div className="pt-6">
            <p className="text-sm text-gray-500">Trusted by over <span className="font-semibold">10,000+ AI-driven businesses</span> nationwide</p>
          </div>
        </div>
        
        {/* Right side content - AI chat preview */}
        <div className="relative hidden md:block">
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
      <Dialog 
        open={isDialogOpen} 
        onOpenChange={(open) => setIsDialogOpen(open)}
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

      {/* Video Dialog */}
      <Dialog 
        open={isVideoDialogOpen} 
        onOpenChange={(open) => setIsVideoDialogOpen(open)}
      >
        <DialogContent className="sm:max-w-[600px] p-4">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-xl font-bold text-clearfund-dark-blue">Watch Our Video</DialogTitle>
          </DialogHeader>
          <div className="aspect-video w-full">
            <iframe 
              width="100%" 
              height="100%" 
              src="https://app.heygen.com/embeds/2b993d1c03844e59a8942ca35a1402d5" 
              title="HeyGen video player" 
              frameBorder="0" 
              allow="encrypted-media; fullscreen;" 
              allowFullScreen
              className="rounded-md"
            />
          </div>
        </DialogContent>
      </Dialog>
    </section>;
};

export default Hero;
