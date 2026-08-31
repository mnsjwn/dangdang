// 위치·거리 계산 (카카오맵 SDK 없이 동작)
import parkData from "../../data/parks.json";

/**
 * 위치 권한이 없을 때 쓰는 기본 좌표.
 * 디자인에 명시된 "건양대학교 메디컬캠퍼스"(대전 서구 관저동) 기준이며 대략값이다.
 */
export const DEFAULT_ORIGIN = {
  lat: 36.2966,
  lng: 127.33,
  label: "건양대학교 메디컬캠퍼스",
};

export const PARKS_META = parkData.meta;

/** 하버사인 공식 — 두 좌표 사이 직선거리(m) */
export function haversine(a, b) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

/** 도보 속도 4km/h 기준 소요 시간(분) */
export const walkMinutes = (meters) => Math.max(1, Math.round(meters / 66.7));

export const formatDistance = (m) =>
  m < 1000 ? `${Math.round(m / 10) * 10}m` : `${(m / 1000).toFixed(1)}km`;

/** 공원 구분·보유시설로 짧은 설명과 태그를 만든다 */
function describe(park) {
  const f = park.facilities || "";
  const tags = [];
  if (/체육|운동|농구|배드민턴|축구|게이트볼/.test(f)) tags.push("운동시설");
  if (/놀이|조합놀이대|그네|시소/.test(f)) tags.push("놀이터");
  if (/화장실/.test(f)) tags.push("화장실");

  const kind = park.kind || "공원";
  const desc = tags.length ? `${kind} · ${tags.slice(0, 2).join(" · ")}` : kind;
  return { desc, tag: kind.replace("공원", "") || "공원" };
}

/**
 * "산책로"로 안내할 만한 공원만 남긴다.
 * 대전 서구 112곳 중 86곳이 1,500㎡ 안팎의 어린이공원이라, 그대로 두면
 * 놀이터만 추천된다. 걸을 공간이 있는 유형이거나 1ha 이상인 곳만 쓴다.
 *
 * 참고: 원본 데이터에 '월평 어린이공원' 면적이 3,994,734㎡(399ha)로
 * 기록돼 있는데 어린이공원 규모로는 불가능한 값이라 걸러낸다.
 */
const MAX_PLAUSIBLE_CHILD_PARK = 30000;
function isWalkable(p) {
  const area = p.areaSqm || 0;
  if (p.kind === "어린이공원") return false;
  if (/근린|체육|수변|문화|소공원/.test(p.kind || "")) return true;
  return area >= 10000;
}
const isAreaPlausible = (p) =>
  !(p.kind === "어린이공원" && (p.areaSqm || 0) > MAX_PLAUSIBLE_CHILD_PARK);

/** 안내 대상이 되는 공원 목록 (필터 적용 후) */
export const WALKABLE = parkData.parks.filter((p) => isAreaPlausible(p) && isWalkable(p));

/**
 * 현재 위치에서 가까운 순으로 공원을 정렬해 반환한다.
 * 공원 면적으로 "한 바퀴" 길이를 어림잡는다(정사각형 가정 → 둘레).
 */
export function nearbyParks(origin, limit = 8) {
  return WALKABLE
    .map((p) => {
      const meters = haversine(origin, p);
      const side = p.areaSqm ? Math.sqrt(p.areaSqm) : 0;
      const loop = side ? (side * 4) / 1000 : null;
      return {
        ...p,
        ...describe(p),
        meters,
        dist: formatDistance(meters),
        walk: `${walkMinutes(meters)}분`,
        loop: loop ? `${loop.toFixed(1)}km` : "—",
      };
    })
    .sort((a, b) => a.meters - b.meters)
    .slice(0, limit);
}

/**
 * 지도 SDK가 붙기 전까지 쓰는 좌표 투영.
 * 목록에 있는 공원들의 위경도 범위를 화면 박스 안으로 정규화한다.
 */
export function projectPins(parks, origin, box) {
  const pts = [...parks, origin];
  const lats = pts.map((p) => p.lat);
  const lngs = pts.map((p) => p.lng);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
  const spanLat = maxLat - minLat || 1e-4;
  const spanLng = maxLng - minLng || 1e-4;

  const toXY = (p) => ({
    // 위도는 위로 갈수록 커지므로 y를 뒤집는다
    x: box.left + ((p.lng - minLng) / spanLng) * box.width,
    y: box.top + (1 - (p.lat - minLat) / spanLat) * box.height,
  });

  return { pins: parks.map((p) => ({ ...p, ...toXY(p) })), me: toXY(origin) };
}

/** 브라우저 위치 권한 요청. 실패하면 기본 좌표로 떨어진다. */
export function getOrigin() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve({ ...DEFAULT_ORIGIN, fallback: true });
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          label: "현재 위치",
          fallback: false,
        }),
      (err) =>
        // code 1 = PERMISSION_DENIED. 한 번 거부하면 브라우저가 다시 묻지 않으므로
        // 호출한 쪽이 안내 문구를 띄울 수 있게 구분해 둔다.
        resolve({ ...DEFAULT_ORIGIN, fallback: true, denied: err?.code === 1 }),
      { timeout: 5000, maximumAge: 60000 }
    );
  });
}
