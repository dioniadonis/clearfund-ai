
import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const Disclaimers: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow py-16 bg-white">
        <div className="container-custom max-w-4xl">
          <h1 className="text-4xl font-bold text-clearfund-dark-blue mb-8">Disclaimers</h1>
          <p className="text-sm text-gray-600 mb-8">Last Updated: January 2025</p>
          
          <div className="space-y-8 text-gray-700">
            <section>
              <h2 className="text-2xl font-semibold text-clearfund-dark-blue mb-4">General Disclaimers</h2>
              <div className="bg-red-50 border border-red-200 p-6 rounded-lg">
                <p className="font-semibold text-red-800 mb-4">Important Notice</p>
                <p className="text-red-700">
                  The information provided on this website is for general informational purposes only. 
                  It does not constitute financial, legal, or professional advice. Individual results may vary.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-clearfund-dark-blue mb-4">Funding Disclaimers</h2>
              <ul className="list-disc pl-6 space-y-4">
                <li>
                  <strong>No Guarantee of Approval:</strong> ClearFund AI does not guarantee funding approval. 
                  All funding decisions are made by third-party providers based on their own criteria.
                </li>
                <li>
                  <strong>Subject to Provider Approval:</strong> All funding offers are subject to final 
                  approval by funding partners and completion of their verification processes.
                </li>
                <li>
                  <strong>Terms May Vary:</strong> Funding terms, rates, and payment schedules are 
                  determined by funding providers and may differ from initial estimates.
                </li>
                <li>
                  <strong>Processing Times:</strong> While we aim for quick processing, actual funding 
                  times depend on funding partner processes and bank verification requirements.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-clearfund-dark-blue mb-4">Credit Repair Disclaimers</h2>
              <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg mb-4">
                <p className="font-semibold text-blue-800 mb-2">Third-Party Services</p>
                <p className="text-blue-700">
                  Credit repair services are provided by licensed third-party partners. 
                  ClearFund AI is an affiliate and receives commissions for referrals.
                </p>
              </div>
              <ul className="list-disc pl-6 space-y-2">
                <li>Individual results vary and are not guaranteed</li>
                <li>Success rates are based on partner data and historical performance</li>
                <li>Credit score improvements depend on individual credit situations</li>
                <li>Typical timeframes may vary based on complexity of credit issues</li>
                <li>You have the right to dispute credit issues directly with credit bureaus</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-clearfund-dark-blue mb-4">Financial Product Disclaimers</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-clearfund-blue mb-2">Merchant Cash Advances</h3>
                  <p className="text-sm text-gray-600">
                    MCAs involve daily/weekly payments based on future receivables. Factor rates 
                    apply, not interest rates. Early repayment may not reduce total cost.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-clearfund-blue mb-2">Equipment Financing</h3>
                  <p className="text-sm text-gray-600">
                    Equipment may serve as collateral. Terms vary by equipment type and provider. 
                    Default may result in equipment repossession.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-clearfund-blue mb-2">Business Loans</h3>
                  <p className="text-sm text-gray-600">
                    Interest rates and terms are set by lenders. Personal guarantees may be required. 
                    Default may affect personal and business credit.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-clearfund-dark-blue mb-4">Website and Technology Disclaimers</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Website information is subject to change without notice</li>
                <li>Technical issues may occasionally affect service availability</li>
                <li>Third-party links are provided for convenience and are not endorsed</li>
                <li>Security measures are in place but cannot guarantee complete protection</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-clearfund-dark-blue mb-4">Regulatory Compliance</h2>
              <p className="mb-4">
                ClearFund AI operates in compliance with applicable federal and state regulations. 
                We encourage you to:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Read all funding agreements carefully before signing</li>
                <li>Understand the terms and costs of any funding product</li>
                <li>Consult with financial or legal advisors when appropriate</li>
                <li>Report any concerns to appropriate regulatory authorities</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-clearfund-dark-blue mb-4">Limitation of Liability</h2>
              <p className="mb-4">
                ClearFund AI's liability is limited to the maximum extent permitted by law. 
                We are not responsible for funding partner decisions, changes in terms, 
                or outcomes of credit repair services.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Disclaimers;
