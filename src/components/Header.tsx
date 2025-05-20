
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { ChevronUp, ChevronDown, Phone } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Toggle } from "@/components/ui/toggle";

const Header: React.FC = () => {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <header className="py-4 bg-white shadow-sm sticky top-0 z-50 relative">
      <div className="container-custom flex items-center justify-between">
        <div className="flex items-center">
          <div className="flex items-center">
            <div className="h-10 w-10 bg-clearfund-blue text-white flex items-center justify-center rounded font-bold text-xl">
              <span>CF</span>
            </div>
            <h1 className="text-2xl font-bold text-clearfund-blue ml-2">
              Clearfund AI
            </h1>
          </div>
        </div>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex space-x-8">
          <a href="#features" className="text-clearfund-dark-blue hover:text-clearfund-blue font-medium transition-colors">
            Working Capital
          </a>
          <a href="#" className="text-clearfund-dark-blue hover:text-clearfund-blue font-medium transition-colors">
            Gig Funding
          </a>
          <a href="#contact" className="text-clearfund-dark-blue hover:text-clearfund-blue font-medium transition-colors">
            Credit Repair
          </a>
        </nav>
        
        <div className="flex items-center space-x-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant={isMobile ? "default" : "ghost"} className={`
                  ${isMobile ? "bg-clearfund-blue hover:bg-clearfund-dark-blue text-white" : "text-clearfund-dark-blue hover:text-clearfund-blue"}
                  transition-colors
                `}>
                Contact Us
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white p-2">
              <DropdownMenuItem asChild>
                <a href="tel:9545790021" className="flex items-center gap-2 text-clearfund-dark-blue hover:text-clearfund-blue cursor-pointer">
                  <Phone size={16} />
                  <span>+1 954-579-0021</span>
                </a>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button className="hidden md:inline-flex bg-clearfund-blue hover:bg-clearfund-dark-blue text-white transition-colors">
            Get Started
          </Button>
        </div>
      </div>
      
      {/* Modern Mobile Navigation Toggle - Half on/half off the header and centered */}
      {isMobile && (
        <div className="flex justify-center absolute left-0 right-0 bottom-0 translate-y-1/2 z-10">
          <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full max-w-[500px] mx-auto">
            <div className="flex justify-center">
              <CollapsibleTrigger asChild>
                <Toggle 
                  pressed={isOpen} 
                  aria-label="Toggle navigation menu" 
                  className="rounded-full h-10 w-10 flex items-center justify-center bg-white border border-gray-200 shadow-md hover:bg-gray-50 px-0 py-0 text-center transition-all duration-300"
                >
                  {isOpen ? 
                    <ChevronUp size={18} className="text-clearfund-blue transition-transform duration-300" /> : 
                    <ChevronDown size={18} className="text-clearfund-blue transition-transform duration-300" />
                  }
                </Toggle>
              </CollapsibleTrigger>
            </div>
            <CollapsibleContent className="bg-white border-t pt-2 shadow-md rounded-b-lg mt-6 transition-all duration-300 data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
              <nav className="flex flex-col items-center space-y-3 py-3">
                <a href="#features" className="text-clearfund-dark-blue hover:text-clearfund-blue font-medium transition-colors w-full text-center py-1">
                  Working Capital
                </a>
                <a href="#" className="text-clearfund-dark-blue hover:text-clearfund-blue font-medium transition-colors w-full text-center py-1">
                  Gig Funding
                </a>
                <a href="#contact" className="text-clearfund-dark-blue hover:text-clearfund-blue font-medium transition-colors w-full text-center py-1">
                  Credit Repair
                </a>
              </nav>
            </CollapsibleContent>
          </Collapsible>
        </div>
      )}
    </header>
  );
};

export default Header;
