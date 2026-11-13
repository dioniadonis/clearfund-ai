
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import ApplyLink from "@/components/ApplyLink";
import qualificationBusinessOwners from "@/assets/qualification-business-owners.png";

const QualificationSection: React.FC = () => {
  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="container-custom">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="relative">
            <div className="absolute -z-10 w-full h-full">
              {/* Green dots and lines pattern */}
              <div className="absolute top-1/4 left-1/4 w-4 h-4 bg-green-500 rounded-full"></div>
              <div className="absolute top-1/3 right-1/3 w-4 h-4 bg-green-500 rounded-full"></div>
              <div className="absolute bottom-1/4 left-1/3 w-4 h-4 bg-green-500 rounded-full"></div>
              <div className="absolute top-1/2 right-1/4 w-4 h-4 bg-green-500 rounded-full"></div>
              <div className="absolute bottom-1/3 right-1/2 w-4 h-4 bg-green-500 rounded-full"></div>
              <div className="absolute transform rotate-45 top-0 left-1/4 w-1 h-64 bg-green-400"></div>
              <div className="absolute transform -rotate-45 bottom-0 right-1/4 w-1 h-64 bg-green-400"></div>
              <div className="absolute transform rotate-12 top-1/3 right-0 w-64 h-1 bg-green-400"></div>
              <div className="absolute transform -rotate-12 bottom-1/3 left-0 w-64 h-1 bg-green-400"></div>
            </div>
            <div className="relative rounded-full overflow-hidden border-4 border-white shadow-xl w-3/4 mx-auto aspect-square">
              <img 
                src={qualificationBusinessOwners}
                alt="Business owners working together" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold text-clearfund-dark-blue">
              Explore Business Funding Options for Your Growth.
            </h2>
            <p className="text-lg text-gray-700">
              Provider offers depend on your business profile and review.
            </p>
            
            <div className="font-bold text-xl mb-4 text-clearfund-dark-blue">
              Minimum Qualification Requirements:
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <Card className="border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6 text-center">
                  <h3 className="text-2xl font-bold text-clearfund-blue mb-2">4+ Months</h3>
                  <p className="text-gray-600">In Business</p>
                </CardContent>
              </Card>
              
              <Card className="border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6 text-center">
                  <h3 className="text-2xl font-bold text-clearfund-blue mb-2">Steady Monthly</h3>
                  <p className="text-gray-600">Business Revenue</p>
                  <p className="text-sm mt-2">
                    Smaller or newer business? Micro funding may be a fit.
                  </p>
                </CardContent>
              </Card>
               
              <Card className="border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6 text-center">
                  <h3 className="text-2xl font-bold text-clearfund-blue mb-2">USA Or Canada</h3>
                  <p className="text-gray-600">Business Location</p>
                </CardContent>
              </Card>
            </div>

            <div className="pt-8 flex justify-center">
              <Button 
                asChild
                className="bg-green-500 hover:bg-green-600 text-white text-lg py-6 px-12 rounded-full transition-colors"
              >
                <ApplyLink cta="qualificationsection_1">
                  Micro Funding
                </ApplyLink>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default QualificationSection;
