import React from 'react';

const PARTNERS = ['David Allen Capital', 'ROK Financial'];

const FundingPartners: React.FC = () => (
  <section aria-labelledby="funding-partners-heading" className="py-12 bg-clearfund-pale-blue">
    <div className="container-custom text-center">
      <h2 id="funding-partners-heading" className="text-sm font-semibold uppercase tracking-widest text-clearfund-dark-blue">
        Our Funding Partners
      </h2>
      <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
        {PARTNERS.map((name) => (
          <li key={name} className="text-lg font-semibold text-clearfund-dark-blue">
            {name}
          </li>
        ))}
      </ul>
      <p className="mt-6 mx-auto max-w-2xl text-sm text-gray-600">
        We may connect applicants with select funding providers. Approval, terms, and availability are determined
        by the provider. ClearFund AI may receive compensation for referrals.
      </p>
    </div>
  </section>
);

export default FundingPartners;
