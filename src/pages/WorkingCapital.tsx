import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { ArrowRight, Check, Briefcase, LineChart, Clock, Building } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Header from '../components/Header';
import Footer from '../components/Footer';

const WorkingCapital: React.FC = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        {/* Hero Section - Unique diagonal style */}
        <section className="relative py-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-clearfund-pale-blue via-white to-amber-50 -skew-y-3 origin-top-right transform-gpu"></div>
          <div className="container-custom relative z-10">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-8">
                <div className="inline-block bg-clearfund-blue/10 px-4 py-2 rounded-full">
                  <span className="text-clearfund-blue font-semibold">Business Funding Solutions</span>
                </div>
                
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                  <span className="text-clearfund-dark-blue">Working</span>
                  <span className="relative mx-2">
                    <span className="text-clearfund-blue">Capital</span>
                    <span className="absolute -bottom-2 left-0 right-0 h-2 bg-amber-300 transform -skew-x-12"></span>
                  </span>
                </h1>
                
                <p className="text-lg text-gray-700">
                  Get your business the funding it needs with our streamlined application process. 
                  Fast approvals, flexible terms, and transparent fees.
                </p>
                
                <div className="flex gap-4 items-center">
                  <Button 
                    onClick={() => setIsDialogOpen(true)}
                    className="bg-clearfund-blue hover:bg-clearfund-dark-blue text-white px-6 py-6 rounded-lg"
                  >
                    Get Started
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  
                  <div className="text-sm text-gray-500">
                    <div className="font-medium">Pre-approval in as little as</div>
                    <div className="text-clearfund-blue font-bold text-xl">24 hours</div>
                  </div>
                </div>
              </div>
              
              <div className="relative hidden md:block">
                <div className="absolute -z-10 w-64 h-64 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 blur-3xl opacity-70 -top-10 -right-10"></div>
                <div className="bg-white rounded-2xl shadow-xl border border-gray-50 p-8 transform rotate-1 hover:rotate-0 transition-transform">
                  <div className="flex justify-between items-center mb-6">
                    <div className="text-2xl font-bold text-clearfund-dark-blue">Working Capital</div>
                    <div className="h-10 w-10 bg-clearfund-blue text-white flex items-center justify-center rounded-full">
                      <Briefcase size={20} />
                    </div>
                  </div>
                  
                  <div className="space-y-4 mb-6">
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded-full bg-green-400"></div>
                      <span className="text-gray-700">24-48 Hour Funding</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded-full bg-blue-400"></div>
                      <span className="text-gray-700">Bad Credit OK</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded-full bg-amber-400"></div>
                      <span className="text-gray-700">Liens/Judgements OK</span>
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    *Minimum requirements: 1+ Year in Business & $120K+ Annual Revenue
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section - Staggered cards */}
        <section className="py-16 bg-white">
          <div className="container-custom">
            <h2 className="text-3xl md:text-4xl font-bold text-clearfund-dark-blue text-center mb-12">
              Working Capital Benefits
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
              {/* Feature Card 1 */}
              <Card className="bg-white border border-gray-100 shadow-md hover:shadow-lg transition-shadow md:transform md:-rotate-1">
                <CardHeader className="pb-2">
                  <div className="w-12 h-12 rounded-full bg-clearfund-blue/10 text-clearfund-blue flex items-center justify-center mb-4">
                    <Clock size={24} />
                  </div>
                  <CardTitle className="text-xl text-clearfund-dark-blue">Fast Funding</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-gray-600">Get approved and funded in as little as 24-48 hours with our streamlined application process.</p>
                  
                  <ul className="mt-4 space-y-2">
                    <li className="flex items-center">
                      <Check size={16} className="text-green-500 mr-2 flex-shrink-0" />
                      <span>Quick electronic application</span>
                    </li>
                    <li className="flex items-center">
                      <Check size={16} className="text-green-500 mr-2 flex-shrink-0" />
                      <span>Expedited review process</span>
                    </li>
                    <li className="flex items-center">
                      <Check size={16} className="text-green-500 mr-2 flex-shrink-0" />
                      <span>Same-day approval possible</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
              
              {/* Feature Card 2 */}
              <Card className="bg-white border border-gray-100 shadow-md hover:shadow-lg transition-shadow md:transform md:translate-y-4">
                <CardHeader className="pb-2">
                  <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mb-4">
                    <LineChart size={24} />
                  </div>
                  <CardTitle className="text-xl text-clearfund-dark-blue">Flexible Requirements</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-gray-600">We understand businesses have unique situations. Our funding options accommodate various credit profiles.</p>
                  
                  <ul className="mt-4 space-y-2">
                    <li className="flex items-center">
                      <Check size={16} className="text-green-500 mr-2 flex-shrink-0" />
                      <span>Bad credit accepted</span>
                    </li>
                    <li className="flex items-center">
                      <Check size={16} className="text-green-500 mr-2 flex-shrink-0" />
                      <span>Liens and judgements OK</span>
                    </li>
                    <li className="flex items-center">
                      <Check size={16} className="text-green-500 mr-2 flex-shrink-0" />
                      <span>No minimum FICO requirement</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
              
              {/* Feature Card 3 */}
              <Card className="bg-white border border-gray-100 shadow-md hover:shadow-lg transition-shadow md:transform md:rotate-1">
                <CardHeader className="pb-2">
                  <div className="w-12 h-12 rounded-full bg-clearfund-pale-blue text-clearfund-blue flex items-center justify-center mb-4">
                    <Building size={24} />
                  </div>
                  <CardTitle className="text-xl text-clearfund-dark-blue">Simple Qualification</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-gray-600">Straightforward requirements that focus on your business performance rather than just credit history.</p>
                  
                  <ul className="mt-4 space-y-2">
                    <li className="flex items-center">
                      <Check size={16} className="text-green-500 mr-2 flex-shrink-0" />
                      <span>1+ Year Time in Business</span>
                    </li>
                    <li className="flex items-center">
                      <Check size={16} className="text-green-500 mr-2 flex-shrink-0" />
                      <span>$120K+ Gross Annual Revenue</span>
                    </li>
                    <li className="flex items-center">
                      <Check size={16} className="text-green-500 mr-2 flex-shrink-0" />
                      <span>Minimal paperwork needed</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Requirements Section */}
        <section className="py-16 bg-gradient-to-br from-clearfund-pale-blue to-white">
          <div className="container-custom">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-clearfund-dark-blue mb-4">
                How to Apply
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Our simple application process makes it quick and easy to get the working capital your business needs
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
                <h3 className="text-2xl font-bold text-clearfund-dark-blue mb-6">Required Documentation</h3>
                
                <div className="space-y-6">
                  <div className="flex items-start">
                    <div className="flex items-center justify-center w-8 h-8 bg-clearfund-blue text-white rounded-full mr-4 flex-shrink-0">1</div>
                    <div>
                      <h4 className="text-lg font-semibold text-clearfund-dark-blue">Electronic Application</h4>
                      <p className="text-gray-600">Complete our secure online application form with basic business information.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="flex items-center justify-center w-8 h-8 bg-clearfund-blue text-white rounded-full mr-4 flex-shrink-0">2</div>
                    <div>
                      <h4 className="text-lg font-semibold text-clearfund-dark-blue">YTD Bank Statements</h4>
                      <p className="text-gray-600">Provide your year-to-date bank statements to verify business income.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="flex items-center justify-center w-8 h-8 bg-clearfund-blue text-white rounded-full mr-4 flex-shrink-0">3</div>
                    <div>
                      <h4 className="text-lg font-semibold text-clearfund-dark-blue">YTD Credit Card Processing Statements</h4>
                      <p className="text-gray-600">If applicable, provide your year-to-date credit card processing statements.</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-8">
                <h3 className="text-2xl font-bold text-clearfund-dark-blue">Business Qualifications</h3>
                
                <div className="space-y-6">
                  <div className="flex items-center">
                    <div className="h-12 w-12 bg-amber-100 rounded-full flex items-center justify-center mr-4">
                      <Check size={24} className="text-amber-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-xl">1+ Year Time in Business</p>
                      <p className="text-gray-600">Your business must be operating for at least one year</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <div className="h-12 w-12 bg-amber-100 rounded-full flex items-center justify-center mr-4">
                      <Check size={24} className="text-amber-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-xl">$120K+ Gross Annual Revenue</p>
                      <p className="text-gray-600">Your business must generate at least $120K in annual gross revenue</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <div className="h-12 w-12 bg-amber-100 rounded-full flex items-center justify-center mr-4">
                      <Check size={24} className="text-amber-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-xl">No Minimum FICO Score</p>
                      <p className="text-gray-600">We look at your business performance rather than just credit scores</p>
                    </div>
                  </div>
                </div>
                
                <div className="pt-4">
                  <Button 
                    onClick={() => setIsDialogOpen(true)}
                    className="bg-clearfund-blue hover:bg-clearfund-dark-blue text-white text-lg py-6 px-8 rounded-lg transition-colors w-full md:w-auto"
                  >
                    Apply for Funding
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-clearfund-blue text-white">
          <div className="container-custom">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="md:max-w-xl">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Grow Your Business?</h2>
                <p className="text-lg opacity-90 mb-6">
                  Our working capital solutions help businesses like yours access the funds they need to seize opportunities and overcome challenges.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="bg-white/20 px-3 py-1 rounded-full text-sm">Quick Approval</span>
                  <span className="bg-white/20 px-3 py-1 rounded-full text-sm">Flexible Terms</span>
                  <span className="bg-white/20 px-3 py-1 rounded-full text-sm">Bad Credit OK</span>
                  <span className="bg-white/20 px-3 py-1 rounded-full text-sm">Simple Process</span>
                </div>
              </div>
              <Button 
                onClick={() => setIsDialogOpen(true)}
                className="bg-white text-clearfund-blue hover:bg-clearfund-pale-blue hover:text-clearfund-dark-blue text-lg py-6 px-10 rounded-lg transition-colors"
              >
                Start Application
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
