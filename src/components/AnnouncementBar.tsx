import { announcements } from "../config/brand";
import { Dinkus } from "./Icons";
import "./AnnouncementBar.css";

/** Slow, linear editorial ticker. Content is duplicated for a seamless loop. */
export function AnnouncementBar() {
  const items = [...announcements, ...announcements];
  return (
    <div className="announce" role="region" aria-label="Studio announcements">
      <p className="sr-only">{announcements.join(". ")}</p>
      <div className="announce__track" aria-hidden="true">
        {[0, 1].map((dup) => (
          <div className="announce__group" key={dup}>
            {items.map((t, i) => (
              <span className="announce__item" key={`${dup}-${i}`}>
                {t}
                <Dinkus size={8} className="announce__dot" />
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
