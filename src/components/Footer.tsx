
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  const [isAboutVideoDialogOpen, setIsAboutVideoDialogOpen] = useState(false);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLinkClick = () => {
    scrollToTop();
  };

  return <footer className="bg-clearfund-dark-blue text-white">
      <div className="container-custom py-16">
        <div id="contact" className="grid md:grid-cols-2 gap-12 mb-12">
          <div>
            <h2 className="text-3xl font-bold mb-4">Ready to get funded?</h2>
            <p className="text-clearfund-pale-blue mb-6 max-w-md">Join thousands of small business owners who trust Clearfund for their financing needs. Talk to our AI advisor or contact our team today.</p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild className="bg-clearfund-blue hover:bg-white hover:text-clearfund-dark-blue transition-colors">
                <Link to="/apply?cta=footer_apply">Apply for Funding</Link>
              </Button>
              <Button asChild variant="outline" className="bg-clearfund-blue hover:bg-white hover:text-clearfund-dark-blue transition-colors">
                <a href="tel:8665784721">Call 866-578-4721</a>
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Products</h3>
              <ul className="space-y-2">
                <li>
                  <Link 
                    to="/working-capital" 
                    className="text-clearfund-pale-blue hover:text-white transition-colors"
                    onClick={handleLinkClick}
                  >
                    Working Capital
                  </Link>
                </li>
                <li>
                  <a 
                    href="https://davidallencapital.com/clearfund" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-clearfund-pale-blue hover:text-white transition-colors"
                  >
                    Instant Micro Funding
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Company</h3>
              <ul className="space-y-2">
                <li>
                  <button 
                    onClick={() => setIsAboutVideoDialogOpen(true)}
                    className="text-clearfund-pale-blue hover:text-white transition-colors text-left"
                  >
                    About Us
                  </button>
                </li>
                <li>
                  <Link 
                    to="/blog" 
                    className="text-clearfund-pale-blue hover:text-white transition-colors"
                    onClick={handleLinkClick}
                  >
                    Blog
                  </Link>
                </li>
                <li>
                  <a href="tel:8665784721" className="text-clearfund-pale-blue hover:text-white transition-colors">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Legal</h3>
              <ul className="space-y-2">
                <li>
                  <Link 
                    to="/privacy-policy" 
                    className="text-clearfund-pale-blue hover:text-white transition-colors"
                    onClick={handleLinkClick}
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/terms-and-conditions" 
                    className="text-clearfund-pale-blue hover:text-white transition-colors"
                    onClick={handleLinkClick}
                  >
                    Terms & Conditions
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/broker-disclosure" 
                    className="text-clearfund-pale-blue hover:text-white transition-colors"
                    onClick={handleLinkClick}
                  >
                    Broker Disclosure
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/disclaimers" 
                    className="text-clearfund-pale-blue hover:text-white transition-colors"
                    onClick={handleLinkClick}
                  >
                    Disclaimers
                  </Link>
                </li>
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
          <div className="text-sm text-clearfund-pale-blue text-center md:text-right">
            <p>&copy; {new Date().getFullYear()} Clearfund AI. All rights reserved.</p>
            <p className="text-xs mt-2">
              *ClearFund AI is a broker, not a lender. We partner with select funding providers, including David Allen Capital, and may receive compensation when you are funded through a partner. Your privacy is protected throughout the process.
            </p>
          </div>
        </div>
      </div>


      {/* About Us Video Dialog */}
      <Dialog open={isAboutVideoDialogOpen} onOpenChange={open => setIsAboutVideoDialogOpen(open)}>
        <DialogContent className="sm:max-w-[600px] p-4">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-xl font-bold text-clearfund-dark-blue">About Clearfund AI</DialogTitle>
          </DialogHeader>
          <div className="aspect-video w-full">
            <iframe 
              width="100%" 
              height="100%" 
              src="https://app.heygen.com/embeds/2b993d1c03844e59a8942ca35a1402d5" 
              title="About Clearfund AI" 
              frameBorder="0" 
              allow="encrypted-media; fullscreen;" 
              allowFullScreen
              className="rounded-md"
            />
          </div>
        </DialogContent>
      </Dialog>
    </footer>;
};


export default Footer;
