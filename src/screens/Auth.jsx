import { useState } from "react";
import { toast } from "sonner";
import { C, LINE, screen } from "../theme.js";
import { Primary, Back, Field, TextLink, Avatar } from "../ui.jsx";
import * as api from "../lib/api.js";
import { getOrigin } from "../lib/geo.js";

// ── 로그인 ──────────────────────────────────────────────
export function Signin({ onBack, onSignup, onSuccess }) {
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState(false);
  const [busy, setBusy] = useState(false);
  const [keep, setKeep] = useState(true);

  const ready = id.trim() && pw.length >= 4;

  async function submit() {
    if (!ready || busy) return;
    setBusy(true);
    try {
      const res = await api.login({ nickname: id.trim(), password: pw });
      if (!res.success) {
        setErr(true);
        return;
      }
      // 모바일 브라우저는 사용자 조작에 붙은 요청일 때 권한 창을 확실히 띄운다.
      // 거부해도 기본 좌표로 동작하므로 결과는 기다리지 않는다.
      getOrigin().catch(() => {});
      onSuccess(res.profile, keep);
    } catch (e) {
      toast.error("서버에 연결하지 못했어요. 잠시 뒤 다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={screen("66px 22px 34px")}>
      <Back onClick={onBack} />
      <div style={{ marginTop: 10, fontSize: 27, fontWeight: 900, letterSpacing: "-1.1px", color: C.ink, lineHeight: 1.25 }}>
        다시 오셨네요
      </div>
      <div style={{ marginTop: 9, fontSize: 13, lineHeight: 1.6, color: C.sub2 }}>
        닉네임과 비밀번호로 로그인하세요.
      </div>

      <div style={{ marginTop: 26, display: "flex", flexDirection: "column", gap: 16 }}>
        <Field
          label="닉네임" placeholder="당당러" value={id}
          onChange={(e) => { setId(e.target.value); setErr(false); }}
        />
        <Field
          label="비밀번호" type="password" placeholder="••••••••" value={pw}
          onChange={(e) => { setPw(e.target.value); setErr(false); }}
          borderColor={err ? C.coral : undefined}
          hint={err ? "닉네임 또는 비밀번호가 맞지 않아요." : "8자 이상, 영문과 숫자를 섞어 주세요."}
          hintColor={err ? C.coral : C.faint}
        />
      </div>

      <div style={{ marginTop: 18 }}>
        <div onClick={() => setKeep(!keep)} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
          <div style={{ width: 20, height: 20, borderRadius: 6, border: `1.5px solid ${keep ? C.coral : "rgba(26,21,18,.26)"}`, background: keep ? C.coral : "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 900, color: "#fff" }}>
            {keep ? "✓" : ""}
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: C.body }}>로그인 상태 유지</span>
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 24 }} />
      <Primary onClick={submit} disabled={!ready || busy}>{busy ? "확인 중…" : "로그인"}</Primary>
      <TextLink onClick={onSignup}>처음이신가요? 회원가입</TextLink>
    </div>
  );
}

