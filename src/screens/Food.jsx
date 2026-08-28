import { useEffect, useRef, useState } from "react";
import { C, LINE, ITEM_BG, ITEM_BD, screen } from "../theme.js";
import { TabBar } from "../ui.jsx";
import { searchFoods, totalGL, glMeta, CATEGORIES, fromCategory, guessCategory } from "../lib/engine.js";

const todayLabel = () => {
  const d = new Date();
  const w = ["일", "월", "화", "수", "목", "금", "토"][d.getDay()];
  const h = d.getHours();
  const meal = h < 11 ? "아침" : h < 16 ? "점심" : h < 21 ? "저녁" : "야식";
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${w}요일 · ${meal}`;
};

export function Food({ items, setItems, onNext, onMy }) {
  const [query, setQuery] = useState("");
  // idle → loading → confirm → category
  const [phase, setPhase] = useState("idle");
  const [pending, setPending] = useState("");
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  const q = query.trim();
  const matches = q ? searchFoods(q) : [];
  const gl = totalGL(items);
  const meta = glMeta(gl);
  const guess = guessCategory(pending);

  function add(food, est = false) {
    setItems((xs) => {
      const i = xs.findIndex((x) => x.name === food.name);
      if (i >= 0) {
        const next = [...xs];
        next[i] = { ...next[i], serv: next[i].serv + 1 };
        return next;
      }
      return [...xs, { ...food, serv: 1, est }];
    });
    setQuery("");
    setPhase("idle");
    setPending("");
  }

  const bump = (name, d) =>
    setItems((xs) =>
      xs
        .map((x) => (x.name === name ? { ...x, serv: Math.max(0, Math.round((x.serv + d) * 2) / 2) } : x))
        .filter((x) => x.serv > 0)
    );

  function startRecognize() {
    setPending(q);
    setPhase("loading");
    timer.current = setTimeout(() => setPhase("confirm"), 1700);
  }

  return (
    <div style={{ ...screen("0"), minHeight: "100dvh" }}>
      <div style={{ padding: "64px 22px 14px" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.faint }}>{todayLabel()}</div>
            <div style={{ marginTop: 3, fontSize: 26, fontWeight: 900, letterSpacing: "-1px", color: C.ink }}>
              오늘 먹은 음식
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: C.faint }}>식후 졸음 위험</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: meta.color, lineHeight: 1.2 }}>{meta.label}</div>
          </div>
        </div>

        <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 10, height: 50, padding: "0 15px", borderRadius: 13, background: C.field, border: `1.5px solid ${q ? C.coral : "rgba(26,21,18,.12)"}` }}>
          <div style={{ width: 15, height: 15, borderRadius: "50%", border: `2px solid ${C.faint}`, flex: "none" }} />
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPhase("idle"); }}
            placeholder="음식 이름 검색 (예: 김밥)"
            style={{ flex: 1, minWidth: 0, border: "none", outline: "none", background: "transparent", fontSize: 15, fontWeight: 500, color: C.ink }}
          />
        </div>
      </div>

      <div style={{ flex: 1, padding: "0 22px" }}>
        {matches.length > 0 && phase === "idle" && (
          <div style={card}>
            {matches.slice(0, 6).map((f) => (
              <div key={f.name} onClick={() => add(f)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "13px 15px", borderBottom: `1px solid ${LINE.inkSoft}`, cursor: "pointer" }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: C.ink, flex: 1 }}>{f.name}</span>
                <span style={{ fontSize: 11.5, color: C.faint }}>{f.serving}</span>
                <span style={{ fontSize: 19, color: C.coral, fontWeight: 700, width: 16, textAlign: "center" }}>+</span>
              </div>
            ))}
          </div>
        )}

        {q.length > 0 && matches.length === 0 && phase === "idle" && (
          <div style={{ ...card, padding: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.ink, lineHeight: 1.5 }}>
              '{q}'은/는 등록되지 않은 음식이에요
            </div>
            <div style={{ marginTop: 6, fontSize: 12.5, lineHeight: 1.6, color: C.sub2 }}>
              음식 종류를 추정해서 결과를 제공해 드릴게요.
            </div>
            <div onClick={startRecognize} style={{ marginTop: 13, height: 46, borderRadius: 11, background: C.coral, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14.5, fontWeight: 700, cursor: "pointer" }}>
              음식 종류 인식하기
            </div>
          </div>
        )}

        {phase === "loading" && (
          <div style={{ ...card, padding: 18, display: "flex", alignItems: "center", gap: 13 }}>
            <div style={{ width: 22, height: 22, borderRadius: "50%", border: "2.5px solid rgba(222,82,50,.2)", borderTopColor: C.coral, animation: "dd-spin .8s linear infinite", flex: "none" }} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>미등록 음식을 인식하고 있어요…</div>
              <div style={{ marginTop: 4, fontSize: 12, color: C.muted }}>'{pending}' 분석 중</div>
            </div>
          </div>
        )}

        {phase === "confirm" && (
          <div style={{ background: C.peach2, border: "1px solid rgba(222,82,50,.4)", borderRadius: 13, padding: 17, animation: "dd-pop .22s ease-out", boxShadow: "0 6px 18px rgba(60,40,30,.07)" }}>
            <div style={{ fontSize: 16, fontWeight: 900, color: C.ink, lineHeight: 1.45 }}>{guess}가 맞나요?</div>
            <div style={{ marginTop: 6, fontSize: 12.5, lineHeight: 1.6, color: C.sub2 }}>
              '{pending}'을 {guess}로 보고 졸음 위험을 계산할게요.
            </div>
            <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
              <div onClick={() => add(fromCategory(guess, `${pending} (${guess} 추정)`), true)} style={sheetBtn(C.coral, "#fff")}>맞아요</div>
              <div onClick={() => setPhase("category")} style={{ ...sheetBtn(C.field, C.ink), border: `1.5px solid ${LINE.inkStrong}` }}>아니에요, 직접 고를게요</div>
            </div>
          </div>
        )}

        {phase === "category" && (
          <div style={{ ...card, padding: 17, animation: "dd-pop .22s ease-out" }}>
            <div style={{ fontSize: 15, fontWeight: 900, color: C.ink }}>'{pending}'은 어떤 종류인가요?</div>
            <div style={{ marginTop: 13, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {CATEGORIES.map((c) => (
                <div
                  key={c.label}
                  onClick={() => add(fromCategory(c.label, `${pending} (${c.label})`), true)}
                  style={{ height: 48, borderRadius: 11, background: C.field, border: `1.5px solid ${LINE.inkStrong}`, display: "flex", alignItems: "center", padding: "0 13px", cursor: "pointer", fontSize: 14, fontWeight: 700, color: C.ink }}
                >
                  {c.label}
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 9 }}>
          {items.map((it, n) => (
            <div key={it.name} style={{ background: ITEM_BG[n % 4], border: `1px solid ${ITEM_BD[n % 4]}`, borderRadius: 14, padding: "13px 14px", display: "flex", alignItems: "center", gap: 11 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <span style={{ fontSize: 15.5, fontWeight: 700, color: C.ink }}>{it.name}</span>
                  {it.est && <span style={{ fontSize: 10, fontWeight: 700, color: C.faint }}>추정</span>}
                </div>
                <div style={{ marginTop: 3, fontSize: 11.5, color: C.sub2 }}>
                  GI {it.gi} · 탄수 {Math.round(it.carbs * it.serv)}g
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 2, background: C.chip, borderRadius: 10, padding: 3 }}>
                <div onClick={() => bump(it.name, -0.5)} style={stepBtn}>−</div>
                <div style={{ width: 42, textAlign: "center", fontSize: 14, fontWeight: 700, color: C.ink }}>
                  {(it.serv % 1 ? it.serv.toFixed(1) : it.serv) + "인분"}
                </div>
                <div onClick={() => bump(it.name, 0.5)} style={stepBtn}>+</div>
              </div>
              <div onClick={() => setItems((xs) => xs.filter((x) => x.name !== it.name))} style={{ width: 34, height: 34, borderRadius: 9, border: `1px solid ${LINE.inkSoft}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 17, color: C.muted2, flex: "none" }}>
                ×
              </div>
            </div>
          ))}
        </div>

        {items.length === 0 && (
          <div style={{ marginTop: 10, border: `1.5px dashed ${LINE.inkSoft}`, borderRadius: 14, padding: "26px 18px", textAlign: "center" }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: C.sub2 }}>아직 기록이 없어요</div>
            <div style={{ marginTop: 5, fontSize: 12, color: C.faint }}>위 검색창에서 먹은 음식을 추가해 보세요.</div>
          </div>
        )}
        <div style={{ height: 20 }} />
      </div>

      <div style={{ position: "sticky", bottom: 0, background: "linear-gradient(180deg,rgba(255,255,255,0) 0%,#FFFFFF 34%)", padding: "16px 22px 0" }}>
        <div
          onClick={items.length ? onNext : undefined}
          style={{ height: 56, borderRadius: 14, background: items.length ? C.ink : "#D8CFC8", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16.5, fontWeight: 700, cursor: items.length ? "pointer" : "default" }}
        >
          다음 단계로
        </div>
        <div style={{ height: 14 }} />
        <TabBar active="food" onFood={() => {}} onMy={onMy} />
      </div>
    </div>
  );
}

const card = {
  background: C.field,
  border: "1px solid rgba(26,21,18,.18)",
  borderRadius: 13,
  overflow: "hidden",
  boxShadow: "0 6px 18px rgba(60,40,30,.07)",
};

const stepBtn = {
  width: 36, height: 36, borderRadius: 8, display: "flex", alignItems: "center",
  justifyContent: "center", cursor: "pointer", fontSize: 19, fontWeight: 700,
  color: C.body, background: "#fff",
};

const sheetBtn = (bg, fg) => ({
  height: 48, borderRadius: 11, background: bg, color: fg, display: "flex",
  alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 700, cursor: "pointer",
});
