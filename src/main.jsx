import React from "react";
import ReactDOM from "react-dom/client";
import { Toaster } from "sonner";
import App from "./App.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {/* sonner 토스트는 앱 루트에 한 번만 렌더링하면 어디서든 toast()로 호출 가능 */}
    <Toaster richColors position="top-center" />
    <App />
  </React.StrictMode>
);
