/**
 * Event bus for opening and managing The Trousseau Concierge & Wardrobe Planner.
 */

export const OPEN_TROUSSEAU = "mehfil:open-trousseau";
export const TROUSSEAU_UPDATED = "mehfil:trousseau-updated";

export function openTrousseau(initialCeremonyId?: string) {
  window.dispatchEvent(new CustomEvent<string | undefined>(OPEN_TROUSSEAU, { detail: initialCeremonyId }));
}

export function notifyTrousseauUpdated() {
  window.dispatchEvent(new CustomEvent(TROUSSEAU_UPDATED));
}
