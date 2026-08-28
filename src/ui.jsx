// 화면들이 공유하는 작은 조각들
import { C, LINE } from "./theme.js";

export function WalkIcon({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 26 26">
      <rect x="4.5" y="3.5" width="7" height="11.5" rx="3.5" fill={C.coral} transform="rotate(-13 8 9.2)" />
      <rect x="14.5" y="11" width="7" height="11.5" rx="3.5" fill={C.coral} opacity=".5" transform="rotate(-13 18 16.7)" />
    </svg>
  );
}

export function StairsIcon({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 26 26">
      <path d="M3 22h6v-5h6v-5h6V7" fill="none" stroke={C.coral} strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

export const ActIcon = ({ kind, size }) =>
  kind === "stairs" ? <StairsIcon size={size} /> : <WalkIcon size={size} />;

export function Avatar({ size = 54 }) {
  const r1 = size * 0.176, r2 = size * 0.287;
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: C.avatar, overflow: "hidden", flex: "none" }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size * 0.37} r={r1} fill={C.avatarInk} />
        <circle cx={size / 2} cy={size * 0.87} r={r2} fill={C.avatarInk} />
      </svg>
    </div>
  );
}

export function Back({ onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        width: 44, height: 44, marginLeft: -10, display: "flex", alignItems: "center",
        justifyContent: "center", cursor: "pointer", fontSize: 22, color: C.ink,
      }}
    >
      ←
    </div>
  );
}

/** 코랄 메인 버튼. disabled면 회색으로 죽인다(디자인의 #D8CFC8). */
export function Primary({ children, onClick, disabled, style }) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={{
        height: 56, width: "100%", border: "none", borderRadius: 14,
        background: disabled ? "#D8CFC8" : C.coral, color: "#fff",
        fontSize: 16.5, fontWeight: 700, cursor: disabled ? "default" : "pointer",
        transition: "background .16s", ...style,
      }}
    >
      {children}
    </button>
  );
}

export function Ghost({ children, onClick, style }) {
  return (
    <button
      onClick={onClick}
      style={{
        height: 56, width: "100%", borderRadius: 14, background: C.white,
        border: `1.5px solid ${LINE.inkStrong}`, color: C.ink,
        fontSize: 16.5, fontWeight: 700, cursor: "pointer", ...style,
      }}
    >
      {children}
    </button>
  );
}

export function TextLink({ children, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        height: 48, color: C.muted, display: "flex", alignItems: "center",
        justifyContent: "center", fontSize: 14, fontWeight: 700, cursor: "pointer",
      }}
    >
      {children}
    </div>
  );
}

export function Field({ label, unit, hint, hintColor, borderColor, ...input }) {
  return (
    <div>
      {label && (
        <div style={{ fontSize: 12.5, fontWeight: 700, color: C.body, marginBottom: 7 }}>{label}</div>
      )}
      <div
        style={{
          display: "flex", alignItems: "center", gap: 10, height: 52, padding: "0 15px",
          borderRadius: 12, border: `1.5px solid ${borderColor || LINE.mint}`, background: C.mint,
        }}
      >
        <input
          {...input}
          style={{
            flex: 1, minWidth: 0, border: "none", outline: "none", background: "transparent",
            fontSize: 16, fontWeight: 500, color: C.ink,
          }}
        />
        {unit && <span style={{ fontSize: 13, fontWeight: 700, color: C.faint }}>{unit}</span>}
      </div>
      {hint && (
        <div style={{ marginTop: 7, fontSize: 12, fontWeight: 600, color: hintColor || C.faint }}>{hint}</div>
      )}
    </div>
  );
}

export function TabBar({ active, onFood, onMy }) {
  const fg = (on) => (on ? C.coral : C.faint2);
  const recordOn = active === "food" || active === "result";
  return (
    <div style={{ display: "flex", borderTop: `1px solid ${LINE.ink}`, padding: "9px 0 max(12px, env(safe-area-inset-bottom))" }}>
      <div onClick={onFood} style={tabStyle}>
        <svg width="21" height="21" viewBox="0 0 21 21">
          <rect x="2.5" y="3.5" width="16" height="14" rx="2.4" fill="none" stroke={fg(recordOn)} strokeWidth="1.9" />
          <line x1="10.5" y1="3.5" x2="10.5" y2="17.5" stroke={fg(recordOn)} strokeWidth="1.9" />
          <line x1="5.6" y1="8" x2="8" y2="8" stroke={fg(recordOn)} strokeWidth="1.6" strokeLinecap="round" />
          <line x1="13" y1="8" x2="15.4" y2="8" stroke={fg(recordOn)} strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        <span style={{ fontSize: 11, fontWeight: 700, color: fg(recordOn) }}>기록</span>
      </div>
      <div onClick={onMy} style={tabStyle}>
        <svg width="21" height="21" viewBox="0 0 21 21">
          <circle cx="10.5" cy="7.6" r="3.4" fill="none" stroke={fg(active === "my")} strokeWidth="1.9" />
          <path d="M4.2 18c0-3.5 2.8-5.4 6.3-5.4s6.3 1.9 6.3 5.4" fill="none" stroke={fg(active === "my")} strokeWidth="1.9" strokeLinecap="round" />
        </svg>
        <span style={{ fontSize: 11, fontWeight: 700, color: fg(active === "my") }}>마이</span>
      </div>
    </div>
  );
}

const tabStyle = {
  flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
  gap: 5, cursor: "pointer", padding: "5px 0",
};

/** 도장 (완료 화면 · 온보딩에서 공용) */
export function Stamp({ size = 148, date, label }) {
  return (
    <div style={{ position: "relative", width: size, height: size, transform: "rotate(-9deg)", animation: "dd-stamp .5s cubic-bezier(.2,1.1,.3,1) both" }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: `5px solid ${C.coral}`, opacity: 0.9 }} />
      <div style={{ position: "absolute", inset: 11, borderRadius: "50%", border: `1.5px dashed rgba(222,82,50,.7)` }} />
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1, opacity: 0.92 }}>
        <div style={{ fontSize: 10, fontWeight: 900, color: C.coral, letterSpacing: ".3em" }}>DANGDANG</div>
        <div style={{ fontSize: 30, fontWeight: 900, color: C.coral, letterSpacing: "-1px", lineHeight: 1.1 }}>{date}</div>
        <div style={{ width: 44, height: 2, background: "rgba(222,82,50,.75)" }} />
        <div style={{ marginTop: 3, fontSize: 11, fontWeight: 900, color: C.coral, letterSpacing: ".06em" }}>{label}</div>
      </div>
    </div>
  );
}

export const Spacer = () => <div style={{ flex: 1, minHeight: 20 }} />;

export const disclaimer = {
  fontSize: 11.5, lineHeight: 1.6, color: C.faint,
};
