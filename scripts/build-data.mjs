// 당당 - 데이터 빌드 스크립트
//
//   node scripts/build-data.mjs
//
// 입력 (data/raw/)
//   전국통합식품영양성분정보_음식_표준데이터.csv        식약처, 조리음식
//   전국통합식품영양성분정보_가공식품_표준데이터.csv     식약처, 가공식품
//   전국통합식품영양성분정보_원재료성식품_표준데이터.csv 식약처, 원재료
//   대전광역시_서구_도시공원정보.csv                    행안부 도시공원 표준데이터
//   + data/gi-table-2012.json (한국영양학회지 2012 논문 GI값)
//
// 출력
//   data/foodDB.json   GI(논문) × 탄수화물(식약처) 결합
//   data/parks.json    대전 서구 공원
//
// 탄수화물은 식약처의 100g당 값(같은 대표식품명 여러 제품의 중앙값)을 쓰고,
// 1인분 중량은 아래 SERVING 표의 기준을 곱해서 환산한다.
// 즉 "농도는 공공데이터, 1인분 기준은 앱이 정한 값"이고 둘 다 화면·메타에 밝힌다.
//
// 함정: 식약처 값이 조리 전(건면·분말) 기준인 항목이 있다. 여기에 조리 후
// 중량을 곱하면 탄수화물이 3배까지 부풀려진다(국수 1그릇 205g 같은 값).
// 그런 항목은 SERVING에 조리 전 중량을 넣고 라벨에 기준을 함께 적는다.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), "utf8"));
const write = (p, o) =>
  fs.writeFileSync(path.join(ROOT, p), JSON.stringify(o, null, 2) + "\n", "utf8");

// ── 1인분 기준 ──────────────────────────────────────────
// [중량(g), 표시라벨, 식약처 대표식품명(다르면)]
const SERVING = {
  "밥": [210, "1공기"], "잡곡밥": [210, "1공기"], "현미": [210, "1공기", "현미밥"],
  "죽": [300, "1그릇"], "누룽지": [30, "1조각(30g)"], "볶음밥/덮밥": [300, "1접시", "볶음밥"],
  "가래떡/백설기": [100, "100g", "가래떡"], "찹쌀떡": [50, "1개"],
  "팥떡/시루떡": [80, "1조각", "시루떡"], "시리얼": [40, "1공기"],
  "미숫가루/선식": [200, "1잔(200g)", "미숫가루"],

  "라면(조리한 것)": [120, "1봉지", "라면"], "컵라면": [75, "1개", "라면"],
  "우동": [300, "1그릇"], "자장면(인스턴트)": [350, "1그릇", "자장면"],
  "국수(삶은 것)": [100, "1인분(건면 100g)", "국수"], "쫄면": [100, "1인분(생면 100g)"],
  "칼국수(생면)": [100, "1인분(생면 100g)", "칼국수"], "메밀국수/냉면": [350, "1그릇", "냉면"],
  "스파게티": [300, "1접시", "스파게티"],

  "식빵": [35, "1장"], "빵(기타)": [80, "1개", "기타빵"],
  "잼빵/팥빵/크림빵": [90, "1개", "단팥빵"], "샌드위치": [150, "1개"],
  "도넛": [50, "1개"], "크로아상/페이스트리": [55, "1개", "기타빵"],
  "케이크": [90, "1조각"], "카스테라": [60, "1조각", "카스텔라"],
  "비스켓/쿠키/크래커": [50, "1봉", "비스킷/쿠키/크래커"], "초코파이": [35, "1개"],
  "피자": [110, "1조각"], "햄버거": [200, "1개"], "핫도그": [100, "1개"],

  "감자": [150, "1개"], "감자튀김": [110, "중"], "감자칩": [60, "1봉", "스낵과자"],
  "고구마": [150, "1개"], "당면": [100, "1인분"], "스낵과자": [60, "1봉"],
  "크로켓": [70, "1개"], "만두": [125, "5개"], "팝콘": [30, "1컵"],

  "사과": [200, "1개"], "바나나": [120, "1개"], "귤": [100, "1개"],
  "포도": [100, "1송이"], "수박": [200, "1쪽"], "키위": [100, "1개"],
  "감": [150, "1개"], "배": [200, "1개"], "파인애플": [100, "100g"],
  "딸기": [150, "10알"], "오렌지": [150, "1개"], "복숭아": [180, "1개"],
  "참외": [200, "1개"], "멜론": [200, "1쪽"], "망고": [100, "100g"], "대추": [30, "10알"],

  "우유": [200, "1팩"], "요구르트(액상)": [150, "1병", "요구르트(액상)"],
  "요구르트(호상)": [100, "1개", "요구르트(호상)"], "아이스크림": [100, "1개"],
  "두유": [190, "1팩"], "콜라": [250, "1캔", "탄산음료"], "사이다": [250, "1캔", "탄산음료"],
  "탄산음료(기타)": [250, "1캔", "탄산음료"], "이온음료": [500, "1병", "기타음료"],
  "과일음료": [300, "1병", "과·채음료"], "채소음료": [200, "1병", "과·채음료"],
  "식혜": [238, "1캔"], "코코아음료": [20, "1잔(분말 20g)", "코코아"],
  "기능성음료": [200, "1병", "기타음료"],

  "설탕": [12, "1스푼"], "꿀": [21, "1스푼"], "초콜릿": [40, "1개"],
  "젤리": [30, "1봉"], "사탕": [15, "3알"], "카라멜": [20, "5알", "캐러멜"],
  "양갱": [60, "1개"], "푸딩": [90, "1개"],

  "완두콩": [60, "1/2컵", "완두"], "땅콩": [30, "한 줌"], "밤": [60, "5알"],
  "아몬드": [30, "한 줌"], "호두": [30, "한 줌"],

  "당근": [100, "1개"], "연근": [100, "100g"], "단호박": [100, "100g", "단호박찜"],
  "옥수수": [150, "1개"],
};

