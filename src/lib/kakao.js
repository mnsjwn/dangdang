// 카카오 지도 SDK 로더
//
// JavaScript 키는 브라우저 코드에 노출될 수밖에 없는 종류이고, 카카오 개발자
// 콘솔에 등록한 도메인에서만 동작하도록 제한돼 있어서 저장소에 두어도 된다.
// (등록 도메인: 배포 주소 + http://localhost:5173)
// 키를 바꾸고 싶으면 .env 에 VITE_KAKAO_JS_KEY 를 넣으면 그 값이 우선한다.

import { useEffect, useState } from "react";

const KEY = import.meta.env.VITE_KAKAO_JS_KEY || "ccbf519ddb214a0d6d16c3eff0accf9a";
const SRC = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KEY}&autoload=false`;

let loading = null;

function loadSdk() {
  if (window.kakao?.maps?.LatLng) return Promise.resolve();
  if (loading) return loading;

  loading = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${SRC}"]`);
    const script = existing || document.createElement("script");
    script.src = SRC;
    script.async = true;
    script.onload = () => window.kakao.maps.load(resolve);
    script.onerror = () => reject(new Error("카카오 지도 SDK를 불러오지 못했습니다."));
    if (!existing) document.head.appendChild(script);
  });
  return loading;
}

/**
 * SDK 로딩 상태를 반환한다.
 * 도메인 미등록·네트워크 차단 등으로 실패하면 failed 가 true 가 되고,
 * 화면은 지도 없이도 동작하는 대체 뷰로 떨어진다.
 */
export function useKakaoMaps() {
  const [state, setState] = useState({ ready: false, failed: false });

  useEffect(() => {
    let alive = true;
    loadSdk()
      .then(() => alive && setState({ ready: true, failed: false }))
      .catch(() => alive && setState({ ready: false, failed: true }));
    return () => { alive = false; };
  }, []);

  return state;
}

/** 카카오맵에서 실제 도보 길찾기를 여는 링크 */
export const routeLink = (park) =>
  `https://map.kakao.com/link/to/${encodeURIComponent(park.name)},${park.lat},${park.lng}`;
