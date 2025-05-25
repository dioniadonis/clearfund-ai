
import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, BookOpen, TrendingUp, CheckCircle } from 'lucide-react';

const Blog: React.FC = () => {
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

            {/* Call to Action with Form */}
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

                {/* Embedded Form */}
                <div className="jotform-container">
                  <script>window.enableEventObserver=true</script>
                  <script src="https://cdn.jotfor.ms/static/prototype.forms.js?v=3.3.63224" type="text/javascript"></script>
                  <script src="https://cdn.jotfor.ms/static/jotform.forms.js?v=3.3.63224" type="text/javascript"></script>
                  <script src="https://cdn.jotfor.ms/js/punycode-1.4.1.min.js?v=3.3.63224" type="text/javascript" defer></script>
                  <script src="https://cdn.jotfor.ms/s/umd/264fc3e16c7/for-widgets-server.js" type="text/javascript"></script>
                  <script src="https://cdn.jotfor.ms/s/umd/264fc3e16c7/for-form-branding-footer.js" type="text/javascript" defer></script>
                  <script src="https://cdn.jotfor.ms/js/vendor/smoothscroll.min.js?v=3.3.63224" type="text/javascript"></script>
                  <script src="https://cdn.jotfor.ms/js/errorNavigation.js?v=3.3.63224" type="text/javascript"></script>

                  <form className="jotform-form" action="https://submit.jotform.com/submit/251428125592154" method="post" name="form_251428125592154" id="251428125592154" accept-charset="utf-8" autoComplete="on">
                    <input type="hidden" name="formID" value="251428125592154" />
                    <input type="hidden" id="JWTContainer" value="" />
                    <input type="hidden" id="cardinalOrderNumber" value="" />
                    <input type="hidden" id="jsExecutionTracker" name="jsExecutionTracker" value="build-date-1748046896965" />
                    <input type="hidden" id="submitSource" name="submitSource" value="unknown" />
                    <input type="hidden" id="buildDate" name="buildDate" value="1748046896965" />
                    <input type="hidden" name="uploadServerUrl" value="https://upload.jotform.com/upload" />
                    <input type="hidden" name="eventObserver" value="1" />
                    
                    <div role="main" className="form-all">
                      <ul className="form-section page-section" role="presentation">
                        <li id="cid_1" className="form-input-wide" data-type="control_head">
                          <div className="form-header-group header-large">
                            <div className="header-text httal htvam">
                              <h1 id="header_1" className="form-header" data-component="header">Newsletter</h1>
                            </div>
                          </div>
                        </li>
                        <li className="form-line jf-required" data-type="control_email" id="id_4">
                          <label className="form-label form-label-left form-label-auto" id="label_4" htmlFor="input_4" aria-hidden="false">
                            E-mail<span className="form-required">*</span>
                          </label>
                          <div id="cid_4" className="form-input jf-required" data-layout="half">
                            <input 
                              type="email" 
                              id="input_4" 
                              name="q4_email" 
                              className="form-textbox validate[required, Email]" 
                              data-defaultvalue="" 
                              autoComplete="section-input_4 email" 
                              style={{width: '310px'}} 
                              size={310} 
                              data-component="email" 
                              aria-labelledby="label_4" 
                              required 
                              defaultValue="" 
                            />
                          </div>
                        </li>
                        <li className="form-line" data-type="control_button" id="id_2">
                          <div id="cid_2" className="form-input-wide" data-layout="full">
                            <div data-align="center" className="form-buttons-wrapper form-buttons-center jsTest-button-wrapperField">
                              <button 
                                id="input_2" 
                                type="submit" 
                                className="form-submit-button submit-button jf-form-buttons jsTest-submitField legacy-submit" 
                                data-component="button" 
                                data-content=""
                              >
                                Submit
                              </button>
                            </div>
                          </div>
                        </li>
                      </ul>
                    </div>
                  </form>
                </div>

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
