import { useId, type CSSProperties, type Ref } from "react";
import { dupattaColours, lehengaColours, type Look, type Swatch } from "../data/mixmatch";

/**
 * Hand-drawn style SVG of a lehenga on a dress form. Every layer is driven by
 * the chosen look; colours transition via CSS (`fill` in style).
 */

const GOLD = "#d8b274";
const GOLD_DEEP = "#b98a3d";

const SKIRT = "M150,252 C142,320 96,470 40,654 Q200,704 360,654 C304,470 258,320 250,252 Z";
const HEM_BAND = "M58,604 Q200,646 342,604 L358,652 Q200,700 42,652 Z";
const WAIST_BAND = "M148,250 L252,250 L254,270 Q200,276 146,270 Z";

const BLOUSE: Record<Look["blouse"], { body: string; extra?: string[] }> = {
  sweetheart: {
    body: "M140,124 Q158,112 176,122 Q192,134 200,126 Q208,134 224,122 Q242,112 260,124 L257,170 Q250,196 252,216 L148,216 Q150,196 143,170 Z",
    extra: ["M160,120 L156,100 L164,100 L169,118 Z", "M240,120 L244,100 L236,100 L231,118 Z"],
  },
  elbow: {
    body: "M150,100 Q170,94 184,97 L200,146 L216,97 Q230,94 250,100 L262,114 Q266,150 257,174 Q250,198 252,216 L148,216 Q150,198 143,174 Q134,150 138,114 Z",
    extra: ["M250,100 L266,108 L290,176 L270,184 L254,130 Z", "M150,100 L134,108 L110,176 L130,184 L146,130 Z"],
  },
  highneck: {
    body: "M184,84 L216,84 L220,98 Q236,96 250,100 L262,114 Q266,150 257,174 Q250,198 252,216 L148,216 Q150,198 143,174 Q134,150 138,114 L150,100 Q164,96 180,98 Z",
    extra: ["M250,100 L268,110 L298,232 L276,238 L254,134 Z", "M150,100 L132,110 L102,232 L124,238 L146,134 Z"],
  },
  offshoulder: {
    body: "M126,122 Q200,134 274,122 L276,140 Q268,146 260,146 L257,172 Q250,198 252,216 L148,216 Q150,198 143,172 L140,146 Q132,146 124,140 Z",
  },
};

function Patterns({ look, lehenga, p }: { look: Look; lehenga: Swatch; p: string }) {
  const e = look.embroidery;
  const thread = e === "zari" ? GOLD : e === "resham" ? lehenga.light : e === "mirror" ? GOLD : lehenga.shade;
  return (
    <defs>
      {/* All-over buttis on the skirt */}
      <pattern id={`${p}butti`} width="34" height="38" patternUnits="userSpaceOnUse">
        {e === "zari" && (
          <g fill={GOLD} opacity=".9">
            <path d="M17,8 C21,13 21,19 17,22 C13,19 13,13 17,8Z" />
            <circle cx="17" cy="25" r="1.4" />
            <path d="M0,27 C3,30 3,34 0,36 M34,27 C31,30 31,34 34,36" stroke={GOLD} strokeWidth=".8" fill="none" />
          </g>
        )}
        {e === "resham" && (
          <g fill="none" stroke={thread} strokeWidth="1.1" opacity=".9">
            <circle cx="17" cy="17" r="3.2" />
            <path d="M17,10 v-3 M17,24 v3 M10,17 h-3 M24,17 h3" />
          </g>
        )}
        {e === "mirror" && (
          <g>
            <circle cx="17" cy="17" r="3.6" fill="#f7f3ea" stroke={GOLD} strokeWidth="1.2" />
            <circle cx="0" cy="36" r="1.8" fill={GOLD} />
            <circle cx="34" cy="36" r="1.8" fill={GOLD} />
          </g>
        )}
      </pattern>

      {/* Dense hem border */}
      <pattern id={`${p}border`} width="26" height="60" patternUnits="userSpaceOnUse">
        {e === "minimal" ? (
          <g stroke={GOLD_DEEP} strokeWidth="1.4">
            <path d="M0,14 H26 M0,20 H26" />
          </g>
        ) : (
          <g fill="none" stroke={thread} strokeWidth="1.3">
            <path d="M0,10 H26 M0,50 H26" />
            {e === "mirror" ? (
              <>
                <circle cx="13" cy="30" r="5" fill="#f7f3ea" />
                <circle cx="0" cy="30" r="2" fill={thread} />
                <circle cx="26" cy="30" r="2" fill={thread} />
              </>
            ) : (
              <>
                <path d="M13,16 C21,22 21,38 13,44 C5,38 5,22 13,16Z" fill={e === "zari" ? GOLD : "none"} fillOpacity=".55" />
                <path d="M0,30 Q6,22 13,30 Q20,38 26,30" />
              </>
            )}
          </g>
        )}
      </pattern>

      {/* Blouse embroidery */}
      <pattern id={`${p}blouse`} width="14" height="14" patternUnits="userSpaceOnUse">
        {e !== "minimal" && <circle cx="7" cy="7" r={e === "mirror" ? 2.2 : 1.3} fill={e === "mirror" ? "#f7f3ea" : thread} stroke={e === "mirror" ? GOLD : "none"} strokeWidth=".6" />}
      </pattern>

      <linearGradient id={`${p}shade`} x1="0" x2="1" y1="0" y2="0">
        <stop offset="0" stopColor="#000" stopOpacity=".32" />
        <stop offset=".28" stopColor="#000" stopOpacity="0" />
        <stop offset=".62" stopColor="#fff" stopOpacity=".07" />
        <stop offset="1" stopColor="#000" stopOpacity=".34" />
      </linearGradient>
    </defs>
  );
}

