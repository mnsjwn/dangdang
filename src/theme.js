// 당당 디자인 토큰 — "당당 App.dc.html"에서 그대로 가져옴
export const C = {
  coral: "#DE5232",
  coralDark: "#C64525",
  coralDeep: "#B93E22",
  coralInk: "#C2431F",
  ink: "#1A1512",
  ink2: "#3E352F",
  body: "#5C5048",
  sub: "#6E6058",
  sub2: "#7A6C63",
  muted: "#8A7C73",
  muted2: "#9C918A",
  faint: "#A0938A",
  faint2: "#B3A79F",
  white: "#FFFFFF",
  paper: "#F7F7F6",
  field: "#F6F4F1",
  mint: "#EDF3EF",
  peach: "#FDF2ED",
  peach2: "#FDF1ED",
  chip: "#F1EFEC",
  track: "#F0EFEE",
  cell: "#F4F3F1",
  avatar: "#E7E0DA",
  avatarInk: "#B3A79F",
  green: "#3D8F63",
  amber: "#C98A16",
  blue: "#2F6BD6",
};

export const LINE = {
  ink: "rgba(26,21,18,.16)",
  inkSoft: "rgba(26,21,18,.14)",
  inkStrong: "rgba(26,21,18,.22)",
  mint: "rgba(46,102,74,.24)",
  mintSoft: "rgba(46,102,74,.22)",
  coral: "rgba(200,88,56,.32)",
};

// 한 끼에 담은 음식 카드에 순서대로 도는 색
export const ITEM_BG = ["#FDF2ED", "#EFF4F0", "#F1F3F8", "#FBF4E7"];
export const ITEM_BD = [
  "rgba(200,88,56,.28)",
  "rgba(60,120,90,.24)",
  "rgba(60,90,150,.22)",
  "rgba(180,130,30,.26)",
];

/** 화면 전체를 채우는 세로 컨테이너 (디자인의 아이폰 프레임 대신 실제 뷰포트를 씀) */
export const screen = (pad = "64px 22px 40px") => ({
  minHeight: "100dvh",
  boxSizing: "border-box",
  background: C.white,
  padding: pad,
  display: "flex",
  flexDirection: "column",
});