// ── 논문에 없는 복합요리 ────────────────────────────────
// 2012년 논문 부록에 단독 항목이 없어 주재료 GI를 적용하고 근거를 남긴다.
// 탄수화물은 식약처에 실제 항목이 있으므로 그대로 가져온다.
const COMPOSITES = [
  { name: "김밥", gi: 72, basedOn: "밥(1197)", g: 230, label: "1줄", cat: "밥류" },
  { name: "떡볶이", gi: 82, basedOn: "가래떡/백설기(1211)", g: 250, label: "1인분", cat: "밥류" },
  { name: "비빔밥", gi: 72, basedOn: "밥(1197)", g: 400, label: "1그릇", cat: "밥류" },
  { name: "김치찌개", gi: 39, basedOn: "채소류(당근 6096)", g: 400, label: "1인분", cat: "기타" },
  { name: "치킨", gi: 57, basedOn: "크로켓(82001) 튀김옷", g: 150, label: "3조각", cat: "튀김류" },
  { name: "떡국", gi: 82, basedOn: "가래떡/백설기(1211)", g: 400, label: "1그릇", cat: "밥류" },
  { name: "아메리카노", gi: 0, basedOn: "논문상 GI 0 식품군", g: 0, label: "1잔", cat: "음료" },
];

// ── GI 0 식품 ───────────────────────────────────────────
// 논문은 육류·가금류·어패류·난류·해조류·유지류·조미료류·버섯류·일부 채소류를
// "탄수화물이 거의 없어 혈당 상승에 크게 영향을 주지 않는다"는 이유로 GI 0으로 처리했다.
// 검색은 되지만 혈당부하에는 기여하지 않도록 목록을 채워 둔다.
// (이게 없으면 양상추 같은 흔한 재료가 '미등록 → 기타 추정'으로 잡혀 엉뚱하게 위험이 올라간다)
const GI_ZERO = [
  // 채소
  ["양상추", 100, "1접시"], ["상추", 50, "10장"], ["배추", 100, "100g"],
  ["양배추", 100, "100g"], ["오이", 100, "1개"], ["토마토", 150, "1개"],
  ["방울토마토", 100, "10알"], ["브로콜리", 100, "100g"], ["시금치", 70, "1접시"],
  ["파프리카", 100, "1개"], ["가지", 100, "1개"], ["무", 100, "100g"],
  ["콩나물", 100, "1접시"], ["미나리", 70, "1접시"], ["부추", 70, "1접시"],
  ["샐러드", 150, "1접시"], ["김치", 60, "1접시"], ["깍두기", 60, "1접시"],
  // 버섯·해조
  ["버섯", 100, "100g"], ["김", 5, "5장"], ["미역", 50, "1접시"],
  // 단백질
  ["달걀", 60, "1개"], ["두부", 150, "1/2모"], ["닭가슴살", 100, "100g"],
  ["삼겹살", 150, "1인분"], ["소고기", 150, "1인분"], ["돼지고기", 150, "1인분"],
  ["닭고기", 150, "1인분"], ["생선", 100, "1토막"], ["고등어", 100, "1토막"],
  ["연어", 100, "1토막"], ["새우", 100, "5마리"], ["오징어", 100, "1마리"],
  ["햄", 50, "2장"], ["소시지", 50, "2개"], ["참치", 100, "1캔"],
  // 기타
  ["아메리카노", 0, "1잔"], ["에스프레소", 0, "1잔"], ["물", 0, "1잔"],
  ["녹차", 0, "1잔"], ["홍차", 0, "1잔"],
];

