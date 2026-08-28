// 당당 - Google Apps Script 백엔드 클라이언트
//
// 읽기는 GET, 쓰기는 POST(text/plain)로 보낸다. text/plain으로 보내야 브라우저가
// CORS preflight를 띄우지 않아서 Apps Script 웹앱과 통신이 된다.

const BASE_URL = import.meta.env.VITE_APPS_SCRIPT_URL;

function requireUrl() {
  if (!BASE_URL) {
    throw new Error(
      "VITE_APPS_SCRIPT_URL이 없습니다. .env에 Apps Script 웹앱 URL을 넣어주세요."
    );
  }
}

async function get(params) {
  requireUrl();
  const res = await fetch(`${BASE_URL}?${new URLSearchParams(params)}`);
  if (!res.ok) throw new Error(`요청 실패 (${res.status})`);
  return res.json();
}

async function post(body) {
  requireUrl();
  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`요청 실패 (${res.status})`);
  return res.json();
}

// ── 계정 ───────────────────────────────────────────────

export const checkNickname = (nickname) => get({ action: "checkNickname", nickname });

export const register = ({ nickname, password, weight, height, age }) =>
  post({ action: "register", nickname, password, weight, height, age });

export const login = ({ nickname, password }) =>
  post({ action: "login", nickname, password });

export const getProfile = (nickname) => get({ action: "getProfile", nickname });

export const updateProfile = ({ nickname, weight, height, age }) =>
  post({ action: "updateProfile", nickname, weight, height, age });

// ── 스탬프 ─────────────────────────────────────────────

export const addStamp = (nickname, stamp) =>
  post({ action: "addStamp", nickname, ...stamp });

export async function getStamps(nickname) {
  const res = await get({ action: "getStamps", nickname });
  // 예전에 배포한 스크립트는 날짜를 "Fri Aug 28 2026 ..." 형태로 돌려주기도 한다.
  // 재배포 여부와 상관없이 화면에서는 항상 yyyy-MM-dd로 다루도록 여기서 맞춘다.
  if (res?.stamps) res.stamps = res.stamps.map((s) => ({ ...s, date: toISODate(s.date) }));
  return res;
}

function toISODate(v) {
  if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}/.test(v)) return v.slice(0, 10);
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  // 로컬 시간대 기준으로 잘라야 하루가 밀리지 않는다
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// ── 익명 모드 (기록을 서버에 저장하지 않음) ──────────────
// 익명은 스탬프가 남지 않는 게 기획 의도라, 세션 동안만 메모리에 들고 있는다.

let anonStamps = [];
export const addStampAnon = (stamp) => {
  anonStamps.push({ date: new Date().toISOString().slice(0, 10), ...stamp });
};
export const getStampsAnon = () => anonStamps.slice();
export const clearAnon = () => { anonStamps = []; };
