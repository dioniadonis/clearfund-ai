
import React from 'react';
import ChatInterface from './ChatInterface';

const AIChat: React.FC = () => {
  return (
    <section id="ai-chat" className="py-16 md:py-24 bg-gradient-to-b from-white to-clearfund-pale-blue relative">
      <div className="absolute inset-0 bg-opacity-50 pointer-events-none"></div>
      <div className="container-custom relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-clearfund-dark-blue mb-4">Get Personalized Funding Advice</h2>
          <p className="text-lg text-gray-700 max-w-2xl mx-auto">
            Our AI advisor can answer your questions about business loans, lines of credit, equity financing, and other options to help you make informed decisions.
          </p>
        </div>
        
        <div className="max-w-4xl mx-auto h-[600px] shadow-xl rounded-xl overflow-hidden">
          <ChatInterface />
        </div>
      </div>
    </section>
  );
};

export default AIChat;
