import React, { useEffect, useRef } from 'react';
import { ExternalLink } from 'lucide-react';

const MINI_TEMPLATE_ID = '5419b6a8b0d04a9ceb044c56';

const PARTNERS = [
  {
    name: 'David Allen Capital',
    url: 'https://www.trustpilot.com/review/www.davidallencapital.com',
    businessUnitId: '56a23ef30000ff000587f226',
  },
  {
    name: 'ROK Financial',
    url: 'https://www.trustpilot.com/review/rok.biz',
    businessUnitId: '600eda90fa1950000114a333',
  },
] as const;

const FundingPartners: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = sectionRef.current;
    if (!root) return;
    // The widget script loads async after React renders; ask it to hydrate
    // any widget divs it missed. Poll briefly, then one last check on load.
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
      <ul className="mt-6 flex flex-wrap items-start justify-center gap-x-10 gap-y-4">
        {PARTNERS.map((partner) => (
          <li key={partner.name} className="flex flex-col items-center gap-3">
            <a
              href={partner.url}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="inline-flex items-center gap-1.5 text-lg font-semibold text-clearfund-dark-blue hover:underline transition-colors"
            >
              {partner.name}
              <ExternalLink className="h-4 w-4 text-gray-500" aria-hidden="true" />
            </a>
            <div
              className="trustpilot-widget"
              data-locale="en-US"
              data-template-id={MINI_TEMPLATE_ID}
              data-businessunit-id={partner.businessUnitId}
              data-style-height="48px"
              data-style-width="240px"
              data-theme="light"
            />
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
};

export default FundingPartners;