const CATEGORY_OF = (n) => {
  if (/^(밥|잡곡밥|현미|죽|누룽지|볶음밥|가래떡|찹쌀떡|팥떡|시리얼|미숫가루)/.test(n)) return "밥류";
  if (/(라면|컵라면|우동|자장면|칼국수|쫄면|국수|냉면|스파게티)/.test(n)) return "면류";
  if (/(식빵|빵|샌드위치|도넛|크로아상|케이크|카스테라|비스켓|초코파이|피자|햄버거|핫도그)/.test(n)) return "빵류";
  if (/(감자|고구마|당면|스낵|크로켓|만두|팝콘)/.test(n)) return "튀김류";
  if (/(사과|바나나|귤|포도|수박|키위|^감$|^배$|파인애플|딸기|오렌지|복숭아|참외|멜론|망고|대추)/.test(n)) return "과일";
  if (/(우유|요구르트|두유|콜라|사이다|탄산|이온|음료|식혜|셰이크|코코아|주스)/.test(n)) return "음료";
  return "기타";
};

// ── CSV ────────────────────────────────────────────────
// 공공데이터포털 CSV는 대부분 EUC-KR이라, UTF-8로 읽어 깨지면 EUC-KR로 다시 디코딩한다.
function readCsv(abs) {
  const buf = fs.readFileSync(abs);
  let text = new TextDecoder("utf-8").decode(buf);
  if (text.includes("�")) text = new TextDecoder("euc-kr").decode(buf);
  return parseCsv(text.replace(/^﻿/, ""));
}

/** 따옴표 필드와 필드 내 줄바꿈을 처리하는 최소 CSV 파서 */
function parseCsv(text) {
  const rows = [];
  let row = [], field = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else quoted = false;
      } else field += c;
      continue;
    }
    if (c === '"') quoted = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else if (c !== "\r") field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  if (!rows.length) return [];
  const head = rows[0].map((h) => h.trim());
  return rows.slice(1).filter((r) => r.length > 1)
    .map((r) => Object.fromEntries(head.map((h, i) => [h, (r[i] ?? "").trim()])));
}

const RAW = path.join(ROOT, "data/raw");
const rawFiles = fs.existsSync(RAW) ? fs.readdirSync(RAW).filter((f) => /\.csv$/i.test(f)) : [];
const findRaw = (kw) => {
  const hit = rawFiles.find((f) => f.includes(kw));
  return hit ? path.join(RAW, hit) : null;
};

const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
};

