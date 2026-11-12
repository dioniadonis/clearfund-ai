import React from "react";
import { Link } from "react-router-dom";
import { logCtaClick } from "@/lib/partners";

type Props = React.AnchorHTMLAttributes<HTMLAnchorElement> & { cta: string; leadId?: string };

// Every public Apply call-to-action goes through the short qualifier, which picks the next step per lead.
const ApplyLink = React.forwardRef<HTMLAnchorElement, Props>(({ cta, leadId, children, target: _t, rel: _r, href: _h, onClick, ...rest }, ref) => (
  <Link ref={ref} {...rest} onClick={(event) => { logCtaClick(cta, leadId); onClick?.(event); }} to={`/get-started?cta=${encodeURIComponent(cta.slice(0, 60))}`}>{children}</Link>
));
ApplyLink.displayName = "ApplyLink";
export default ApplyLink;
