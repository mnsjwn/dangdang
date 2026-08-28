import React from "react";
import ReactDOM from "react-dom/client";
import { Toaster } from "sonner";
import App from "./App.jsx";

/**
 * 모바일 전용 앱이라 데스크톱에서도 폰 폭(최대 430px)을 유지한다.
 * 넓은 화면에서는 가운데 정렬하고 바깥쪽만 배경색으로 채운다.
 */
function PhoneFrame({ children }) {
  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        justifyContent: "center",
        background: "#E8E4E0",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 430,
          minHeight: "100dvh",
          background: "#fff",
          position: "relative",
          // 폰 폭보다 넓은 화면에서만 경계가 보이도록
          boxShadow: "0 0 0 1px rgba(26,21,18,.06), 0 18px 50px rgba(60,40,30,.12)",
        }}
      >
        {children}
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <PhoneFrame>
      {/* sonner 토스트는 앱 루트에 한 번만 렌더링하면 어디서든 toast()로 호출 가능 */}
      <Toaster richColors position="top-center" />
      <App />
    </PhoneFrame>
  </React.StrictMode>
);