// ── 식약처: 대표식품명 → 100g당 탄수화물 중앙값 ──────────
function loadCarbIndex() {
  const files = [
    "전국통합식품영양성분정보_음식_표준데이터.csv",
    "전국통합식품영양성분정보_가공식품_표준데이터.csv",
    "전국통합식품영양성분정보_원재료성식품_표준데이터.csv",
  ].map((f) => path.join(RAW, f)).filter((p) => fs.existsSync(p));

  if (!files.length) return null;

  const byRep = new Map();
  let rowCount = 0;
  for (const file of files) {
    for (const r of readCsv(file)) {
      rowCount++;
      // 기준량이 100g인 행만 사용해서 단위를 통일한다.
      if (!/100\s*g/.test(r["영양성분함량기준량"] || "")) continue;
      // 말린 것·분말은 수분이 빠져 100g당 탄수화물이 2~4배로 잡힌다.
      // 표본이 적은 식품(바나나: 생것 20g / 말린것 78.5g)에서는 중앙값이
      // 통째로 왜곡되므로 생것 기준 행만 남긴다.
      if (/말린것|말린 것|건조|분말|가루|농축|튀각|말랭이/.test(r["식품명"] || "")) continue;
      // 값이 비어 있는 행이 많은데 Number("")는 0이라, 빈 값을 먼저 걸러야
      // 중앙값이 0으로 끌려 내려간다.
      const cell = (r["탄수화물(g)"] ?? "").trim();
      if (cell === "") continue;
      const carb = Number(cell);
      if (!Number.isFinite(carb)) continue;
      for (const key of [r["대표식품명"], r["식품명"]]) {
        const k = (key || "").trim();
        if (!k || k === "해당없음") continue;
        if (!byRep.has(k)) byRep.set(k, []);
        byRep.get(k).push(carb);
      }
    }
  }
  console.log(`  식약처 CSV ${files.length}개 · ${rowCount.toLocaleString()}행 → 식품명 ${byRep.size.toLocaleString()}종`);
  return byRep;
}

/** 이름으로 100g당 탄수화물을 찾는다. 정확 일치 → 부분 일치 순. */
function lookupCarb(index, name, alias) {
  if (!index) return null;
  for (const key of [alias, name].filter(Boolean)) {
    const hit = index.get(key);
    if (hit?.length) return { per100: median(hit), matched: key, n: hit.length, exact: true };
  }
  const target = alias || name;
  const partial = [...index.entries()].filter(([k]) => k === target || k.startsWith(target + "_"));
  if (partial.length) {
    const all = partial.flatMap(([, v]) => v);
    return { per100: median(all), matched: target, n: all.length, exact: false };
  }
  return null;
}

// ── 대전 서구 도시공원 ──────────────────────────────────
function loadParks() {
  const file = findRaw("도시공원");
  if (!file) return null;
  const rows = readCsv(file);
  const parks = rows.map((r) => ({
    name: (r["공원명"] || "").trim(),
    kind: r["공원구분"],
    address: r["소재지도로명주소"] || r["소재지지번주소"],
    lat: Number(r["위도"]),
    lng: Number(r["경도"]),
    areaSqm: Number(r["공원면적"]) || null,
    facilities: [
      r["공원보유시설(운동시설)"], r["공원보유시설(유희시설)"], r["공원보유시설(편익시설)"],
    ].filter((x) => x && x !== "해당없음").join(", "),
    manager: r["관리기관명"],
  }))
    // 대전 서구만 (파일이 이미 서구여도 한 번 더 확인)
    .filter((p) => {
      const a = (p.address || "").replace(/\s/g, "");
      return a.includes("대전") && a.includes("서구");
    })
    .filter((p) => p.name && Number.isFinite(p.lat) && Number.isFinite(p.lng))
    .sort((a, b) => (b.areaSqm || 0) - (a.areaSqm || 0));
  console.log(`  도시공원 CSV ${rows.length}행 → 대전 서구 ${parks.length}곳`);
  return parks;
}

// ── 빌드 ────────────────────────────────────────────────
console.log("입력:");
const gi = read("data/gi-table-2012.json");
const carbIndex = loadCarbIndex();
if (!carbIndex) console.log("  식약처 CSV 없음 → 탄수화물 생략");

const foods = [];
let matched = 0;

