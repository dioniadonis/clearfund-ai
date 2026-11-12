import React from "react";
import { Link } from "react-router-dom";

type Props = React.AnchorHTMLAttributes<HTMLAnchorElement> & { cta: string };

// Every public Apply call-to-action goes through the short qualifier, which picks the next step per lead.
const ApplyLink = React.forwardRef<HTMLAnchorElement, Props>(({ cta, children, target: _t, rel: _r, href: _h, ...rest }, ref) => (
  <Link ref={ref} {...rest} to={`/get-started?cta=${encodeURIComponent(cta.slice(0, 60))}`}>{children}</Link>
));
ApplyLink.displayName = "ApplyLink";
export default ApplyLink;
