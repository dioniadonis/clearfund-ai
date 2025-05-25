
import React, { useState, useEffect } from 'react';
import { Check, ArrowLeft, ArrowRight, X, Clock, DollarSign, Shield, CreditCard, Calculator, Percent } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";

interface FundingFAQSlideShowProps {
  onClose: () => void;
}

const FundingFAQSlideShow: React.FC<FundingFAQSlideShowProps> = ({ onClose }) => {
  const [api, setApi] = useState<any>(null);
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  const handleNext = () => {
    if (current === count - 1) {
      api?.scrollTo(0);
    } else {
      api?.scrollNext();
    }
  };

  const handlePrevious = () => {
    if (current === 0) {
      api?.scrollTo(count - 1);
    } else {
      api?.scrollPrev();
    }
  };

  useEffect(() => {
    if (!api) return;

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap());

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  const handleGetFunded = () => {
    window.open('http://davidallencapital.com/clearfund', '_blank');
  };

  return (
    <div className="bg-white/95 backdrop-blur-sm w-full h-full p-6 rounded-xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-clearfund-dark-blue">Funding FAQ</h2>
        <Button variant="ghost" onClick={onClose} className="hover:bg-gray-100 p-2 h-auto">
          <X size={20} className="text-gray-500" />
        </Button>
      </div>

      <Carousel className="w-full max-w-4xl mx-auto" setApi={setApi}>
        <CarouselContent>
          {/* Slide 1: Funding Timeline */}
          <CarouselItem>
            <div className="p-6">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="md:w-1/3">
                  <div className="w-32 h-32 rounded-full bg-clearfund-pale-blue text-clearfund-blue flex items-center justify-center mx-auto">
                    <Clock size={64} />
                  </div>
                </div>
                <div className="md:w-2/3 space-y-4">
                  <h3 className="text-2xl font-bold text-clearfund-dark-blue">How Fast Can I Get Funded?</h3>
                  <p className="text-gray-600 text-lg">
                    Our streamlined process is designed for speed. Most approved applications receive funding within 24-48 hours.
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-clearfund-pale-blue flex items-center justify-center">
                      <Check size={18} className="text-clearfund-blue" />
                    </div>
                    <span className="text-gray-700">Application review: Same day</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-clearfund-pale-blue flex items-center justify-center">
                      <Check size={18} className="text-clearfund-blue" />
                    </div>
                    <span className="text-gray-700">Approval decision: Within hours</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-clearfund-pale-blue flex items-center justify-center">
                      <Check size={18} className="text-clearfund-blue" />
                    </div>
                    <span className="text-gray-700">Fund transfer: 24-48 hours</span>
                  </div>
                </div>
              </div>
            </div>
          </CarouselItem>

          {/* Slide 2: Funding Amounts */}
          <CarouselItem>
            <div className="p-6">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="md:w-1/3">
                  <div className="w-32 h-32 rounded-full bg-clearfund-pale-blue text-clearfund-blue flex items-center justify-center mx-auto">
                    <DollarSign size={64} />
                  </div>
                </div>
                <div className="md:w-2/3 space-y-4">
                  <h3 className="text-2xl font-bold text-clearfund-dark-blue">How Much Can I Borrow?</h3>
                  <p className="text-gray-600 text-lg">
                    We offer flexible funding amounts ranging from $400 to $20,000 based on your business revenue and needs.
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-clearfund-pale-blue flex items-center justify-center">
                      <Check size={18} className="text-clearfund-blue" />
                    </div>
                    <span className="text-gray-700">Minimum funding: $400</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-clearfund-pale-blue flex items-center justify-center">
                      <Check size={18} className="text-clearfund-blue" />
                    </div>
                    <span className="text-gray-700">Maximum funding: $20,000</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-clearfund-pale-blue flex items-center justify-center">
                      <Check size={18} className="text-clearfund-blue" />
                    </div>
                    <span className="text-gray-700">Funding based on monthly revenue</span>
                  </div>
                </div>
              </div>
            </div>
          </CarouselItem>

          {/* Slide 3: Requirements */}
          <CarouselItem>
            <div className="p-6">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="md:w-1/3">
                  <div className="w-32 h-32 rounded-full bg-clearfund-pale-blue text-clearfund-blue flex items-center justify-center mx-auto">
                    <Shield size={64} />
                  </div>
                </div>
                <div className="md:w-2/3 space-y-4">
                  <h3 className="text-2xl font-bold text-clearfund-dark-blue">What Are The Requirements?</h3>
                  <p className="text-gray-600 text-lg">
                    Our requirements are simple and designed to help more business owners qualify for funding.
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-clearfund-pale-blue flex items-center justify-center">
                      <Check size={18} className="text-clearfund-blue" />
                    </div>
                    <span className="text-gray-700">$3,000+ monthly bank revenue</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-clearfund-pale-blue flex items-center justify-center">
                      <Check size={18} className="text-clearfund-blue" />
                    </div>
                    <span className="text-gray-700">3+ months in business</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-clearfund-pale-blue flex items-center justify-center">
                      <Check size={18} className="text-clearfund-blue" />
                    </div>
                    <span className="text-gray-700">No collateral required</span>
                  </div>
                </div>
              </div>
            </div>
          </CarouselItem>

          {/* Slide 4: Rates */}
          <CarouselItem>
            <div className="p-6">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="md:w-1/3">
                  <div className="w-32 h-32 rounded-full bg-clearfund-pale-blue text-clearfund-blue flex items-center justify-center mx-auto">
                    <Percent size={64} />
                  </div>
                </div>
                <div className="md:w-2/3 space-y-4">
                  <h3 className="text-2xl font-bold text-clearfund-dark-blue">What Are Your Rates?</h3>
                  <p className="text-gray-600 text-lg">
                    Competitive rates designed for business growth, not just survival.
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-clearfund-pale-blue flex items-center justify-center">
                      <Check size={18} className="text-clearfund-blue" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-700">Factor rates from 1.1 to 1.5 (10% to 50% total cost)</span>
                      <span className="text-gray-400 text-sm italic mt-1 opacity-70">
                        e.g., $4,000 monthly sales = qualify for $800-$1,200 funding
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-clearfund-pale-blue flex items-center justify-center">
                      <Check size={18} className="text-clearfund-blue" />
                    </div>
                    <span className="text-gray-700">Rates based on your business strength - stronger businesses get better rates</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-clearfund-pale-blue flex items-center justify-center">
                      <Check size={18} className="text-clearfund-blue" />
                    </div>
                    <span className="text-gray-700">No hidden fees or surprise charges - total cost disclosed upfront</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-clearfund-pale-blue flex items-center justify-center">
                      <Check size={18} className="text-clearfund-blue" />
                    </div>
                    <span className="text-gray-700">Rate determined in minutes during our quick approval process</span>
                  </div>
                </div>
              </div>
            </div>
          </CarouselItem>

          {/* Slide 5: Repayment */}
          <CarouselItem>
            <div className="p-6">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="md:w-1/3">
                  <div className="w-32 h-32 rounded-full bg-clearfund-pale-blue text-clearfund-blue flex items-center justify-center mx-auto">
                    <CreditCard size={64} />
                  </div>
                </div>
                <div className="md:w-2/3 space-y-4">
                  <h3 className="text-2xl font-bold text-clearfund-dark-blue">How Does Repayment Work?</h3>
                  <p className="text-gray-600 text-lg">
                    We offer flexible repayment options that work with your business cash flow.
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-clearfund-pale-blue flex items-center justify-center">
                      <Check size={18} className="text-clearfund-blue" />
                    </div>
                    <span className="text-gray-700">Automatic daily or weekly payments</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-clearfund-pale-blue flex items-center justify-center">
                      <Check size={18} className="text-clearfund-blue" />
                    </div>
                    <span className="text-gray-700">Payments based on percentage of revenue</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-clearfund-pale-blue flex items-center justify-center">
                      <Check size={18} className="text-clearfund-blue" />
                    </div>
                    <span className="text-gray-700">No prepayment penalties</span>
                  </div>
                </div>
              </div>
            </div>
          </CarouselItem>

          {/* Slide 6: Ready to Apply */}
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
                    Join thousands of business owners who have successfully funded their operations with Clearfund AI.
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-clearfund-pale-blue flex items-center justify-center">
                      <Check size={18} className="text-clearfund-blue" />
                    </div>
                    <span className="text-gray-700">Simple online application</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-clearfund-pale-blue flex items-center justify-center">
                      <Check size={18} className="text-clearfund-blue" />
                    </div>
                    <span className="text-gray-700">Fast approval and funding</span>
                  </div>
                  <div className="space-y-4 mt-6">
                    <Button 
                      onClick={handleGetFunded}
                      className="bg-clearfund-blue hover:bg-clearfund-dark-blue text-white px-8 py-3 text-lg"
                    >
                      Get Funded Today
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CarouselItem>
        </CarouselContent>

        {/* Navigation controls */}
        <div className="flex flex-col items-center mt-8 space-y-4">
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
  );
};

export default FundingFAQSlideShow;
