
import React, { useState, useEffect } from 'react';
import { Check, ArrowLeft, ArrowRight, X, FileText, DollarSign, Shield, CreditCard, Calculator } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { openApplication } from "@/lib/partners";

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
    openApplication("fundingfaqslideshow_1");
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
          {/* Slide 1: Provider Review */}
          <CarouselItem>
            <div className="p-6">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="md:w-1/3">
                  <div className="w-32 h-32 rounded-full bg-clearfund-pale-blue text-clearfund-blue flex items-center justify-center mx-auto">
                    <FileText size={64} />
                  </div>
                </div>
                <div className="md:w-2/3 space-y-4">
                  <h3 className="text-2xl font-bold text-clearfund-dark-blue">How Does the Review Work?</h3>
                  <p className="text-gray-600 text-lg">
                    The provider reviews your application and decides whether to make an offer.
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-clearfund-pale-blue flex items-center justify-center">
                      <Check size={18} className="text-clearfund-blue" />
                    </div>
                    <span className="text-gray-700">Application review: handled by the provider</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-clearfund-pale-blue flex items-center justify-center">
                      <Check size={18} className="text-clearfund-blue" />
                    </div>
                    <span className="text-gray-700">Offer decision: Set by the funding partner</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-clearfund-pale-blue flex items-center justify-center">
                      <Check size={18} className="text-clearfund-blue" />
                    </div>
                    <span className="text-gray-700">You choose whether to accept any offer</span>
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
                    Provider funding amounts depend on your business revenue, needs and their review.
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-clearfund-pale-blue flex items-center justify-center">
                      <Check size={18} className="text-clearfund-blue" />
                    </div>
                    <span className="text-gray-700">Amounts vary by provider</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-clearfund-pale-blue flex items-center justify-center">
                      <Check size={18} className="text-clearfund-blue" />
                    </div>
                    <span className="text-gray-700">Your request is reviewed individually</span>
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
                    Requirements vary by provider and are reviewed for each application.
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-clearfund-pale-blue flex items-center justify-center">
                      <Check size={18} className="text-clearfund-blue" />
                    </div>
                    <span className="text-gray-700">Business revenue information</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-clearfund-pale-blue flex items-center justify-center">
                      <Check size={18} className="text-clearfund-blue" />
                    </div>
                    <span className="text-gray-700">Time in business</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-clearfund-pale-blue flex items-center justify-center">
                      <Check size={18} className="text-clearfund-blue" />
                    </div>
                    <span className="text-gray-700">Provider-specific verification</span>
                  </div>
                </div>
              </div>
            </div>
          </CarouselItem>

          {/* Slide 4: Costs */}
          <CarouselItem>
            <div className="p-6">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="md:w-1/3">
                  <div className="w-32 h-32 rounded-full bg-clearfund-pale-blue text-clearfund-blue flex items-center justify-center mx-auto">
                    <FileText size={64} />
                  </div>
                </div>
                <div className="md:w-2/3 space-y-4">
                  <h3 className="text-2xl font-bold text-clearfund-dark-blue">How Are Costs Disclosed?</h3>
                  <p className="text-gray-600 text-lg">
                    Any provider offer includes its costs and terms for your review.
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-clearfund-pale-blue flex items-center justify-center">
                      <Check size={18} className="text-clearfund-blue" />
                    </div>
                    <span className="text-gray-700">Review the total cost and payment schedule</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-clearfund-pale-blue flex items-center justify-center">
                      <Check size={18} className="text-clearfund-blue" />
                    </div>
                    <span className="text-gray-700">Ask questions before accepting</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-clearfund-pale-blue flex items-center justify-center">
                      <Check size={18} className="text-clearfund-blue" />
                    </div>
                    <span className="text-gray-700">You choose whether to accept any offer</span>
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
                    Repayment terms are set by the provider and included in any offer.
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-clearfund-pale-blue flex items-center justify-center">
                      <Check size={18} className="text-clearfund-blue" />
                    </div>
                    <span className="text-gray-700">Payment schedule in the provider agreement</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-clearfund-pale-blue flex items-center justify-center">
                      <Check size={18} className="text-clearfund-blue" />
                    </div>
                    <span className="text-gray-700">Any revenue-based payments explained by the provider</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-clearfund-pale-blue flex items-center justify-center">
                      <Check size={18} className="text-clearfund-blue" />
                    </div>
                    <span className="text-gray-700">Review prepayment terms before accepting</span>
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
                    Explore funding options for your business with ClearFund AI.
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
                    <span className="text-gray-700">Provider review and terms</span>
                  </div>
                  <div className="space-y-4 mt-6">
                    <Button 
                      onClick={handleGetFunded}
                      className="bg-clearfund-blue hover:bg-clearfund-dark-blue text-white px-8 py-3 text-lg"
                    >
                      Explore Funding Options
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
