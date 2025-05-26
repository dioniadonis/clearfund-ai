
import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const BrokerDisclosure: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow py-16 bg-white">
        <div className="container-custom max-w-4xl">
          <h1 className="text-4xl font-bold text-clearfund-dark-blue mb-8">Broker Disclosure</h1>
          <p className="text-sm text-gray-600 mb-8">Last Updated: January 2025</p>
          
          <div className="space-y-8 text-gray-700">
            <section>
              <h2 className="text-2xl font-semibold text-clearfund-dark-blue mb-4">Important Broker Disclosure</h2>
              <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-lg">
                <p className="font-semibold text-yellow-800 mb-4">
                  ClearFund AI is a business funding broker, not a direct lender or funding provider.
                </p>
                <p className="text-yellow-700">
                  We connect businesses with third-party funding partners and receive commissions 
                  for successful referrals. We do not make funding decisions or set terms and rates.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-clearfund-dark-blue mb-4">Our Role as a Broker</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>We evaluate your funding needs and business profile</li>
                <li>We match you with appropriate funding partners from our network</li>
                <li>We facilitate introductions and application processes</li>
                <li>We provide guidance throughout the funding process</li>
                <li>We do not make final approval decisions</li>
                <li>We do not set interest rates, factor rates, or payment terms</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-clearfund-dark-blue mb-4">Commission Structure</h2>
              <p className="mb-4">
                ClearFund AI receives compensation from funding partners when you are successfully 
                funded. This compensation structure:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Does not affect the rates or terms offered to you</li>
                <li>Does not cost you additional fees</li>
                <li>Allows us to provide our broker services at no direct cost to you</li>
                <li>May vary by funding partner and product type</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-clearfund-dark-blue mb-4">Funding Partner Network</h2>
              <p className="mb-4">We work with various types of funding providers:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Merchant Cash Advance (MCA) providers</li>
                <li>Equipment financing companies</li>
                <li>Traditional business lenders</li>
                <li>Alternative lending platforms</li>
                <li>Credit repair service providers (affiliate relationships)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-clearfund-dark-blue mb-4">Your Rights as a Customer</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>You are not obligated to accept any funding offer</li>
                <li>You can work directly with funding providers if you choose</li>
                <li>You have the right to compare offers from multiple sources</li>
                <li>You can request information about our commission structure</li>
                <li>You can withdraw from the process at any time</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-clearfund-dark-blue mb-4">Florida Compliance</h2>
              <p className="mb-4">
                ClearFund AI operates in compliance with Florida business laws and regulations. 
                We are not required to hold a lending license as we do not directly provide funds 
                or make lending decisions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-clearfund-dark-blue mb-4">Contact Us</h2>
              <p className="mb-4">
                If you have questions about our broker services or commission structure:
              </p>
              <div className="bg-clearfund-pale-blue p-4 rounded-lg">
                <p>Email: info@clearfundai.com</p>
                <p>Phone: 954-579-0021</p>
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default BrokerDisclosure;
