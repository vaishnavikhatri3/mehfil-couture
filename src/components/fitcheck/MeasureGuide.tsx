import type { FieldKey } from "../../lib/fitcheck/fields";
import type { FlatKey } from "../../lib/fitcheck/garment";

/**
 * Visual Measurement Helper: an anatomical vector guide where the active
 * measurement's tape line animates into place. Purely illustrative.
 */

type BodyLine = { d: string; kind?: "loop" | "length" };
const BODY: Record<FieldKey, BodyLine> = {
  shoulder: { d: "M63 82 Q100 74 137 82" },
  bust: { d: "M66 112 Q100 126 134 112", kind: "loop" },
  underbust: { d: "M70 128 Q100 140 130 128", kind: "loop" },
  waist: { d: "M76 156 Q100 166 124 156", kind: "loop" },
  hip: { d: "M66 196 Q100 210 134 196", kind: "loop" },
  armhole: { d: "M64 84 C52 92 54 112 70 116 C76 104 74 90 64 84", kind: "loop" },
  sleeve: { d: "M62 84 L46 132 L38 176", kind: "length" },
  blouseLength: { d: "M90 74 L90 140", kind: "length" },
  waistToFloor: { d: "M156 158 L156 404", kind: "length" },
  height: { d: "M182 18 L182 404", kind: "length" },
};

export function BodyGuide({ active }: { active: FieldKey | null }) {
  return (
    <svg className="mg" viewBox="0 0 200 420" role="img" aria-label={active ? `Where to measure: ${active}` : "Body measurement guide"}>
      <g className="mg__figure">
        <circle cx="100" cy="34" r="17" />
        <path d="M92 50 L92 62 Q100 66 108 62 L108 50" />
        <path d="M64 80 Q100 66 136 80 L138 96 Q136 118 130 132 Q124 148 124 158 Q132 176 136 198 Q140 226 132 262 L128 300 L122 404 L104 404 L101 286 L99 286 L96 404 L78 404 L72 300 L68 262 Q60 226 64 198 Q68 176 76 158 Q76 148 70 132 Q64 118 62 96 Z" />
        <path d="M64 82 L46 132 L38 180 L44 182 L54 136 L68 100" />
        <path d="M136 82 L154 132 L162 180 L156 182 L146 136 L132 100" />
      </g>
      {(Object.keys(BODY) as FieldKey[]).map((k) => (
        <path key={k} d={BODY[k].d} className={`mg__line ${active === k ? "is-active" : ""}`} />
      ))}
      {active && (BODY[active].kind === "length" || active === "shoulder") && (
        <>
          <circle className="mg__dot" cx={start(BODY[active].d)[0]} cy={start(BODY[active].d)[1]} r="3" />
        </>
      )}
    </svg>
  );
}

const FLAT: Record<FlatKey, string> = {
  chestFlat: "M58 96 L142 96",
  waistFlat: "M64 150 L136 150",
  hipFlat: "M58 214 L142 214",
  shoulderSeam: "M66 46 L134 46",
  sleeveLen: "M58 50 L22 108",
  garmentLen: "M84 36 L84 286",
};

export function FlatGuide({ active, garment }: { active: FlatKey | null; garment: "blouse" | "kurti" | "dress" }) {
  const hem = garment === "blouse" ? 172 : 290;
  return (
    <svg className="mg" viewBox="0 0 200 310" role="img" aria-label="Garment laid flat measurement guide">
      <g className="mg__figure mg__figure--flat">
        <path
          d={
            garment === "blouse"
              ? `M66 44 Q100 58 134 44 L176 104 L156 116 L142 88 L142 ${hem} L58 ${hem} L58 88 L44 116 L24 104 Z`
              : `M66 44 Q100 58 134 44 L176 104 L156 116 L142 88 L142 150 Q150 220 158 ${hem} L42 ${hem} Q50 220 58 150 L58 88 L44 116 L24 104 Z`
          }
        />
        <path d="M86 46 Q100 70 114 46" />
      </g>
      {(Object.keys(FLAT) as FlatKey[])
        .filter((k) => !(garment === "blouse" && k === "hipFlat"))
        .map((k) => (
          <path key={k} d={k === "garmentLen" ? `M84 36 L84 ${hem}` : FLAT[k]} className={`mg__line ${active === k ? "is-active" : ""}`} />
        ))}
    </svg>
  );
}

function start(d: string): [number, number] {
  const m = d.match(/M\s*([\d.]+)[ ,]([\d.]+)/);
  return m ? [Number(m[1]), Number(m[2])] : [0, 0];
}
