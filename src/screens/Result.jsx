import { useState } from "react";
import { C, LINE, screen } from "../theme.js";
import { Back, ActIcon } from "../ui.jsx";
import { totalGL, glMeta, recMinutes, activityOptions } from "../lib/engine.js";

export function Result({ items, weight, onBack, onStart }) {
  const [sel, setSel] = useState(null);
  const [confirming, setConfirming] = useState(false);

  const gl = totalGL(items);
  const meta = glMeta(gl);
  const recMin = recMinutes(gl);
  const acts = activityOptions(gl, weight);

  // 게이지: GL 70을 한 바퀴로 본다 (원 둘레 590.6)
  const gaugeOffset = 590.6 * (1 - Math.min(1, gl / 70));

  const line1 = recMin >= 20 ? "지금 20분은 움직여야" : recMin >= 15 ? "지금부터 15분만 움직이면" : "지금 10분만 걸어도";
  const line2 = recMin >= 20 ? "오후 졸음을 막을 수 있어요" : recMin >= 15 ? "오후에 졸리지 않아요" : "오후가 가뿐해져요";

  const list = [
    { ...acts.walk, title: `걷기 ${acts.walk.minutes}분`, effect: "천천히 걸어도 효과 있어요", iconBg: "rgba(222,82,50,.1)", delay: ".74s" },
    { ...acts.stairs, title: `계단오르기 ${acts.stairs.minutes}분`, effect: "짧은 시간에 효과가 커요", iconBg: "rgba(26,21,18,.06)", delay: ".84s" },
  ];
  const picked = list.find((a) => a.kind === sel);

  return (
    <div style={{ ...screen("64px 22px 40px"), position: "relative" }}>
      <Back onClick={onBack} />
      <div style={{ marginTop: 6, fontSize: 26, fontWeight: 900, letterSpacing: "-1px", color: C.ink }}>
        오늘 식사, 졸음 위험은?
      </div>

      <div style={{ marginTop: 22, display: "flex", justifyContent: "center" }}>
        <div style={{ position: "relative", width: 222, height: 222 }}>
          <svg width="222" height="222" viewBox="0 0 222 222">
            <circle cx="111" cy="111" r="94" fill="none" stroke={C.track} strokeWidth="18" />
            <circle
              cx="111" cy="111" r="94" fill="none" stroke={meta.color} strokeWidth="18"
              strokeLinecap="round" strokeDasharray="590.6" strokeDashoffset={gaugeOffset}
              transform="rotate(-90 111 111)"
              style={{ "--dd-off": gaugeOffset, animation: "dd-ring 1.7s .12s cubic-bezier(.3,.85,.25,1) both" }}
            />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2 }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: C.faint, letterSpacing: ".04em" }}>식후 졸음 위험</div>
            <div style={{ fontSize: 42, fontWeight: 900, letterSpacing: "-2px", color: meta.color, lineHeight: 1.1, whiteSpace: "nowrap" }}>
              {meta.label}
            </div>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: C.faint }}>혈당부하 {gl}</div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 6, textAlign: "center", fontSize: 13.5, fontWeight: 700, color: C.body, animation: "dd-rise .5s .5s ease-out both" }}>
        {meta.sub}
      </div>

      <div style={{ marginTop: 18, background: C.mint, border: `1px solid ${LINE.mintSoft}`, borderRadius: 15, padding: "16px 17px", animation: "dd-rise .5s .62s ease-out both" }}>
        <div style={{ fontSize: 16.5, fontWeight: 900, color: C.ink, lineHeight: 1.5, textAlign: "center" }}>
          {line1}<br /><span style={{ color: C.coral }}>{line2}</span>
        </div>
      </div>

      <div style={{ marginTop: 18, fontSize: 12.5, fontWeight: 700, color: C.body }}>활동 고르기</div>
      <div style={{ marginTop: 9, display: "flex", flexDirection: "column", gap: 10 }}>
        {list.map((a) => (
          <div
            key={a.kind}
            onClick={() => (sel === a.kind ? setConfirming(true) : (setSel(a.kind), setConfirming(false)))}
            style={{
              background: C.mint, border: `1.5px solid ${sel === a.kind ? C.coral : LINE.inkSoft}`,
              borderRadius: 15, padding: "15px 16px", display: "flex", alignItems: "center",
              gap: 14, cursor: "pointer", transition: "border-color .16s",
              animation: `dd-rise .5s ${a.delay} ease-out both`,
            }}
          >
            <div style={{ width: 46, height: 46, borderRadius: 12, background: a.iconBg, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
              <ActIcon kind={a.kind} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 900, color: C.ink }}>{a.title}</div>
              <div style={{ marginTop: 4, fontSize: 12.5, fontWeight: 500, color: C.sub2 }}>
                {a.effect} · 약 {a.kcal}kcal
              </div>
            </div>
            <span style={{ fontSize: 18, color: "#C4B7AE" }}>›</span>
          </div>
        ))}
      </div>

      {confirming && picked && (
        <div style={{ position: "fixed", inset: 0, zIndex: 20, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
          <div onClick={() => setConfirming(false)} style={{ position: "absolute", inset: 0, background: "rgba(26,21,18,.42)", animation: "dd-fade .3s ease-out both" }} />
          <div style={{ position: "relative", margin: "0 12px 26px", background: "#fff", borderRadius: 22, padding: "24px 20px 18px", animation: "dd-sheet .3s ease-out both", boxShadow: "0 16px 40px rgba(60,40,30,.28)" }}>
            <div style={{ fontSize: 21, fontWeight: 900, letterSpacing: "-.7px", color: C.ink, textAlign: "center", lineHeight: 1.4 }}>
              {picked.title}으로 시작할까요?
            </div>
            <div style={{ marginTop: 8, fontSize: 13, fontWeight: 500, color: C.sub2, textAlign: "center", lineHeight: 1.6 }}>
              시작하면 타이머가 바로 켜져요.<br />중간에 멈추거나 완료 처리할 수 있어요.
            </div>
            <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 9 }}>
              <div onClick={() => onStart(picked)} style={{ height: 54, borderRadius: 14, background: C.coral, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, cursor: "pointer" }}>
                {picked.title} 시작
              </div>
              <div onClick={() => setConfirming(false)} style={{ height: 52, borderRadius: 14, background: C.cell, color: C.body, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
                다시 고를게요
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
