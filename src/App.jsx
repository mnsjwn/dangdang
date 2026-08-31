import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Splash, Onboard, Login } from "./screens/Intro.jsx";
import { Signin, Signup, Welcome } from "./screens/Auth.jsx";
import { Food } from "./screens/Food.jsx";
import { Result } from "./screens/Result.jsx";
import { Timer, Done } from "./screens/Activity.jsx";
import { My, EditProfile } from "./screens/My.jsx";
import { Trails } from "./screens/Trails.jsx";
import { totalGL } from "./lib/engine.js";
import * as api from "./lib/api.js";
import { WALKABLE, getOrigin } from "./lib/geo.js";

const SAVED = "dangdang_profile";
// 온보딩을 본 적 있는지는 로그인 여부와 별개로 기억한다.
// SAVED 하나로 겸하면 '로그인 상태 유지'를 끄거나 로그아웃한 순간
// 이미 앱을 아는 사람에게 온보딩이 다시 뜬다.
const SEEN = "dangdang_onboarded";

const seenOnboarding = () => {
  try {
    return localStorage.getItem(SEEN) === "1";
  } catch {
    return false; // 저장소를 못 읽으면 안전하게 온보딩을 보여준다
  }
};

const markOnboarding = () => {
  try {
    localStorage.setItem(SEEN, "1");
  } catch {
    /* 저장 실패해도 흐름은 그대로 진행한다 */
  }
};

export default function App() {
  const [screen, setScreen] = useState("splash");
  const [profile, setProfile] = useState(null);
  const [items, setItems] = useState([]);
  const [activity, setActivity] = useState(null);
  const [moved, setMoved] = useState(0);
  const [stamps, setStamps] = useState([]);

  // "로그인 상태 유지"로 저장해 둔 계정이 있으면 스플래시 다음에 바로 홈으로
  const [remembered] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(SAVED) || "null");
    } catch {
      return null;
    }
  });

  const loadStamps = useCallback(async (nickname) => {
    if (!nickname) return;
    try {
      const res = await api.getStamps(nickname);
      if (res.success) setStamps(res.stamps);
    } catch {
      // 기록 조회 실패는 화면을 막을 정도는 아니라 조용히 넘어간다
    }
  }, []);

  useEffect(() => {
    if (profile?.nickname) loadStamps(profile.nickname);
  }, [profile?.nickname, loadStamps]);

  // 가입·로그인·자동로그인 어느 경로로 들어와도 앱에 들어선 순간 위치 권한을 한 번
  // 물어둔다. 산책로 화면에서 처음 묻게 두면 그 화면이 뜨는 동안 지도가 멈춰 보인다.
  // 거부해도 기본 좌표로 동작하므로 결과는 기다리지 않는다.
  const askedGeo = useRef(false);
  useEffect(() => {
    if (!profile?.nickname || askedGeo.current) return;
    askedGeo.current = true;
    getOrigin().catch(() => {});
  }, [profile?.nickname]);

  function signedIn(p, keep) {
    setProfile(p);
    if (keep) {
      try {
        localStorage.setItem(SAVED, JSON.stringify(p));
      } catch {
        /* 저장 실패해도 이번 세션은 그대로 쓴다 */
      }
    }
    markOnboarding(); // 로그인까지 한 사람은 온보딩을 이미 지난 사람이다
    setScreen("welcome");
  }

  function logout() {
    try {
      localStorage.removeItem(SAVED);
    } catch {
      /* 무시 */
    }
    setProfile(null);
    setStamps([]);
    setItems([]);
    setScreen("login");
  }

  async function finishActivity({ minutes }) {
    setMoved(minutes);
    setScreen("done");

    if (!profile?.nickname) return; // 익명 모드는 기록을 남기지 않는다
    const stamp = {
      activityType: activity.kind === "stairs" ? "계단오르기" : "걷기",
      minutes,
      kcal: Math.round(activity.met * (Number(profile.weight) || 62) * (minutes / 60)),
      totalGL: totalGL(items),
      dropPercent: activity.dropPercent,
    };
    try {
      await api.addStamp(profile.nickname, stamp);
      await loadStamps(profile.nickname);
    } catch {
      toast.error("스탬프를 저장하지 못했어요. 기록은 다음에 다시 시도할게요.");
    }
  }

  switch (screen) {
    case "splash":
      return (
        <Splash
          onDone={() => {
            // 저장해 둔 계정이 있으면 바로 홈으로,
            // 없더라도 온보딩을 본 적 있으면 로그인 화면으로 보낸다
            if (remembered) {
              setProfile(remembered);
              setScreen("welcome");
            } else {
              setScreen(seenOnboarding() ? "login" : "onboard");
            }
          }}
        />
      );

    case "onboard":
      return <Onboard onFinish={() => { markOnboarding(); setScreen("login"); }} />;

    case "login":
      return <Login onSignin={() => setScreen("signin")} onSignup={() => setScreen("signup")} />;

    case "signin":
      return (
        <Signin
          onBack={() => setScreen("login")}
          onSignup={() => setScreen("signup")}
          onSuccess={signedIn}
        />
      );

    case "signup":
      return <Signup onBack={() => setScreen("login")} onSuccess={(p) => signedIn(p, true)} />;

    case "welcome":
      return (
        <Welcome
          profile={profile}
          stampCount={new Set(stamps.map((s) => String(s.date).slice(0, 10))).size}
          totalMinutes={stamps.reduce((a, s) => a + (Number(s.minutes) || 0), 0)}
          onStart={() => setScreen("food")}
          onSwitch={logout}
        />
      );

    case "food":
      return (
        <Food
          items={items}
          setItems={setItems}
          onNext={() => setScreen("result")}
          onMy={() => setScreen("my")}
        />
      );

    case "result":
      return (
        <Result
          items={items}
          weight={profile?.weight}
          onBack={() => setScreen("food")}
          onStart={(a) => {
            setActivity(a);
            setScreen("timer");
          }}
        />
      );

    case "timer":
      return (
        <Timer
          activity={activity}
          weight={profile?.weight}
          onBack={() => setScreen("result")}
          onDone={finishActivity}
        />
      );

    case "done":
      return (
        <Done
          activity={activity}
          movedMinutes={moved}
          weight={profile?.weight}
          onHome={() => {
            setItems([]);
            setScreen("welcome");
          }}
          onMy={() => {
            setItems([]);
            setScreen("my");
          }}
        />
      );

    case "my":
      return (
        <My
          profile={profile}
          stamps={stamps}
          parkCount={WALKABLE.length}
          onEdit={() => setScreen("edit")}
          onMap={() => setScreen("map")}
          onFood={() => setScreen("food")}
          onLogout={logout}
        />
      );

    case "edit":
      return (
        <EditProfile
          profile={profile}
          onBack={() => setScreen("my")}
          onSaved={(p) => {
            setProfile(p);
            try {
              if (localStorage.getItem(SAVED)) localStorage.setItem(SAVED, JSON.stringify(p));
            } catch {
              /* 무시 */
            }
            setScreen("my");
          }}
        />
      );

    case "map":
      return <Trails onBack={() => setScreen("my")} />;

    default:
      return null;
  }
}
