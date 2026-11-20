import { Mail } from "lucide-react";
import { siInstagram, siWhatsapp } from "simple-icons";

/* App icons for the channels HUSTLE drafts for. Brand marks are used only to name the channel. */

function BrandIcon({ path, color, title }: { path: string; color: string; title: string }) {
  return (
    <svg viewBox="0 0 24 24" role="img" aria-label={title} fill={color}>
      <path d={path} />
    </svg>
  );
}

export function WhatsAppIcon() {
  return <BrandIcon path={siWhatsapp.path} color={`#${siWhatsapp.hex}`} title="WhatsApp" />;
}

export function InstagramIcon() {
  return <BrandIcon path={siInstagram.path} color={`#${siInstagram.hex}`} title="Instagram" />;
}

/** simple-icons no longer ships LinkedIn, so this is drawn here. */
export function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" role="img" aria-label="LinkedIn">
      <rect width="24" height="24" rx="4" fill="#0a66c2" />
      <circle cx="7" cy="7.2" r="1.65" fill="#fff" />
      <rect x="5.6" y="9.6" width="2.8" height="8.8" rx="0.3" fill="#fff" />
      <path
        fill="#fff"
        d="M10.6 9.6h2.7v1.3c.5-.9 1.6-1.6 3-1.6 2.6 0 3.2 1.7 3.2 3.9v5.2h-2.8v-4.6c0-1.1-.1-2.4-1.6-2.4s-1.7 1.1-1.7 2.3v4.7h-2.8z"
      />
    </svg>
  );
}

export function EmailIcon() {
  return <Mail role="img" aria-label="Email" color="#386be5" strokeWidth={1.8} />;
}
