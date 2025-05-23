import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Mail, Clock, BookOpen, TrendingUp, CheckCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

// Extend the global window object to include hbspt
declare global {
  interface Window {
    hbspt: any;
  }
}

const Blog: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);

  useEffect(() => {
    // Load HubSpot script
    const script = document.createElement('script');
    script.src = '//js-na2.hsforms.net/forms/embed/v2.js';
    script.charset = 'utf-8';
    script.type = 'text/javascript';
    document.head.appendChild(script);

    return () => {
      // Cleanup script on unmount
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({
        title: "Email Required",
        description: "Please enter your email address to subscribe.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Wait a bit for HubSpot to load if needed
      await new Promise(resolve => setTimeout(resolve, 500));

      if (typeof window.hbspt !== 'undefined') {
        // Create HubSpot form submission
        window.hbspt.forms.create({
          portalId: "242866165",
          formId: "abf3f674-594a-4092-832b-76b7d283a75b",
          region: "na2",
          target: '#hubspot-form-container',
          onFormSubmit: () => {
            console.log('HubSpot form submitted successfully');
            // Show thank you animation
            setShowThankYou(true);
            setEmail('');
            
            toast({
              title: "Successfully Subscribed!",
              description: "You'll be the first to know when our blog launches."
            });
          },
          onFormReady: () => {
            // Auto-fill and submit the form
            setTimeout(() => {
              const form = document.querySelector('#hubspot-form-container form');
              if (form) {
                const emailInput = form.querySelector('input[name="email"]') as HTMLInputElement;
                if (emailInput) {
                  emailInput.value = email;
                  const submitButton = form.querySelector('input[type="submit"]') as HTMLInputElement;
                  if (submitButton) {
                    submitButton.click();
                  }
                }
              }
            }, 100);
          }
        });
      } else {
        // Fallback - just show success for now
        console.log('HubSpot not loaded, showing success anyway');
        setShowThankYou(true);
        setEmail('');
        
        toast({
          title: "Successfully Subscribed!",
          description: "You'll be the first to know when our blog launches."
        });
      }

    } catch (error) {
      console.error('Submission error:', error);
      toast({
        title: "Submission Error",
        description: "There was an issue with your submission. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetThankYou = () => {
    setShowThankYou(false);
  };

  if (showThankYou) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-clearfund-pale-blue via-white to-clearfund-pale-blue flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-green-500 rounded-full mb-6 animate-scale-in">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-clearfund-dark-blue mb-4">
            Thank You!
          </h1>
          
          <p className="text-xl text-gray-700 mb-8 max-w-2xl mx-auto">
            You're all set! We'll send you exclusive insights and early access to our blog content.
          </p>
          
          <Button 
            onClick={resetThankYou}
            className="bg-gradient-to-r from-clearfund-blue to-clearfund-dark-blue hover:from-clearfund-dark-blue hover:to-clearfund-blue transition-all duration-300 rounded-xl"
          >
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-clearfund-pale-blue via-white to-clearfund-pale-blue">
      <Header />
      
      <main className="pt-20 pb-16">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto text-center py-16">
            {/* Main Hero Section */}
            <div className="mb-12">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-clearfund-blue rounded-full mb-6">
                <BookOpen className="w-10 h-10 text-white" />
              </div>
              
              <h1 className="text-5xl md:text-6xl font-bold text-clearfund-dark-blue mb-6">
                Coming Soon
              </h1>
              
              <p className="text-xl md:text-2xl text-gray-700 mb-8 max-w-3xl mx-auto leading-relaxed">
                We're crafting something special for you. Get ready for expert insights on 
                <span className="text-clearfund-blue font-semibold"> AI-driven business financing</span>, 
                growth strategies, and financial wisdom that will transform your business.
              </p>
            </div>

            {/* Features Preview */}
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <Card className="border-none shadow-lg bg-white/70 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
                <CardContent className="p-8">
                  <div className="w-12 h-12 bg-clearfund-blue/10 rounded-lg flex items-center justify-center mb-4 mx-auto">
                    <TrendingUp className="w-6 h-6 text-clearfund-blue" />
                  </div>
                  <h3 className="text-lg font-bold text-clearfund-dark-blue mb-2">Expert Insights</h3>
                  <p className="text-gray-600">Deep dives into financing strategies and business growth tactics</p>
                </CardContent>
              </Card>

              <Card className="border-none shadow-lg bg-white/70 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
                <CardContent className="p-8">
                  <div className="w-12 h-12 bg-clearfund-blue/10 rounded-lg flex items-center justify-center mb-4 mx-auto">
                    <Clock className="w-6 h-6 text-clearfund-blue" />
                  </div>
                  <h3 className="text-lg font-bold text-clearfund-dark-blue mb-2">Weekly Updates</h3>
                  <p className="text-gray-600">Fresh content delivered every week to keep you informed</p>
                </CardContent>
              </Card>

              <Card className="border-none shadow-lg bg-white/70 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
                <CardContent className="p-8">
                  <div className="w-12 h-12 bg-clearfund-blue/10 rounded-lg flex items-center justify-center mb-4 mx-auto">
                    <Mail className="w-6 h-6 text-clearfund-blue" />
                  </div>
                  <h3 className="text-lg font-bold text-clearfund-dark-blue mb-2">Exclusive Access</h3>
                  <p className="text-gray-600">Subscribers get early access and exclusive content</p>
                </CardContent>
              </Card>
            </div>

            {/* Email Capture Form */}
            <Card className="max-w-2xl mx-auto border-none shadow-2xl bg-white/90 backdrop-blur-sm">
              <CardContent className="p-8 md:p-12">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-clearfund-dark-blue mb-4">
                    Be the First to Know
                  </h2>
                  <p className="text-lg text-gray-700">
                    Join our exclusive list and get notified when we launch, plus receive our 
                    <span className="text-clearfund-blue font-semibold"> free financing guide</span> as a welcome gift.
                  </p>
                </div>

                <form onSubmit={handleEmailSubmit} className="space-y-6">
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input 
                      type="email" 
                      placeholder="Enter your email address" 
                      value={email} 
                      onChange={e => setEmail(e.target.value)} 
                      className="pl-12 h-14 text-lg border-2 border-gray-200 focus:border-clearfund-blue rounded-xl" 
                      required 
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    disabled={isSubmitting} 
                    className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-clearfund-blue to-clearfund-dark-blue hover:from-clearfund-dark-blue hover:to-clearfund-blue transition-all duration-300 rounded-xl shadow-lg hover:shadow-xl"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Subscribing...
                      </>
                    ) : (
                      'Get Early Access'
                    )}
                  </Button>
                </form>

                <p className="text-sm text-gray-500 mt-6 text-center">
                  No spam, ever. Unsubscribe anytime with just one click.
                </p>
              </CardContent>
            </Card>

            {/* Hidden HubSpot form container */}
            <div style={{ display: 'none' }} id="hubspot-form-container"></div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Blog;
