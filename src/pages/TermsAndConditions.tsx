
import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const TermsAndConditions: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow py-16 bg-white">
        <div className="container-custom max-w-4xl">
          <h1 className="text-4xl font-bold text-clearfund-dark-blue mb-8">Terms and Conditions</h1>
          <p className="text-sm text-gray-600 mb-8">Last Updated: January 2025</p>
          
          <div className="space-y-8 text-gray-700">
            <section>
              <h2 className="text-2xl font-semibold text-clearfund-dark-blue mb-4">Service Description</h2>
              <p className="mb-4">
                ClearFund AI provides business funding brokerage and affiliate marketing services. 
                We are not a direct lender, MCA provider, or funding company. We connect businesses 
                with appropriate funding partners and may receive commissions for successful referrals.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-clearfund-dark-blue mb-4">Funding Product Types</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-clearfund-blue mb-2">Merchant Cash Advances (MCAs)</h3>
                  <p>MCAs are purchases of future receivables, not loans. They involve daily or weekly payments and factor rates, not interest rates.</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-clearfund-blue mb-2">Equipment Financing</h3>
                  <p>Terms vary by provider and may require equipment as collateral. Interest rates and payment terms vary.</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-clearfund-blue mb-2">Traditional Business Loans</h3>
                  <p>Traditional loans have interest rates and fixed payment terms as determined by the lender.</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-clearfund-blue mb-2">Credit Repair Services</h3>
                  <p>Credit repair services are provided by licensed third-party partners. ClearFund AI acts as an affiliate and receives commissions for referrals.</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-clearfund-dark-blue mb-4">User Eligibility and Requirements</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>You must be at least 18 years old and legally authorized to enter contracts</li>
                <li>You must be a business owner or authorized representative</li>
                <li>You must provide accurate and complete information</li>
                <li>Your business must meet minimum requirements set by funding partners</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-clearfund-dark-blue mb-4">No Guarantee of Approval</h2>
              <p className="mb-4">
                ClearFund AI does not guarantee funding approval. All funding decisions are made by 
                third-party providers based on their own underwriting criteria. We make no representations 
                about approval likelihood or funding terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-clearfund-dark-blue mb-4">Commission Disclosure</h2>
              <p className="mb-4">
                We receive commissions from funding partners and affiliate partners when you are 
                approved for their services. This compensation does not affect the terms or rates 
                offered to you by the funding providers.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-clearfund-dark-blue mb-4">Accurate Information Requirement</h2>
              <p className="mb-4">
                You agree to provide accurate, complete, and current information. Providing false 
                or misleading information may result in disqualification from funding opportunities 
                and termination of services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-clearfund-dark-blue mb-4">Intellectual Property</h2>
              <p className="mb-4">
                All content, trademarks, and intellectual property on this website are owned by 
                ClearFund AI or licensed to us. You may not use our intellectual property without 
                express written permission.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-clearfund-dark-blue mb-4">Limitation of Liability</h2>
              <p className="mb-4">
                ClearFund AI's liability is limited to the maximum extent permitted by law. We are 
                not liable for decisions made by funding partners, changes in funding terms, or 
                indirect damages resulting from our services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-clearfund-dark-blue mb-4">Indemnification</h2>
              <p className="mb-4">
                You agree to indemnify and hold harmless ClearFund AI from claims arising from your 
                use of our services, violation of these terms, or infringement of third-party rights.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-clearfund-dark-blue mb-4">Electronic Communications</h2>
              <p className="mb-4">
                By using our services and providing your contact information, you consent to receive
                communications from ClearFund AI and our select funding partners regarding your funding inquiry.
                You may receive emails (with opt-out options), phone calls (including automated systems), and if you opt-in, text messages.
                Standard message and data rates may apply. Consent is not a condition of purchase. You may opt out at any time.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-clearfund-dark-blue mb-4">Dispute Resolution and Governing Law</h2>
              <p className="mb-4">
                These terms are governed by the laws of the State of Florida. Any disputes will be 
                resolved in the appropriate courts of Florida. You agree to Florida jurisdiction 
                for all legal matters related to these terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-clearfund-dark-blue mb-4">Termination</h2>
              <p className="mb-4">
                Either party may terminate the service relationship at any time. ClearFund AI 
                reserves the right to terminate services for violation of these terms or for any reason.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-clearfund-dark-blue mb-4">Changes to Terms</h2>
              <p className="mb-4">
                We may modify these terms at any time. Changes will be posted on this page with 
                an updated effective date. Continued use constitutes acceptance of modified terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-clearfund-dark-blue mb-4">Contact Information</h2>
              <div className="bg-clearfund-pale-blue p-4 rounded-lg">
                <p>For questions about these terms:</p>
                <p>Email: info@clearfundai.com</p>
                <p>Phone: 954-579-0021</p>
                <p>Address: ClearFund AI Legal Department, Florida, USA</p>
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TermsAndConditions;
