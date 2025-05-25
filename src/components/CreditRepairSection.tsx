
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Check, Shield, TrendingUp } from 'lucide-react';

const CreditRepairSection: React.FC = () => {
  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="container-custom">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4">
              <Card className="bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6 flex items-center">
                  <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center mr-4">
                    <TrendingUp size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-clearfund-dark-blue">73% Success Rate</h3>
                    <p className="text-gray-600">vs 25% industry average</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6 flex items-center">
                  <div className="w-12 h-12 rounded-full bg-clearfund-blue/10 text-clearfund-blue flex items-center justify-center mr-4">
                    <Shield size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-clearfund-dark-blue">100% Money Back</h3>
                    <p className="text-gray-600">Guarantee on services</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6 flex items-center">
                  <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mr-4">
                    <Check size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-clearfund-dark-blue">60-90 Days</h3>
                    <p className="text-gray-600">Typical completion time</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="font-semibold text-green-800 mb-2">Free Consultation Available!</div>
              <p className="text-sm text-green-700">
                Get a free in-depth credit analysis and learn exactly what can be done to improve your score.
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold text-clearfund-dark-blue">
              Credit Repair That Actually Works
            </h2>
            <p className="text-lg text-gray-700">
              In business since 1998 with multiple locations nationwide. A+ BBB rating and fully licensed, bonded, and insured.
            </p>
            
            <div className="font-bold text-xl mb-4 text-clearfund-dark-blue">
              We Help Remove Negative Items:
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <Card className="border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4 text-center">
                  <h3 className="text-lg font-bold text-clearfund-blue mb-1">Bankruptcies</h3>
                  <p className="text-sm text-gray-600">& Foreclosures</p>
                </CardContent>
              </Card>
              
              <Card className="border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4 text-center">
                  <h3 className="text-lg font-bold text-clearfund-blue mb-1">Collections</h3>
                  <p className="text-sm text-gray-600">& Charge Offs</p>
                </CardContent>
              </Card>
              
              <Card className="border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4 text-center">
                  <h3 className="text-lg font-bold text-clearfund-blue mb-1">Liens</h3>
                  <p className="text-sm text-gray-600">& Judgements</p>
                </CardContent>
              </Card>
              
              <Card className="border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4 text-center">
                  <h3 className="text-lg font-bold text-clearfund-blue mb-1">Late Payments</h3>
                  <p className="text-sm text-gray-600">& Inquiries</p>
                </CardContent>
              </Card>
            </div>

            <div className="pt-6 flex justify-center">
              <Button 
                asChild
                className="bg-clearfund-blue hover:bg-clearfund-dark-blue text-white text-lg py-6 px-8 rounded-lg transition-colors"
              >
                <a href="/credit-repair">
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

export default CreditRepairSection;
