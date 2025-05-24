
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

            {/* Call to Action with Jotform */}
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

                {/* Jotform Scripts and Styles */}
                <div dangerouslySetInnerHTML={{
                  __html: `
                    <script>window.enableEventObserver=true</script>
                    <script src="https://cdn.jotfor.ms/static/prototype.forms.js?v=3.3.63224" type="text/javascript"></script>
                    <script src="https://cdn.jotfor.ms/static/jotform.forms.js?v=3.3.63224" type="text/javascript"></script>
                    <script src="https://cdn.jotfor.ms/js/punycode-1.4.1.min.js?v=3.3.63224" type="text/javascript" defer></script>
                    <script src="https://cdn.jotfor.ms/s/umd/264fc3e16c7/for-widgets-server.js" type="text/javascript"></script>
                    <script src="https://cdn.jotfor.ms/s/umd/264fc3e16c7/for-form-branding-footer.js" type="text/javascript" defer></script>
                    <script src="https://cdn.jotfor.ms/js/vendor/smoothscroll.min.js?v=3.3.63224" type="text/javascript"></script>
                    <script src="https://cdn.jotfor.ms/js/errorNavigation.js?v=3.3.63224" type="text/javascript"></script>
                    <link type="text/css" rel="stylesheet" href="https://cdn.jotfor.ms/stylebuilder/static/form-common.css?v=421d4e0"/>
                    <link type="text/css" rel="stylesheet" href="https://cdn.jotfor.ms/themes/CSS/5e6b428acc8c4e222d1beb91.css?v=3.3.63224&themeRevisionID=5f30e2a790832f3e96009402"/>
                    <link type="text/css" rel="stylesheet" href="https://cdn.jotfor.ms/css/styles/payment/payment_styles.css?3.3.63224" />
                    <link type="text/css" rel="stylesheet" href="https://cdn.jotfor.ms/css/styles/payment/payment_feature.css?3.3.63224" />
                    
                    <style type="text/css">
                      @media print{*{-webkit-print-color-adjust: exact !important;color-adjust: exact !important;}.form-section{display:inline!important}.form-pagebreak{display:none!important}.form-section-closed{height:auto!important}.page-section{position:initial!important}}
                      
                      .form-label.form-label-auto {
                        display: inline-block;
                        float: left;
                        text-align: left;
                      }
                      
                      /* Custom branding styles to match Clearfund AI */
                      .jotform-form {
                        background: transparent !important;
                        border: none !important;
                        box-shadow: none !important;
                      }
                      
                      .form-header {
                        color: #1e3a8a !important;
                        font-family: 'Poppins', sans-serif !important;
                        font-weight: 700 !important;
                        font-size: 2rem !important;
                        text-align: center !important;
                      }
                      
                      .form-textbox {
                        border: 2px solid #e5e7eb !important;
                        border-radius: 0.75rem !important;
                        padding: 0.75rem 1rem !important;
                        font-size: 1rem !important;
                        transition: all 0.3s ease !important;
                        background: white !important;
                      }
                      
                      .form-textbox:focus {
                        border-color: #3b82f6 !important;
                        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1) !important;
                        outline: none !important;
                      }
                      
                      .form-submit-button {
                        background: linear-gradient(135deg, #3b82f6 0%, #1e3a8a 100%) !important;
                        color: white !important;
                        border: none !important;
                        border-radius: 0.75rem !important;
                        padding: 0.875rem 2rem !important;
                        font-size: 1.125rem !important;
                        font-weight: 600 !important;
                        cursor: pointer !important;
                        transition: all 0.3s ease !important;
                        text-transform: none !important;
                        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05) !important;
                      }
                      
                      .form-submit-button:hover {
                        background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%) !important;
                        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
                        transform: translateY(-1px) !important;
                      }
                      
                      .form-label {
                        color: #374151 !important;
                        font-weight: 500 !important;
                        margin-bottom: 0.5rem !important;
                        font-size: 1rem !important;
                      }
                      
                      .form-required {
                        color: #ef4444 !important;
                      }
                      
                      .form-all {
                        background: transparent !important;
                      }
                      
                      .divider {
                        border-color: #e5e7eb !important;
                        margin: 1.5rem 0 !important;
                      }
                      
                      .h-captcha {
                        margin: 1rem auto !important;
                        display: flex !important;
                        justify-content: center !important;
                      }
                    </style>
                    
                    <script type="text/javascript">
                      JotForm.newDefaultTheme = true;
                      JotForm.extendsNewTheme = false;
                      JotForm.singleProduct = false;
                      JotForm.newPaymentUIForNewCreatedForms = false;
                      JotForm.texts = {"confirmEmail":"E-mail does not match","pleaseWait":"Please wait...","validateEmail":"You need to validate this e-mail","confirmClearForm":"Are you sure you want to clear the form","lessThan":"Your score should be less than or equal to","incompleteFields":"There are incomplete required fields. Please complete them.","required":"This field is required.","requireOne":"At least one field required.","requireEveryRow":"Every row is required.","requireEveryCell":"Every cell is required.","email":"Enter a valid e-mail address","alphabetic":"This field can only contain letters","numeric":"This field can only contain numeric values","alphanumeric":"This field can only contain letters and numbers.","cyrillic":"This field can only contain cyrillic characters","url":"This field can only contain a valid URL","currency":"This field can only contain currency values.","fillMask":"Field value must fill mask.","uploadExtensions":"You can only upload following files:","noUploadExtensions":"File has no extension file type (e.g. .txt, .png, .jpeg)","uploadFilesize":"File size cannot be bigger than:","uploadFilesizemin":"File size cannot be smaller than:","gradingScoreError":"Score total should only be less than or equal to","inputCarretErrorA":"Input should not be less than the minimum value:","inputCarretErrorB":"Input should not be greater than the maximum value:","maxDigitsError":"The maximum digits allowed is","minCharactersError":"The number of characters should not be less than the minimum value:","maxCharactersError":"The number of characters should not be more than the maximum value:","freeEmailError":"Free email accounts are not allowed","minSelectionsError":"The minimum required number of selections is ","maxSelectionsError":"The maximum number of selections allowed is ","pastDatesDisallowed":"Date must not be in the past.","dateLimited":"This date is unavailable.","dateInvalid":"This date is not valid. The date format is {format}","dateInvalidSeparate":"This date is not valid. Enter a valid {element}.","ageVerificationError":"You must be older than {minAge} years old to submit this form.","multipleFileUploads_typeError":"{file} has invalid extension. Only {extensions} are allowed.","multipleFileUploads_sizeError":"{file} is too large, maximum file size is {sizeLimit}.","multipleFileUploads_minSizeError":"{file} is too small, minimum file size is {minSizeLimit}.","multipleFileUploads_emptyError":"{file} is empty, please select files again without it.","multipleFileUploads_uploadFailed":"File upload failed, please remove it and upload the file again.","multipleFileUploads_onLeave":"The files are being uploaded, if you leave now the upload will be cancelled.","multipleFileUploads_fileLimitError":"Only {fileLimit} file uploads allowed.","dragAndDropFilesHere_infoMessage":"Drag and drop files here","chooseAFile_infoMessage":"Choose a file","maxFileSize_infoMessage":"Max. file size","generalError":"There are errors on the form. Please fix them before continuing.","generalPageError":"There are errors on this page. Please fix them before continuing.","wordLimitError":"Too many words. The limit is","wordMinLimitError":"Too few words.  The minimum is","characterLimitError":"Too many Characters.  The limit is","characterMinLimitError":"Too few characters. The minimum is","ccInvalidNumber":"Credit Card Number is invalid.","ccInvalidCVC":"CVC number is invalid.","ccInvalidExpireDate":"Expire date is invalid.","ccInvalidExpireMonth":"Expiration month is invalid.","ccInvalidExpireYear":"Expiration year is invalid.","ccMissingDetails":"Please fill up the credit card details.","ccMissingProduct":"Please select at least one product.","ccMissingDonation":"Please enter numeric values for donation amount.","disallowDecimals":"Please enter a whole number.","restrictedDomain":"This domain is not allowed","ccDonationMinLimitError":"Minimum amount is {minAmount} {currency}","requiredLegend":"All fields marked with * are required and must be filled.","geoPermissionTitle":"Permission Denied","geoPermissionDesc":"Check your browser's privacy settings.","geoNotAvailableTitle":"Position Unavailable","geoNotAvailableDesc":"Location provider not available. Please enter the address manually.","geoTimeoutTitle":"Timeout","geoTimeoutDesc":"Please check your internet connection and try again.","selectedTime":"Selected Time","formerSelectedTime":"Former Time","cancelAppointment":"Cancel Appointment","cancelSelection":"Cancel Selection","noSlotsAvailable":"No slots available","slotUnavailable":"{time} on {date} has been selected is unavailable. Please select another slot.","multipleError":"There are {count} errors on this page. Please correct them before moving on.","oneError":"There is {count} error on this page. Please correct it before moving on.","doneMessage":"Well done! All errors are fixed.","invalidTime":"Enter a valid time","doneButton":"Done","reviewSubmitText":"Review and Submit","nextButtonText":"Next","prevButtonText":"Previous","seeErrorsButton":"See Errors","notEnoughStock":"Not enough stock for the current selection","notEnoughStock_remainedItems":"Not enough stock for the current selection ({count} items left)","soldOut":"Sold Out","justSoldOut":"Just Sold Out","selectionSoldOut":"Selection Sold Out","subProductItemsLeft":"({count} items left)","startButtonText":"START","submitButtonText":"Submit","submissionLimit":"Sorry! Only one entry is allowed. <br> Multiple submissions are disabled for this form.","reviewBackText":"Back to Form","seeAllText":"See All","progressMiddleText":"of","fieldError":"field has an error.","error":"Error"};
                      JotForm.newPaymentUI = true;
                      JotForm.originalLanguage = "en";
                      JotForm.isFormViewTrackingAllowed = true;
                      JotForm.replaceTagTest = true;
                      JotForm.uploadServerURL = "https://upload.jotform.com/upload";
                      JotForm.clearFieldOnHide="disable";
                      JotForm.submitError="jumpToFirstError";
                      window.addEventListener('DOMContentLoaded',function(){window.brandingFooter.init({"formID":251428125592154,"campaign":"powered_by_jotform_le","isCardForm":false,"isLegacyForm":true,"formLanguage":"en"})});
                      JotForm.isFullSource = true;

                      try{
                        function isTrackingProhibited() {
                          try {
                            var isEUDomain = /(?:eu.jotform)|(?:jotformeu.com)/.test(window.location.host);
                            var isHipaaDomain = /(?:hipaa.jotform)/.test(window.location.host);
                            var isProhibitedParameterExists = /(?:wfTaskID|PCI_preSubmitRequest|wfTaskType)/.test(window.location.search);
                            var isEditMode = JotForm.isEditMode();
                            var isTrackingProhibited = isEUDomain || isHipaaDomain || isProhibitedParameterExists || isEditMode;
                            return isTrackingProhibited;
                          } catch (e) {
                            console.log(e);
                            return true;
                          }
                        }
                        if (!isTrackingProhibited()) {
                          var sesApiUrl = /jotform.pro/.test(window.location.host) ? '/API' : 'https://api.jotform.com';
                          function sendOpenId(uuid, eventType) {
                            navigator.sendBeacon(sesApiUrl + '/form/' + 251428125592154 + '/event/' + uuid + '/' + eventType, {});
                          }
                          var formOpenId = '';
                          if (window.crypto) {
                            formOpenId = window.crypto.getRandomValues(new BigUint64Array(1)).toString();
                          } else {
                            formOpenId = (Math.random() * 16).toString(16).slice(2);
                          }
                          sendOpenId = sendOpenId.bind(this, formOpenId);
                          function sendOpenIdOnSubmit() {
                            var currentForm = document.getElementById('251428125592154');
                            if (currentForm) {
                              currentForm.addEventListener('submit', function() { sendOpenId('clientSubmitClick_V5'); });
                              var openIdInput = currentForm.querySelector('[name="formOpenId_V5"]');
                              if (!openIdInput) {
                                openIdInput = document.createElement('input');
                                openIdInput.setAttribute('type', 'hidden');
                                openIdInput.setAttribute('name', 'formOpenId_V5');
                                currentForm.appendChild(openIdInput);
                              }
                              openIdInput.value = formOpenId;
                            }
                          }
                          sendOpenId('clientFormView_V5');
                          if (document.readyState == 'complete') {
                              sendOpenIdOnSubmit();
                          } else {
                              document.addEventListener('DOMContentLoaded', sendOpenIdOnSubmit);
                          }
                        }
                      } catch(openIdBlockError) {
                        console.log(openIdBlockError);
                      }

                      JotForm.init(function(){
                        JotForm.alterTexts(undefined);
                      });

                      setTimeout(function() {
                        JotForm.paymentExtrasOnTheFly([null,{"name":"heading","qid":"1","text":"Newsletter","type":"control_head"},{"name":"submit2","qid":"2","text":"Submit","type":"control_button"},null,{"name":"email","qid":"4","text":"E-mail","type":"control_email"},null,null,{"description":"","name":"pleaseVerify","qid":"7","text":"Please verify that you are human","type":"control_captcha"},null,{"name":"divider","qid":"9","text":"Divider","type":"control_divider"},null,null,null,null,null,null,null,{"name":"typeA","qid":"17","text":"Get Page URL","type":"control_widget"}]);
                      }, 20);
                    </script>
                  `
                }} />

                {/* Jotform HTML */}
                <form 
                  className="jotform-form" 
                  onSubmit={() => typeof testSubmitFunction !== 'undefined' && testSubmitFunction()}
                  action="https://submit.jotform.com/submit/251428125592154" 
                  method="post" 
                  name="form_251428125592154" 
                  id="251428125592154" 
                  acceptCharset="utf-8" 
                  autoComplete="on"
                >
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
                      
                      <li className="form-line" data-type="control_divider" id="id_9">
                        <div id="cid_9" className="form-input-wide" data-layout="full">
                          <div 
                            className="divider" 
                            data-component="divider" 
                            style={{
                              borderBottomWidth: '1px',
                              borderBottomStyle: 'solid',
                              borderColor: '#e6e6e6',
                              height: '1px',
                              marginLeft: '0px',
                              marginRight: '0px',
                              marginTop: '5px',
                              marginBottom: '5px'
                            }}
                          />
                        </div>
                      </li>
                      
                      <li className="form-line jf-required" data-type="control_captcha" id="id_7">
                        <label className="form-label form-label-left form-label-auto" id="label_7" htmlFor="input_7" aria-hidden="false">
                          Please verify that you are human<span className="form-required">*</span>
                        </label>
                        <div id="cid_7" className="form-input jf-required" data-layout="full">
                          <section data-wrapper-react="true">
                            <div 
                              id="hcaptcha_input_7" 
                              className="h-captcha" 
                              data-sitekey="772f4a50-7161-425e-8cd5-4d7e361ab765" 
                              data-callback="hcaptchaCallbackinput_7" 
                              data-expired-callback="hcaptchaExpiredCallbackinput_7"
                            />
                            <input 
                              type="hidden" 
                              id="input_7" 
                              className="hidden validate[required]" 
                              name="hcaptcha_visible" 
                              required 
                            />
                            <script 
                              type="text/javascript" 
                              src="https://hcaptcha.com/1/api.js"
                            />
                            <script 
                              type="text/javascript"
                              dangerouslySetInnerHTML={{
                                __html: `
                                  var hcaptchaCallbackinput_7 = function(token) {
                                    var hiddenInput = document.getElementById("input_7");
                                    if (hiddenInput) {
                                      hiddenInput.value = 1;
                                      if (hiddenInput.validateInput) {
                                        hiddenInput.validateInput();
                                      }
                                    }
                                  }

                                  var hcaptchaExpiredCallbackinput_7 = function() {
                                    var hiddenInput = document.getElementById("input_7");
                                    if (hiddenInput) {
                                      hiddenInput.value = false;
                                      if (hiddenInput.validateInput) {
                                        hiddenInput.validateInput();
                                      }
                                    }
                                  }
                                `
                              }}
                            />
                          </section>
                        </div>
                      </li>
                      
                      <li className="form-line" data-type="control_widget" id="id_17">
                        <div id="cid_17" className="form-input" data-layout="full">
                          <div style={{width: '100%', textAlign: 'left'}} data-component="widget-directEmbed">
                            <div className="direct-embed-widgets get-form-page-url-widget" data-type="direct-embed" style={{width: '1px', minHeight: '50px'}}>
                              <input 
                                type="hidden" 
                                id="input_17" 
                                name="q17_typeA" 
                                className="form-hidden getParentURL" 
                              />
                              <script 
                                type="text/javascript" 
                                src="//widgets.jotform.io/getParentUrl/min/scripts.min.js"
                              />
                            </div>
                          </div>
                        </div>
                      </li>
                      
                      <li style={{display: 'none'}}>
                        Should be Empty: <input type="text" name="website" defaultValue="" type="hidden" />
                      </li>
                    </ul>
                  </div>
                  
                  <input type="hidden" className="simple_spc" id="simple_spc" name="simple_spc" value="251428125592154" />
                </form>

                <script 
                  type="text/javascript"
                  dangerouslySetInnerHTML={{
                    __html: `
                      JotForm.showJotFormPowered = "new_footer";
                      JotForm.poweredByText = "Powered by Jotform";
                      JotForm.ownerView = true;
                      JotForm.isNewSACL = true;
                      
                      var all_spc = document.querySelectorAll("form[id='251428125592154'] .simple_spc");
                      for (var i = 0; i < all_spc.length; i++) {
                        all_spc[i].value = "251428125592154-251428125592154";
                      }
                    `
                  }}
                />

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
