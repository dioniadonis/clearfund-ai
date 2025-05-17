
import React from 'react';
import { Button } from "@/components/ui/button";

const Header: React.FC = () => {
  return (
    <header className="py-4 bg-white shadow-sm sticky top-0 z-50">
      <div className="container-custom flex items-center justify-between">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold text-bluevine-dark-blue">
            <span className="text-bluevine-accent">Blue</span>Vine
          </h1>
        </div>
        <nav className="hidden md:flex space-x-8">
          <a href="#features" className="text-bluevine-dark-blue hover:text-bluevine-accent font-medium transition-colors">
            Solutions
          </a>
          <a href="#ai-chat" className="text-bluevine-dark-blue hover:text-bluevine-accent font-medium transition-colors">
            AI Advisor
          </a>
          <a href="#" className="text-bluevine-dark-blue hover:text-bluevine-accent font-medium transition-colors">
            Resources
          </a>
          <a href="#contact" className="text-bluevine-dark-blue hover:text-bluevine-accent font-medium transition-colors">
            Contact
          </a>
        </nav>
        <div className="flex items-center space-x-4">
          <Button variant="ghost" className="hidden md:inline-flex text-bluevine-dark-blue hover:text-bluevine-accent">
            Sign In
          </Button>
          <Button className="bg-bluevine-accent hover:bg-bluevine-dark-blue text-white transition-colors">
            Get Started
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
