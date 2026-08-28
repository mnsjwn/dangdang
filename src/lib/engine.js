// 당당 - 식후 졸음(식후 고혈당) 계산 엔진
// 전부 결정적 공식. AI/딥러닝 미사용.
//
// 용어: 사용자에게는 "식후 졸음"으로 보여주고, 학술 근거는 식후 고혈당
// (postprandial hyperglycemia)이다. 식후 혈당 급상승이 졸음의 주요 원인이므로
// 같은 현상을 사용자 언어와 학술 언어로 각각 부르는 것.

import foodDB from "../../data/foodDB.json";

export const MET = {
  walk: 3.5,   // 평지 보통 속도 걷기
  stairs: 8.0, // 계단 오르기
};

/**
 * 계단오르기 권장 시간(분).
 * 계단은 MET 8로 걷기(3.5)보다 강도가 높으므로, 같은 효과를 내는 데 필요한
 * 시간이 더 짧다. 걷기 시간에 강도 비율을 곱해 산출하되 최소 5분은 둔다.
 */
export const stairsMinutes = (gl) =>
  Math.max(5, Math.round((recMinutes(gl) * MET.walk) / MET.stairs));

/** 단일 항목의 혈당부하(GL) = GI × 탄수화물(g) ÷ 100 */
export function itemGL(gi, carbs, serv = 1) {
  return (gi * carbs * serv) / 100;
}

/** 한 끼 총 GL (정수 반올림) */
export function totalGL(items) {
  return Math.round(items.reduce((a, i) => a + itemGL(i.gi, i.carbs, i.serv), 0));
}

/**
 * 총 GL → 졸음 위험 등급.
 *
 * 기준선은 인용 중인 논문의 한국인 데이터에 맞춰 잡았다.
 * 논문(한국영양학회지 2012;45(1):80-93)에서 20~29세의 하루 식사혈당부하(DGL)
 * 평균은 166.1이고, 하루 세 끼로 나누면 한 끼 약 55다.
 * 그래서 "한 끼 평균(55) 이상"을 높음으로 본다.
 *
 * 국제 기준(1인분당 저 10 이하 / 중 11~19 / 고 20 이상)은 개별 식품 한 접시를
 * 재는 값이라, 여러 음식을 합산하는 한 끼 단위에 그대로 쓰면 밥 한 공기(GL 58)
 * 만으로도 최고 등급이 되어 등급이 변별력을 잃는다.
 */
export const GL_BANDS = { medium: 30, high: 55 };

export function glMeta(gl) {
  if (gl < GL_BANDS.medium)
    return { color: "#3D8F63", label: "낮아요", sub: "이 식사로는 졸음이 오지 않아요" };
  if (gl < GL_BANDS.high)
    return { color: "#C98A16", label: "보통이에요", sub: "10분만 걸으면 산뜻하게 넘어가요" };
  return { color: "#DE5232", label: "높아요", sub: "그냥 앉아 있으면 30분 뒤 졸음이 몰려와요" };
}

/** 개별 음식이 한 끼에서 차지하는 영향도 라벨 */
export function impactOf(gi, carbs) {
  const v = itemGL(gi, carbs);
  return v < 8 ? "적음" : v < 20 ? "보통" : "큼";
}

/** GI 수치 → 배지 색상 (저/중/고 GI 국제 기준 55·69 경계) */
export function giMeta(gi) {
  if (gi <= 55) return { giFg: "#2F6E4E", giBg: "rgba(61,143,99,.12)" };
  if (gi <= 69) return { giFg: "#96650C", giBg: "rgba(201,138,22,.14)" };
  return { giFg: "#B93E22", giBg: "rgba(222,82,50,.12)" };
}

/** 권장 걷기 시간(분) — 총 GL이 클수록 길어짐 */
export function recMinutes(gl) {
  return gl >= 55 ? 20 : gl >= 30 ? 15 : 10;
}

