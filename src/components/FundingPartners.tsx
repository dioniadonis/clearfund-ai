import React, { useEffect, useRef } from 'react';
import { ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

const TRUSTBOX_TEMPLATE_ID = '54ad5defc6454f065c28af8b';
const ROK_BUSINESS_UNIT_ID = '600eda90fa1950000114a333';

const FundingPartners: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = sectionRef.current;
    if (!root) return;
    let timer: number | undefined;
    const hydrate = () => {
      const tp = (window as any).Trustpilot;
      if (!tp?.loadFromElement) return false;
      root.querySelectorAll('.trustpilot-widget').forEach((el) => tp.loadFromElement(el, true));
      return true;
    };
    if (hydrate()) return;
    timer = window.setInterval(() => { if (hydrate() && timer) window.clearInterval(timer); }, 300);
    window.setTimeout(() => { if (timer) window.clearInterval(timer); hydrate(); }, 8000);
    return () => { if (timer) window.clearInterval(timer); };
  }, []);

  return (
    <section ref={sectionRef} aria-labelledby="funding-partners-heading" className="py-12 bg-clearfund-pale-blue">
      <div className="container-custom text-center">
        <h2 id="funding-partners-heading" className="text-sm font-semibold uppercase tracking-widest text-clearfund-dark-blue">
          Our Funding Partners
        </h2>
        <p className="mt-6 text-lg font-semibold text-clearfund-dark-blue">
          <Link to="/get-started?cta=fundingpartners_rok" className="hover:underline transition-colors">
            ROK Financial
          </Link>
        </p>
        <div className="mt-6 flex flex-col items-center gap-3">
          <div
            className="trustpilot-widget"
            data-locale="en-US"
            data-template-id={TRUSTBOX_TEMPLATE_ID}
            data-businessunit-id={ROK_BUSINESS_UNIT_ID}
            data-stars="4,5"
            data-style-height="180px"
            data-style-width="320px"
            data-theme="light"
          />
          <a
            href="https://www.trustpilot.com/review/rok.biz"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-gray-600 hover:text-clearfund-dark-blue hover:underline transition-colors"
          >
            ROK Financial reviews on Trustpilot
            <ExternalLink className="h-3 w-3" aria-hidden="true" />
          </a>
        </div>
        <p className="mt-6 mx-auto max-w-2xl text-sm text-gray-600">
          We may connect applicants with select funding providers. Approval, terms, and availability are determined
          by the provider. ClearFund AI may receive compensation for referrals.
        </p>
      </div>
    </section>
  );
};

export default FundingPartners;
