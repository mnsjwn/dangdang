import { useEffect, useMemo, useState } from "react";
import { C } from "../theme.js";
import { nearbyParks, projectPins, getOrigin, DEFAULT_ORIGIN, PARKS_META } from "../lib/geo.js";

/**
 * 가까운 산책로.
 * 지도 SDK(카카오맵)는 배포 후 도메인 등록이 필요해 아직 붙이지 않았다.
 * 그때까지는 공공데이터의 실제 위경도를 화면 좌표로 투영해 핀을 찍고,
 * 거리·도보 시간은 하버사인으로 직접 계산한다.
 */
export function Trails({ onBack }) {
  const [origin, setOrigin] = useState({ ...DEFAULT_ORIGIN, fallback: true });
  const [idx, setIdx] = useState(0);
  const [routing, setRouting] = useState(false);

  useEffect(() => {
    let alive = true;
    getOrigin().then((o) => alive && setOrigin(o));
    return () => { alive = false; };
  }, []);

  const parks = useMemo(() => nearbyParks(origin, 6), [origin]);
  const { pins, me } = useMemo(
    () => projectPins(parks, origin, { left: 58, top: 190, width: 260, height: 300 }),
    [parks, origin]
  );
  const active = parks[idx];

  if (!active) {
    return (
      <div style={{ minHeight: "100dvh", background: C.white, padding: "64px 22px", display: "flex", flexDirection: "column", gap: 12 }}>
        <Header onBack={onBack} origin={origin} />
        <div style={{ marginTop: 40, textAlign: "center", color: C.muted }}>공원 데이터를 불러오지 못했어요.</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100dvh", height: "100dvh", boxSizing: "border-box", background: "#EDE8E2", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>
      {/* 지도 자리 — 실제 SDK가 붙기 전까지 쓰는 배경 */}
      <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(0deg,rgba(255,255,255,.9) 0 3px,transparent 3px 62px),repeating-linear-gradient(90deg,rgba(255,255,255,.9) 0 3px,transparent 3px 74px),#E4E9E1" }} />
      <div style={{ position: "absolute", left: -40, top: 150, width: 250, height: 190, borderRadius: "46% 54% 60% 40%", background: "#D2E0CE" }} />
      <div style={{ position: "absolute", right: -60, top: 400, width: 230, height: 210, borderRadius: "52% 48% 40% 60%", background: "#D2E0CE" }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 300, height: 12, background: "#DCE6EC" }} />
      <div style={{ position: "absolute", left: 16, bottom: 250, font: "600 10px ui-monospace,Menlo,monospace", color: "#8A9384", letterSpacing: ".04em" }}>
        지도 SDK 자리 — {PARKS_META.source}
      </div>

      {/* 길 안내 선 */}
      <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <path
          d={`M${me.x} ${me.y} L${me.x} ${(me.y + pins[idx].y) / 2} L${pins[idx].x} ${(me.y + pins[idx].y) / 2} L${pins[idx].x} ${pins[idx].y}`}
          fill="none" stroke={C.coral} strokeWidth="4" strokeDasharray="9 7" strokeLinecap="round"
          opacity={routing ? 1 : 0.3}
        />
      </svg>

      <Header onBack={onBack} origin={origin} />

      {pins.map((p, i) => (
        <div
          key={p.name + i}
          onClick={() => { setIdx(i); setRouting(false); }}
          style={{ position: "absolute", left: p.x, top: p.y, transform: "translate(-50%,-100%)", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, zIndex: i === idx ? 3 : 2 }}
        >
          <div style={{ padding: "4px 8px", borderRadius: 7, background: "#fff", fontSize: 10.5, fontWeight: 700, color: C.ink, boxShadow: "0 2px 8px rgba(60,40,30,.18)", whiteSpace: "nowrap" }}>
            {p.name}
          </div>
          <div style={{ width: i === idx ? 22 : 16, height: i === idx ? 22 : 16, borderRadius: "50%", background: i === idx ? C.coral : C.muted, border: "3px solid #fff", boxShadow: "0 2px 7px rgba(60,40,30,.3)" }} />
        </div>
      ))}

      {/* 내 위치 */}
      <div style={{ position: "absolute", left: me.x, top: me.y, transform: "translate(-50%,-50%)", width: 18, height: 18, borderRadius: "50%", background: C.blue, border: "3px solid #fff", boxShadow: "0 0 0 9px rgba(47,107,214,.16)" }} />
      <div style={{ position: "absolute", left: me.x, top: me.y + 24, transform: "translateX(-50%)", padding: "4px 9px", borderRadius: 7, background: C.ink, color: "#fff", fontSize: 10.5, fontWeight: 700, whiteSpace: "nowrap" }}>
        {origin.label}
      </div>

      {origin.fallback && (
        <div style={{ position: "absolute", left: 14, right: 14, top: 122, display: "flex", alignItems: "center", gap: 9, padding: "11px 13px", borderRadius: 12, background: "rgba(26,21,18,.92)", boxShadow: "0 4px 14px rgba(60,40,30,.2)", zIndex: 4 }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#FFB9A6", flex: "none" }} />
          <span style={{ fontSize: 11.5, fontWeight: 600, color: "#F5F0EC", lineHeight: 1.45 }}>
            위치 권한이 없어 <span style={{ fontWeight: 900, color: "#fff" }}>{DEFAULT_ORIGIN.label}</span>를 기준으로 보여주고 있어요
          </span>
        </div>
      )}

      <div style={{ flex: 1 }} />

      <div style={{ position: "relative", margin: "0 14px max(30px, env(safe-area-inset-bottom))", background: "#fff", borderRadius: 20, padding: "18px 18px 16px", boxShadow: "0 12px 30px rgba(60,40,30,.18)", zIndex: 5 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 19, fontWeight: 900, letterSpacing: "-.6px", color: C.ink }}>{active.name}</div>
            <div style={{ marginTop: 4, fontSize: 12.5, fontWeight: 500, color: C.sub2 }}>{active.desc}</div>
          </div>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: C.coral, background: "rgba(222,82,50,.1)", padding: "5px 9px", borderRadius: 7, whiteSpace: "nowrap" }}>
            {active.tag}
          </div>
        </div>
        <div style={{ marginTop: 14, display: "flex", borderTop: "1px solid rgba(26,21,18,.08)", paddingTop: 13 }}>
          <Cell label="거리" value={active.dist} />
          <Cell label="도보" value={active.walk} />
          <Cell label="한 바퀴" value={active.loop} />
        </div>
        {routing && (
          <div style={{ marginTop: 13, display: "flex", alignItems: "center", gap: 9, padding: "11px 13px", borderRadius: 12, background: C.chip, border: "1px solid rgba(26,21,18,.14)" }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: C.coral, flex: "none", animation: "dd-pulse 1.4s ease-in-out infinite" }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: C.ink2 }}>
              안내 중 · {active.name}까지 {active.walk} · {active.dist}
            </span>
          </div>
        )}
        <div
          onClick={() => setRouting((r) => !r)}
          style={{ marginTop: 14, height: 52, borderRadius: 13, background: routing ? C.ink2 : C.coral, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15.5, fontWeight: 700, cursor: "pointer" }}
        >
          {routing ? "안내 종료" : "길 안내"}
        </div>
      </div>
    </div>
  );
}

const Header = ({ onBack, origin }) => (
  <div style={{ position: "relative", padding: "64px 22px 0", display: "flex", alignItems: "center", gap: 6, zIndex: 4 }}>
    <div onClick={onBack} style={{ width: 44, height: 44, borderRadius: 12, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 20, color: C.ink, boxShadow: "0 3px 10px rgba(60,40,30,.14)", flex: "none" }}>
      ←
    </div>
    <div style={{ height: 44, flex: 1, borderRadius: 12, background: "#fff", display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 14px", boxShadow: "0 3px 10px rgba(60,40,30,.14)" }}>
      <div style={{ fontSize: 13.5, fontWeight: 900, color: C.ink, lineHeight: 1.2 }}>가까운 산책로 · 대전 서구</div>
      <div style={{ fontSize: 10.5, fontWeight: 600, color: C.muted }}>기준 위치 · {origin.label}</div>
    </div>
  </div>
);

const Cell = ({ label, value }) => (
  <div style={{ flex: 1 }}>
    <div style={{ fontSize: 10.5, fontWeight: 700, color: C.faint }}>{label}</div>
    <div style={{ marginTop: 2, fontSize: 19, fontWeight: 900, color: C.ink }}>{value}</div>
  </div>
);
