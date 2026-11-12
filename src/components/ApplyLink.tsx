import React from "react";
import { DAC_APPLY_URL, logDacClick } from "@/lib/partners";

type Props = React.AnchorHTMLAttributes<HTMLAnchorElement> & { cta: string };

// Every public Apply call-to-action goes through this link so the URL and click log stay in one place.
const ApplyLink = React.forwardRef<HTMLAnchorElement, Props>(({ cta, onClick, children, ...rest }, ref) => (
  <a ref={ref} {...rest} href={DAC_APPLY_URL} target="_blank" rel="noopener noreferrer"
    onClick={(e) => { logDacClick(cta); onClick?.(e); }}>{children}</a>
));
ApplyLink.displayName = "ApplyLink";
export default ApplyLink;
