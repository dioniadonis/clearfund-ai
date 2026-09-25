import React, { useEffect, useRef } from 'react';
import { ExternalLink } from 'lucide-react';

const TRUSTBOX_TEMPLATE_ID = '54ad5defc6454f065c28af8b'; // Trustpilot Slider widget

const PARTNERS = [
  {
    name: 'David Allen Capital',
    url: 'https://davidallencapital.com/clearfund',
    // No TrustBox access granted to this business unit (Trustpilot returns
    // an error for every widget template) — profile link only.
    businessUnitId: null,
  },
  {
    name: 'ROK Financial',
    url: 'https://go.mypartner.io/business-financing/?ref=0014x00000YEKKUAA5',
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
      <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
        {PARTNERS.map((partner) => (
          <li key={partner.name}>
            <a
              href={partner.url}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="inline-flex items-center gap-1.5 text-lg font-semibold text-clearfund-dark-blue hover:underline transition-colors"
            >
              {partner.name}
              <ExternalLink className="h-4 w-4 text-gray-500" aria-hidden="true" />
            </a>
          </li>
        ))}
      </ul>
      {PARTNERS.some((p) => p.businessUnitId) && (
        <div className="mt-6 flex flex-col items-center gap-3">
          <div
            className="trustpilot-widget"
            data-locale="en-US"
            data-template-id={TRUSTBOX_TEMPLATE_ID}
            data-businessunit-id={(PARTNERS.find((p) => p.businessUnitId) as { businessUnitId: string }).businessUnitId}
            data-style-height="180px"
            data-style-width="320px"
            data-theme="light"
          />
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            {[
              { label: 'ROK Financial reviews on Trustpilot', href: 'https://www.trustpilot.com/review/rok.biz' },
              { label: 'David Allen Capital reviews on Trustpilot', href: 'https://www.trustpilot.com/review/www.davidallencapital.com' },
            ].map((l) => (
              <a
                key={l.href}
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-gray-600 hover:text-clearfund-dark-blue hover:underline transition-colors"
              >
                {l.label}
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </a>
            ))}
          </div>
        </div>
      )}
      <p className="mt-6 mx-auto max-w-2xl text-sm text-gray-600">
        We may connect applicants with select funding providers. Approval, terms, and availability are determined
        by the provider. ClearFund AI may receive compensation for referrals.
      </p>
    </div>
  </section>
  );
};

export default FundingPartners;
