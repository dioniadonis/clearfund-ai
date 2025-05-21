
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { ChevronDown, Phone } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const Header: React.FC = () => {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);
  
  // Close menu when route changes (e.g., when clicking on anchor links)
  useEffect(() => {
    const handleHashChange = () => {
      if (isOpen) setIsOpen(false);
    };
    
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [isOpen]);
  
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
      
      {/* Mobile Navigation Toggle - Fixed position and animation */}
      {isMobile && (
        <div className="flex justify-center absolute left-0 right-0 bottom-0 translate-y-1/2 z-10">
          <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full max-w-[500px] mx-auto">
            <div className="flex justify-center">
              <CollapsibleTrigger asChild>
                <button 
                  className={`
                    fixed w-14 h-8 rounded-md flex items-center justify-center
                    ${isOpen ? "bg-clearfund-pale-blue text-clearfund-blue" : "bg-white text-clearfund-blue"} 
                    border border-gray-200 shadow-md hover:bg-gray-50 
                    transition-colors duration-300
                  `}
                >
                  {/* Fixed toggle icon - Points down regardless of state */}
                  <ChevronDown 
                    size={16} 
                    className={`transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>
              </CollapsibleTrigger>
            </div>
            
            {/* Menu content - Using top-oriented animation */}
            <CollapsibleContent className="bg-white border-t shadow-md rounded-b-lg mt-6 overflow-hidden">
              <div className="px-4 py-4 origin-top">
                <nav className="flex flex-col space-y-4">
                  <a href="#features" className="text-clearfund-dark-blue hover:text-clearfund-blue font-medium transition-colors py-2 border-b border-gray-100">
                    Working Capital
                  </a>
                  <a href="#" className="text-clearfund-dark-blue hover:text-clearfund-blue font-medium transition-colors py-2 border-b border-gray-100">
                    Gig Funding
                  </a>
                  <a href="#contact" className="text-clearfund-dark-blue hover:text-clearfund-blue font-medium transition-colors py-2">
                    Credit Repair
                  </a>
                </nav>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      )}
    </header>
  );
};

export default Header;
