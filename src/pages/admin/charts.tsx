import { useState } from "react";

/** Single-series horizontal bars: label · bar · value (direct labels, no legend needed). */
export function HBars({ data, empty, swatches }: { data: { label: string; value: number }[]; empty: string; swatches?: (label: string) => string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  if (!data.length) return <p className="ad__empty">{empty}</p>;
  return (
    <ul className="hb">
      {data.map((d) => (
        <li key={d.label} className="hb__row" title={`${d.label}: ${d.value}`}>
          <span className="hb__label">
            {swatches && <i className="hb__sw" style={{ background: swatches(d.label) }} />}
            {d.label}
          </span>
          <span className="hb__track">
            <span className="hb__bar" style={{ width: `${(d.value / max) * 100}%` }} />
          </span>
          <span className="hb__value">{d.value}</span>
        </li>
      ))}
    </ul>
  );
}

/** Scans and leads per day — grouped bars on one shared count axis, legend + hover tooltip. */
export function DailyChart({ data }: { data: { day: string; scans: number; leads: number }[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 640, H = 200, pl = 30, pb = 26, pt = 10, pr = 8;
  const max = Math.max(4, ...data.map((d) => Math.max(d.scans, d.leads)));
  const step = Math.ceil(max / 4);
  const top = step * 4;
  const cw = (W - pl - pr) / data.length;
  const bw = Math.min(14, (cw - 8) / 2);
  const y = (v: number) => pt + (H - pt - pb) * (1 - v / top);
  const day = (s: string) => new Date(s + "T12:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  return (
    <div className="dc">
      <div className="dc__legend">
        <span><i style={{ background: "#4a6aa5" }} />QR scans</span>
        <span><i style={{ background: "#c28a35" }} />Leads (opted in)</span>
      </div>
      <div className="dc__wrap">
        <svg viewBox={`0 0 ${W} ${H}`} className="dc__svg" role="img" aria-label="QR scans and leads per day, last 14 days" onMouseLeave={() => setHover(null)}>
          {[0, 1, 2, 3, 4].map((i) => (
            <g key={i}>
              <line x1={pl} x2={W - pr} y1={y(i * step)} y2={y(i * step)} className="dc__grid" />
              <text x={pl - 6} y={y(i * step) + 4} className="dc__tick" textAnchor="end">{i * step}</text>
            </g>
          ))}
          {data.map((d, i) => {
            const x0 = pl + i * cw + (cw - bw * 2 - 2) / 2;
            return (
              <g key={d.day} onMouseEnter={() => setHover(i)}>
                <rect x={pl + i * cw} y={pt} width={cw} height={H - pt - pb} fill="transparent" />
                {hover === i && <rect x={pl + i * cw + 1} y={pt} width={cw - 2} height={H - pt - pb} className="dc__hl" />}
                <rect x={x0} y={y(d.scans)} width={bw} height={Math.max(0, y(0) - y(d.scans))} rx="3" fill="#4a6aa5" />
                <rect x={x0 + bw + 2} y={y(d.leads)} width={bw} height={Math.max(0, y(0) - y(d.leads))} rx="3" fill="#c28a35" />
                {i % 2 === 0 && <text x={pl + i * cw + cw / 2} y={H - 8} className="dc__tick" textAnchor="middle">{day(d.day)}</text>}
              </g>
            );
          })}
          <line x1={pl} x2={W - pr} y1={y(0)} y2={y(0)} className="dc__axis" />
        </svg>
        {hover != null && (
          <div className="dc__tip" style={{ left: `${((pl + hover * cw + cw / 2) / W) * 100}%` }}>
            <b>{day(data[hover].day)}</b>
            <span>{data[hover].scans} scans</span>
            <span>{data[hover].leads} leads</span>
          </div>
        )}
      </div>
    </div>
  );
}
