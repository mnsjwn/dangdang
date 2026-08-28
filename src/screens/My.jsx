import { useState } from "react";
import { toast } from "sonner";
import { C, LINE, screen } from "../theme.js";
import { Avatar, Back, Primary, TabBar, Field, disclaimer } from "../ui.jsx";
import { glMeta } from "../lib/engine.js";
import * as api from "../lib/api.js";

const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export function My({ profile, stamps, parkCount, onEdit, onMap, onFood, onLogout }) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const todayStr = iso(now);

  // 이번 달 스탬프
  const monthStamps = stamps.filter((s) => {
    const d = new Date(s.date);
    return d.getFullYear() === year && d.getMonth() === month;
  });
  const stampDays = new Set(monthStamps.map((s) => Number(String(s.date).slice(8, 10))));
  const totalMinutes = stamps.reduce((a, s) => a + (Number(s.minutes) || 0), 0);

  // 활동한 날 기준으로, 그 활동이 식후 혈당 피크를 얼마나 낮췄는지의 평균.
  // (스탬프에 저장해 둔 dropPercent의 평균 — "실천일 기준"이라는 부제와 맞춘 값)
  const avgDrop = stamps.length
    ? Math.round(stamps.reduce((a, s) => a + (Number(s.dropPercent) || 0), 0) / stamps.length)
    : 0;

  const stats = [
    { label: "실천일수", value: stampDays.size, unit: `일 / ${month + 1}월`, color: C.ink },
    { label: "졸음 감소율", value: `${avgDrop}%`, unit: "실천일 평균", color: C.coral },
    { label: "누적 활동", value: totalMinutes, unit: "분", color: C.ink },
  ];

  // 달력 (일요일 시작, 6주 그리드)
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = Array.from({ length: 42 }, (_, i) => {
    const day = i - firstDay + 1;
    const inMonth = day >= 1 && day <= daysInMonth;
    const stamped = inMonth && stampDays.has(day);
    const today = inMonth && day === now.getDate();
    return { day: inMonth ? day : "", inMonth, stamped, today };
  });

  // 최근 7일 졸음 위험 (스탬프에 기록된 그날의 총 GL)
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (6 - i));
    const key = iso(d);
    const hit = stamps.filter((s) => String(s.date).slice(0, 10) === key);
    const gl = hit.length ? Math.max(...hit.map((s) => Number(s.totalGL) || 0)) : 0;
    return { key, gl, label: key === todayStr ? "오늘" : String(d.getDate()) };
  });
  const maxGL = Math.max(60, ...days.map((d) => d.gl));
  const avgGL = Math.round(days.reduce((a, d) => a + d.gl, 0) / days.length);

  return (
    <div style={{ ...screen("0"), minHeight: "100dvh" }}>
      <div style={{ padding: "66px 22px 0", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Avatar size={66} />
          <div>
            <div style={{ fontSize: 23, fontWeight: 900, letterSpacing: "-.9px", color: C.ink }}>
              {profile?.nickname || "당당러"}
            </div>
            <div style={{ marginTop: 3, fontSize: 12, fontWeight: 600, color: C.muted }}>
              {stamps.length ? `기록 ${stamps.length}회` : "첫 기록을 남겨보세요"}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 20, ...panel }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 13, fontWeight: 900, color: C.ink }}>신체정보</span>
            <div onClick={onEdit} style={{ height: 32, padding: "0 12px", borderRadius: 8, border: `1.5px solid ${LINE.inkStrong}`, display: "flex", alignItems: "center", fontSize: 12, fontWeight: 700, color: C.body, cursor: "pointer" }}>
              수정
            </div>
          </div>
          <div style={{ marginTop: 13, display: "flex" }}>
            <Metric label="몸무게" value={profile?.weight} unit="kg" />
            <Metric label="키" value={profile?.height} unit="cm" />
            <Metric label="나이" value={profile?.age} unit="세" />
          </div>
        </div>

        <div style={{ marginTop: 22, fontSize: 13, fontWeight: 900, color: C.ink }}>통계</div>
        <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
          {stats.map((s) => (
            <div key={s.label} style={{ flex: 1, ...panel, padding: "13px 12px" }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: C.faint, lineHeight: 1.3 }}>{s.label}</div>
              <div style={{ marginTop: 6, fontSize: 22, fontWeight: 900, letterSpacing: "-.8px", color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ marginTop: 3, fontSize: 10.5, fontWeight: 700, color: C.muted }}>{s.unit}</div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 12, ...panel }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 13, fontWeight: 900, color: C.ink }}>{year}년 {month + 1}월</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: C.muted }}>스탬프 {stampDays.size}일</span>
          </div>
          <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4 }}>
            {["일", "월", "화", "수", "목", "금", "토"].map((w) => (
              <div key={w} style={{ textAlign: "center", fontSize: 10, fontWeight: 700, color: C.faint2, paddingBottom: 4 }}>{w}</div>
            ))}
            {cells.map((c, i) => (
              <div key={i} style={{ position: "relative", aspectRatio: "1", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 7, border: `1px solid ${c.inMonth ? "rgba(26,21,18,.2)" : "transparent"}`, background: c.today ? C.ink : c.stamped ? "#fff" : c.inMonth ? C.cell : "transparent" }}>
                {c.stamped && (
                  <>
                    <span style={{ position: "absolute", width: 27, height: 27, borderRadius: "50%", border: `2.2px solid ${c.today ? "rgba(255,255,255,.85)" : "rgba(222,82,50,.8)"}`, opacity: 0.9 }} />
                    <span style={{ position: "absolute", width: 20, height: 20, borderRadius: "50%", border: `1px dashed ${c.today ? "rgba(255,255,255,.55)" : "rgba(222,82,50,.45)"}` }} />
                  </>
                )}
                <span style={{ position: "relative", fontSize: 11, fontWeight: c.stamped ? 900 : 500, color: !c.inMonth ? "transparent" : c.today ? "#fff" : c.stamped ? C.coralInk : C.muted2 }}>
                  {c.day}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 12, ...panel }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
            <span style={{ fontSize: 13, fontWeight: 900, color: C.ink }}>최근 7일 졸음 위험</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: C.muted }}>평균 {glMeta(avgGL).label}</span>
          </div>
          <div style={{ marginTop: 14, display: "flex", alignItems: "flex-end", gap: 7, height: 104 }}>
            {days.map((d, i) => (
              <div key={d.key} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, height: "100%", justifyContent: "flex-end" }}>
                <div style={{ width: "100%", borderRadius: "6px 6px 3px 3px", background: i === 6 ? C.coral : "rgba(26,21,18,.16)", height: `${Math.max(3, Math.round((d.gl / maxGL) * 76))}px`, transformOrigin: "bottom center", animation: `dd-grow .55s ${(0.08 + i * 0.06).toFixed(2)}s cubic-bezier(.2,.9,.25,1) both` }} />
                <span style={{ fontSize: 10, fontWeight: 700, color: C.faint2 }}>{d.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ marginTop: 8, fontSize: 11, fontWeight: 600, color: C.faint2 }}>
          막대가 높을수록 식후 졸음이 오기 쉬웠던 날이에요
        </div>

        <div onClick={onMap} style={{ marginTop: 16, background: C.peach, border: `1.5px solid ${LINE.coral}`, borderRadius: 15, padding: "16px 17px", display: "flex", alignItems: "center", gap: 13, cursor: "pointer" }}>
          <div style={{ width: 40, height: 40, borderRadius: 11, background: "rgba(222,82,50,.1)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
            <svg width="18" height="18" viewBox="0 0 18 18">
              <circle cx="9" cy="9" r="7.5" fill="none" stroke={C.coral} strokeWidth="2" />
              <circle cx="9" cy="9" r="2.6" fill={C.coral} />
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 900, color: C.ink }}>가까운 산책로</div>
            <div style={{ marginTop: 3, fontSize: 12, fontWeight: 500, color: C.sub2 }}>
              현재 위치 기준 대전 서구 공원 {parkCount}곳
            </div>
          </div>
          <span style={{ fontSize: 18, color: "#C4B7AE" }}>›</span>
        </div>

        <div style={{ marginTop: 9, ...disclaimer }}>
          모든 수치는 GI·탄수화물·MET 공식을 이용한 <span style={{ fontWeight: 700, color: C.muted }}>추정치</span>이며 의료 진단이 아닙니다.
        </div>
        <div onClick={onLogout} style={{ marginTop: 14, fontSize: 12.5, fontWeight: 700, color: C.faint2, cursor: "pointer" }}>
          로그아웃
        </div>
        <div style={{ height: 26 }} />
      </div>

      <div style={{ position: "sticky", bottom: 0, background: "#fff", padding: "0 22px" }}>
        <TabBar active="my" onFood={onFood} onMy={() => {}} />
      </div>
    </div>
  );
}

