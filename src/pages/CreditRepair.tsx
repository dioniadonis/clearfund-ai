
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { ArrowRight, Check, Phone } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Header from '../components/Header';
import Footer from '../components/Footer';

const CreditRepair: React.FC = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const creditIssues = [
    "Bankruptcies",
    "Liens",
    "Judgements",
    "Foreclosures",
    "Charge Offs",
    "Collections",
    "Repossessions",
    "Late Payments",
    "Inquiries"
  ];
  
  const benefits = [
    "No monthly fees, one-time payment only",
    "60-90 day typical service completion",
    "We dispute all items at once",
    "Free in-depth credit analysis",
    "73% success rate (compared to 25% industry average)",
    "Permanent results guaranteed",
    "Constant communication throughout the process",
    "We can remove virtually anything negative"
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="py-16 md:py-24 bg-gradient-to-br from-white via-clearfund-pale-blue to-white">
          <div className="container-custom grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-clearfund-dark-blue leading-tight">
                Credit Repair <span className="text-clearfund-blue">That Actually Works</span>
              </h1>
              <p className="text-lg md:text-xl text-gray-700 max-w-lg">
                Get your finances back on track with our industry-leading credit repair service. 
                <span className="font-semibold block mt-2">Free consultation available!</span>
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button 
                  onClick={() => setIsDialogOpen(true)}
                  className="bg-clearfund-blue hover:bg-clearfund-dark-blue text-white text-lg py-6 px-8 rounded-lg transition-colors"
                >
                  Free Consultation
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button variant="outline" className="border-clearfund-blue text-clearfund-blue hover:bg-clearfund-pale-blue text-lg py-6 px-8 rounded-lg transition-colors">
                  Learn More
                </Button>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <Phone size={16} className="text-clearfund-blue" />
                <span className="font-medium">Call us: 954-579-0021</span>
              </div>
            </div>
            
            {/* Right side content - Credit Repair Highlight */}
            <div className="relative hidden md:block">
              <div className="absolute -top-16 -right-16 w-64 h-64 bg-clearfund-pale-blue rounded-full opacity-50 blur-3xl"></div>
              <Card className="relative bg-white shadow-xl rounded-xl border border-gray-100">
                <CardHeader className="bg-clearfund-blue text-white text-center rounded-t-xl">
                  <CardTitle className="text-3xl font-bold">THE CONSULTATION IS FREE</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <p className="text-gray-700 mb-6">
                    Don't let credit issues stress you out. We do this for a living. Our team is not only knowledgeable, but dedicated to giving you the most comfortable experience possible. Credit repair doesn't have to be painful! Let us help.
                  </p>
                  <h3 className="font-semibold text-lg text-clearfund-dark-blue mb-3">We help remove negative items including:</h3>
                  <ul className="grid grid-cols-2 gap-y-2">
                    {creditIssues.map((issue, index) => (
                      <li key={index} className="flex items-center">
                        <Check size={16} className="text-clearfund-blue mr-2" />
                        <span>{issue}</span>
                      </li>
                    ))}
                    <li className="flex items-center col-span-2">
                      <Check size={16} className="text-clearfund-blue mr-2" />
                      <span>And More</span>
                    </li>
                  </ul>
                </CardContent>
                <CardFooter className="flex justify-center">
                  <Button 
                    onClick={() => setIsDialogOpen(true)}
                    className="w-full bg-clearfund-blue hover:bg-clearfund-dark-blue text-white"
                  >
                    Get Started Now
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section className="py-16 bg-white">
          <div className="container-custom">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-clearfund-dark-blue mb-4">About Our Credit Repair</h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                In business since 1998, with multiple locations nationwide, our mission is to get your credit repaired as quickly as possible.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-2xl font-semibold text-clearfund-blue mb-6">Why Choose Our Credit Repair?</h3>
                <p className="mb-6">
                  Along with being fully licensed, bonded, and insured, we also have an A+ rating with the BBB. We dispute directly with the creditors, which leads to more effective results.
                </p>
                <p className="mb-6">
                  Our average success rate is 73% while most other companies barely return 25%. With us, you're purchasing a credit repair service, not an insurance policy.
                </p>
                <p className="mb-6">
                  Our fee is paid once and covers you for the full duration of the services, opposed to the never-ending monthly fees of other "repair" companies. Every item removed is permanent; you'll never worry about items returning back on your report.
                </p>
                <p className="font-semibold text-clearfund-dark-blue">
                  We offer a 100% money back guarantee on our services, which utilize 20+ different dispute techniques to guarantee the best possible results.
                </p>
              </div>
              
              <div className="bg-clearfund-pale-blue rounded-xl p-8">
                <h3 className="text-2xl font-semibold text-clearfund-blue mb-6">The Fastest Credit Repair In The Business</h3>
                <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                  <h4 className="text-xl font-bold text-center text-clearfund-dark-blue mb-4">RESULTS IN 30 DAYS</h4>
                  <p className="text-gray-700">
                    Our evaluation and consultation is FREE and we have a passionate staff, readily available, ready to serve you; returning all calls and texts the same business day.
                  </p>
                </div>
                
                <blockquote className="border-l-4 border-clearfund-blue pl-4 italic">
                  "We can't wait to show you how important customer service is to me and my team. Give us a call today!"
                  <footer className="mt-2 font-semibold">- CEO, Clearfund Credit Repair</footer>
                </blockquote>
              </div>
            </div>
          </div>
        </section>
        
        {/* Process Section */}
        <section className="py-16 bg-gradient-to-br from-clearfund-pale-blue to-white">
          <div className="container-custom">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-clearfund-dark-blue mb-4">Our Credit Repair Process</h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                We've developed a streamlined approach that delivers results in 60-90 days
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {benefits.map((benefit, index) => (
                <Card key={index} className="bg-white border border-gray-200 hover:border-clearfund-blue transition-colors">
                  <CardHeader className="pb-2">
                    <div className="w-12 h-12 rounded-full bg-clearfund-blue text-white flex items-center justify-center font-bold text-xl mb-2">
                      {index + 1}
                    </div>
                    <CardTitle className="text-lg text-clearfund-dark-blue">Benefit</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>{benefit}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
        
        {/* Call to Action */}
        <section className="py-16 bg-clearfund-blue text-white">
          <div className="container-custom text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Repair Your Credit?</h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Our consultation is absolutely free. We'll analyze your credit reports and explain exactly what we can do to help improve your score.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button 
                onClick={() => setIsDialogOpen(true)}
                className="bg-white text-clearfund-blue hover:bg-clearfund-pale-blue hover:text-clearfund-dark-blue text-lg py-6 px-8"
              >
                Get Free Consultation
              </Button>
              <Button variant="outline" className="border-white text-white hover:bg-white/10 text-lg py-6 px-8">
                Call Now: 954-579-0021
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Consultation Form Dialog */}
      <Dialog 
        open={isDialogOpen} 
        onOpenChange={(open) => setIsDialogOpen(open)}
      >
        <DialogContent className="sm:max-w-[800px] h-[600px] p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-xl font-bold text-clearfund-dark-blue">Free Credit Consultation</DialogTitle>
          </DialogHeader>
          <iframe 
            src="https://form.jotform.com/251378086816062" 
            className="w-full h-[550px] border-none"
            title="Credit Repair Consultation Form"
            data-clearfund-form="credit-repair"
          />
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default CreditRepair;
