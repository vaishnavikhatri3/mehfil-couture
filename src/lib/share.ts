import { copyText } from "./enquiry";
import { toast } from "./toast";

export async function shareText(title: string, text: string, url = window.location.origin) {
  if (navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return "shared" as const;
    } catch (e) {
      if ((e as DOMException)?.name === "AbortError") return "cancelled" as const;
    }
  }
  const ok = await copyText(`${text}\n${url}`);
  toast(ok ? "Copied — paste it anywhere to share." : "Couldn't copy automatically. Please try again.");
  return ok ? ("copied" as const) : ("failed" as const);
}
