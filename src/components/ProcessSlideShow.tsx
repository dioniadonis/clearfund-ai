
import React, { useState } from 'react';
import { Check, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface ProcessSlideProps {
  onClose: () => void;
}

const ProcessSlideShow: React.FC<ProcessSlideProps> = ({ onClose }) => {
  return (
    <div className="bg-white/95 backdrop-blur-sm w-full h-full p-6 rounded-xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-clearfund-dark-blue">Simple 5-Step Process</h2>
        <Button variant="ghost" onClick={onClose} className="hover:bg-gray-100">
          Close
        </Button>
      </div>

      <Carousel className="w-full max-w-4xl mx-auto">
        <CarouselContent>
          {/* Step 1 */}
          <CarouselItem>
            <div className="p-6">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="md:w-1/3">
                  <div className="w-32 h-32 rounded-full bg-clearfund-pale-blue text-clearfund-blue flex items-center justify-center mx-auto">
                    <span className="text-6xl font-bold">1</span>
                  </div>
                </div>
                <div className="md:w-2/3 space-y-4">
                  <h3 className="text-2xl font-bold text-clearfund-dark-blue">Answer A Few Questions</h3>
                  <p className="text-gray-600 text-lg">
                    Our simple questionnaire helps us understand your business needs and 
                    provides us with essential information to create a customized funding 
                    offer tailored to your gig economy business.
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-clearfund-pale-blue flex items-center justify-center">
                      <Check size={18} className="text-clearfund-blue" />
                    </div>
                    <span className="text-gray-700">Takes less than 5 minutes</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-clearfund-pale-blue flex items-center justify-center">
                      <Check size={18} className="text-clearfund-blue" />
                    </div>
                    <span className="text-gray-700">No impact on your credit score</span>
                  </div>
                </div>
              </div>
            </div>
          </CarouselItem>

          {/* Step 2 */}
          <CarouselItem>
            <div className="p-6">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="md:w-1/3">
                  <div className="w-32 h-32 rounded-full bg-clearfund-pale-blue text-clearfund-blue flex items-center justify-center mx-auto">
                    <span className="text-6xl font-bold">2</span>
                  </div>
                </div>
                <div className="md:w-2/3 space-y-4">
                  <h3 className="text-2xl font-bold text-clearfund-dark-blue">Link Your Bank Account</h3>
                  <p className="text-gray-600 text-lg">
                    Securely connect your business bank account through our encrypted 
                    platform. This allows us to verify your income and transaction 
                    history without requiring extensive paperwork.
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-clearfund-pale-blue flex items-center justify-center">
                      <Check size={18} className="text-clearfund-blue" />
                    </div>
                    <span className="text-gray-700">Bank-level security encryption</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-clearfund-pale-blue flex items-center justify-center">
                      <Check size={18} className="text-clearfund-blue" />
                    </div>
                    <span className="text-gray-700">Fast verification process</span>
                  </div>
                </div>
              </div>
            </div>
          </CarouselItem>

          {/* Step 3 */}
          <CarouselItem>
            <div className="p-6">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="md:w-1/3">
                  <div className="w-32 h-32 rounded-full bg-clearfund-pale-blue text-clearfund-blue flex items-center justify-center mx-auto">
                    <span className="text-6xl font-bold">3</span>
                  </div>
                </div>
                <div className="md:w-2/3 space-y-4">
                  <h3 className="text-2xl font-bold text-clearfund-dark-blue">Review Approval Terms</h3>
                  <p className="text-gray-600 text-lg">
                    Once approved, you'll receive a customized funding offer with 
                    transparent terms. We clearly outline the funding amount, 
                    repayment schedule, and all applicable fees.
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-clearfund-pale-blue flex items-center justify-center">
                      <Check size={18} className="text-clearfund-blue" />
                    </div>
                    <span className="text-gray-700">No hidden fees or charges</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-clearfund-pale-blue flex items-center justify-center">
                      <Check size={18} className="text-clearfund-blue" />
                    </div>
                    <span className="text-gray-700">Customized to your business needs</span>
                  </div>
                </div>
              </div>
            </div>
          </CarouselItem>

          {/* Step 4 */}
          <CarouselItem>
            <div className="p-6">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="md:w-1/3">
                  <div className="w-32 h-32 rounded-full bg-clearfund-pale-blue text-clearfund-blue flex items-center justify-center mx-auto">
                    <span className="text-6xl font-bold">4</span>
                  </div>
                </div>
                <div className="md:w-2/3 space-y-4">
                  <h3 className="text-2xl font-bold text-clearfund-dark-blue">Accept Funding Offer</h3>
                  <p className="text-gray-600 text-lg">
                    If you're happy with the terms, simply accept the offer and sign 
                    the agreement electronically. Our streamlined process makes it 
                    easy to complete all necessary paperwork online.
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-clearfund-pale-blue flex items-center justify-center">
                      <Check size={18} className="text-clearfund-blue" />
                    </div>
                    <span className="text-gray-700">Simple e-signature process</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-clearfund-pale-blue flex items-center justify-center">
                      <Check size={18} className="text-clearfund-blue" />
                    </div>
                    <span className="text-gray-700">Complete verification steps</span>
                  </div>
                </div>
              </div>
            </div>
          </CarouselItem>

          {/* Step 5 */}
          <CarouselItem>
            <div className="p-6">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="md:w-1/3">
                  <div className="w-32 h-32 rounded-full bg-clearfund-pale-blue text-clearfund-blue flex items-center justify-center mx-auto">
                    <span className="text-6xl font-bold">5</span>
                  </div>
                </div>
                <div className="md:w-2/3 space-y-4">
                  <h3 className="text-2xl font-bold text-clearfund-dark-blue">Receive Funds</h3>
                  <p className="text-gray-600 text-lg">
                    Get your approved funds deposited directly to your business account within 
                    24-48 hours. Quick access to capital means you can put your 
                    funding to work immediately.
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-clearfund-pale-blue flex items-center justify-center">
                      <Check size={18} className="text-clearfund-blue" />
                    </div>
                    <span className="text-gray-700">Fast direct deposit</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-clearfund-pale-blue flex items-center justify-center">
                      <Check size={18} className="text-clearfund-blue" />
                    </div>
                    <span className="text-gray-700">No waiting for paperwork processing</span>
                  </div>
                </div>
              </div>
            </div>
          </CarouselItem>
        </CarouselContent>

        <div className="flex items-center justify-center gap-4 mt-8">
          <CarouselPrevious className="position-relative left-auto" />
          <CarouselNext className="position-relative right-auto" />
        </div>
      </Carousel>
    </div>
  );
};

export default ProcessSlideShow;
