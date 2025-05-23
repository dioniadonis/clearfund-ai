
import React, { useState, useEffect } from 'react';
import { Check, ArrowLeft, ArrowRight, X, DollarSign, TrendingUp, Clock, Shield, Calculator } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface FinancingEducationSlideProps {
  onClose: () => void;
}

const FinancingEducationSlideShow: React.FC<FinancingEducationSlideProps> = ({ onClose }) => {
  const [api, setApi] = useState<any>(null);
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);
  const [isApplicationDialogOpen, setIsApplicationDialogOpen] = useState(false);

  // Handle navigation to ensure looping through the slides
  const handleNext = () => {
    if (current === count - 1) {
      // If at the last slide, loop back to the first
      api?.scrollTo(0);
    } else {
      api?.scrollNext();
    }
  };

  const handlePrevious = () => {
    if (current === 0) {
      // If at the first slide, loop to the last
      api?.scrollTo(count - 1);
    } else {
      api?.scrollPrev();
    }
  };

  // Update current slide index and total count when the carousel changes
  useEffect(() => {
    if (!api) return;

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap());

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  const handleApplyNow = () => {
    setIsApplicationDialogOpen(true);
  };

  return (
    <>
      <div className="bg-white/95 backdrop-blur-sm w-full h-full p-6 rounded-xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-clearfund-dark-blue">Understanding Business Financing</h2>
          <Button variant="ghost" onClick={onClose} className="hover:bg-gray-100 p-2 h-auto">
            <X size={20} className="text-gray-500" />
          </Button>
        </div>

        <Carousel className="w-full max-w-4xl mx-auto" setApi={setApi}>
          <CarouselContent>
            {/* Slide 1: What is Business Financing? */}
            <CarouselItem>
              <div className="p-6">
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <div className="md:w-1/3">
                    <div className="w-32 h-32 rounded-full bg-clearfund-pale-blue text-clearfund-blue flex items-center justify-center mx-auto">
                      <DollarSign size={64} />
                    </div>
                  </div>
                  <div className="md:w-2/3 space-y-4">
                    <h3 className="text-2xl font-bold text-clearfund-dark-blue">What is Business Financing?</h3>
                    <p className="text-gray-600 text-lg">
                      Business financing provides the capital you need to start, operate, or expand your business. 
                      It's the fuel that powers your entrepreneurial dreams and helps you overcome cash flow challenges.
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-clearfund-pale-blue flex items-center justify-center">
                        <Check size={18} className="text-clearfund-blue" />
                      </div>
                      <span className="text-gray-700">Cover operational expenses</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-clearfund-pale-blue flex items-center justify-center">
                        <Check size={18} className="text-clearfund-blue" />
                      </div>
                      <span className="text-gray-700">Invest in growth opportunities</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-clearfund-pale-blue flex items-center justify-center">
                        <Check size={18} className="text-clearfund-blue" />
                      </div>
                      <span className="text-gray-700">Bridge cash flow gaps</span>
                    </div>
                  </div>
                </div>
              </div>
            </CarouselItem>

            {/* Slide 2: Types of Financing */}
            <CarouselItem>
              <div className="p-6">
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <div className="md:w-1/3">
                    <div className="w-32 h-32 rounded-full bg-clearfund-pale-blue text-clearfund-blue flex items-center justify-center mx-auto">
                      <TrendingUp size={64} />
                    </div>
                  </div>
                  <div className="md:w-2/3 space-y-4">
                    <h3 className="text-2xl font-bold text-clearfund-dark-blue">Types of Business Financing</h3>
                    <p className="text-gray-600 text-lg">
                      Different financing options serve different business needs. Understanding your options 
                      helps you choose the right solution for your specific situation.
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-clearfund-pale-blue flex items-center justify-center">
                        <Check size={18} className="text-clearfund-blue" />
                      </div>
                      <span className="text-gray-700"><strong>Working Capital:</strong> Short-term funding for daily operations</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-clearfund-pale-blue flex items-center justify-center">
                        <Check size={18} className="text-clearfund-blue" />
                      </div>
                      <span className="text-gray-700"><strong>Term Loans:</strong> Fixed amount with structured repayment</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-clearfund-pale-blue flex items-center justify-center">
                        <Check size={18} className="text-clearfund-blue" />
                      </div>
                      <span className="text-gray-700"><strong>Lines of Credit:</strong> Flexible access to funds as needed</span>
                    </div>
                  </div>
                </div>
              </div>
            </CarouselItem>

            {/* Slide 3: When to Consider Financing */}
            <CarouselItem>
              <div className="p-6">
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <div className="md:w-1/3">
                    <div className="w-32 h-32 rounded-full bg-clearfund-pale-blue text-clearfund-blue flex items-center justify-center mx-auto">
                      <Clock size={64} />
                    </div>
                  </div>
                  <div className="md:w-2/3 space-y-4">
                    <h3 className="text-2xl font-bold text-clearfund-dark-blue">When to Consider Financing</h3>
                    <p className="text-gray-600 text-lg">
                      Timing is crucial in business financing. Recognizing the right moments to seek funding 
                      can be the difference between seizing opportunities and missing them.
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-clearfund-pale-blue flex items-center justify-center">
                        <Check size={18} className="text-clearfund-blue" />
                      </div>
                      <span className="text-gray-700">Seasonal cash flow challenges</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-clearfund-pale-blue flex items-center justify-center">
                        <Check size={18} className="text-clearfund-blue" />
                      </div>
                      <span className="text-gray-700">Expansion opportunities</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-clearfund-pale-blue flex items-center justify-center">
                        <Check size={18} className="text-clearfund-blue" />
                      </div>
                      <span className="text-gray-700">Equipment purchases or upgrades</span>
                    </div>
                  </div>
                </div>
              </div>
            </CarouselItem>

            {/* Slide 4: What Lenders Look For */}
            <CarouselItem>
              <div className="p-6">
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <div className="md:w-1/3">
                    <div className="w-32 h-32 rounded-full bg-clearfund-pale-blue text-clearfund-blue flex items-center justify-center mx-auto">
                      <Shield size={64} />
                    </div>
                  </div>
                  <div className="md:w-2/3 space-y-4">
                    <h3 className="text-2xl font-bold text-clearfund-dark-blue">What Lenders Look For</h3>
                    <p className="text-gray-600 text-lg">
                      Understanding lender requirements helps you prepare a stronger application and 
                      increases your chances of approval with favorable terms.
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-clearfund-pale-blue flex items-center justify-center">
                        <Check size={18} className="text-clearfund-blue" />
                      </div>
                      <span className="text-gray-700">Strong business cash flow</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-clearfund-pale-blue flex items-center justify-center">
                        <Check size={18} className="text-clearfund-blue" />
                      </div>
                      <span className="text-gray-700">Good personal and business credit</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-clearfund-pale-blue flex items-center justify-center">
                        <Check size={18} className="text-clearfund-blue" />
                      </div>
                      <span className="text-gray-700">Clear business purpose and plan</span>
                    </div>
                  </div>
                </div>
              </div>
            </CarouselItem>

            {/* Slide 5: Ready to Get Started? */}
            <CarouselItem>
              <div className="p-6">
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <div className="md:w-1/3">
                    <div className="w-32 h-32 rounded-full bg-clearfund-pale-blue text-clearfund-blue flex items-center justify-center mx-auto">
                      <Calculator size={64} />
                    </div>
                  </div>
                  <div className="md:w-2/3 space-y-4">
                    <h3 className="text-2xl font-bold text-clearfund-dark-blue">Ready to Get Started?</h3>
                    <p className="text-gray-600 text-lg">
                      Now that you understand the basics of business financing, you're ready to explore 
                      your options. Our AI-powered platform makes it easy to find the right financing solution.
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-clearfund-pale-blue flex items-center justify-center">
                        <Check size={18} className="text-clearfund-blue" />
                      </div>
                      <span className="text-gray-700">Fast application process</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-clearfund-pale-blue flex items-center justify-center">
                        <Check size={18} className="text-clearfund-blue" />
                      </div>
                      <span className="text-gray-700">Transparent terms and pricing</span>
                    </div>
                    <div className="space-y-4 mt-6">
                      <Button 
                        onClick={handleApplyNow}
                        className="bg-clearfund-blue hover:bg-clearfund-dark-blue text-white px-8 py-3 text-lg"
                      >
                        Apply for Funding Now
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CarouselItem>
          </CarouselContent>

          {/* Navigation controls - positioned below the content */}
          <div className="flex flex-col items-center mt-8 space-y-4">
            {/* Slide indicators */}
            <div className="flex items-center justify-center gap-2">
              {Array.from({ length: count }).map((_, i) => (
                <button
                  key={i}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    i === current ? "bg-clearfund-blue" : "bg-gray-300"
                  }`}
                  onClick={() => api?.scrollTo(i)}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
            
            {/* Sleek navigation buttons */}
            <div className="flex items-center justify-center gap-8">
              <button 
                onClick={handlePrevious} 
                className="text-clearfund-blue hover:text-clearfund-dark-blue transition-colors p-2 focus:outline-none"
                aria-label="Previous slide"
              >
                <ArrowLeft className="h-8 w-8" />
              </button>
              
              <button 
                onClick={handleNext} 
                className="text-clearfund-blue hover:text-clearfund-dark-blue transition-colors p-2 focus:outline-none"
                aria-label="Next slide"
              >
                <ArrowRight className="h-8 w-8" />
              </button>
            </div>
          </div>
        </Carousel>
      </div>

      {/* Application Form Dialog */}
      <Dialog open={isApplicationDialogOpen} onOpenChange={setIsApplicationDialogOpen}>
        <DialogContent className="sm:max-w-[800px] h-[600px] p-0">
          <iframe 
            src="https://form.jotform.com/251378086816062" 
            className="w-full h-[550px] border-none"
            title="Funding Application Form"
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FinancingEducationSlideShow;
