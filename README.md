# TripKey Frontend

여행 메모를 카드로 정리하고, 날짜별 일정으로 편집·확정하는 여행 플래너입니다.

팀 프로젝트에서 프론트엔드 코드를 분리한 저장소이며, **minsoo가 담당한 화면과 수정 내용**을 정리했습니다. 백엔드와 AI 처리 서버는 포함하지 않습니다.

| 항목 | 내용 |
| --- | --- |
| 개인 기여 기간 | 2026.04.08 ~ 2026.07.27 — 보존된 minsoo 커밋 기준 |
| 담당 | 온보딩·메모 입력·확정 화면, 지도·공유 기능, 기존 화면 개선 |
| 주요 기술 | React 19, TypeScript, Vite, Zustand, TanStack Query, Tailwind CSS |

<!-- 공개 전 추가: 팀 구성과 역할 분담, 원본 저장소, 배포·데모 링크, 실제 화면 스크린샷 또는 GIF. -->

[서비스 흐름](#서비스-흐름) · [담당 작업](#담당한-작업) · [수정 사례](#수정-사례) · [실행 방법](#로컬-실행)

## 서비스 흐름

```mermaid
flowchart LR
    A["여행 준비<br/>여행 정보 설정 · 메모 입력"]
    B["일정 만들기<br/>카드 검토 · 날짜별 배치"]
    C["확정 및 공유<br/>지도 확인 · 링크 공유"]

    A --> B --> C

    classDef step fill:#F5F3FF,stroke:#C4B5FD,color:#252039,stroke-width:1px;
    classDef finish fill:#EDE9FE,stroke:#8B5CF6,color:#252039,stroke-width:2px;
    class A,B step;
    class C finish;
```

입력한 메모를 서버에서 처리하면, 결과를 카드로 검토하고 날짜별 일정으로 배치합니다. 완성한 일정은 지도와 함께 확인하고 링크로 공유할 수 있습니다.

## 담당한 작업

**minsoo · 프론트엔드 개발**

- **온보딩·메모 입력** — 여행 정보와 예약 정보 입력 화면, API 연동
- **확정 화면·지도** — 날짜별 일정, 장소 마커와 호버 정보, 순서 연결선
- **공유** — 공유 링크 생성, 네이티브 공유와 클립보드 복사
- **기존 화면 개선** — 공통 헤더, 정리·배치 UI, 미완료 카드의 진행 제한
- **이벤트 기록** — PostHog 제출·확정·조회·공유 시도 이벤트 추가

<details>
<summary>작업별 커밋 보기</summary>

| 영역 | 작업 내용 | 대표 커밋 |
| --- | --- | --- |
| 온보딩 | 여행지·인원·날짜 입력 UI와 여행 생성 API 연동 | [UI](https://github.com/minsoo4/tripkey-frontend/commit/ca81235), [API](https://github.com/minsoo4/tripkey-frontend/commit/f190463) |
| 메모 입력 | 입력 화면, Dump API·DTO, 항공·숙박 정보 입력 및 연동 | [화면](https://github.com/minsoo4/tripkey-frontend/commit/fab01ae), [API](https://github.com/minsoo4/tripkey-frontend/commit/a88a018), [예약 정보](https://github.com/minsoo4/tripkey-frontend/commit/c701d17) |
| 확정 화면·지도 | 확정 화면 UI, 날짜별 장소 마커, 호버 정보와 순서 연결선 | [화면](https://github.com/minsoo4/tripkey-frontend/commit/c5e2223), [지도](https://github.com/minsoo4/tripkey-frontend/commit/9de25f2) |
| 공유 | 공유 링크 생성, 네이티브 공유·클립보드 복사, 공유 화면의 편집 관련 액션 숨김 | [공유](https://github.com/minsoo4/tripkey-frontend/commit/310e6ad) |
| 기존 화면 개선 | 공통 헤더, 정리·배치 화면 UI 수정, 미완료 카드가 있을 때 다음 단계 진행 제한 | [헤더](https://github.com/minsoo4/tripkey-frontend/commit/f09a6bd), [정리](https://github.com/minsoo4/tripkey-frontend/commit/4655bdd), [배치](https://github.com/minsoo4/tripkey-frontend/commit/f8b5a9f), [진행 제한](https://github.com/minsoo4/tripkey-frontend/commit/04196c5) |
| 이벤트 기록 | PostHog 연동 및 제출·확정·조회·공유 시도 이벤트 추가 | [이벤트 추가](https://github.com/minsoo4/tripkey-frontend/commit/368ed71) |

</details>

<details>
<summary>구현 범위</summary>

- AI 처리·추천은 서버 연동 기능이며, 일정 배치 전체와 AI 로직은 개인 기여에 포함하지 않았습니다.
- 지도 연결선은 장소 순서를 표시하며, 도로 기반 길찾기는 아닙니다.
- 공유 화면은 편집 관련 UI를 숨기는 방식입니다. 서버 권한 제어를 의미하지 않습니다.
- PostHog는 이벤트 기록을 추가한 단계이며, 측정된 전환율 개선 성과는 없습니다.

</details>

## 수정 사례

### 01. 새로고침 후 여행 정보 유지

**문제** — 새로고침하면 여행 식별자와 입력 정보가 사라졌습니다.

**수정** — Zustand `persist`로 값을 저장하고, 캘린더 초기값과 `Date` 객체를 복원했습니다.

현재는 `sessionStorage`를 사용해 **같은 탭의 새로고침**에 대응합니다. 새 탭·다른 기기에서 식별자 없이 데이터를 복원하는 기능은 아닙니다.

[커밋 확인 ↗](https://github.com/minsoo4/tripkey-frontend/commit/4ffe19f) · [코드 보기](src/utils/calendar-store.ts)

### 02. 날짜 전환 시 기간 표시 수정

**문제** — 정확한 날짜와 유연한 날짜를 전환하면 이전 값이 남아 박·일이 잘못 표시되었습니다.

**수정** — 한 유형을 선택할 때 다른 유형의 날짜 값을 함께 초기화했습니다.

[커밋 확인 ↗](https://github.com/minsoo4/tripkey-frontend/commit/1bebf73) · [코드 보기](src/utils/calendar-store.ts)

### 03. 늦게 도착하는 지도 좌표 반영

**문제** — 장소 처리 완료 전에 진입하면 지도에 좌표가 표시되지 않았습니다.

**수정** — 처리 중인 카드가 있으면 2초 간격으로 다시 조회하고, 완료되거나 갱신 횟수 상한을 넘으면 중단하도록 했습니다.

[커밋 확인 ↗](https://github.com/minsoo4/tripkey-frontend/commit/1d94b40) · [코드 보기](src/hooks/useArrange.ts)

## 현재 상태

| 확인 가능한 기능 | 보완이 필요한 부분 |
| --- | --- |
| 메인·온보딩 입력 UI | 이후 단계는 유효한 tripId와 백엔드 필요 |
| 게스트 시작 | 소셜 로그인·일정 저장은 준비 중 |
| 일정 화면과 공유 UI | 일부 모바일 레이아웃 보완 필요 |

개발 모드의 페이지 진입 허용은 데이터 제공과 별개입니다. 배포 모드에서는 tripId가 없으면 온보딩으로 이동합니다.

<details>
<summary>다음 보완 항목</summary>

- [ ] 백엔드와 실제 tripId 없이 체험할 수 있는 예제 여행 데모
- [ ] tripId 누락·잘못된 ID·서버 오류 안내 및 다시 시작하기
- [ ] 모바일 가로 넘침·고정 폭 패널·버튼 배치 수정
- [ ] 드래그 없이 날짜를 선택해 카드를 이동하는 방법
- [ ] 실제 화면 스크린샷과 짧은 시연 영상

</details>

## 코드 구성

<details>
<summary>폴더 구조와 사용 기술</summary>

| 경로 | 내용 |
| --- | --- |
| `src/pages` | 온보딩, 입력, 정리, 배치, 확정 등 페이지 |
| `src/components` | 화면별 컴포넌트와 공통 UI |
| `src/hooks` | 서버 조회·변경 및 처리 상태 폴링 |
| `src/utils` | API 함수, Zustand 스토어, 응답을 화면 데이터로 변환하는 매퍼 |
| `src/types` | API 및 화면 데이터 타입 |

여행 입력 상태는 Zustand로, 카드·일정 조회는 TanStack Query와 Axios로 처리합니다. 지도는 `@vis.gl/react-google-maps`, 공통 UI는 Tailwind CSS와 Radix UI 기반 컴포넌트를 사용합니다.

</details>

## 로컬 실행

Node.js 22와 npm을 기준으로 합니다.

```bash
git clone https://github.com/minsoo4/tripkey-frontend.git
cd tripkey-frontend
npm ci
cp .env.example .env.local
npm run dev
```

개발 서버: <http://localhost:3000>

<details>
<summary>환경변수와 서버 연결 설정</summary>

`.env.local`에서 연결할 서버와 외부 서비스 설정을 입력합니다.

| 변수 | 예시 / 기본값 | 용도 |
| --- | --- | --- |
| `VITE_API_BASE_URL` | `/api` | 프론트엔드 API 요청 경로 |
| `VITE_DEV_PROXY_TARGET` | `http://localhost:8080` | 개발 서버가 요청을 전달할 백엔드 주소 |
| `VITE_GOOGLE_MAPS_API_KEY` | 직접 입력 | 지도 표시용 키 |
| `VITE_PUBLIC_POSTHOG_KEY` | 직접 입력 | PostHog 프로젝트 키 |
| `VITE_PUBLIC_POSTHOG_HOST` | `https://us.i.posthog.com` | PostHog 수집 서버 |
| `VITE_APP_ENV` | 미설정 시 `development` | 분석 이벤트의 환경 구분. 필요 시 직접 추가 |

개발 서버는 `/api` 요청을 백엔드의 `/v1` 경로로 바꿔 전달합니다. 예를 들어 `/api/trips`는 기본 설정에서 `http://localhost:8080/v1/trips`로 전달됩니다.

지도 표시에는 Google Maps API 키가 필요합니다. 개발 모드에서는 PostHog 수집을 비활성화합니다.

Docker/Nginx 설정은 `backend:8080`에 접근할 수 있는 환경을 전제로 합니다. 이 저장소에는 백엔드와 Docker Compose 구성이 없으며, 실제 배포 시 API 프록시 주소를 환경에 맞게 설정해야 합니다.

</details>

<details>
<summary>개발 명령어</summary>

| 명령어 | 용도 |
| --- | --- |
| `npm run dev` | 개발 서버 실행 |
| `npm run build` | TypeScript 빌드 검사 후 프로덕션 파일 생성 |
| `npm run preview` | 빌드 결과 미리보기. 개발 서버의 API 프록시 설정은 적용되지 않음 |
| `npm run lint` | ESLint 검사 |
| `npm run lint:fix` | 자동 수정 가능한 규칙 적용 |

현재 `package.json`에는 자동화 테스트 명령이 등록되어 있지 않습니다.

</details>

<!-- README 구성 검토 시 참고한 공개 사례:
- 팀 프로젝트 소개: https://github.com/woowacourse-teams/2024-review-me
- 개인 기여와 PR 연결: https://github.com/hwinkr/2024-woowacourse-archive
본문의 기여 설명은 이 저장소의 코드와 커밋을 기준으로 작성했습니다.
-->

## 라이선스

[MIT License](LICENSE)
