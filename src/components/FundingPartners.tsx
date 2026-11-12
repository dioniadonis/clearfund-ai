import React from "react";

const FundingPartners: React.FC = () => (
  <section aria-labelledby="funding-partners-heading" className="bg-clearfund-pale-blue py-12">
    <div className="container-custom text-center">
      <h2 id="funding-partners-heading" className="text-sm font-semibold uppercase tracking-widest text-clearfund-dark-blue">
        Our Funding Partners
      </h2>
      <p className="mt-6 text-lg font-semibold text-clearfund-dark-blue">
        We work with a network of funding providers.
      </p>
      <p className="mx-auto mt-6 max-w-2xl text-sm text-gray-600">
        We may connect applicants with select funding providers. Approval, terms, and availability are determined
        by the provider. ClearFund AI may receive compensation for referrals.
      </p>
    </div>
  </section>
);

export default FundingPartners;
