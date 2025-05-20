
import React from 'react';
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuTrigger,
  DropdownMenuItem
} from "@/components/ui/dropdown-menu";
import { Phone } from "lucide-react";

const Header: React.FC = () => {
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
              <Button variant="ghost" className="hidden md:inline-flex text-clearfund-dark-blue hover:text-clearfund-blue">
                Contact Us
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white p-2">
              <DropdownMenuItem asChild>
                <a href="tel:9545790021" className="flex items-center gap-2 text-clearfund-dark-blue hover:text-clearfund-blue cursor-pointer">
                  <Phone size={16} />
                  <span>954-579-0021</span>
                </a>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button className="bg-clearfund-blue hover:bg-clearfund-dark-blue text-white transition-colors">
            Get Started
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
