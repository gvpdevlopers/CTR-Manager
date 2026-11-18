import lightLogo from "../assets/Logo-White-BG.PNG";
import darkLogo from "../assets/Logo-Black-BG.PNG";

export default function BrandLogo({ className = "", variant }) {
  if (variant) {
    return <span className={`brand-logo ${className}`} aria-hidden="true"><img src={variant === "dark" ? darkLogo : lightLogo} alt="" /></span>;
  }
  return <span className={`brand-logo ${className}`} aria-hidden="true"><img className="brand-logo-light" src={lightLogo} alt=""/><img className="brand-logo-dark" src={darkLogo} alt=""/></span>;
}