const panel = {
  background: "#fff",
  border: `1px solid ${LINE.ink}`,
  borderRadius: 15,
  padding: "16px 17px",
};

const Metric = ({ label, value, unit }) => (
  <div style={{ flex: 1 }}>
    <div style={{ fontSize: 11, fontWeight: 700, color: C.faint }}>{label}</div>
    <div style={{ marginTop: 2, fontSize: 19, fontWeight: 900, color: C.ink }}>
      {value || "—"}
      <span style={{ fontSize: 11, color: C.muted }}> {unit}</span>
    </div>
  </div>
);

// ── 신체정보 수정 ───────────────────────────────────────
export function EditProfile({ profile, onBack, onSaved }) {
  const [f, setF] = useState({
    weight: profile?.weight ?? "", height: profile?.height ?? "", age: profile?.age ?? "",
  });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function save() {
    setBusy(true);
    try {
      const res = await api.updateProfile({ nickname: profile.nickname, ...f });
      if (!res.success) {
        toast.error("저장에 실패했어요.");
        return;
      }
      toast.success("신체정보를 저장했어요.");
      onSaved({ ...profile, ...f });
    } catch {
      toast.error("서버에 연결하지 못했어요.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={screen("66px 22px 40px")}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: -10 }}>
        <Back onClick={onBack} />
        <span style={{ fontSize: 16, fontWeight: 900, color: C.ink }}>신체정보 수정</span>
      </div>

      <div style={{ marginTop: 18, display: "flex", justifyContent: "center" }}>
        <Avatar size={82} />
      </div>

      <div style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 15 }}>
        <Field label="닉네임" value={profile?.nickname || ""} readOnly unit="" />
        <Field label="몸무게" inputMode="numeric" value={f.weight} onChange={set("weight")} unit="kg" />
        <Field label="키" inputMode="numeric" value={f.height} onChange={set("height")} unit="cm" />
        <Field label="나이" inputMode="numeric" value={f.age} onChange={set("age")} unit="세" />
      </div>

      <div style={{ flex: 1, minHeight: 24 }} />
      <Primary onClick={save} disabled={busy}>{busy ? "저장 중…" : "저장하기"}</Primary>
      <div style={{ marginTop: 9, ...disclaimer, textAlign: "center" }}>
        몸무게가 바뀌면 필요한 활동 시간과 소모 칼로리도 다시 계산돼요.
      </div>
    </div>
  );
}
