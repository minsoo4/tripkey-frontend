import { http, HttpResponse } from 'msw/http';

import {
  DEMO_TRIP_ID,
  demoRouteLegsResponse,
  demoTrip,
} from '@/dev-fixtures/demo-trip';
import { API_BASE_URL, API_PATH } from '@/utils/constants';

import {
  confirmDemoPlacement,
  getDemoCards,
  getDemoDay,
  getDemoGroups,
} from './demo-store';

// 브라우저 요청 주소를 사용합니다. Vite 프록시가 바꾸는 /v1 주소가 아닙니다.
const apiUrl = (path: string) => `${API_BASE_URL.replace(/\/$/, '')}${path}`;
const tripPath = API_PATH.TRIP_DETAIL(':tripId');
const notFound = () =>
  HttpResponse.json(
    { code: 'NOT_FOUND', message: '예제 여행 또는 일정을 찾을 수 없습니다.' },
    { status: 404 }
  );

export const handlers = [
  http.get(apiUrl(tripPath), ({ params }) =>
    params.tripId === DEMO_TRIP_ID ? HttpResponse.json(demoTrip) : notFound()
  ),
  http.get(apiUrl(API_PATH.CARDS(':tripId')), ({ params }) =>
    params.tripId === DEMO_TRIP_ID
      ? HttpResponse.json(getDemoCards())
      : notFound()
  ),
  http.get(apiUrl(`${tripPath}/days/:dayNumber`), ({ params }) => {
    const dayNumber = Number(params.dayNumber);
    if (
      params.tripId !== DEMO_TRIP_ID ||
      !Number.isInteger(dayNumber) ||
      dayNumber < 1 ||
      dayNumber > demoTrip.travel_days
    ) {
      return notFound();
    }

    return HttpResponse.json(getDemoDay(dayNumber));
  }),
  http.get(apiUrl(API_PATH.GROUPS(':tripId')), ({ params, request }) => {
    if (params.tripId !== DEMO_TRIP_ID) return notFound();
    if (new URL(request.url).searchParams.get('view') !== '04') {
      return HttpResponse.json(
        { message: '데모는 일정 배치 화면의 카드 목록만 지원합니다.' },
        { status: 501 }
      );
    }
    return HttpResponse.json(getDemoGroups());
  }),
  http.post(
    apiUrl(API_PATH.CONFIRM(':tripId')),
    async ({ params, request }) => {
      if (params.tripId !== DEMO_TRIP_ID) return notFound();
      try {
        return HttpResponse.json(confirmDemoPlacement(await request.json()));
      } catch (error) {
        return HttpResponse.json(
          {
            code: 'INVALID_PLACEMENT',
            message:
              error instanceof Error ? error.message : '잘못된 일정입니다.',
          },
          { status: 400 }
        );
      }
    }
  ),
  http.get(apiUrl(API_PATH.ROUTE_LEGS(':tripId')), ({ params }) =>
    params.tripId === DEMO_TRIP_ID
      ? HttpResponse.json(demoRouteLegsResponse)
      : notFound()
  ),
  // 데모에서 구현하지 않은 API가 실제 백엔드로 전달되지 않도록 막습니다.
  // 지도 등 외부 서비스 요청에는 이 규칙이 적용되지 않습니다.
  http.all(apiUrl('/*'), () =>
    HttpResponse.json(
      {
        code: 'DEMO_NOT_IMPLEMENTED',
        message:
          '데모는 일정 조회·카드 배치·확정을 지원합니다. 이 기능은 아직 지원하지 않습니다.',
      },
      { status: 501 }
    )
  ),
];
