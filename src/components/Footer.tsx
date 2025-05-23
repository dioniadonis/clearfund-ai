
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  const [isApplyDialogOpen, setIsApplyDialogOpen] = useState(false);
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
  const [jotformLoaded, setJotformLoaded] = useState(false);

  // Load JotForm script after component mounts
  useEffect(() => {
    // Clean up any existing scripts first to avoid conflicts
    const existingScripts = document.querySelectorAll('script[src*="jotform"]');
    existingScripts.forEach(script => {
      document.body.removeChild(script);
    });

    // Load the main JotForm script
    const script1 = document.createElement('script');
    script1.src = 'https://form.jotform.com/static/feedback2.js';
    script1.async = true;
    document.body.appendChild(script1);

    // Create a promise to wait for script to load
    const scriptLoaded = new Promise<void>((resolve) => {
      script1.onload = () => resolve();
    });

    // Initialize JotForm after script loads
    scriptLoaded.then(() => {
      if (typeof window.JotformFeedback !== 'undefined') {
        try {
          window.JFL_251398259721162 = new window.JotformFeedback({
            formId: '251398259721162',
            base: 'https://form.jotform.com/',
            windowTitle: 'Contact Us',
            backgroundColor: '#005aff',
            fontColor: '#FFFFFF',
            type: 'false',
            height: 500,
            width: 700,
            openOnLoad: false
          });
          setJotformLoaded(true);
          console.log('JotForm initialized successfully');
        } catch (error) {
          console.error('Error initializing JotForm:', error);
          setJotformLoaded(false);
        }
      } else {
        console.error('JotformFeedback is undefined');
        setJotformLoaded(false);
      }
    });

    return () => {
      // Clean up scripts on unmount
      const jotformScripts = document.querySelectorAll('script[src*="jotform"]');
      jotformScripts.forEach(script => {
        if (document.body.contains(script)) {
          document.body.removeChild(script);
        }
      });
    };
  }, []);

  const openMessageForm = (e: React.MouseEvent) => {
    e.preventDefault();
    
    try {
      // Check if JotForm is loaded and the function exists
      if (jotformLoaded && window.JFL_251398259721162 && typeof window.JFL_251398259721162.openLightbox === 'function') {
        window.JFL_251398259721162.openLightbox();
        console.log('Opening JotForm lightbox');
      } else {
        console.log('JotForm not loaded or openLightbox not available, using fallback dialog');
        setIsMessageDialogOpen(true);
        // Add a toast notification to inform the user
        toast({
          title: "Using fallback form",
          description: "Our embedded form is loading. Thank you for your patience.",
        });
      }
    } catch (error) {
      console.error('Error opening message form:', error);
      setIsMessageDialogOpen(true);
    }
  };

  return <footer className="bg-clearfund-dark-blue text-white">
      <div className="container-custom py-16">
        <div id="contact" className="grid md:grid-cols-2 gap-12 mb-12">
          <div>
            <h2 className="text-3xl font-bold mb-4">Ready to get funded?</h2>
            <p className="text-clearfund-pale-blue mb-6 max-w-md">Join thousands of small business owners who trust Clearfund for their financing needs. Talk to our AI advisor or contact our team today.</p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button onClick={() => setIsApplyDialogOpen(true)} className="bg-clearfund-blue hover:bg-white hover:text-clearfund-dark-blue transition-colors">
                Apply for Funding
              </Button>
              <Button 
                variant="outline" 
                className="bg-clearfund-blue hover:bg-white hover:text-clearfund-dark-blue transition-colors"
                onClick={openMessageForm}
              >
                Message Us
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Products</h3>
              <ul className="space-y-2">
                <li><Link to="/working-capital" className="text-clearfund-pale-blue hover:text-white transition-colors">Working Capital</Link></li>
                <li><a href="#" className="text-clearfund-pale-blue hover:text-white transition-colors">Term Loans</a></li>
                <li><a href="#" className="text-clearfund-pale-blue hover:text-white transition-colors">Equipment Finance</a></li>
                <li><Link to="/gig-funding" className="text-clearfund-pale-blue hover:text-white transition-colors">Instant Micro Funding</Link></li>
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

      {/* Apply for Funding Dialog */}
      <Dialog open={isApplyDialogOpen} onOpenChange={open => setIsApplyDialogOpen(open)}>
        <DialogContent className="sm:max-w-[800px] h-[600px] p-0">
          <iframe src="https://form.jotform.com/251378086816062" className="w-full h-[550px] border-none" title="Funding Application Form" data-clearfund-form="funding-application" />
        </DialogContent>
      </Dialog>

      {/* Message Us Dialog (fallback) */}
      <Dialog open={isMessageDialogOpen} onOpenChange={open => setIsMessageDialogOpen(open)}>
        <DialogContent className="sm:max-w-[800px] h-[600px] p-0">
          <iframe src="https://form.jotform.com/251398259721162" className="w-full h-[550px] border-none" title="Contact Form" data-clearfund-form="contact-form" />
        </DialogContent>
      </Dialog>
    </footer>;
};

// Add the global JotformFeedback type declaration
declare global {
  interface Window {
    JFL_251398259721162: any;
    JotformFeedback: any;
  }
}

export default Footer;
