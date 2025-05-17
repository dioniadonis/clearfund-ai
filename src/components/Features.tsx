
import React from 'react';
import { MessageCircle, DollarSign, CreditCard, FileText } from 'lucide-react';

const Features: React.FC = () => {
  const featureItems = [
    {
      icon: <MessageCircle className="h-10 w-10 text-bluevine-accent" />,
      title: "AI-Powered Conversations",
      description: "Get instant answers to your loan questions and personalized financial advice tailored to your business needs."
    },
    {
      icon: <DollarSign className="h-10 w-10 text-bluevine-accent" />,
      title: "Fast Financing Solutions",
      description: "Access lines of credit, term loans, and invoice factoring with quick approvals and funding as fast as 24 hours."
    },
    {
      icon: <CreditCard className="h-10 w-10 text-bluevine-accent" />,
      title: "Flexible Repayment Options",
      description: "Choose payment schedules that work with your cash flow to better manage your business finances."
    },
    {
      icon: <FileText className="h-10 w-10 text-bluevine-accent" />,
      title: "Simplified Application Process",
      description: "Our AI guides you through a streamlined application process with minimal paperwork and fast decisions."
    }
  ];

  return (
    <section id="features" className="py-16 md:py-24 bg-white">
      <div className="container-custom">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-bluevine-dark-blue mb-4">Solutions Built for Small Businesses</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Our AI-powered platform provides tailored financing solutions to help you manage cash flow, cover expenses, and grow your business.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {featureItems.map((item, index) => (
            <div 
              key={index} 
              className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="bg-bluevine-pale-blue w-16 h-16 rounded-full flex items-center justify-center mb-4">
                {item.icon}
              </div>
              <h3 className="text-xl font-semibold text-bluevine-dark-blue mb-3">{item.title}</h3>
              <p className="text-gray-600">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
