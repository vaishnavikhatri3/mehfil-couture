import { useEffect, useState } from "react";
import { Check, Crown, Download, MapPin, MessageCircle, QrCode, Share2, Sparkles, X } from "lucide-react";
import { Link } from "react-router-dom";
import QRCode from "qrcode";
import { brand } from "../config/brand";
import { openEnquiry } from "../lib/enquiry";
import { shareText } from "../lib/share";
import { toast } from "../lib/toast";
import { track } from "../lib/analytics";
import "./DigitalEntryCard.css";

type PriveMember = {
  name: string;
  occasion: string;
};

export function DigitalEntryCard() {
  const [open, setOpen] = useState(false);
  const [member, setMember] = useState<PriveMember | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [occasionInput, setOccasionInput] = useState("Wedding / Reception");
  const [qrCode, setQrCode] = useState("");

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    QRCode.toDataURL(window.location.origin, {
      errorCorrectionLevel: "M",
      margin: 1,
      width: 240,
      color: { dark: "#1f1612", light: "#ffffff" },
    }).then(
      (dataUrl) => {
        if (!cancelled) setQrCode(dataUrl);
      },
      () => {
        if (!cancelled) toast("Couldn't create the QR code. Please try again.");
      },
    );
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const previousOverflow = document.documentElement.style.overflow;
    document.addEventListener("keydown", onKeyDown);
    document.documentElement.style.overflow = "hidden";
    return () => {
      cancelled = true;
      document.removeEventListener("keydown", onKeyDown);
      document.documentElement.style.overflow = previousOverflow;
    };
  }, [open]);

  const handleCreateCard = (e: React.FormEvent) => {
    e.preventDefault();
    const newMember: PriveMember = {
      name: nameInput.trim(),
      occasion: occasionInput,
    };
    setMember(newMember);
    track("digital_card_created");
    toast(`Your Mehfil Couture card is ready, ${newMember.name}.`);
  };

  const handleDownloadCard = async () => {
    if (!member) return;
    const canvas = document.createElement("canvas");
    canvas.width = 1000;
    canvas.height = 600;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      toast("Couldn't prepare the card image on this device. Please try again.");
      return;
    }

    const grad = ctx.createLinearGradient(0, 0, 1000, 600);
    grad.addColorStop(0, "#351612");
    grad.addColorStop(0.55, "#581c1b");
    grad.addColorStop(1, "#24100e");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1000, 600);
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#d8b274";
    ctx.strokeRect(24, 24, 952, 552);

    ctx.textAlign = "left";
    ctx.font = "italic 54px Georgia, serif";
    ctx.fillStyle = "#f5d49a";
    ctx.fillText("Mehfil", 64, 116);
    ctx.font = "16px Arial, sans-serif";
    ctx.fillStyle = "rgba(251, 246, 238, 0.8)";
    ctx.fillText("COUTURE  ·  DRESS YOUR DREAM", 66, 150);

    ctx.font = "18px Arial, sans-serif";
    ctx.fillStyle = "#e5c48b";
    ctx.fillText("A NOTE FOR", 66, 260);
    ctx.font = "48px Georgia, serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(member.name.slice(0, 28), 66, 318);
    ctx.font = "18px Arial, sans-serif";
    ctx.fillStyle = "rgba(251, 246, 238, 0.88)";
    ctx.fillText(member.occasion.slice(0, 54), 66, 356);
    ctx.font = "20px Georgia, serif";
    ctx.fillStyle = "#f5d49a";
    ctx.fillText("Handcrafted moments, made to be remembered.", 66, 470);
    ctx.font = "15px Arial, sans-serif";
    ctx.fillStyle = "rgba(251, 246, 238, 0.75)";
    ctx.fillText(window.location.origin, 66, 515);

    if (qrCode) {
      try {
        const qrImage = new Image();
        qrImage.src = qrCode;
        await qrImage.decode();
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(760, 190, 174, 174);
        ctx.drawImage(qrImage, 772, 202, 150, 150);
        ctx.font = "14px Arial, sans-serif";
        ctx.fillStyle = "#f5d49a";
        ctx.textAlign = "center";
        ctx.fillText("SCAN TO VISIT", 847, 390);
      } catch {
        toast("Couldn't add the QR code to the card image. Please try again.");
        return;
      }
    }

    try {
      const a = document.createElement("a");
      a.href = canvas.toDataURL("image/png");
      a.download = "Mehfil-Couture-Digital-Card.png";
      a.click();
    } catch {
      toast("Couldn't download the card image. Please try again.");
      return;
    }
    track("digital_card_download");
    toast("Your Mehfil Couture card has been downloaded.");
  };

  const handleWhatsAppClaim = () => {
    if (!member) return;
    track("digital_card_enquiry");
    const message = [
      `Hi Mehfil Couture! I found your digital card and would love to explore the collection.`,
      `- Name: ${member.name}`,
      `- Occasion: ${member.occasion}`,
      "",
      "Could you please help me find a look for my celebration?",
    ].join("\n");
    openEnquiry(message, "digital_card_enquiry");
  };

  const handleShare = async () => {
    track("digital_card_share");
    await shareText(
      "Mehfil Couture · Dress your Dream",
      "Discover handcrafted bridal, luxury prêt and Indo-Western occasionwear from Mehfil Couture in Indore.",
      window.location.origin,
    );
  };

  return (
    <>
      {/* Discreet Floating Trigger Pill */}
      <button
        type="button"
        className="prive-pill"
        onClick={() => setOpen(true)}
        aria-label="Open the Mehfil Couture digital card"
      >
        <Crown size={15} className="prive-pill__icon" />
        <span className="prive-pill__text">
          {member ? `Your Mehfil Card` : "Your Mehfil Card"}
        </span>
      </button>

      {/* Privé Card Modal */}
      {open && (
        <div className="prive-modal" role="dialog" aria-modal="true" aria-labelledby="prive-modal-title">
          <div className="prive-modal__backdrop" onClick={() => setOpen(false)} />
          <div className="prive-modal__container">
            <button
              type="button"
              className="prive-modal__close"
              onClick={() => setOpen(false)}
              aria-label="Close Privé Pass"
            >
              <X size={20} />
            </button>

            {!member ? (
              /* Step 1: Onboarding Form */
              <div className="prive-onboard">
                <div className="prive-onboard__badge">
                  <Crown size={18} /> Mehfil Couture Privé
                </div>
                <h2 id="prive-modal-title" className="prive-onboard__title">
                  Your <em>Mehfil Moment</em> Starts Here
                </h2>
                <p className="prive-onboard__desc">
                  Create a personal digital card to keep Mehfil close, discover a look for your celebration, and share the atelier with someone you love.
                </p>

                <form onSubmit={handleCreateCard} className="prive-form">
                  <div className="prive-form__field">
                    <label htmlFor="prive-name">Your Full Name</label>
                    <input
                      id="prive-name"
                      type="text"
                      placeholder="e.g. Priya"
                      required
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                    />
                  </div>
                  <div className="prive-form__field">
                    <label htmlFor="prive-occ">Occasion / Wedding</label>
                    <select
                      id="prive-occ"
                      value={occasionInput}
                      onChange={(e) => setOccasionInput(e.target.value)}
                    >
                      <option value="Bride — Wedding & Pheras">Bride — Wedding & Pheras</option>
                      <option value="Sangeet & Cocktail Night">Sangeet & Cocktail Night</option>
                      <option value="Mehendi & Haldi Ceremony">Mehendi & Haldi Ceremony</option>
                      <option value="Bridesmaid / Sister of Bride">Bridesmaid / Sister of Bride</option>
                      <option value="Reception / Family Celebration">Reception / Family Celebration</option>
                    </select>
                  </div>

                  <button type="submit" className="btn btn--block prive-btn-gold">
                    <Sparkles size={16} /> Create My Digital Card
                  </button>
                </form>

                <p className="prive-privacy-note">Your name stays on this device for this visit. We don’t collect it.</p>
                <div className="prive-perks-row">
                  <div className="prive-perk">
                    <MapPin size={14} />
                    <span>Visit the atelier</span>
                  </div>
                  <div className="prive-perk">
                    <Crown size={14} />
                    <span>Find your look</span>
                  </div>
                  <div className="prive-perk">
                    <Check size={14} />
                    <span>Share the story</span>
                  </div>
                </div>
              </div>
            ) : (
              /* Step 2: Generated Digital Royal Card */
              <div className="prive-card-view">
                <header className="prive-card-view__head">
                  <span className="label label--gold">Your digital visiting card</span>
                  <h3>Welcome to Mehfil, {member.name}</h3>
                </header>

                {/* The Physical-feeling Digital Card */}
                <div className="royal-card">
                  <div className="royal-card__shimmer" />
                  <div className="royal-card__top">
                    <div className="royal-card__brand">
                      <span className="royal-card__logo">Mehfil</span>
                      <span className="royal-card__sub">Couture · Indore Atelier</span>
                    </div>
                  </div>

                  <div className="royal-card__body">
                    <span className="royal-card__prefix">MADE FOR YOUR NEXT CELEBRATION</span>
                    <h2 className="royal-card__name">{member.name}</h2>
                    <span className="royal-card__occasion">✦ {member.occasion}</span>
                  </div>

                  <div className="royal-card__bottom">
                    <div className="royal-card__benefit">
                      <span className="royal-card__benefit-amount">Dress your Dream</span>
                      <span className="royal-card__benefit-txt">{window.location.host}</span>
                    </div>
                    <div className="royal-card__qr">
                      {qrCode ? (
                        <img src={qrCode} alt="QR code to visit Mehfil Couture online" />
                      ) : (
                        <QrCode size={40} className="royal-card__qr-icon" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="prive-card-actions">
                  <button
                    type="button"
                    className="btn btn--block prive-btn-gold"
                    onClick={handleDownloadCard}
                    disabled={!qrCode}
                    title={qrCode ? "Download your card with its website QR code" : "Preparing your QR code"}
                  >
                    <Download size={16} /> {qrCode ? "Download Card to Phone" : "Preparing Your Card…"}
                  </button>
                  <button type="button" className="btn btn--block btn--ghost" onClick={handleShare}>
                    <Share2 size={16} /> Share Mehfil with Family
                  </button>
                  <Link
                    to="/product/festive-statement-lehenga"
                    className="btn btn--block btn--ghost"
                    onClick={() => setOpen(false)}
                  >
                    <Sparkles size={16} /> Explore the Festive Collection
                  </Link>
                  <button
                    type="button"
                    className="btn btn--block btn--ghost"
                    onClick={handleWhatsAppClaim}
                  >
                    <MessageCircle size={16} /> Ask Our Stylist for Help
                  </button>
                  <a href={brand.studio.mapUrl} target="_blank" rel="noopener noreferrer" className="prive-reset-btn">
                    Find our Indore atelier
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
