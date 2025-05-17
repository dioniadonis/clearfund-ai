
import React from 'react';
import { Button } from "@/components/ui/button";

const Footer: React.FC = () => {
  return (
    <footer className="bg-bluevine-dark-blue text-white">
      <div className="container-custom py-16">
        <div id="contact" className="grid md:grid-cols-2 gap-12 mb-12">
          <div>
            <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
            <p className="text-bluevine-pale-blue mb-6 max-w-md">
              Join thousands of small businesses who trust BluVine for their financing needs. Talk to our AI advisor or contact our team today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button className="bg-bluevine-accent hover:bg-white hover:text-bluevine-dark-blue transition-colors">
                Chat with AI
              </Button>
              <Button variant="outline" className="border-white text-white hover:bg-white hover:text-bluevine-dark-blue">
                Contact Sales
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Products</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-bluevine-pale-blue hover:text-white transition-colors">Line of Credit</a></li>
                <li><a href="#" className="text-bluevine-pale-blue hover:text-white transition-colors">Term Loans</a></li>
                <li><a href="#" className="text-bluevine-pale-blue hover:text-white transition-colors">Invoice Factoring</a></li>
                <li><a href="#" className="text-bluevine-pale-blue hover:text-white transition-colors">Business Checking</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Company</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-bluevine-pale-blue hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="text-bluevine-pale-blue hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="text-bluevine-pale-blue hover:text-white transition-colors">Press</a></li>
                <li><a href="#" className="text-bluevine-pale-blue hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="border-t border-bluevine-medium-blue pt-8 flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <h1 className="text-2xl font-bold">
              <span className="text-bluevine-accent">Blue</span>Vine
            </h1>
          </div>
          <div className="text-sm text-bluevine-pale-blue">
            <p>&copy; {new Date().getFullYear()} BluVine. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
