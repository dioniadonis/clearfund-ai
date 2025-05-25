import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { ArrowRight, Check, Car, Clock, DollarSign, Sparkles, Building, CreditCard, BriefcaseBusiness, HelpCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProcessSlideShow from '../components/ProcessSlideShow';
import FundingFAQSlideShow from '../components/FundingFAQSlideShow';

const GigFunding: React.FC = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSlideShowOpen, setIsSlideShowOpen] = useState(false);
  const [isFAQSlideShowOpen, setIsFAQSlideShowOpen] = useState(false);

  const handleExternalLink = () => {
    window.open('https://davidallencapital.com/clearfund', '_blank');
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="py-16 md:py-24 bg-gradient-to-br from-white via-clearfund-pale-blue to-white">
          <div className="container-custom grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-clearfund-dark-blue leading-tight">
                <span className="text-clearfund-blue mx-0 px-0 py-[2px] my-[17px]">Instant Micro Funding</span>
              </h1>
              <p className="text-lg md:text-xl text-gray-700 max-w-lg">
                <span className="text-clearfund-blue font-bold">Get Up To $20k today!</span><br/>
                <span className="text-clearfund-blue font-bold">Immediate offer!</span><br/>
                From $400 - $20,000.<br/>
                Easy-Breezy online process designed for all business owners.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button onClick={handleExternalLink} className="bg-clearfund-blue hover:bg-clearfund-dark-blue text-white text-lg py-6 px-8 rounded-lg transition-colors">
                  Get Funded Today
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  variant="outline" 
                  className="border-clearfund-blue text-clearfund-blue hover:bg-clearfund-pale-blue text-lg py-6 px-8 rounded-lg transition-colors"
                  onClick={() => setIsSlideShowOpen(true)}
                >
                  Learn More
                </Button>
              </div>
            </div>
            
            {/* Right side content - Simple Requirements card */}
            <div className="relative hidden md:block">
              <div className="absolute -top-16 -right-16 w-64 h-64 bg-clearfund-pale-blue rounded-full opacity-50 blur-3xl"></div>
              <div className="relative bg-white shadow-xl rounded-xl p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-clearfund-dark-blue">Simple Requirements</h3>
                  <div className="h-12 w-12 bg-clearfund-blue text-white flex items-center justify-center rounded-full">
                    <BriefcaseBusiness size={24} />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-clearfund-pale-blue flex items-center justify-center">
                      <Check size={18} className="text-clearfund-blue" />
                    </div>
                    <div className="text-gray-700">$3,000+ Monthly Bank Revenue</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-clearfund-pale-blue flex items-center justify-center">
                      <Check size={18} className="text-clearfund-blue" />
                    </div>
                    <div className="text-gray-700">3+ Months In Business</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-clearfund-pale-blue flex items-center justify-center">
                      <Check size={18} className="text-clearfund-blue" />
                    </div>
                    <div className="text-gray-700">No Collateral Required</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-clearfund-pale-blue flex items-center justify-center">
                      <Check size={18} className="text-clearfund-blue" />
                    </div>
                    <div className="text-gray-700">Easier Qualification Process</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Simple Process Section */}
        <section className="py-16 bg-white">
          <div className="container-custom">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-clearfund-dark-blue">
                Our Simple Process
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto mt-4">
                Get the funding you need for your business with our straightforward application process
              </p>
            </div>
            
            <div className="grid md:grid-cols-5 gap-6">
              {/* Process Step 1 */}
              <Card className="border border-gray-100 shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <div className="w-12 h-12 rounded-full bg-clearfund-pale-blue text-clearfund-blue flex items-center justify-center mb-4">
                    <span className="text-xl font-bold">1</span>
                  </div>
                  <CardTitle className="text-xl text-clearfund-dark-blue">Answer A Few Questions</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Complete our simple questionnaire to help us understand your business needs.
                  </p>
                </CardContent>
              </Card>
              
              {/* Process Step 2 */}
              <Card className="border border-gray-100 shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <div className="w-12 h-12 rounded-full bg-clearfund-pale-blue text-clearfund-blue flex items-center justify-center mb-4">
                    <span className="text-xl font-bold">2</span>
                  </div>
                  <CardTitle className="text-xl text-clearfund-dark-blue">Link Your Bank Account</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Securely connect your bank account for verification of your business revenue.
                  </p>
                </CardContent>
              </Card>
              
              {/* Process Step 3 */}
              <Card className="border border-gray-100 shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <div className="w-12 h-12 rounded-full bg-clearfund-pale-blue text-clearfund-blue flex items-center justify-center mb-4">
                    <span className="text-xl font-bold">3</span>
                  </div>
                  <CardTitle className="text-xl text-clearfund-dark-blue">Review Approval Terms</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Receive your customized funding offer with transparent terms and conditions.
                  </p>
                </CardContent>
              </Card>
              
              {/* Process Step 4 */}
              <Card className="border border-gray-100 shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <div className="w-12 h-12 rounded-full bg-clearfund-pale-blue text-clearfund-blue flex items-center justify-center mb-4">
                    <span className="text-xl font-bold">4</span>
                  </div>
                  <CardTitle className="text-xl text-clearfund-dark-blue">Accept Funding Offer</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Sign your agreement electronically and complete the final verification steps.
                  </p>
                </CardContent>
              </Card>
              
              {/* Process Step 5 */}
              <Card className="border border-gray-100 shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <div className="w-12 h-12 rounded-full bg-clearfund-pale-blue text-clearfund-blue flex items-center justify-center mb-4">
                    <span className="text-xl font-bold">5</span>
                  </div>
                  <CardTitle className="text-xl text-clearfund-dark-blue">Receive Funds</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Get your approved funds deposited directly to your business account within 24-48 hours.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-16 bg-gradient-to-br from-clearfund-pale-blue to-white">
          <div className="container-custom">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-clearfund-dark-blue">
                Funding Benefits
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto mt-4">
                Designed specifically for business owners with your unique needs in mind
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-8">
                <div className="flex items-start">
                  <div className="h-12 w-12 rounded-full bg-clearfund-blue text-white flex items-center justify-center mr-4 flex-shrink-0">
                    <CreditCard size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-clearfund-dark-blue mb-2">Easier Qualifications</h3>
                    <p className="text-gray-600">
                      Our qualification process is designed to help business owners access funding without the strict requirements of traditional lenders.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="h-12 w-12 rounded-full bg-clearfund-blue text-white flex items-center justify-center mr-4 flex-shrink-0">
                    <Building size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-clearfund-dark-blue mb-2">Transparent Terms</h3>
                    <p className="text-gray-600">
                      All our funding offers come with clear terms and no hidden fees, so you'll always know exactly what to expect.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="h-12 w-12 rounded-full bg-clearfund-blue text-white flex items-center justify-center mr-4 flex-shrink-0">
                    <DollarSign size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-clearfund-dark-blue mb-2">No Collateral Required</h3>
                    <p className="text-gray-600">
                      Get the funding you need without putting up your personal assets as collateral, perfect for business owners.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 space-y-6">
                <h3 className="text-2xl font-bold text-clearfund-dark-blue mb-4">Funding Relationship Benefits</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center">
                    <div className="h-10 w-10 bg-clearfund-pale-blue rounded-full flex items-center justify-center mr-4">
                      <Check size={20} className="text-clearfund-blue" />
                    </div>
                    <div>
                      <p className="font-semibold text-lg">Payment History Earns You More</p>
                      <p className="text-gray-600 text-sm">Build a relationship with us through on-time payments</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <div className="h-10 w-10 bg-clearfund-pale-blue rounded-full flex items-center justify-center mr-4">
                      <Check size={20} className="text-clearfund-blue" />
                    </div>
                    <div>
                      <p className="font-semibold text-lg">Receive Funding Again</p>
                      <p className="text-gray-600 text-sm">After successful repayment, qualify for new funding</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <div className="h-10 w-10 bg-clearfund-pale-blue rounded-full flex items-center justify-center mr-4">
                      <Check size={20} className="text-clearfund-blue" />
                    </div>
                    <div>
                      <p className="font-semibold text-lg">Add-On Funds Available</p>
                      <p className="text-gray-600 text-sm">Access additional capital as your business grows</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <div className="h-10 w-10 bg-clearfund-pale-blue rounded-full flex items-center justify-center mr-4">
                      <Check size={20} className="text-clearfund-blue" />
                    </div>
                    <div>
                      <p className="font-semibold text-lg">Grow Your Business</p>
                      <p className="text-gray-600 text-sm">Use funding to expand your business operations</p>
                    </div>
                  </div>
                </div>
                
                <div className="pt-4">
                  <Button onClick={handleExternalLink} className="bg-clearfund-blue hover:bg-clearfund-dark-blue text-white text-lg py-6 px-8 w-full rounded-lg transition-colors">
                    Get Funded Today
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-16 bg-white">
          <div className="container-custom">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-clearfund-dark-blue">
                Success Stories
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto mt-4">
                Hear from business owners who've benefited from our funding program
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {/* Testimonial 1 */}
              <Card className="border border-gray-100 shadow-md">
                <CardContent className="pt-6">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 rounded-full bg-clearfund-pale-blue text-clearfund-blue flex items-center justify-center mr-3">
                      <span className="font-bold">JM</span>
                    </div>
                    <div>
                      <p className="font-semibold">James M.</p>
                      <p className="text-sm text-gray-500">Business Owner, 2 years</p>
                    </div>
                  </div>
                  <p className="text-gray-600 italic">
                    "I needed capital to maintain my equipment for my business. The simple application process and quick funding from Clearfund AI helped me keep my business running without any downtime."
                  </p>
                </CardContent>
              </Card>
              
              {/* Testimonial 2 */}
              <Card className="border border-gray-100 shadow-md">
                <CardContent className="pt-6">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 rounded-full bg-clearfund-pale-blue text-clearfund-blue flex items-center justify-center mr-3">
                      <span className="font-bold">SR</span>
                    </div>
                    <div>
                      <p className="font-semibold">Sarah R.</p>
                      <p className="text-sm text-gray-500">Small Business Owner</p>
                    </div>
                  </div>
                  <p className="text-gray-600 italic">
                    "The transparent terms and no-collateral requirement made Clearfund AI perfect for my business needs. I've since received additional funding to expand my operations."
                  </p>
                </CardContent>
              </Card>
              
              {/* Testimonial 3 */}
              <Card className="border border-gray-100 shadow-md">
                <CardContent className="pt-6">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 rounded-full bg-clearfund-pale-blue text-clearfund-blue flex items-center justify-center mr-3">
                      <span className="font-bold">DT</span>
                    </div>
                    <div>
                      <p className="font-semibold">David T.</p>
                      <p className="text-sm text-gray-500">New Business Owner</p>
                    </div>
                  </div>
                  <p className="text-gray-600 italic">
                    "Even with just 4 months in business, I qualified for funding when traditional banks turned me away. Now I can focus on growing my business without financial stress."
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-clearfund-blue text-white">
          <div className="container-custom">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="md:max-w-xl">
                <div className="flex items-center mb-4">
                  <Sparkles size={24} className="text-white mr-2" />
                  <span className="text-white font-semibold">Same Day Funding </span>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Grow Your Business?</h2>
                <p className="text-lg opacity-90 mb-6">
                  For Smaller Businesses And Gig Workers
                  Don't miss this opportunity to secure the funding you need with our simple requirements and process.
                </p>
                <div className="flex flex-wrap gap-3 mb-6">
                  <span className="bg-white/20 px-3 py-1 rounded-full text-sm">$3,000+ Monthly Revenue</span>
                  <span className="bg-white/20 px-3 py-1 rounded-full text-sm">3+ Months in Business</span>
                  <span className="bg-white/20 px-3 py-1 rounded-full text-sm">No Collateral Required</span>
                  <span className="bg-white/20 px-3 py-1 rounded-full text-sm">Fast Approval</span>
                </div>
              </div>
              <div className="flex flex-col gap-4 items-center">
                <Button onClick={handleExternalLink} className="bg-white hover:bg-gray-100 text-clearfund-dark-blue text-lg font-semibold py-6 px-10 rounded-lg shadow-lg transition-colors">
                  Get Funded Today
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  onClick={() => setIsFAQSlideShowOpen(true)}
                  className="bg-white hover:bg-gray-100 text-clearfund-dark-blue text-lg font-semibold py-6 px-10 rounded-lg shadow-lg transition-colors"
                >
                  <HelpCircle className="mr-2 h-5 w-5" />
                  Frequently Asked Questions
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Application Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={open => setIsDialogOpen(open)}>
        <DialogContent className="sm:max-w-[800px] h-[600px] p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-xl font-bold text-clearfund-dark-blue">Business Application</DialogTitle>
          </DialogHeader>
          <iframe src="https://form.jotform.com/251378086816062" className="w-full h-[550px] border-none" title="Clearfund Application Form" data-clearfund-form="business-application" />
        </DialogContent>
      </Dialog>

      {/* Process SlideShow Dialog */}
      <Dialog open={isSlideShowOpen} onOpenChange={open => setIsSlideShowOpen(open)}>
        <DialogContent className="sm:max-w-[900px] max-h-[700px] p-0">
          <ProcessSlideShow onClose={() => setIsSlideShowOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Funding FAQ SlideShow Dialog */}
      <Dialog open={isFAQSlideShowOpen} onOpenChange={open => setIsFAQSlideShowOpen(open)}>
        <DialogContent className="sm:max-w-[900px] max-h-[700px] p-0">
          <FundingFAQSlideShow onClose={() => setIsFAQSlideShowOpen(false)} />
        </DialogContent>
      </Dialog>
      
      <Footer />
    </div>
  );
};

export default GigFunding;
