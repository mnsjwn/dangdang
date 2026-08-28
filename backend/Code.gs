/**
 * 당당 - Google Apps Script 백엔드 (Google Sheets를 DB로 사용)
 *
 * 시트 2개가 필요함 (탭 이름 정확히 일치해야 함):
 *
 *   Users   : A=nickname  B=passwordHash  C=weight  D=height  E=age  F=joinedAt
 *   Stamps  : A=nickname  B=date  C=activityType  D=minutes  E=kcal  F=totalGL  G=dropPercent
 *
 * 1행은 헤더로 쓰고, 데이터는 2행부터 들어감.
 *
 * 배포: 확장 프로그램 > Apps Script > 이 파일 붙여넣기 >
 *       배포 > 새 배포 > 웹 앱 / 실행: 나 / 액세스: 모든 사용자
 *
 * 읽기(GET)와 쓰기(POST)를 나눠 두었다. POST는 Content-Type을 text/plain으로
 * 보내면 브라우저가 CORS preflight(OPTIONS)를 띄우지 않으므로 Apps Script에서도
 * 문제없이 동작한다. 비밀번호가 URL 쿼리스트링에 남지 않는 이점도 있다.
 */

const USERS_SHEET = "Users";
const STAMPS_SHEET = "Stamps";

// 비밀번호는 평문으로 저장하지 않는다. 시트를 열어봐도 원문을 알 수 없게 해시로 보관.
const SALT = "dangdang-2026-sdg";

function doGet(e) {
  try {
    const action = e.parameter.action;
    if (action === "checkNickname") return respond(checkNickname(e.parameter.nickname));
    if (action === "getProfile") return respond(getProfile(e.parameter.nickname));
    if (action === "getStamps") return respond(getStamps(e.parameter.nickname));
    return respond({ success: false, message: "unknown action: " + action });
  } catch (err) {
    return respond({ success: false, message: String(err) });
  }
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const action = body.action;
    if (action === "register") return respond(registerUser(body));
    if (action === "login") return respond(login(body));
    if (action === "updateProfile") return respond(updateProfile(body));
    if (action === "addStamp") return respond(addStamp(body));
    return respond({ success: false, message: "unknown action: " + action });
  } catch (err) {
    return respond({ success: false, message: String(err) });
  }
}

// ── 유틸 ────────────────────────────────────────────────

function sheet(name) {
  const s = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  if (!s) throw new Error("시트를 찾을 수 없음: " + name);
  return s;
}

function hash(password) {
  const bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    SALT + String(password)
  );
  return bytes.map(function (b) {
    return ((b < 0 ? b + 256 : b) + 0x100).toString(16).slice(1);
  }).join("");
}

/** Users 시트에서 닉네임으로 행 번호를 찾는다. 없으면 -1. (헤더 1행 제외) */
function findUserRow(nickname) {
  const rows = sheet(USERS_SHEET).getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(nickname)) return i + 1; // 1-based
  }
  return -1;
}

function respond(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/** 시트 셀 값을 항상 "yyyy-MM-dd" 문자열로 만든다 */
function toDateString(v) {
  if (Object.prototype.toString.call(v) === "[object Date]") {
    return Utilities.formatDate(v, "Asia/Seoul", "yyyy-MM-dd");
  }
  return String(v).slice(0, 10);
}

// ── 계정 ────────────────────────────────────────────────

function checkNickname(nickname) {
  if (!nickname) return { success: false, message: "nickname required" };
  return { success: true, exists: findUserRow(nickname) !== -1 };
}

function registerUser(b) {
  const nickname = (b.nickname || "").trim();
  if (nickname.length < 2 || nickname.length > 10) {
    return { success: false, code: "bad_nickname", message: "닉네임은 2~10자여야 해요." };
  }
  // 디자인 기준: 8자 이상, 영문과 숫자를 섞어서
  const pw = String(b.password || "");
  if (pw.length < 8 || !/[A-Za-z]/.test(pw) || !/[0-9]/.test(pw)) {
    return { success: false, code: "bad_password", message: "8자 이상, 영문과 숫자를 섞어 주세요." };
  }
  if (findUserRow(nickname) !== -1) {
    return { success: false, code: "duplicate", message: "이미 사용 중인 닉네임이에요." };
  }
  sheet(USERS_SHEET).appendRow([
    nickname, hash(pw), b.weight || "", b.height || "", b.age || "", new Date().toISOString(),
  ]);
  return { success: true, nickname: nickname };
}

function login(b) {
  const nickname = (b.nickname || "").trim();
  const row = findUserRow(nickname);
  if (row === -1) {
    // 존재하지 않는 계정과 비밀번호 오류를 같은 메시지로 돌려준다(계정 존재 여부 노출 방지).
    return { success: false, code: "bad_credentials", message: "닉네임 또는 비밀번호가 맞지 않아요." };
  }
  const stored = sheet(USERS_SHEET).getRange(row, 2).getValue();
  if (String(stored) !== hash(b.password || "")) {
    return { success: false, code: "bad_credentials", message: "닉네임 또는 비밀번호가 맞지 않아요." };
  }
  const vals = sheet(USERS_SHEET).getRange(row, 1, 1, 6).getValues()[0];
  return {
    success: true,
    profile: { nickname: vals[0], weight: vals[2], height: vals[3], age: vals[4] },
  };
}

function getProfile(nickname) {
  const row = findUserRow(nickname);
  if (row === -1) return { success: false, message: "not_found" };
  const v = sheet(USERS_SHEET).getRange(row, 1, 1, 6).getValues()[0];
  return { success: true, profile: { nickname: v[0], weight: v[2], height: v[3], age: v[4] } };
}

/** 신체정보 수정 화면용. 비밀번호는 건드리지 않는다. */
function updateProfile(b) {
  const row = findUserRow(b.nickname);
  if (row === -1) return { success: false, message: "not_found" };
  sheet(USERS_SHEET).getRange(row, 3, 1, 3)
    .setValues([[b.weight || "", b.height || "", b.age || ""]]);
  return { success: true };
}

// ── 스탬프 ──────────────────────────────────────────────

function addStamp(b) {
  if (!b.nickname) return { success: false, message: "nickname required" };
  sheet(STAMPS_SHEET).appendRow([
    b.nickname,
    b.date || new Date().toISOString().slice(0, 10),
    b.activityType || "",
    b.minutes || "",
    b.kcal || "",
    b.totalGL || "",
    b.dropPercent || "",
  ]);
  return { success: true };
}

function getStamps(nickname) {
  if (!nickname) return { success: false, message: "nickname required" };
  const rows = sheet(STAMPS_SHEET).getDataRange().getValues();
  const stamps = [];
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) !== String(nickname)) continue;
    stamps.push({
      // 시트가 날짜 셀로 저장하면 Date 객체가 넘어온다. Apps Script에서는
      // instanceof Date가 항상 참이 되진 않아서 toString 태그로 판별한다.
      date: toDateString(rows[i][1]),
      activityType: rows[i][2],
      minutes: rows[i][3],
      kcal: rows[i][4],
      totalGL: rows[i][5],
      dropPercent: rows[i][6],
    });
  }
  return { success: true, stamps: stamps };
}
