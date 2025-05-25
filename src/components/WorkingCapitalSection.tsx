
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Clock, LineChart, Building } from 'lucide-react';

const WorkingCapitalSection: React.FC = () => {
  return (
    <section className="py-16 md:py-24 bg-gray-50">
      <div className="container-custom">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold text-clearfund-dark-blue">
              Working Capital Solutions for Your Business Growth
            </h2>
            <p className="text-lg text-gray-700">
              Get approved and funded in as little as 24-48 hours with our streamlined application process.
            </p>
            
            <div className="font-bold text-xl mb-4 text-clearfund-dark-blue">
              Business Qualifications:
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <Card className="border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6 text-center">
                  <h3 className="text-2xl font-bold text-clearfund-blue mb-2">1+ Year</h3>
                  <p className="text-gray-600">Time in Business</p>
                </CardContent>
              </Card>
              
              <Card className="border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6 text-center">
                  <h3 className="text-2xl font-bold text-clearfund-blue mb-2">$120K+</h3>
                  <p className="text-gray-600">Gross Annual Revenue</p>
                </CardContent>
              </Card>
              
              <Card className="border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6 text-center">
                  <h3 className="text-2xl font-bold text-clearfund-blue mb-2">No Minimum</h3>
                  <p className="text-gray-600">FICO Score Required</p>
                </CardContent>
              </Card>
              
              <Card className="border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6 text-center">
                  <h3 className="text-2xl font-bold text-clearfund-blue mb-2">Bad Credit</h3>
                  <p className="text-gray-600">Accepted</p>
                </CardContent>
              </Card>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="text-amber-600" size={20} />
                <span className="font-semibold text-amber-800">Quick Features:</span>
              </div>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Liens and judgements OK</li>
                <li>• 24-48 hour funding available</li>
                <li>• Flexible repayment terms</li>
              </ul>
            </div>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4">
              <Card className="bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6 flex items-center">
                  <div className="w-12 h-12 rounded-full bg-clearfund-blue/10 text-clearfund-blue flex items-center justify-center mr-4">
                    <Clock size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-clearfund-dark-blue">Fast Funding</h3>
                    <p className="text-gray-600">Get approved and funded in 24-48 hours</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6 flex items-center">
                  <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mr-4">
                    <LineChart size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-clearfund-dark-blue">Flexible Requirements</h3>
                    <p className="text-gray-600">Bad credit and liens accepted</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6 flex items-center">
                  <div className="w-12 h-12 rounded-full bg-clearfund-pale-blue text-clearfund-blue flex items-center justify-center mr-4">
                    <Building size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-clearfund-dark-blue">Simple Process</h3>
                    <p className="text-gray-600">Minimal paperwork and documentation</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="pt-6 flex justify-center">
              <Button 
                asChild
                className="bg-clearfund-blue hover:bg-clearfund-dark-blue text-white text-lg py-6 px-8 rounded-lg transition-colors"
              >
                <a href="/working-capital">
                  Learn More
                  <ArrowRight className="ml-2 h-5 w-5" />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WorkingCapitalSection;