// ── 회원가입 ────────────────────────────────────────────
export function Signup({ onBack, onSuccess }) {
  const [f, setF] = useState({ nickname: "", password: "", weight: "62", height: "170", age: "22" });
  const [taken, setTaken] = useState(false);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => { setF({ ...f, [k]: e.target.value }); if (k === "nickname") setTaken(false); };

  const nick = f.nickname.trim();
  const pwOk = f.password.length >= 8 && /[A-Za-z]/.test(f.password) && /[0-9]/.test(f.password);
  const ready = nick.length >= 2 && nick.length <= 10 && pwOk && !taken;

  async function submit() {
    if (!ready || busy) return;
    setBusy(true);
    try {
      const res = await api.register({ ...f, nickname: nick });
      if (!res.success) {
        if (res.code === "duplicate") setTaken(true);
        else toast.error(res.message || "가입에 실패했어요.");
        return;
      }
      toast.success(`${nick}님, 반가워요!`);
      getOrigin().catch(() => {});
      onSuccess({ nickname: nick, weight: f.weight, height: f.height, age: f.age });
    } catch (e) {
      toast.error("서버에 연결하지 못했어요.");
    } finally {
      setBusy(false);
    }
  }

  const nickMsg = taken
    ? "이미 사용 중인 닉네임이에요. 다른 이름을 써주세요."
    : nick.length === 1
    ? "2자 이상 입력해 주세요."
    : "2~10자로 지어주세요.";

  return (
    <div style={screen("66px 22px 34px")}>
      <Back onClick={onBack} />
      <div style={{ marginTop: 10, fontSize: 27, fontWeight: 900, letterSpacing: "-1.1px", color: C.ink, lineHeight: 1.25 }}>
        닉네임과 신체정보를 알려주세요
      </div>
      <div style={{ marginTop: 9, fontSize: 13, lineHeight: 1.6, color: C.sub2 }}>
        몸무게·키·나이로 얼마나 움직여야 오후 졸음을 막을 수 있는지 계산해요.
        가까운 산책로를 찾기 위해 위치 권한도 함께 요청해요.
      </div>

      <div style={{ marginTop: 26, display: "flex", flexDirection: "column", gap: 16 }}>
        <Field
          label="닉네임" placeholder="당당이" value={f.nickname} onChange={set("nickname")}
          borderColor={taken ? C.coral : undefined}
          hint={nickMsg} hintColor={taken ? C.coral : C.faint}
        />
        <Field
          label="비밀번호" type="password" placeholder="••••••••" value={f.password} onChange={set("password")}
          hint="8자 이상, 영문과 숫자를 섞어 주세요."
          hintColor={f.password && !pwOk ? C.coral : C.faint}
        />
        {/* flex 아이템은 기본 min-width가 auto라 input의 기본 너비 밑으로 안 줄어든다.
            minWidth: 0 을 줘야 좁은 화면에서 폰 폭을 넘지 않는다. */}
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Field label="몸무게 (kg)" inputMode="numeric" value={f.weight} onChange={set("weight")} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Field label="키 (cm)" inputMode="numeric" value={f.height} onChange={set("height")} />
          </div>
          <div style={{ flex: "0 1 76px", minWidth: 0 }}>
            <Field label="나이" inputMode="numeric" value={f.age} onChange={set("age")} />
          </div>
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 30 }} />
      <Primary onClick={submit} disabled={!ready || busy}>{busy ? "가입 중…" : "시작하기"}</Primary>
    </div>
  );
}

// ── 재방문 환영 ─────────────────────────────────────────
export function Welcome({ profile, stampCount, totalMinutes, onStart, onSwitch }) {
  return (
    <div style={{ ...screen("120px 26px 40px"), height: "100dvh" }}>
      <div style={{ animation: "dd-rise .5s .04s ease-out both" }}>
        <Avatar size={54} />
        <div style={{ marginTop: 20, fontSize: 32, fontWeight: 900, letterSpacing: "-1.5px", color: C.ink, lineHeight: 1.28 }}>
          {profile?.nickname || "당당러"}님,<br />안녕하세요
        </div>
        <div style={{ marginTop: 12, fontSize: 15.5, fontWeight: 500, lineHeight: 1.65, color: C.sub }}>
          오늘도 <span style={{ color: C.coral, fontWeight: 700 }}>식후 졸음 예측</span>을<br />시작해 볼까요?
        </div>
      </div>

      <div style={{ marginTop: 26, borderRadius: 16, background: C.mint, border: `1px solid ${LINE.mint}`, padding: "16px 17px", animation: "dd-rise .5s .18s ease-out both" }}>
        <Row label="이번 달 도장" value={`${stampCount}일`} color={C.coral} />
        <div style={{ height: 11 }} />
        <Row label="누적 활동" value={`${totalMinutes}분`} color={C.ink} />
      </div>

      <div style={{ flex: 1 }} />
      <Primary onClick={onStart}>시작하기</Primary>
      <TextLink onClick={onSwitch}>다른 계정으로 로그인</TextLink>
    </div>
  );
}

const Row = ({ label, value, color }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
    <span style={{ fontSize: 12.5, fontWeight: 700, color: C.body }}>{label}</span>
    <span style={{ fontSize: 19, fontWeight: 900, color }}>{value}</span>
  </div>
);
