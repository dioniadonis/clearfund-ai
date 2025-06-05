import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { ChevronDown, Phone, Mail, Menu, X } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Link } from "react-router-dom";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import FinancingEducationSlideShow from './FinancingEducationSlideShow';

const Header: React.FC = () => {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);
  const [isContactFormOpen, setIsContactFormOpen] = useState(false);
  const [isEducationSlideShowOpen, setIsEducationSlideShowOpen] = useState(false);
  
  // Close menu when route changes (e.g., when clicking on anchor links)
  useEffect(() => {
    const handleHashChange = () => {
      if (isOpen) setIsOpen(false);
    };
    
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [isOpen]);

  const openContactForm = () => {
    setIsContactFormOpen(true);
  };

  const openEducationSlideShow = () => {
    setIsEducationSlideShowOpen(true);
  };
  
  return (
    <header className="py-4 bg-white shadow-sm sticky top-0 z-50">
      <div className="container-custom flex items-center justify-between">
        <div className="flex items-center">
          <Link to="/" className="flex items-center">
            <h1 className="text-2xl font-bold text-clearfund-blue">
              Clearfund AI
            </h1>
          </Link>
        </div>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex space-x-8">
          <Link to="/working-capital" className="text-clearfund-dark-blue hover:text-clearfund-blue font-medium transition-colors">
            Working Capital
          </Link>
          <Link to="/gig-funding" className="text-clearfund-dark-blue hover:text-clearfund-blue font-medium transition-colors">
            Get Funded Today
          </Link>
          <Link to="/credit-repair" className="text-clearfund-dark-blue hover:text-clearfund-blue font-medium transition-colors">
            Credit Repair
          </Link>
        </nav>
        
        <div className="flex items-center space-x-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="text-clearfund-dark-blue hover:text-clearfund-blue font-medium transition-colors flex items-center gap-1">
                <Phone size={16} />
                <ChevronDown size={16} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white p-2 min-w-[200px]">
              <DropdownMenuItem asChild>
                <a href="tel:9545790021" className="flex items-center gap-2 text-clearfund-dark-blue hover:text-clearfund-blue cursor-pointer w-full px-2 py-2">
                  <Phone size={16} />
                  <span>954-579-0021</span>
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <button 
                  onClick={openContactForm}
                  className="flex items-center gap-2 text-clearfund-dark-blue hover:text-clearfund-blue cursor-pointer w-full px-2 py-2"
                >
                  <Mail size={16} />
                  <span>Email Us</span>
                </button>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button 
            onClick={openEducationSlideShow}
            className="hidden md:inline-flex bg-clearfund-blue hover:bg-clearfund-dark-blue text-white transition-colors"
          >
            Get Started
          </Button>
          
          {/* Mobile Menu Toggle */}
          {isMobile && (
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden p-2 text-clearfund-blue"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          )}
        </div>
      </div>
      
      {/* Mobile Navigation Menu */}
      {isMobile && isOpen && (
        <div className="md:hidden bg-white border-t shadow-lg">
          <nav className="container-custom py-4 flex flex-col space-y-4">
            <Link to="/working-capital" className="text-clearfund-dark-blue hover:text-clearfund-blue font-medium transition-colors py-2 border-b border-gray-100">
              Working Capital
            </Link>
            <Link to="/gig-funding" className="text-clearfund-dark-blue hover:text-clearfund-blue font-medium transition-colors py-2 border-b border-gray-100">
              Get Funded Today
            </Link>
            <Link to="/credit-repair" className="text-clearfund-dark-blue hover:text-clearfund-blue font-medium transition-colors py-2">
              Credit Repair
            </Link>
          </nav>
        </div>
      )}

      {/* Contact Form Dialog */}
      <Dialog open={isContactFormOpen} onOpenChange={setIsContactFormOpen}>
        <DialogContent className="sm:max-w-[800px] h-[600px] p-0">
          <iframe 
            src="https://form.jotform.com/251398259721162" 
            className="w-full h-[550px] border-none" 
            title="Contact Form" 
          />
        </DialogContent>
      </Dialog>

      {/* Financing Education Slideshow Dialog */}
      <Dialog open={isEducationSlideShowOpen} onOpenChange={setIsEducationSlideShowOpen}>
        <DialogContent className="sm:max-w-[900px] h-[700px] p-0">
          <FinancingEducationSlideShow onClose={() => setIsEducationSlideShowOpen(false)} />
        </DialogContent>
      </Dialog>
    </header>
  );
};

export default Header;
