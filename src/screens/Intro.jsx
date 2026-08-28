import { useEffect, useState } from "react";
import { C, LINE, screen } from "../theme.js";
import { Primary, Ghost, WalkIcon, StairsIcon, Stamp } from "../ui.jsx";

// ── 스플래시 ────────────────────────────────────────────
export function Splash({ onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 1900);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div
      onClick={onDone}
      style={{ ...screen("0 26px"), height: "100dvh", alignItems: "center", justifyContent: "center", cursor: "pointer", position: "relative" }}
    >
      <div style={{ animation: "dd-pop .5s cubic-bezier(.2,.8,.2,1) both" }}>
        <div style={{ fontSize: 76, fontWeight: 900, letterSpacing: "-4.5px", color: C.ink, lineHeight: 0.9, textAlign: "center" }}>당당</div>
        <div style={{ marginTop: 14, height: 6, borderRadius: 3, background: C.coral, transformOrigin: "left center", animation: "dd-bar .7s .25s cubic-bezier(.2,.8,.2,1) both" }} />
      </div>
      <div style={{ marginTop: 18, fontSize: 14.5, fontWeight: 700, color: C.sub2, textAlign: "center", lineHeight: 1.6, animation: "dd-rise .6s .45s ease-out both" }}>
        밥 먹고 졸리지 않는 오후
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 52, display: "flex", justifyContent: "center", gap: 5, animation: "dd-rise .6s .7s ease-out both" }}>
        {[0, 0.2, 0.4].map((d) => (
          <span key={d} style={{ width: 6, height: 6, borderRadius: "50%", background: C.coral, animation: `dd-pulse 1.2s ${d}s ease-in-out infinite` }} />
        ))}
      </div>
    </div>
  );
}

// ── 온보딩 ──────────────────────────────────────────────
const OB = [
  { step: "STEP 1", title: "먹은 것만 넣으면 끝", body: "음식 이름만 검색해 담으면 돼요.\n칼로리 계산도, 사진 촬영도 필요 없어요." },
  { step: "STEP 2", title: "오후에 졸릴지\n먼저 알려줘요", body: "먹은 음식으로 식후 졸음 위험을 계산해\n지금 몇 분 움직여야 하는지 알려줘요." },
  { step: "STEP 3", title: "걷기와 계단오르기\n중에 골라요", body: "시간이 있으면 걷기, 짧게 끝내려면 계단.\n고른 활동에 맞춰 타이머가 켜져요." },
  { step: "STEP 4", title: "가까운 산책로도\n찾아줘요", body: "지금 위치에서 가까운 대전 서구 공원과\n산책로를 거리·도보 시간과 함께 보여줘요." },
  { step: "STEP 5", title: "움직이면\n도장이 찍혀요", body: "타이머대로 걷거나 계단을 오르면\n그날의 도장이 남아요. 달력에 쌓입니다." },
  { step: "STEP 6", title: "마이페이지에\n기록이 모여요", body: "도장 달력과 최근 7일 졸음 위험,\n실천일수까지 한 화면에서 볼 수 있어요." },
];

export function Onboard({ onFinish }) {
  const [i, setI] = useState(0);
  const last = i === OB.length - 1;

  return (
    <div style={screen("62px 26px 34px")}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 6 }}>
          {OB.map((_, n) => (
            <span key={n} style={{ width: n === i ? 22 : 6, height: 6, borderRadius: 3, background: n === i ? C.coral : "#E2DDD8", transition: "all .25s" }} />
          ))}
        </div>
        <div onClick={onFinish} style={{ fontSize: 13, fontWeight: 700, color: C.muted2, cursor: "pointer", padding: "6px 2px" }}>
          건너뛰기
        </div>
      </div>

      <div key={i} style={{ display: "flex", flexDirection: "column", flex: 1 }}>
        <div style={{ marginTop: 52, fontSize: 12, fontWeight: 900, letterSpacing: ".14em", color: C.coral, animation: "dd-rise .42s .02s ease-out both" }}>
          {OB[i].step}
        </div>
        <div style={{ marginTop: 10, fontSize: 30, fontWeight: 900, letterSpacing: "-1.4px", color: C.ink, lineHeight: 1.3, whiteSpace: "pre-line", animation: "dd-rise .48s .08s ease-out both" }}>
          {OB[i].title}
        </div>
        <div style={{ marginTop: 14, fontSize: 15, fontWeight: 500, lineHeight: 1.7, color: C.sub, whiteSpace: "pre-line", animation: "dd-rise .48s .16s ease-out both" }}>
          {OB[i].body}
        </div>
        <div style={{ marginTop: 34, flex: 1, display: "flex", alignItems: "center", justifyContent: "center", animation: "dd-rise .55s .24s ease-out both" }}>
          <ObArt step={i} />
        </div>
      </div>

      <div style={{ display: "flex", gap: 9 }}>
        {i > 0 && (
          <Ghost onClick={() => setI(i - 1)} style={{ width: 78, flex: "none", fontSize: 15, color: C.body }}>
            이전
          </Ghost>
        )}
        <Primary onClick={() => (last ? onFinish() : setI(i + 1))}>{last ? "당당 시작하기" : "다음"}</Primary>
      </div>
    </div>
  );
}