type Props = {
  look: Look;
  /** Garment only (no dress form), cropped tight — used as the try-on lens overlay */
  bare?: boolean;
  svgRef?: Ref<SVGSVGElement>;
  className?: string;
};

export function LehengaSketch({ look, bare = false, svgRef, className = "sketch" }: Props) {
  const p = `lk${useId().replace(/[^a-zA-Z0-9]/g, "")}-`;
  const lehenga = lehengaColours.find((c) => c.key === look.lehenga) ?? lehengaColours[0];
  const dupatta = dupattaColours.find((c) => c.key === look.dupatta);
  const dup = dupatta && "base" in dupatta ? dupatta : null;
  const blouse = BLOUSE[look.blouse];
  const fill = (c: string): CSSProperties => ({ fill: c });

  // Kalis: pleat lines from waist to hem
  const kalis = Array.from({ length: 9 }, (_, i) => {
    const t = i / 8;
    const x1 = 152 + t * 96;
    const x2 = 48 + t * 304;
    const y2 = 650 + Math.sin(t * Math.PI) * 24; // follows the curved hem
    return `M${x1},262 Q${(x1 + x2) / 2 + (t - 0.5) * 30},${460} ${x2},${y2}`;
  });

  return (
    <svg
      ref={svgRef}
      className={className}
      viewBox={bare ? "20 80 360 630" : "0 0 400 720"}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={bare ? "Lehenga illustration overlay" : "Illustration of the selected lehenga look on a dress form"}
    >
      <Patterns look={look} lehenga={lehenga} p={p} />

      {/* Dress form */}
      {!bare && (
      <g className="sketch__form">
        <ellipse cx="200" cy="44" rx="20" ry="6" fill="#e6d8bf" stroke="#b9a582" strokeWidth=".8" />
        <rect x="186" y="44" width="28" height="56" rx="6" fill="#efe3cc" stroke="#b9a582" strokeWidth=".8" />
        <path
          d="M150,100 Q200,84 250,100 L262,114 Q270,152 258,190 Q248,226 252,262 L148,262 Q152,226 142,190 Q130,152 138,114 Z"
          fill="#efe3cc"
          stroke="#b9a582"
          strokeWidth=".8"
        />
        <path d="M200,92 V262" stroke="#b9a582" strokeWidth=".6" strokeDasharray="3 4" opacity=".7" />
      </g>
      )}

      {/* Dupatta — back fall */}
      {dup && (
        <path
          className="sketch__fade"
          d="M152,104 C118,150 96,270 92,400 C88,520 72,600 58,664 L104,670 C112,568 130,446 140,334 C150,240 160,160 170,106 Z"
          style={{ ...fill(dup.base), opacity: 0.55 }}
        />
      )}

      {/* Skirt */}
      <path d={SKIRT} className="sketch__fill" style={fill(lehenga.base)} />
      {look.embroidery !== "minimal" && <path d={SKIRT} fill={`url(#${p}butti)`} opacity=".85" />}
      <g fill="none" stroke={lehenga.shade} strokeWidth="1.1" opacity=".6">
        {kalis.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
      <path d={SKIRT} fill={`url(#${p}shade)`} />
      <path d={HEM_BAND} className="sketch__fill" style={fill(lehenga.shade)} />
      <path d={HEM_BAND} fill={`url(#${p}border)`} />
      <path d={WAIST_BAND} className="sketch__fill" style={fill(lehenga.shade)} />
      <path d={WAIST_BAND} fill={`url(#${p}border)`} opacity=".8" />

      {/* Blouse */}
      <g>
        <path d={blouse.body} className="sketch__fill" style={fill(lehenga.base)} />
        {blouse.extra?.map((d) => (
          <path key={d} d={d} className="sketch__fill" style={fill(lehenga.base)} />
        ))}
        <path d={blouse.body} fill={`url(#${p}blouse)`} opacity=".9" />
        {blouse.extra?.map((d) => (
          <path key={`${d}-e`} d={d} fill={`url(#${p}blouse)`} opacity=".9" />
        ))}
        <path d={blouse.body} fill="none" stroke={lehenga.shade} strokeWidth="1" />
        <path d="M148,212 L252,212" stroke={look.embroidery === "minimal" ? GOLD_DEEP : GOLD} strokeWidth="3" opacity=".9" />
      </g>

      {/* Dupatta — front swag over the shoulder */}
      {dup && (
        <g className="sketch__fade">
          <path
            d="M150,102 C176,170 222,232 274,282 C284,300 278,316 268,318 C214,268 170,200 138,118 Z"
            style={{ ...fill(dup.light), opacity: 0.6 }}
          />
          <path d="M150,102 C176,170 222,232 274,282" fill="none" stroke={GOLD} strokeWidth="2" strokeDasharray="1 5" strokeLinecap="round" />
          <path d="M104,670 L58,664" stroke={GOLD} strokeWidth="2" strokeDasharray="1 5" strokeLinecap="round" />
        </g>
      )}

      {/* Jewellery */}
      <g className="sketch__fade" fill="none" stroke={GOLD} strokeLinecap="round">
        {look.jewellery === "choker" && (
          <>
            <path d="M184,96 Q200,110 216,96" strokeWidth="6" />
            {[188, 194, 200, 206, 212].map((x) => (
              <circle key={x} cx={x} cy={x === 200 ? 110 : 106} r="2.2" fill={x === 200 ? "#a8222b" : GOLD} stroke="none" />
            ))}
          </>
        )}
        {look.jewellery === "haar" && (
          <>
            <path d="M184,96 Q200,108 216,96" strokeWidth="4" />
            <path d="M180,98 Q200,142 220,98" strokeWidth="2.4" />
            <path d="M176,100 Q200,174 224,100" strokeWidth="2" strokeDasharray="0.1 5" />
            <circle cx="200" cy="138" r="5" fill={GOLD} stroke="none" />
          </>
        )}
        {look.jewellery === "minimal" && (
          <>
            <path d="M186,98 Q200,118 214,98" strokeWidth="1" />
            <circle cx="200" cy="114" r="2" fill={GOLD} stroke="none" />
          </>
        )}
        {look.jewellery === "jhumka" && !bare && (
          <g transform="translate(300 70)" strokeWidth="1.2">
            {[0, 34].map((dx) => (
              <g key={dx} transform={`translate(${dx} 0)`}>
                <path d="M10,0 V10" />
                <circle cx="10" cy="14" r="4" fill={GOLD} stroke="none" />
                <path d="M0,34 Q10,14 20,34 Z" fill={GOLD} stroke="none" />
                {[2, 6, 10, 14, 18].map((x) => (
                  <circle key={x} cx={x} cy="38" r="1.4" fill={GOLD_DEEP} stroke="none" />
                ))}
              </g>
            ))}
          </g>
        )}
      </g>

      {/* Base */}
      {!bare && <path d="M150,708 H250" stroke="#b9a582" strokeWidth="1" />}
    </svg>
  );
}
