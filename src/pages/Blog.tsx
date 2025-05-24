
import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, BookOpen, TrendingUp, CheckCircle } from 'lucide-react';

const Blog: React.FC = () => {
  const handleGetEarlyAccess = () => {
    window.open(
      'https://form.jotform.com/251428125592154',
      'blank',
      'scrollbars=yes,toolbar=no,width=700,height=500'
    );
  };

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
                    <CheckCircle className="w-6 h-6 text-clearfund-blue" />
                  </div>
                  <h3 className="text-lg font-bold text-clearfund-dark-blue mb-2">Exclusive Access</h3>
                  <p className="text-gray-600">Subscribers get early access and exclusive content</p>
                </CardContent>
              </Card>
            </div>

            {/* Call to Action */}
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

                <Button 
                  onClick={handleGetEarlyAccess}
                  className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-clearfund-blue to-clearfund-dark-blue hover:from-clearfund-dark-blue hover:to-clearfund-blue transition-all duration-300 rounded-xl shadow-lg hover:shadow-xl"
                >
                  Get Early Access
                </Button>

                <p className="text-sm text-gray-500 mt-6 text-center">
                  No spam, ever. Unsubscribe anytime with just one click.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Blog;
