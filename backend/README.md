# 당당 백엔드 (Google Sheets + Apps Script)

Firebase 대신 Google Sheets를 DB로 쓴다.

## 1. 스프레드시트 만들기

새 Google Sheets 파일을 만들고, 하단 탭 이름을 **정확히** `Users`, `Stamps`로 만든다.
각 시트 1행에 아래 헤더를 넣는다(데이터는 2행부터 쌓임).

**Users 시트**

| A | B | C | D | E | F |
|---|---|---|---|---|---|
| nickname | passwordHash | weight | height | age | joinedAt |

**Stamps 시트**

| A | B | C | D | E | F | G |
|---|---|---|---|---|---|---|
| nickname | date | activityType | minutes | kcal | totalGL | dropPercent |

> 비밀번호는 평문이 아니라 SHA-256 해시로 저장된다. 시트를 열어봐도 원문은 안 보인다.

## 2. Apps Script 붙여넣기

1. 스프레드시트 메뉴 → **확장 프로그램 → Apps Script**
2. 기본 `Code.gs` 내용을 다 지우고, 이 폴더의 `Code.gs` 내용을 붙여넣기
3. 저장 (Ctrl+S)

## 3. 웹 앱으로 배포

1. 우측 상단 **배포 → 새 배포**
2. 유형 → **웹 앱**
3. 실행 계정 **나**, 액세스 권한 **모든 사용자**
4. 배포 → 권한 승인(본인 계정이니 "고급" → "이동" → 허용)
5. 나오는 **웹 앱 URL** 복사 (`https://script.google.com/macros/s/...../exec`)

## 4. 프론트엔드에 연결

프로젝트 루트에 `.env` 파일을 만들고:

```
VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/...../exec
```

## 5. API 정리

읽기는 GET(쿼리스트링), 쓰기는 POST(`Content-Type: text/plain`)로 보낸다.
text/plain이어야 브라우저가 CORS preflight를 안 띄워서 Apps Script와 통신이 된다.
비밀번호가 URL에 남지 않는 이점도 있다.

| 동작 | 방식 | 파라미터 |
|---|---|---|
| 닉네임 중복확인 | GET | `action=checkNickname&nickname=` |
| 회원가입 | POST | `{action:"register", nickname, password, weight, height, age}` |
| 로그인 | POST | `{action:"login", nickname, password}` |
| 프로필 조회 | GET | `action=getProfile&nickname=` |
| 신체정보 수정 | POST | `{action:"updateProfile", nickname, weight, height, age}` |
| 스탬프 적립 | POST | `{action:"addStamp", nickname, date, activityType, minutes, kcal, totalGL, dropPercent}` |
| 스탬프 조회 | GET | `action=getStamps&nickname=` |

### 검증 규칙 (디자인과 일치)
- 닉네임 2~10자, 중복 불가
- 비밀번호 8자 이상 + 영문·숫자 혼용
- 로그인 실패 시 "닉네임 또는 비밀번호가 맞지 않아요" 하나로 응답
  (계정이 존재하는지 여부를 노출하지 않기 위해)

## 6. 코드 고친 뒤에는 재배포

`Code.gs`를 수정했으면 **배포 → 배포 관리 → 연필 아이콘 → 버전: 새 버전 → 배포**를
해야 반영된다. 저장만 하면 기존 URL에는 반영되지 않는다.
