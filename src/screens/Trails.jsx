import { useEffect, useMemo, useRef, useState } from "react";
import { C } from "../theme.js";
import { nearbyParks, projectPins, getOrigin, DEFAULT_ORIGIN, PARKS_META } from "../lib/geo.js";
import { useKakaoMaps, routeLink } from "../lib/kakao.js";

/**
 * 가까운 산책로.
 * 카카오 지도 SDK가 뜨면 실제 지도에 공공데이터 좌표로 마커를 찍고,
 * 로딩에 실패하면(도메인 미등록·네트워크 차단) 좌표를 화면에 투영한 대체 뷰로 떨어진다.
 * 거리·도보 시간은 두 경우 모두 하버사인으로 직접 계산한 값이다.
 */
export function Trails({ onBack }) {
  const [origin, setOrigin] = useState({ ...DEFAULT_ORIGIN, fallback: true });
  const [idx, setIdx] = useState(0);
  const { ready, failed } = useKakaoMaps();

  useEffect(() => {
    let alive = true;
    getOrigin().then((o) => alive && setOrigin(o));
    return () => { alive = false; };
  }, []);

  const parks = useMemo(() => nearbyParks(origin, 6), [origin]);
  const active = parks[idx];

  if (!active) {
    return (
      <div style={{ minHeight: "100dvh", background: C.white, padding: "64px 22px" }}>
        <Header onBack={onBack} origin={origin} />
        <div style={{ marginTop: 40, textAlign: "center", color: C.muted }}>공원 데이터를 불러오지 못했어요.</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100dvh", height: "100dvh", boxSizing: "border-box", background: "#EDE8E2", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>
      {ready ? (
        <KakaoMap parks={parks} origin={origin} idx={idx} onPick={setIdx} />
      ) : (
        <FallbackMap parks={parks} origin={origin} idx={idx} onPick={setIdx} failed={failed} />
      )}

      <Header onBack={onBack} origin={origin} />

      {origin.fallback && (
        <div style={{ position: "absolute", left: 14, right: 14, top: 122, display: "flex", alignItems: "center", gap: 9, padding: "11px 13px", borderRadius: 12, background: "rgba(26,21,18,.92)", boxShadow: "0 4px 14px rgba(60,40,30,.2)", zIndex: 4 }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#FFB9A6", flex: "none" }} />
          <span style={{ flex: 1, fontSize: 11.5, fontWeight: 600, color: "#F5F0EC", lineHeight: 1.45 }}>
            위치 권한이 없어 <span style={{ fontWeight: 900, color: "#fff" }}>{DEFAULT_ORIGIN.label}</span>를 기준으로 보여주고 있어요
          </span>
          {/* 브라우저는 사용자 조작이 있을 때 권한 창을 안정적으로 띄우므로 버튼으로 다시 요청한다 */}
          <button
            onClick={() => getOrigin().then(setOrigin)}
            style={{ flex: "none", border: "none", borderRadius: 8, padding: "7px 11px", background: C.coral, color: "#fff", fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}
          >
            내 위치 쓰기
          </button>
        </div>
      )}

      <div style={{ flex: 1, pointerEvents: "none" }} />
      <InfoCard park={active} />
    </div>
  );
}

// ── 실제 카카오 지도 ────────────────────────────────────
function KakaoMap({ parks, origin, idx, onPick }) {
  const boxRef = useRef(null);
  const mapRef = useRef(null);
  const overlaysRef = useRef([]);

  // 지도 생성 (한 번만)
  useEffect(() => {
    const { kakao } = window;
    if (!boxRef.current || mapRef.current) return;
    mapRef.current = new kakao.maps.Map(boxRef.current, {
      center: new kakao.maps.LatLng(origin.lat, origin.lng),
      level: 6,
    });
  }, [origin.lat, origin.lng]);

  // 마커·내 위치·연결선 갱신
  useEffect(() => {
    const { kakao } = window;
    const map = mapRef.current;
    if (!map) return;

    overlaysRef.current.forEach((o) => o.setMap(null));
    overlaysRef.current = [];

    parks.forEach((p, i) => {
      const on = i === idx;
      const el = document.createElement("div");
      el.style.cssText = "display:flex;flex-direction:column;align-items:center;gap:3px;cursor:pointer;transform:translateY(-50%)";
      el.innerHTML =
        `<div style="padding:4px 8px;border-radius:7px;background:#fff;font-size:10.5px;font-weight:700;color:${C.ink};box-shadow:0 2px 8px rgba(60,40,30,.18);white-space:nowrap">${p.name}</div>` +
        `<div style="width:${on ? 22 : 16}px;height:${on ? 22 : 16}px;border-radius:50%;background:${on ? C.coral : C.muted};border:3px solid #fff;box-shadow:0 2px 7px rgba(60,40,30,.3)"></div>`;
      el.onclick = () => onPick(i);

      const ov = new kakao.maps.CustomOverlay({
        position: new kakao.maps.LatLng(p.lat, p.lng),
        content: el,
        zIndex: on ? 5 : 3,
      });
      ov.setMap(map);
      overlaysRef.current.push(ov);
    });

    // 내 위치
    const me = document.createElement("div");
    me.style.cssText = "display:flex;flex-direction:column;align-items:center;gap:4px";
    me.innerHTML =
      `<div style="width:18px;height:18px;border-radius:50%;background:${C.blue};border:3px solid #fff;box-shadow:0 0 0 9px rgba(47,107,214,.16)"></div>` +
      `<div style="padding:4px 9px;border-radius:7px;background:${C.ink};color:#fff;font-size:10.5px;font-weight:700;white-space:nowrap">${origin.label}</div>`;
    const meOv = new kakao.maps.CustomOverlay({
      position: new kakao.maps.LatLng(origin.lat, origin.lng),
      content: me,
      zIndex: 4,
    });
    meOv.setMap(map);
    overlaysRef.current.push(meOv);

    // 직선을 그리면 건물·하천을 가로지르는 경로처럼 보여 오해를 준다.
    // 실제 도보 경로는 아래 "카카오맵으로 길 안내"로 넘긴다.
    const sel = parks[idx];

    // 내 위치와 선택한 공원이 모두 보이도록 맞춘다
    const bounds = new kakao.maps.LatLngBounds();
    bounds.extend(new kakao.maps.LatLng(origin.lat, origin.lng));
    bounds.extend(new kakao.maps.LatLng(sel.lat, sel.lng));
    map.setBounds(bounds, 90, 40, 260, 40);
  }, [parks, origin, idx, onPick]);

  return <div ref={boxRef} style={{ position: "absolute", inset: 0 }} />;
}

// ── SDK 실패 시 대체 뷰 ─────────────────────────────────
function FallbackMap({ parks, origin, idx, onPick, failed }) {
  const { pins, me } = useMemo(
    () => projectPins(parks, origin, { left: 58, top: 190, width: 260, height: 300 }),
    [parks, origin]
  );

  return (
    <>
      <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(0deg,rgba(255,255,255,.9) 0 3px,transparent 3px 62px),repeating-linear-gradient(90deg,rgba(255,255,255,.9) 0 3px,transparent 3px 74px),#E4E9E1" }} />
      <div style={{ position: "absolute", left: -40, top: 150, width: 250, height: 190, borderRadius: "46% 54% 60% 40%", background: "#D2E0CE" }} />
      <div style={{ position: "absolute", right: -60, top: 400, width: 230, height: 210, borderRadius: "52% 48% 40% 60%", background: "#D2E0CE" }} />
      <div style={{ position: "absolute", left: 16, bottom: 250, font: "600 10px ui-monospace,Menlo,monospace", color: "#8A9384", letterSpacing: ".04em" }}>
        {failed ? "지도를 불러오지 못했어요 · 좌표 기준 표시" : "지도 불러오는 중…"} — {PARKS_META.source}
      </div>

      {pins.map((p, i) => (
        <div
          key={p.name + i}
          onClick={() => onPick(i)}
          style={{ position: "absolute", left: p.x, top: p.y, transform: "translate(-50%,-100%)", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, zIndex: i === idx ? 3 : 2 }}
        >
          <div style={{ padding: "4px 8px", borderRadius: 7, background: "#fff", fontSize: 10.5, fontWeight: 700, color: C.ink, boxShadow: "0 2px 8px rgba(60,40,30,.18)", whiteSpace: "nowrap" }}>
            {p.name}
          </div>
          <div style={{ width: i === idx ? 22 : 16, height: i === idx ? 22 : 16, borderRadius: "50%", background: i === idx ? C.coral : C.muted, border: "3px solid #fff", boxShadow: "0 2px 7px rgba(60,40,30,.3)" }} />
        </div>
      ))}

      <div style={{ position: "absolute", left: me.x, top: me.y, transform: "translate(-50%,-50%)", width: 18, height: 18, borderRadius: "50%", background: C.blue, border: "3px solid #fff", boxShadow: "0 0 0 9px rgba(47,107,214,.16)" }} />
      <div style={{ position: "absolute", left: me.x, top: me.y + 24, transform: "translateX(-50%)", padding: "4px 9px", borderRadius: 7, background: C.ink, color: "#fff", fontSize: 10.5, fontWeight: 700, whiteSpace: "nowrap" }}>
        {origin.label}
      </div>
    </>
  );
}

// ── 공통 조각 ───────────────────────────────────────────
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

function InfoCard({ park }) {
  return (
    <div style={{ position: "relative", margin: "0 14px max(30px, env(safe-area-inset-bottom))", background: "#fff", borderRadius: 20, padding: "18px 18px 16px", boxShadow: "0 12px 30px rgba(60,40,30,.18)", zIndex: 5 }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 19, fontWeight: 900, letterSpacing: "-.6px", color: C.ink }}>{park.name}</div>
          <div style={{ marginTop: 4, fontSize: 12.5, fontWeight: 500, color: C.sub2 }}>{park.desc}</div>
        </div>
        <div style={{ fontSize: 10.5, fontWeight: 700, color: C.coral, background: "rgba(222,82,50,.1)", padding: "5px 9px", borderRadius: 7, whiteSpace: "nowrap" }}>
          {park.tag}
        </div>
      </div>

      <div style={{ marginTop: 14, display: "flex", borderTop: "1px solid rgba(26,21,18,.08)", paddingTop: 13 }}>
        <Cell label="직선거리" value={park.dist} />
        <Cell label="도보" value={park.walk} />
        <Cell label="한 바퀴" value={park.loop} />
      </div>

      <a
        href={routeLink(park)}
        target="_blank"
        rel="noopener noreferrer"
        style={{ marginTop: 14, height: 52, borderRadius: 13, background: C.coral, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15.5, fontWeight: 700, textDecoration: "none" }}
      >
        카카오맵으로 길 안내
      </a>
    </div>
  );
}

const Cell = ({ label, value }) => (
  <div style={{ flex: 1 }}>
    <div style={{ fontSize: 10.5, fontWeight: 700, color: C.faint }}>{label}</div>
    <div style={{ marginTop: 2, fontSize: 19, fontWeight: 900, color: C.ink }}>{value}</div>
  </div>
);
