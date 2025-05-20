
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuTrigger,
  DropdownMenuItem
} from "@/components/ui/dropdown-menu";
import { ChevronUp, ChevronDown, Phone } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const Header: React.FC = () => {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <header className="py-4 bg-white shadow-sm sticky top-0 z-50">
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
              <Button 
                variant={isMobile ? "default" : "ghost"}
                className={`
                  ${isMobile ? "bg-clearfund-blue hover:bg-clearfund-dark-blue text-white" : "text-clearfund-dark-blue hover:text-clearfund-blue"}
                  transition-colors
                `}
              >
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
      
      {/* Mobile Navigation Toggle */}
      {isMobile && (
        <div className="flex justify-center mt-2">
          <Collapsible
            open={isOpen}
            onOpenChange={setIsOpen}
            className="w-full"
          >
            <CollapsibleTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="flex items-center gap-1 text-clearfund-dark-blue hover:text-clearfund-blue"
              >
                {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                <span>Menu</span>
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 border-t pt-2">
              <nav className="flex flex-col items-center space-y-2">
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
            </CollapsibleContent>
          </Collapsible>
        </div>
      )}
    </header>
  );
};

export default Header;
