import { useId, useState } from "react";
import { ArrowRight } from "lucide-react";
import { brand } from "../config/brand";
import { track } from "../lib/analytics";
import "./NewsletterForm.css";

/**
 * Launch-list signup. With VITE_NEWSLETTER_ENDPOINT configured it POSTs
 * { email, consent }. Without one it validates, then tells the visitor plainly
 * that nothing was stored — no pretend subscriptions.
 */
export function NewsletterForm() {
  const id = useId();
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [errField, setErrField] = useState<"email" | "consent" | null>(null);
  const [state, setState] = useState<"idle" | "sending" | "done" | "unconfigured" | "failed">("idle");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      setError("Please enter a valid email address.");
      setErrField("email");
      return;
    }
    if (!consent) {
      setError("Please tick the box so we know it's okay to email you.");
      setErrField("consent");
      return;
    }
    setError("");
    setErrField(null);
    if (!brand.endpoints.newsletter) {
      setState("unconfigured");
      return;
    }
    setState("sending");
    try {
      const res = await fetch(brand.endpoints.newsletter, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ email: email.trim(), consent: true, source: "website" }),
      });
      if (!res.ok) throw new Error(String(res.status));
      track("newsletter_submit");
      setState("done");
    } catch {
      setState("failed");
    }
  };

  return (
    <div className="news">
      <div className="news__text">
        <p className="label label--gold">The launch list</p>
        <h2 className="news__title">
          Be the first to know when something <em>beautiful</em> arrives.
        </h2>
        <p className="news__expect">New collections and the occasional styling note. No spam — unsubscribe any time.</p>
      </div>

      {state === "done" ? (
        <p className="news__msg" role="status">
          You're on the list. Watch your inbox for the next arrival.
        </p>
      ) : state === "unconfigured" ? (
        <div className="news__msg" role="status">
          <p>
            Thank you! Our mailing list isn't live yet, so <strong>your email hasn't been saved</strong>. For now, new arrivals
            go up first on{" "}
            <a href={brand.instagram.url} target="_blank" rel="noopener noreferrer" className="u">
              Instagram {brand.instagram.handle}
            </a>
            .
          </p>
          <button type="button" className="link-arrow" onClick={() => setState("idle")}>
            Back
          </button>
        </div>
      ) : (
        <form className="news__form" onSubmit={submit} noValidate>
          <div className="news__row">
            <label htmlFor={`${id}-email`} className="sr-only">
              Email address
            </label>
            <input
              id={`${id}-email`}
              className="news__input"
              type="email"
              autoComplete="email"
              placeholder="Your email address"
              value={email}
              aria-invalid={errField === "email" ? true : undefined}
              aria-describedby={errField === "email" ? `${id}-err` : undefined}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
                setErrField(null);
              }}
            />
            <button type="submit" className="btn btn--gold" disabled={state === "sending"}>
              {state === "sending" ? "Joining…" : "Join"} <ArrowRight />
            </button>
          </div>
          <label className="news__consent">
            <input
              type="checkbox"
              checked={consent}
              aria-invalid={errField === "consent" ? true : undefined}
              aria-describedby={errField === "consent" ? `${id}-err` : undefined}
              onChange={(e) => {
                setConsent(e.target.checked);
                setError("");
                setErrField(null);
              }}
            />
            <span>Yes, email me about new arrivals from Mehfil Couture.</span>
          </label>
          {error && (
            <p className="news__error" id={`${id}-err`} role="alert">
              {error}
            </p>
          )}
          {state === "failed" && (
            <p className="news__error" role="alert">
              We couldn't add you just now — please try again in a moment.
            </p>
          )}
        </form>
      )}
    </div>
  );
}
