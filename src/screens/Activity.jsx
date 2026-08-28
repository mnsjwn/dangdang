import { useEffect, useRef, useState } from "react";
import { C, LINE, screen } from "../theme.js";
import { Back, ActIcon, Primary, TextLink, Stamp } from "../ui.jsx";
import { kcal as calcKcal } from "../lib/engine.js";

/** 완료 시 짧은 3음 차임 (외부 음원 없이 WebAudio로) */
function chime() {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ac = new AC();
    if (ac.state === "suspended") ac.resume();
    [[880, 0], [1174.7, 0.18], [1567.98, 0.36]].forEach(([freq, at]) => {
      const t = ac.currentTime + at;
      const osc = ac.createOscillator();
      const g = ac.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.22, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0008, t + 0.75);
      osc.connect(g).connect(ac.destination);
      osc.start(t);
      osc.stop(t + 0.8);
    });
  } catch {
    /* 소리는 부가 기능이라 실패해도 넘어간다 */
  }
}

// ── 타이머 ──────────────────────────────────────────────
export function Timer({ activity, weight, onBack, onDone }) {
  const total = activity.minutes * 60;
  const [left, setLeft] = useState(total);
  const [running, setRunning] = useState(true);
  const doneRef = useRef(false);

  useEffect(() => {
    if (!running) return;
    const iv = setInterval(() => {
      setLeft((v) => {
        if (v <= 1) {
          clearInterval(iv);
          if (!doneRef.current) {
            doneRef.current = true;
            chime();
            onDone({ minutes: activity.minutes });
          }
          return 0;
        }
        return v - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [running, activity.minutes, onDone]);

  const elapsed = total - left;
  const isStairs = activity.kind === "stairs";

  return (
    <div style={screen("64px 22px 40px")}>
      <Back onClick={onBack} />

      <div style={{ marginTop: 14, display: "flex", flexDirection: "column", alignItems: "center", animation: "dd-rise .45s .05s ease-out both" }}>
        <div style={{ width: 56, height: 56, borderRadius: 15, background: "rgba(222,82,50,.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <ActIcon kind={activity.kind} size={30} />
        </div>
        <div style={{ marginTop: 12, fontSize: 24, fontWeight: 900, letterSpacing: "-.8px", color: C.ink }}>
          {isStairs ? "계단오르기" : "걷기"}
        </div>
        <div style={{ marginTop: 5, fontSize: 13, fontWeight: 600, color: C.muted }}>
          {isStairs ? "한 층씩 천천히 올라가요" : "편한 속도로 걸으면 충분해요"}
        </div>
      </div>

      <div style={{ marginTop: 26, display: "flex", justifyContent: "center" }}>
        <div style={{ position: "relative", width: 268, height: 268 }}>
          <svg width="268" height="268" viewBox="0 0 268 268">
            <circle cx="134" cy="134" r="118" fill="none" stroke={C.track} strokeWidth="14" />
            <circle
              cx="134" cy="134" r="118" fill="none" stroke={C.coral} strokeWidth="14"
              strokeLinecap="round" strokeDasharray="741.4"
              strokeDashoffset={741.4 * (left / (total || 1))}
              transform="rotate(-90 134 134)"
              style={{ transition: "stroke-dashoffset .5s linear" }}
            />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: C.faint, letterSpacing: ".06em" }}>남은 시간</div>
            <div style={{ fontSize: 56, fontWeight: 900, letterSpacing: "-2.5px", color: C.ink, lineHeight: 1.1, fontVariantNumeric: "tabular-nums" }}>
              {String(Math.floor(left / 60)).padStart(2, "0")}:{String(left % 60).padStart(2, "0")}
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.coral }}>
              {Math.round((elapsed / (total || 1)) * 100)}% 완료
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 22, display: "flex", gap: 9, animation: "dd-rise .5s .3s ease-out both" }}>
        <Stat label="예상 소모 칼로리" value={Math.round(activity.met * (Number(weight) || 62) * (elapsed / 3600))} unit="kcal" color={C.ink} />
        <Stat label="움직인 시간" value={Math.floor(elapsed / 60)} unit="분" color={C.coral} />
      </div>

      <div style={{ flex: 1, minHeight: 18 }} />
      <Primary onClick={() => setRunning((r) => !r)}>{running ? "잠시 멈추기" : "이어서 하기"}</Primary>
      <TextLink
        onClick={() => {
          if (doneRef.current) return;
          doneRef.current = true;
          chime();
          onDone({ minutes: Math.max(1, Math.round(elapsed / 60)) });
        }}
      >
        완료 처리하기
      </TextLink>
    </div>
  );
}

const Stat = ({ label, value, unit, color }) => (
  <div style={{ flex: 1, background: C.mint, border: `1px solid ${LINE.mintSoft}`, borderRadius: 13, padding: "13px 14px" }}>
    <div style={{ fontSize: 11, fontWeight: 700, color: C.faint }}>{label}</div>
    <div style={{ marginTop: 4, fontSize: 20, fontWeight: 900, color }}>
      {value}
      <span style={{ fontSize: 12, fontWeight: 700, color: C.muted }}> {unit}</span>
    </div>
  </div>
);

// ── 완료 · 스탬프 ───────────────────────────────────────
export function Done({ activity, movedMinutes, weight, onHome, onMy }) {
  const d = new Date();
  const isStairs = activity.kind === "stairs";
  const title = isStairs ? "계단오르기" : "걷기";
  const kcal = calcKcal(movedMinutes, activity.met, weight);

  return (
    <div style={{ ...screen("110px 22px 40px"), alignItems: "center" }}>
      <Stamp size={148} date={`${d.getMonth() + 1}.${d.getDate()}`} label={`${title} 완료`} />

      <div style={{ marginTop: 26, fontSize: 26, fontWeight: 900, letterSpacing: "-1px", color: C.ink, textAlign: "center", animation: "dd-rise .5s .42s ease-out both" }}>
        오늘 스탬프를 받았어요
      </div>
      <div style={{ marginTop: 8, fontSize: 13.5, lineHeight: 1.7, color: C.sub2, textAlign: "center" }}>
        {title} {movedMinutes}분을 마쳤어요. 이 정도면 이제 졸음은 오지 않을 거예요.
      </div>

      <div style={{ marginTop: 22, width: "100%", display: "flex", flexDirection: "column", gap: 10, animation: "dd-rise .5s .56s ease-out both" }}>
        <BigRow label="소모 칼로리" value={kcal} unit="kcal" color={C.ink} />
        <BigRow label="움직인 시간" value={movedMinutes} unit="분" color={C.coral} />
      </div>
      <div style={{ marginTop: 10, fontSize: 11.5, lineHeight: 1.6, color: C.faint, textAlign: "center" }}>
        몸무게 {weight}kg · MET 기반 추정치예요.
      </div>

      <div style={{ flex: 1, minHeight: 20 }} />
      <Primary onClick={onHome}>홈 화면으로 돌아가기</Primary>
      <TextLink onClick={onMy}>마이페이지에서 기록 보기</TextLink>
    </div>
  );
}

const BigRow = ({ label, value, unit, color }) => (
  <div style={{ background: C.mint, border: `1px solid ${LINE.mintSoft}`, borderRadius: 16, padding: "17px 19px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
    <div style={{ fontSize: 14.5, fontWeight: 700, color: C.body }}>{label}</div>
    <div style={{ fontSize: 27, fontWeight: 900, letterSpacing: "-1px", color, lineHeight: 1 }}>
      {value}
      <span style={{ fontSize: 13, fontWeight: 700, color: C.muted }}> {unit}</span>
    </div>
  </div>
);
