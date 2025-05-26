
import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow py-16 bg-white">
        <div className="container-custom max-w-4xl">
          <h1 className="text-4xl font-bold text-clearfund-dark-blue mb-8">Privacy Policy</h1>
          <p className="text-sm text-gray-600 mb-8">Last Updated: January 2025</p>
          
          <div className="space-y-8 text-gray-700">
            <section>
              <h2 className="text-2xl font-semibold text-clearfund-dark-blue mb-4">About ClearFund AI</h2>
              <p className="mb-4">
                ClearFund AI ("we," "our," or "us") is a business funding broker operating in Florida, USA. 
                We are not a direct lender or funder. Instead, we connect businesses with appropriate funding 
                partners including MCA providers, equipment financiers, business lenders, and credit repair services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-clearfund-dark-blue mb-4">Information We Collect</h2>
              <p className="mb-4">We collect information necessary to match you with appropriate funding partners:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Business information (name, industry, years in operation, legal structure)</li>
                <li>Financial data (revenue, bank statements, cash flow information)</li>
                <li>Equipment details (for equipment financing requests)</li>
                <li>Contact information (name, phone, email, business address)</li>
                <li>Credit information and reports (with your consent)</li>
                <li>Website usage data through cookies and analytics</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-clearfund-dark-blue mb-4">How We Use Your Information</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Match you with appropriate funding partners and products</li>
                <li>Facilitate underwriting and approval processes</li>
                <li>Provide customer service and support</li>
                <li>Send marketing communications about relevant funding opportunities</li>
                <li>Comply with legal and regulatory requirements</li>
                <li>Improve our services and website functionality</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-clearfund-dark-blue mb-4">Information Sharing</h2>
              <p className="mb-4">We share your information with:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>MCA providers and funding partners for loan evaluation</li>
                <li>Equipment financing companies for equipment loans</li>
                <li>Traditional business lenders and banks</li>
                <li>Underwriting services and credit bureaus</li>
                <li>Credit repair partners (affiliate relationships)</li>
                <li>Service providers who assist with our operations</li>
                <li>Legal authorities when required by law</li>
              </ul>
              <p className="mt-4 font-semibold">
                Disclosure: We may receive commissions from funding partners and affiliate partners 
                when you are approved for their services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-clearfund-dark-blue mb-4">Your Rights</h2>
              <p className="mb-4">You have the right to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Access the personal information we have about you</li>
                <li>Request correction of inaccurate information</li>
                <li>Request deletion of your information (subject to legal requirements)</li>
                <li>Opt-out of marketing communications</li>
                <li>Withdraw consent for information sharing</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-clearfund-dark-blue mb-4">Cookies and Tracking</h2>
              <p className="mb-4">
                We use cookies and similar technologies to improve website functionality, analyze usage, 
                and provide personalized experiences. You can control cookie settings through your browser.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-clearfund-dark-blue mb-4">Data Security</h2>
              <p className="mb-4">
                We implement appropriate technical and organizational measures to protect your information 
                against unauthorized access, alteration, disclosure, or destruction. However, no internet 
                transmission is completely secure.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-clearfund-dark-blue mb-4">Florida Privacy Compliance</h2>
              <p className="mb-4">
                This privacy policy complies with applicable Florida privacy laws and regulations. 
                For Florida-specific privacy rights, please contact us using the information below.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-clearfund-dark-blue mb-4">Contact Us</h2>
              <p className="mb-4">For privacy-related questions or requests, contact us at:</p>
              <div className="bg-clearfund-pale-blue p-4 rounded-lg">
                <p>Email: info@clearfundai.com</p>
                <p>Phone: 954-579-0021</p>
                <p>Address: ClearFund AI Privacy Department, Florida, USA</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-clearfund-dark-blue mb-4">Changes to This Policy</h2>
              <p>
                We may update this privacy policy periodically. Changes will be posted on this page 
                with an updated effective date. Continued use of our services constitutes acceptance 
                of any changes.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