function ObArt({ step }) {
  if (step === 0)
    return (
      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 9 }}>
        <div style={{ height: 50, borderRadius: 13, background: C.field, border: "1px solid rgba(26,21,18,.18)", display: "flex", alignItems: "center", gap: 10, padding: "0 15px" }}>
          <div style={{ width: 14, height: 14, borderRadius: "50%", border: `2px solid ${C.faint}` }} />
          <span style={{ fontSize: 14.5, fontWeight: 500, color: C.muted2 }}>김치찌개</span>
        </div>
        {[["흰쌀밥 1공기", C.peach, "rgba(200,88,56,.28)"], ["김치찌개", C.mint, LINE.mint]].map(([n, bg, bd]) => (
          <div key={n} style={{ height: 58, borderRadius: 14, background: bg, border: `1px solid ${bd}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px" }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: C.ink }}>{n}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: C.muted }}>1인분</span>
          </div>
        ))}
      </div>
    );

  if (step === 1)
    return (
      <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ position: "relative", width: 196, height: 196 }}>
          <svg width="196" height="196" viewBox="0 0 196 196">
            <circle cx="98" cy="98" r="82" fill="none" stroke={C.track} strokeWidth="16" />
            <circle cx="98" cy="98" r="82" fill="none" stroke={C.coral} strokeWidth="16" strokeLinecap="round" strokeDasharray="515.2" strokeDashoffset="150" transform="rotate(-90 98 98)" style={{ animation: "dd-ob-ring 1.15s .34s cubic-bezier(.22,.9,.24,1) both" }} />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.faint }}>식후 졸음 위험</div>
            <div style={{ fontSize: 34, fontWeight: 900, letterSpacing: "-1.4px", color: C.coral, animation: "dd-pop .4s 1.16s cubic-bezier(.2,1.1,.3,1) both" }}>높아요</div>
          </div>
        </div>
        <div style={{ marginTop: 16, width: "100%", borderRadius: 15, background: C.mint, border: `1px solid ${LINE.mint}`, padding: "15px 16px", animation: "dd-rise .5s 1.32s ease-out both" }}>
          <div style={{ fontSize: 16, fontWeight: 900, color: C.ink, lineHeight: 1.5, textAlign: "center" }}>
            지금 <span style={{ color: C.coral }}>20분</span>은 움직여야<br />오후 졸음을 막을 수 있어요
          </div>
        </div>
      </div>
    );

  if (step === 2)
    return (
      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 10 }}>
        {[
          { icon: <WalkIcon size={24} />, t: "걷기 15분", s: "천천히 걸어도 효과 있어요", on: true, bg: "rgba(222,82,50,.1)" },
          { icon: <StairsIcon size={24} />, t: "계단오르기 10분", s: "짧은 시간에 효과가 커요", on: false, bg: "rgba(26,21,18,.06)" },
        ].map((a) => (
          <div key={a.t} style={{ borderRadius: 15, background: C.mint, border: `1.5px solid ${a.on ? C.coral : LINE.mint}`, padding: "15px 16px", display: "flex", alignItems: "center", gap: 13 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: a.bg, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>{a.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15.5, fontWeight: 900, color: C.ink }}>{a.t}</div>
              <div style={{ marginTop: 3, fontSize: 12.5, fontWeight: 500, color: C.sub2 }}>{a.s}</div>
            </div>
            {a.on && <span style={{ fontSize: 11, fontWeight: 900, color: C.coral }}>선택됨</span>}
          </div>
        ))}
      </div>
    );

  if (step === 3)
    return (
      <div style={{ width: "100%", borderRadius: 16, overflow: "hidden", border: "1px solid rgba(26,21,18,.16)" }}>
        <div style={{ position: "relative", height: 168, background: "repeating-linear-gradient(0deg,rgba(255,255,255,.9) 0 3px,transparent 3px 46px),repeating-linear-gradient(90deg,rgba(255,255,255,.9) 0 3px,transparent 3px 56px),#E4E9E1" }}>
          <div style={{ position: "absolute", left: -20, top: 22, width: 140, height: 104, borderRadius: "46% 54% 60% 40%", background: "#D2E0CE" }} />
          <div style={{ position: "absolute", left: 0, right: 0, top: 112, height: 9, background: "#DCE6EC" }} />
          <div style={{ position: "absolute", left: 44, top: 60, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
            <div style={{ padding: "3px 7px", borderRadius: 6, background: "#fff", fontSize: 9.5, fontWeight: 700, color: C.ink, boxShadow: "0 2px 6px rgba(60,40,30,.2)", whiteSpace: "nowrap" }}>월평근린공원</div>
            <div style={{ width: 16, height: 16, borderRadius: "50%", background: C.coral, border: "3px solid #fff", boxShadow: "0 2px 6px rgba(60,40,30,.3)" }} />
          </div>
          <div style={{ position: "absolute", left: 150, top: 132, width: 14, height: 14, borderRadius: "50%", background: C.blue, border: "3px solid #fff", boxShadow: "0 0 0 7px rgba(47,107,214,.16)" }} />
        </div>
        <div style={{ background: "#fff", padding: "13px 15px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 14.5, fontWeight: 900, color: C.ink }}>월평근린공원</div>
            <div style={{ marginTop: 2, fontSize: 11.5, fontWeight: 500, color: C.sub2 }}>근린공원 · 운동시설</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 15, fontWeight: 900, color: C.coral }}>450m</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.muted }}>도보 7분</div>
          </div>
        </div>
      </div>
    );

  if (step === 4) return <Stamp size={150} date="8.27" label="걷기 완료" />;

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", gap: 8 }}>
        {[
          { l: "실천일수", v: "13", u: "일 / 8월", c: C.ink },
          { l: "졸음 예방률", v: "85%", u: "실천일 기준", c: C.coral },
        ].map((s) => (
          <div key={s.l} style={{ flex: 1, borderRadius: 14, background: "#fff", border: "1px solid rgba(26,21,18,.16)", padding: "13px 12px" }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: C.faint }}>{s.l}</div>
            <div style={{ marginTop: 5, fontSize: 21, fontWeight: 900, color: s.c, lineHeight: 1 }}>{s.v}</div>
            <div style={{ marginTop: 3, fontSize: 10.5, fontWeight: 700, color: C.muted }}>{s.u}</div>
          </div>
        ))}
      </div>
      <div style={{ borderRadius: 15, background: "#fff", border: "1px solid rgba(26,21,18,.16)", padding: "14px 15px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 12, fontWeight: 900, color: C.ink }}>2026년 8월</span>
          <span style={{ fontSize: 10.5, fontWeight: 700, color: C.muted }}>스탬프 13일</span>
        </div>
        <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4 }}>
          {Array.from({ length: 21 }, (_, n) => {
            const day = n + 7;
            const on = [8, 11, 12, 13, 17, 19, 20, 24, 25, 26, 27].includes(day);
            return (
              <div key={day} style={{ position: "relative", aspectRatio: "1", borderRadius: 6, border: "1px solid rgba(26,21,18,.16)", background: on ? "#fff" : C.cell, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {on && <span style={{ position: "absolute", width: 20, height: 20, borderRadius: "50%", border: "1.8px solid rgba(222,82,50,.8)" }} />}
                <span style={{ position: "relative", fontSize: 9.5, fontWeight: on ? 900 : 500, color: on ? C.coralInk : C.muted2 }}>{day}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── 시작 화면 ───────────────────────────────────────────
export function Login({ onSignin, onSignup }) {
  return (
    <div style={screen("120px 26px 40px")}>
      <div style={{ fontSize: 64, fontWeight: 900, letterSpacing: "-3.5px", color: C.ink, lineHeight: 0.95, textAlign: "center", animation: "dd-rise .5s .04s ease-out both" }}>
        당당
      </div>
      <div style={{ marginTop: 14, fontSize: 15.5, fontWeight: 500, lineHeight: 1.65, color: C.sub, textAlign: "center" }}>
        먹은 음식만 입력하면<br />
        <span style={{ color: C.coral, fontWeight: 700 }}>졸리지 않으려면 몇 분</span><br />
        움직여야 하는지 알려줘요.
      </div>

      <div style={{ flex: 1 }} />

      <Primary onClick={onSignin}>로그인</Primary>
      <Ghost onClick={onSignup} style={{ marginTop: 11 }}>회원가입</Ghost>
      <div style={{ marginTop: 10, fontSize: 12, lineHeight: 1.6, color: C.muted, textAlign: "center" }}>
        스탬프 · 통계 · 신체정보가 저장됩니다.
      </div>
      <div style={{ height: 26 }} />
    </div>
  );
}