function pushFood({ name, giVal, giCode, giBasedOn, g, label, category }) {
  const hit = lookupCarb(carbIndex, name, SERVING[name]?.[2]);
  if (giVal === 0) {
    // GI 0 식품(커피 등)은 혈당부하에 기여하지 않으므로 탄수화물도 0으로 둔다.
    foods.push({ name, gi: 0, carbs: 0, serving: label, category, giCode, giSource: "kjn2012", giBasedOn, carbSource: "gi-zero" });
    return;
  }
  if (!hit) return; // 식약처에서 탄수화물을 못 찾으면 검색 목록에서 제외
  matched++;
  foods.push({
    name,
    gi: giVal,
    carbs: Math.round((hit.per100 * g) / 100),
    // 라벨에 이미 중량이 적혀 있으면(예: "1인분(건면 100g)") 중복해서 붙이지 않는다
    serving: /\dg/.test(label) ? label : `${label}(${g}g)`,
    category,
    giCode,
    giSource: giBasedOn ? "kjn2012-derived" : "kjn2012",
    ...(giBasedOn ? { giBasedOn } : {}),
    carbSource: "mfds",
    carbPer100g: Math.round(hit.per100 * 10) / 10,
    carbMatch: { name: hit.matched, samples: hit.n, exact: hit.exact },
  });
}

for (const it of gi.items) {
  const s = SERVING[it.name];
  if (!s) continue;
  pushFood({
    name: it.name, giVal: it.gi, giCode: it.code,
    g: s[0], label: s[1], category: CATEGORY_OF(it.name),
  });
}
for (const c of COMPOSITES) {
  pushFood({
    name: c.name, giVal: c.gi, giBasedOn: c.basedOn,
    g: c.g, label: c.label, category: c.cat,
  });
}
for (const [name, g, label] of GI_ZERO) {
  foods.push({
    name, gi: 0, carbs: 0,
    serving: g ? `${label}(${g}g)` : label,
    category: "기타",
    giSource: "kjn2012-zero",
    giBasedOn: "논문상 GI 0 식품군(채소·육류·어패류·난류·해조류 등)",
    carbSource: "gi-zero",
  });
}

// ── 카테고리 평균 (미등록 음식 fallback) ────────────────
const categories = ["밥류", "면류", "빵류", "튀김류", "과일", "음료", "기타"].map((label) => {
  const b = foods.filter((f) => f.category === label && f.gi > 0);
  const avg = (xs) => Math.round(xs.reduce((a, x) => a + x, 0) / xs.length);
  return {
    label,
    gi: b.length ? avg(b.map((f) => f.gi)) : 55,
    carbs: b.length ? avg(b.map((f) => f.carbs)) : 30,
    basis: `${b.length}개 항목 평균`,
  };
});

write("data/foodDB.json", {
  meta: {
    app: "당당",
    generatedAt: new Date().toISOString().slice(0, 10),
    gi: {
      source: gi.meta.source,
      url: gi.meta.url,
      note: "복합요리(김밥·떡볶이 등)는 논문에 단독 항목이 없어 주재료 GI를 적용하고 giBasedOn에 근거를 남김.",
    },
    carbs: {
      source: "식품의약품안전처 전국통합식품영양성분정보 표준데이터 (공공데이터포털)",
      url: "https://www.data.go.kr/data/15100070/standard.do",
      method: "같은 대표식품명에 속한 제품들의 100g당 탄수화물 중앙값을 구한 뒤, 1인분 중량을 곱해 환산",
      servingNote: "1인분 중량은 앱이 정한 기준이며 각 항목의 serving에 g으로 표기함",
    },
    disclaimer: "GI·탄수화물·MET 공식을 이용한 추정치이며 의료 진단이 아닙니다.",
  },
  categories,
  foods,
});
console.log(`\nfoodDB.json: ${foods.length}개 (식약처 탄수화물 매칭 ${matched}개)`);

const parks = loadParks();
if (parks) {
  write("data/parks.json", {
    meta: {
      source: "행정안전부 도시공원정보 표준데이터 (공공데이터포털)",
      url: "https://www.data.go.kr/data/15012890/standard.do",
      region: "대전광역시 서구",
      generatedAt: new Date().toISOString().slice(0, 10),
    },
    parks,
  });
  console.log(`parks.json: 대전 서구 ${parks.length}곳`);
}
