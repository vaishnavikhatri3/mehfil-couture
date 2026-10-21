import { brand } from "../config/brand";
import { track } from "./analytics";
import { toast } from "./toast";

export const hasWhatsApp = () => brand.whatsapp.length >= 10;

export const enquiryChannel = () => (hasWhatsApp() ? "WhatsApp" : "Instagram DM");

export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers / insecure contexts
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch {
      ok = false;
    }
    ta.remove();
    return ok;
  }
}

/**
 * Opens a prefilled enquiry. With a verified WhatsApp number this deep-links
 * to wa.me; otherwise it copies the message and opens the studio's Instagram DM
 * (the only verified contact channel today).
 */
export async function openEnquiry(message: string, source: string) {
  track("enquiry_open", { source, channel: enquiryChannel() });
  if (hasWhatsApp()) {
    window.open(`https://wa.me/${brand.whatsapp}?text=${encodeURIComponent(message)}`, "_blank", "noopener");
    return;
  }
  const copied = await copyText(message);
  toast(
    copied
      ? "Your message is copied — paste it into our Instagram DM that just opened."
      : "Opening our Instagram DM — tell us your occasion and we'll take it from there.",
  );
  window.open(brand.instagram.dm, "_blank", "noopener");
}

export const generalEnquiry = () =>
  openEnquiry("Hi Mehfil Couture! I found you through your website and would love to know more about your collections.", "general");
