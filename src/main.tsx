import posthog from 'posthog-js';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from './App';
import './App.css';

const isDemo = import.meta.env.MODE === 'demo';

// 예제 여행 조회를 실제 사용자 분석 데이터에 포함하지 않습니다.
if (!isDemo && import.meta.env.VITE_PUBLIC_POSTHOG_KEY) {
  posthog.init(import.meta.env.VITE_PUBLIC_POSTHOG_KEY, {
    api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
    capture_pageview: 'history_change',
    // 전송 직전 훅 — URL 쿼리에 tripId 등 내부 식별자가 실려 나가지 않도록 경로만 남긴다.
    sanitize_properties: (properties) => ({
      ...properties,
      $current_url: properties.$current_url?.split('?')[0],
      $referrer: properties.$referrer?.split('?')[0],
    }),
    loaded: (ph) => {
      // 로컬 개발 중 클릭이 실사용자 데이터에 섞이지 않도록 수집을 끈다.
      if (import.meta.env.DEV) ph.opt_out_capturing();
    },
  });

  // super property — 이후 모든 이벤트에 environment 가 자동으로 붙는다.
  posthog.register({
    environment: import.meta.env.VITE_APP_ENV ?? 'development',
  });
}

const startApp = async () => {
  if (isDemo) {
    const { worker } = await import('./mocks/browser');
    // 첫 조회가 MSW 준비 전에 실제 서버로 나가지 않도록 기다립니다.
    await worker.start({
      serviceWorker: {
        url: `${import.meta.env.BASE_URL}mockServiceWorker.js`,
      },
      onUnhandledFrame: 'bypass',
    });
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      {isDemo && (
        <div
          role="status"
          className="bg-violet-100 px-4 py-2 text-center text-sm text-violet-950"
        >
          예제 데이터 데모 · 온보딩·카드 조회·일정 이동·확정을 체험할 수
          있습니다. 새로고침하면 여행이 초기 예제로 돌아갑니다. 카드 추가·내용
          수정·AI·채팅·실제 동선 계산은 지원하지 않습니다.
        </div>
      )}
      <App />
    </StrictMode>
  );
};

void startApp().catch((error: unknown) => {
  console.error('앱을 시작하지 못했습니다.', error);
  const root = document.getElementById('root');
  if (root) {
    root.textContent =
      '데모를 시작하지 못했습니다. 페이지를 새로고침해 주세요.';
  }
});
