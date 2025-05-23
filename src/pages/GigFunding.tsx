import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { ArrowRight, Check, Car, Clock, DollarSign, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Header from '../components/Header';
import Footer from '../components/Footer';
const GigFunding: React.FC = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  return <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="py-16 md:py-24 bg-gradient-to-br from-white via-clearfund-pale-blue to-white">
          <div className="container-custom grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-clearfund-dark-blue leading-tight">
                Gig Economy <br />
                <span className="text-clearfund-blue mx-0 px-0 py-[2px] my-[17px]">Instant Micro Funding</span>
              </h1>
              <p className="text-lg md:text-xl text-gray-700 max-w-lg">
                Specialized financing for rideshare & gig economy drivers. 
                Get the funding you need for your vehicle with our flexible loan options.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button onClick={() => setIsDialogOpen(true)} className="bg-clearfund-blue hover:bg-clearfund-dark-blue text-white text-lg py-6 px-8 rounded-lg transition-colors">
                  Apply Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button variant="outline" className="border-clearfund-blue text-clearfund-blue hover:bg-clearfund-pale-blue text-lg py-6 px-8 rounded-lg transition-colors">
                  Learn More
                </Button>
              </div>
            </div>
            
            {/* Right side content - Feature card */}
            <div className="relative hidden md:block">
              <div className="absolute -top-16 -right-16 w-64 h-64 bg-clearfund-pale-blue rounded-full opacity-50 blur-3xl"></div>
              <div className="relative bg-white shadow-xl rounded-xl p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-clearfund-dark-blue">Gig Driver Benefits</h3>
                  <div className="h-12 w-12 bg-clearfund-blue text-white flex items-center justify-center rounded-full">
                    <Car size={24} />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-clearfund-pale-blue flex items-center justify-center">
                      <Check size={18} className="text-clearfund-blue" />
                    </div>
                    <div className="text-gray-700">Access to quality vehicles</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-clearfund-pale-blue flex items-center justify-center">
                      <Check size={18} className="text-clearfund-blue" />
                    </div>
                    <div className="text-gray-700">Low down payments</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-clearfund-pale-blue flex items-center justify-center">
                      <Check size={18} className="text-clearfund-blue" />
                    </div>
                    <div className="text-gray-700">Minimal requirements</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-clearfund-pale-blue flex items-center justify-center">
                      <Check size={18} className="text-clearfund-blue" />
                    </div>
                    <div className="text-gray-700">Experienced or new drivers welcome</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-white">
          <div className="container-custom">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-clearfund-dark-blue">
                Benefits of Our Gig Funding Program
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto mt-4">
                We understand the unique needs of rideshare and delivery drivers. Our funding solutions are tailored specifically for the gig economy.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {/* Feature Card 1 */}
              <Card className="border border-gray-100 shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <div className="w-12 h-12 rounded-full bg-clearfund-pale-blue text-clearfund-blue flex items-center justify-center mb-4">
                    <Car size={24} />
                  </div>
                  <CardTitle className="text-xl text-clearfund-dark-blue">Access to Quality Vehicles</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Choose from a wide selection of vehicles that meet rideshare and delivery requirements, including hybrid and fuel-efficient options.
                  </p>
                  
                  <ul className="mt-4 space-y-2">
                    <li className="flex items-center">
                      <Check size={16} className="text-clearfund-blue mr-2 flex-shrink-0" />
                      <span className="text-sm">Rideshare-approved vehicles</span>
                    </li>
                    <li className="flex items-center">
                      <Check size={16} className="text-clearfund-blue mr-2 flex-shrink-0" />
                      <span className="text-sm">Fuel-efficient options</span>
                    </li>
                    <li className="flex items-center">
                      <Check size={16} className="text-clearfund-blue mr-2 flex-shrink-0" />
                      <span className="text-sm">Well-maintained fleet</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
              
              {/* Feature Card 2 */}
              <Card className="border border-gray-100 shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <div className="w-12 h-12 rounded-full bg-clearfund-pale-blue text-clearfund-blue flex items-center justify-center mb-4">
                    <DollarSign size={24} />
                  </div>
                  <CardTitle className="text-xl text-clearfund-dark-blue">Flexible Financing</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Our financing options are designed with gig workers in mind, offering low down payments and flexible terms that work with your income.
                  </p>
                  
                  <ul className="mt-4 space-y-2">
                    <li className="flex items-center">
                      <Check size={16} className="text-clearfund-blue mr-2 flex-shrink-0" />
                      <span className="text-sm">Low down payment options</span>
                    </li>
                    <li className="flex items-center">
                      <Check size={16} className="text-clearfund-blue mr-2 flex-shrink-0" />
                      <span className="text-sm">Flexible payment terms</span>
                    </li>
                    <li className="flex items-center">
                      <Check size={16} className="text-clearfund-blue mr-2 flex-shrink-0" />
                      <span className="text-sm">Accommodating to variable income</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
              
              {/* Feature Card 3 */}
              <Card className="border border-gray-100 shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <div className="w-12 h-12 rounded-full bg-clearfund-pale-blue text-clearfund-blue flex items-center justify-center mb-4">
                    <Clock size={24} />
                  </div>
                  <CardTitle className="text-xl text-clearfund-dark-blue">Quick Approval</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    We understand that time is money in the gig economy. Our streamlined approval process gets you on the road earning quickly.
                  </p>
                  
                  <ul className="mt-4 space-y-2">
                    <li className="flex items-center">
                      <Check size={16} className="text-clearfund-blue mr-2 flex-shrink-0" />
                      <span className="text-sm">Fast application review</span>
                    </li>
                    <li className="flex items-center">
                      <Check size={16} className="text-clearfund-blue mr-2 flex-shrink-0" />
                      <span className="text-sm">Minimal documentation required</span>
                    </li>
                    <li className="flex items-center">
                      <Check size={16} className="text-clearfund-blue mr-2 flex-shrink-0" />
                      <span className="text-sm">Quick vehicle selection process</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-16 bg-gradient-to-br from-clearfund-pale-blue to-white">
          <div className="container-custom">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-clearfund-dark-blue">
                How Our Gig Funding Works
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto mt-4">
                Our simple process makes it easy to get the vehicle you need to maximize your earnings
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-10">
                <div className="flex items-start">
                  <div className="h-12 w-12 rounded-full bg-clearfund-blue text-white flex items-center justify-center mr-4 flex-shrink-0">
                    <span className="text-xl font-bold">1</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-clearfund-dark-blue mb-2">Complete Our Simple Application</h3>
                    <p className="text-gray-600">Fill out our online application with basic information about yourself and your gig work experience.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="h-12 w-12 rounded-full bg-clearfund-blue text-white flex items-center justify-center mr-4 flex-shrink-0">
                    <span className="text-xl font-bold">2</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-clearfund-dark-blue mb-2">Get Approved Quickly</h3>
                    <p className="text-gray-600">Our team reviews your application and provides a quick response, often within 24 hours.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="h-12 w-12 rounded-full bg-clearfund-blue text-white flex items-center justify-center mr-4 flex-shrink-0">
                    <span className="text-xl font-bold">3</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-clearfund-dark-blue mb-2">Select Your Vehicle</h3>
                    <p className="text-gray-600">Browse our selection of rideshare-ready vehicles and choose one that fits your needs and budget.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="h-12 w-12 rounded-full bg-clearfund-blue text-white flex items-center justify-center mr-4 flex-shrink-0">
                    <span className="text-xl font-bold">4</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-clearfund-dark-blue mb-2">Start Earning</h3>
                    <p className="text-gray-600">Complete the paperwork, make your down payment, and hit the road to start earning with your new vehicle.</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 space-y-6">
                <h3 className="text-2xl font-bold text-clearfund-dark-blue mb-4">Program Requirements</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center">
                    <div className="h-10 w-10 bg-clearfund-pale-blue rounded-full flex items-center justify-center mr-4">
                      <Check size={20} className="text-clearfund-blue" />
                    </div>
                    <div>
                      <p className="font-semibold text-lg">Valid Driver's License</p>
                      <p className="text-gray-600 text-sm">Must have a valid driver's license in good standing</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <div className="h-10 w-10 bg-clearfund-pale-blue rounded-full flex items-center justify-center mr-4">
                      <Check size={20} className="text-clearfund-blue" />
                    </div>
                    <div>
                      <p className="font-semibold text-lg">Gig Economy Platform</p>
                      <p className="text-gray-600 text-sm">Active account on Uber, Lyft, DoorDash, or similar platform</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <div className="h-10 w-10 bg-clearfund-pale-blue rounded-full flex items-center justify-center mr-4">
                      <Check size={20} className="text-clearfund-blue" />
                    </div>
                    <div>
                      <p className="font-semibold text-lg">Minimum Age</p>
                      <p className="text-gray-600 text-sm">Must be at least 21 years old</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <div className="h-10 w-10 bg-clearfund-pale-blue rounded-full flex items-center justify-center mr-4">
                      <Check size={20} className="text-clearfund-blue" />
                    </div>
                    <div>
                      <p className="font-semibold text-lg">Income Verification</p>
                      <p className="text-gray-600 text-sm">Proof of earnings from gig work (for experienced drivers)</p>
                    </div>
                  </div>
                </div>
                
                <div className="pt-4">
                  <Button onClick={() => setIsDialogOpen(true)} className="bg-clearfund-blue hover:bg-clearfund-dark-blue text-white text-lg py-6 px-8 w-full rounded-lg transition-colors">
                    Apply For Funding
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
                Hear from gig economy drivers who've benefited from our funding program
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
                      <p className="text-sm text-gray-500">Uber Driver, 2 years</p>
                    </div>
                  </div>
                  <p className="text-gray-600 italic">
                    "I needed a reliable vehicle quickly to start driving for Uber. Clearfund AI made the process incredibly simple, and I was approved with a low down payment despite my average credit score."
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
                      <p className="text-sm text-gray-500">DoorDash & Uber Eats Driver</p>
                    </div>
                  </div>
                  <p className="text-gray-600 italic">
                    "As a full-time delivery driver, my car is my livelihood. When my old car broke down, Clearfund AI helped me get into a fuel-efficient vehicle within days, so I could get back to earning."
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
                      <p className="text-sm text-gray-500">Lyft Driver, New Driver</p>
                    </div>
                  </div>
                  <p className="text-gray-600 italic">
                    "I was new to rideshare and worried no one would approve me for a vehicle loan. Clearfund AI understood my situation and got me into a great car with terms I could manage while building my business."
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
                  <span className="text-white font-semibold">Limited Time Offer</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Start Earning More?</h2>
                <p className="text-lg opacity-90 mb-6">
                  Apply today and get a special introductory rate plus waived application fees for qualified applicants. 
                  Don't miss this opportunity to get into a quality vehicle with minimal upfront costs.
                </p>
                <div className="flex flex-wrap gap-3">
                  <span className="bg-white/20 px-3 py-1 rounded-full text-sm">Low Down Payments</span>
                  <span className="bg-white/20 px-3 py-1 rounded-full text-sm">Quick Approval</span>
                  <span className="bg-white/20 px-3 py-1 rounded-full text-sm">Flexible Terms</span>
                  <span className="bg-white/20 px-3 py-1 rounded-full text-sm">All Credit Types</span>
                </div>
              </div>
              <Button onClick={() => setIsDialogOpen(true)} className="bg-white hover:bg-gray-100 text-clearfund-dark-blue text-lg font-semibold py-6 px-10 rounded-lg shadow-lg transition-colors">
                Apply Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Application Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={open => setIsDialogOpen(open)}>
        <DialogContent className="sm:max-w-[800px] h-[600px] p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-xl font-bold text-clearfund-dark-blue">Gig Driver Application</DialogTitle>
          </DialogHeader>
          <iframe src="https://form.jotform.com/251378086816062" className="w-full h-[550px] border-none" title="Clearfund Application Form" data-clearfund-form="gig-application" />
        </DialogContent>
      </Dialog>
      
      <Footer />
    </div>;
};
export default GigFunding;