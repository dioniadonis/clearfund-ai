
import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowRight } from 'lucide-react';

const WorkingCapital: React.FC = () => {
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="py-16 md:py-20 bg-gradient-to-br from-white via-amber-50 to-white">
          <div className="container-custom grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-amber-800 leading-tight">
                Working <br />
                Capital <br />
                <span className="text-orange-500">Loan</span>
              </h1>
              <div className="flex space-x-3">
                <div className="h-4 w-4 rounded-full bg-orange-400"></div>
                <div className="h-4 w-4 rounded-full bg-orange-400"></div>
                <div className="h-4 w-4 rounded-full bg-orange-400"></div>
              </div>
              <div className="pt-4">
                <Button 
                  onClick={() => setIsDialogOpen(true)}
                  className="bg-clearfund-blue hover:bg-clearfund-dark-blue text-white text-lg py-6 px-8 rounded-lg transition-colors"
                >
                  Apply Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>
            <div className="relative hidden md:block">
              <div className="absolute -z-10 w-full h-full rounded-full bg-gradient-to-br from-amber-100 to-orange-200 blur-xl opacity-50"></div>
              <img 
                src="/lovable-uploads/d5f9606b-e10b-468e-adb3-00280450262e.png"
                alt="Business professional holding golden coins" 
                className="w-full h-auto rounded-2xl shadow-lg"
              />
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-16 bg-white">
          <div className="container-custom">
            <div className="bg-amber-50 rounded-2xl p-8 md:p-12 shadow-md">
              <h2 className="text-3xl md:text-4xl font-bold text-amber-800 mb-8">
                Unique Benefits
              </h2>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <div className="text-orange-500 mr-4 text-xl">•</div>
                  <span className="text-xl text-amber-800">24-48 Hour Funding</span>
                </li>
                <li className="flex items-start">
                  <div className="text-orange-500 mr-4 text-xl">•</div>
                  <span className="text-xl text-amber-800">Bad Credit OK</span>
                </li>
                <li className="flex items-start">
                  <div className="text-orange-500 mr-4 text-xl">•</div>
                  <span className="text-xl text-amber-800">Liens/Judgements OK</span>
                </li>
              </ul>
            </div>
            
            <div className="mt-12 bg-amber-50 rounded-2xl p-8 md:p-12 shadow-md">
              <h2 className="text-3xl md:text-4xl font-bold text-amber-800 mb-8">
                Paperwork Needed
              </h2>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <div className="text-orange-500 mr-4 text-xl">•</div>
                  <span className="text-xl text-amber-800">Electronic Application</span>
                </li>
                <li className="flex items-start">
                  <div className="text-orange-500 mr-4 text-xl">•</div>
                  <span className="text-xl text-amber-800">YTD Bank Statements</span>
                </li>
                <li className="flex items-start">
                  <div className="text-orange-500 mr-4 text-xl">•</div>
                  <span className="text-xl text-amber-800">YTD Credit Card Processing Statements <span className="italic">(if applicable)</span></span>
                </li>
              </ul>
            </div>
            
            <div className="mt-12 bg-amber-50 rounded-2xl p-8 md:p-12 shadow-md">
              <h2 className="text-3xl md:text-4xl font-bold text-amber-800 mb-8">
                Qualifications:
              </h2>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <div className="text-orange-500 mr-4 text-xl">•</div>
                  <span className="text-xl text-amber-800">1+ Year Time in Business</span>
                </li>
                <li className="flex items-start">
                  <div className="text-orange-500 mr-4 text-xl">•</div>
                  <span className="text-xl text-amber-800">$120K+ Gross Annual Revenue</span>
                </li>
                <li className="flex items-start">
                  <div className="text-orange-500 mr-4 text-xl">•</div>
                  <span className="text-xl text-amber-800">No Minimum FICO</span>
                </li>
              </ul>
            </div>
            
            <div className="mt-12 flex justify-center">
              <Button 
                onClick={() => setIsDialogOpen(true)}
                className="bg-clearfund-blue hover:bg-clearfund-dark-blue text-white text-lg py-6 px-12 rounded-lg transition-colors"
              >
                Apply for Funding
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </section>
      </main>

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
      
      <Footer />
    </div>
  );
};

export default WorkingCapital;
