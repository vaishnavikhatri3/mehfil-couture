/**
 * Event bus for opening and managing the Bespoke Measurement Passport modal.
 */

export const OPEN_PASSPORT = "mehfil:open-passport";
export const PASSPORT_UPDATED = "mehfil:passport-updated";

export function openPassport(initialPoint?: string) {
  window.dispatchEvent(new CustomEvent<string | undefined>(OPEN_PASSPORT, { detail: initialPoint }));
}

export function notifyPassportUpdated() {
  window.dispatchEvent(new CustomEvent(PASSPORT_UPDATED));
}
