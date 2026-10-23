const TOKEN = "mehfil-admin-token";

export const adminToken = {
  get: () => {
    try {
      return sessionStorage.getItem(TOKEN);
    } catch {
      return null;
    }
  },
  set: (t: string | null) => {
    try {
      if (t) sessionStorage.setItem(TOKEN, t);
      else sessionStorage.removeItem(TOKEN);
    } catch {
      /* storage blocked — the session lasts for this page only */
    }
  },
};

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function api<T>(path: string, opts: { method?: string; body?: unknown; admin?: boolean } = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";
  if (opts.admin) {
    const t = adminToken.get();
    if (t) headers.Authorization = `Bearer ${t}`;
  }
  let res: Response;
  try {
    res = await fetch(path, { method: opts.method || "GET", headers, body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined });
  } catch {
    throw new ApiError(0, "Can't reach the server. Check your connection and try again.");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && opts.admin) adminToken.set(null);
    throw new ApiError(res.status, (data as { error?: string }).error || "Something went wrong.");
  }
  return data as T;
}

// Shared shapes
export type Design = {
  id: string; name: string; category: string; story: string; fabric: string; embroidery: string; care: string;
  colours: string[]; sizes: string[]; occasions: string[]; imageUrl: string; isDemo: boolean;
  stats?: { pieces: number; inStock: number; scans: number; leads: number };
};
export type Lead = {
  id: string; designId: string; pieceCode: string | null; occasion: string | null; style: string | null; budget: string | null;
  mobile: string; size: string; location: { method: "gps" | "manual"; lat: number | null; lng: number | null; accuracy: number | null; text: string | null };
  colours: string[]; consent: boolean; consentText: string | null; consentAt: string; status: "new" | "contacted"; isDemo: boolean; createdAt: string;
};
export type Order = {
  id: string; mode: string; garment: string; unit: "in" | "cm"; measurements: Record<string, number>; spec: unknown; confidence: number;
  verdict: string; eventDate: string | null; embroidery: string; feasibility: { status: string; needDays: number; haveDays: number | null; readyBy: string; advice: string } | null;
  stylistRequested: boolean; status: string; timeline: { step: string; at: string; note?: string }[]; createdAt: string; contact?: string | null; notes?: string | null;
};

/** Colour name → swatch. Unknown names fall back to a neutral. */
const SW: Record<string, string> = {
  maroon: "#6e1b1b", red: "#b3202a", wine: "#5a1a2a", blush: "#e7b3b3", pink: "#e58aa6", rani: "#c2185b", ivory: "#f3ead6", cream: "#f2e6cc",
  gold: "#c39a4c", champagne: "#e8d3a9", sage: "#97a685", mint: "#a8d5ba", green: "#2f6b45", teal: "#2b7a78", midnight: "#25304d",
  navy: "#1d2a4d", blue: "#3a5a9b", lilac: "#c3a6d6", lavender: "#b9a7d9", peach: "#f1b49a", orange: "#e07a2f", yellow: "#e9c33f",
  mustard: "#c99a2e", black: "#1b1b1b", silver: "#c9c9cf", white: "#fbfbfb", beige: "#d9c4a3", purple: "#6a3d8f", magenta: "#b0207a",
};
export const swatch = (name: string) => SW[name.trim().toLowerCase()] || "#cbbba6";
export const COLOUR_OPTIONS = ["Maroon", "Red", "Blush", "Pink", "Ivory", "Gold", "Sage", "Mint", "Teal", "Midnight", "Lilac", "Peach", "Mustard", "Black"];