/**
 * 예상 혈당 피크 감소율(%).
 * 기준: 식후 10~15분 걷기로 하루 혈당곡선 면적 12~22% 감소(선행연구).
 * 시간과 운동강도(MET)에 비례하되 32%에서 상한을 둔다.
 */
export function dropPercent(minutes, met) {
  return Math.min(32, Math.round(minutes * (met / MET.walk) * 1.2));
}

/** 소모 칼로리 = MET × 체중(kg) × 시간(h) */
export function kcal(minutes, met, weightKg) {
  return Math.round(met * (Number(weightKg) || 62) * (minutes / 60));
}

/** 총 GL 기준으로 두 활동 옵션을 만들어 반환 */
export function activityOptions(gl, weightKg) {
  const walkMin = recMinutes(gl);
  return {
    walk: {
      kind: "walk",
      label: "걷기",
      minutes: walkMin,
      met: MET.walk,
      dropPercent: dropPercent(walkMin, MET.walk),
      kcal: kcal(walkMin, MET.walk, weightKg),
    },
    stairs: (() => {
      const m = stairsMinutes(gl);
      return {
        kind: "stairs",
        label: "계단오르기",
        minutes: m,
        met: MET.stairs,
        dropPercent: dropPercent(m, MET.stairs),
        kcal: kcal(m, MET.stairs, weightKg),
      };
    })(),
  };
}

// ── 음식 검색 / 미등록 음식 처리 ────────────────────────────────

// 사람들이 흔히 쓰는 말 → 식약처 표기
const SYNONYMS = {
  오뎅: "어묵", 계란: "달걀", 삐아: "피자", 짜장: "자장",
  아아: "아메리카노", 아메: "아메리카노", 라떼: "우유",
  돈까스: "돈가스", 팟타이: "쌀국수", 후라이드: "닭튀김",
  치맥: "닭튀김", 소맥: "맥주", 붕어빵: "호떡",
};

/**
 * 부분 일치 검색.
 * 항목이 1,400개가 넘어 순서가 중요해졌다.
 * 정확히 같은 이름 → 이름이 검색어로 시작 → 그 외 포함 순으로 정렬하고,
 * 같은 순위 안에서는 이름이 짧은(= 더 일반적인) 것을 앞에 둔다.
 */
export function searchFoods(query) {
  const raw = query.trim();
  if (!raw) return [];
  const q = SYNONYMS[raw] || raw;

  const rank = (name) => (name === q ? 0 : name.startsWith(q) ? 1 : 2);
  return foodDB.foods
    .filter((f) => f.name.includes(q))
    .sort((a, b) => rank(a.name) - rank(b.name) || a.name.length - b.name.length);
}

export const CATEGORIES = foodDB.categories;

/**
 * 미등록 음식: 사용자가 고른 카테고리의 평균값으로 대체한다.
 * est(추정) 플래그를 붙여 화면에서 "추정치"로 표시할 수 있게 한다.
 */
export function fromCategory(categoryLabel, foodName) {
  const c = foodDB.categories.find((x) => x.label === categoryLabel);
  if (!c) throw new Error(`알 수 없는 카테고리: ${categoryLabel}`);
  return { name: foodName || `${categoryLabel} (추정)`, gi: c.gi, carbs: c.carbs, est: true };
}

/** 입력한 이름으로 카테고리를 추측(단순 키워드 규칙, AI 아님) */
export function guessCategory(name) {
  const n = name || "";
  const rules = [
    [/면|국수|라면|파스타|우동|쫄|칼국수/, "면류"],
    [/밥|덮밥|볶음밥|죽|김밥|초밥/, "밥류"],
    [/빵|케이크|토스트|샌드위치|버거|피자|도넛/, "빵류"],
    [/튀김|까스|치킨|감자칩|만두/, "튀김류"],
    [/사과|배|귤|포도|바나나|딸기|수박|과일/, "과일"],
    [/음료|주스|콜라|사이다|커피|라떼|우유|차/, "음료"],
  ];
  for (const [re, label] of rules) if (re.test(n)) return label;
  return "기타";
}
