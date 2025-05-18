import React from 'react';
import { Button } from "@/components/ui/button";
const Footer: React.FC = () => {
  return <footer className="bg-clearfund-dark-blue text-white">
      <div className="container-custom py-16">
        <div id="contact" className="grid md:grid-cols-2 gap-12 mb-12">
          <div>
            <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
            <p className="text-clearfund-pale-blue mb-6 max-w-md">
              Join thousands of AI-driven businesses who trust Clearfund for their financing needs. Talk to our AI advisor or contact our team today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button className="bg-clearfund-blue hover:bg-white hover:text-clearfund-dark-blue transition-colors">
                Chat with AI
              </Button>
              <Button variant="outline" className="bg-clearfund-blue hover:bg-white hover:text-clearfund-dark-blue transition-colors">
                Contact Sales
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Products</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-clearfund-pale-blue hover:text-white transition-colors"> Instant Micro Funding</a></li>
                <li><a href="#" className="text-clearfund-pale-blue hover:text-white transition-colors">Term Loans</a></li>
                <li><a href="#" className="text-clearfund-pale-blue hover:text-white transition-colors">Equipment Financing</a></li>
                <li><a href="#" className="text-clearfund-pale-blue hover:text-white transition-colors">Working Capital</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Company</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-clearfund-pale-blue hover:text-white transition-colors">About Us</a></li>

                <li><a href="#" className="text-clearfund-pale-blue hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="text-clearfund-pale-blue hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="border-t border-clearfund-blue pt-8 flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0 flex items-center">
            <div className="h-10 w-10 bg-white text-clearfund-blue font-bold flex items-center justify-center rounded mr-2">
              CF
            </div>
            <h1 className="text-2xl font-bold">
              <span className="text-clearfund-white">Clear</span>fund AI
            </h1>
          </div>
          <div className="text-sm text-clearfund-pale-blue">
            <p>&copy; {new Date().getFullYear()} Clearfund AI. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>;
};
export default Footer;