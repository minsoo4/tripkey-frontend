import type { DayViewModel, RouteLegsResponse } from '@/types/arrange-api';
import type { Card, CardsResponse } from '@/types/grouping-api';
import type { TripDetailResponse } from '@/types/trip-api';

// 실제 서버가 발급한 ID가 아닌, 예제 데이터를 구분하기 위한 값입니다.
export const DEMO_TRIP_ID = 'demo-osaka';

// 여행 상세 API 응답 모양의 예제입니다. 데모 모드의 MSW 응답으로 사용합니다.
// 날짜를 고정해 실행 시점에 따라 데모 내용이 바뀌지 않도록 합니다.
export const demoTrip: TripDetailResponse = {
  trip_id: DEMO_TRIP_ID,
  travel_days: 2,
  companion_count: 2,
  destinations: ['오사카'],
  confirmed: true,
  created_at: '2026-11-03T00:00:00Z',
  start_date: '2026-11-14',
};

// 장소마다 달라지는 값만 입력하고, 공통 상태와 사용하지 않는 필드는 여기서 채웁니다.
type DemoPlace = Pick<
  Card,
  | 'instance_id'
  | 'name'
  | 'category'
  | 'coordinates'
  | 'estimated_duration_min'
  | 'day'
  | 'day_order'
>;

const createDemoCard = (place: DemoPlace): Card => ({
  ...place,
  place_id: null,
  classification: 'confirmed',
  placement_status: 'ready',
  processing_status: 'completed',
  action_type: 'review_only',
  can_exclude: true,
  allow_duplicate: false,
  is_excluded: false,
  is_ai_generated: false,
  location: '오사카',
  address: null,
  time_constraint: null,
  question_text: null,
  options: null,
  blocked_reason: null,
  user_context: null,
  tips: null,
  tags: null,
  source: 'demo',
  notes: null,
  memo: null,
  check_in: null,
  check_out: null,
  flight_number: null,
  flight_datetime: null,
  flight_role: null,
});

// 좌표는 지도 시연용이며, 체류 시간과 방문 순서는 예시입니다.
export const demoCards: Card[] = [
  createDemoCard({
    instance_id: 'demo-osaka-castle',
    name: '오사카성',
    category: 'place',
    coordinates: { lat: 34.6873, lng: 135.5262 },
    estimated_duration_min: 90,
    day: 1,
    day_order: 1,
  }),
  createDemoCard({
    instance_id: 'demo-nakanoshima',
    name: '나카노시마 공원',
    category: 'place',
    coordinates: { lat: 34.6926, lng: 135.5062 },
    estimated_duration_min: 60,
    day: 1,
    day_order: 2,
  }),
  createDemoCard({
    instance_id: 'demo-kuromon',
    name: '구로몬 시장',
    category: 'food',
    coordinates: { lat: 34.6653, lng: 135.5063 },
    estimated_duration_min: 60,
    day: 2,
    day_order: 1,
  }),
  createDemoCard({
    instance_id: 'demo-dotonbori',
    name: '도톤보리',
    category: 'place',
    coordinates: { lat: 34.6687, lng: 135.5013 },
    estimated_duration_min: 90,
    day: 2,
    day_order: 2,
  }),
];

export const demoCardsResponse: CardsResponse = {
  cards: demoCards,
  context_summary: '두 명이 함께하는 오사카 2일 예제 여행',
  alert_cards: [],
};

// 카드 목록과 일자별 응답을 따로 복사하지 않고 같은 원본에서 구성합니다.
// 배열의 첫 번째 항목이 Day 1, 두 번째 항목이 Day 2 응답입니다.
export const demoDays: DayViewModel[] = Array.from(
  { length: demoTrip.travel_days },
  (_, index) => ({
    day_id: `${DEMO_TRIP_ID}-day-${index + 1}`,
    start_time_card: null,
    end_time_card: null,
    cards: demoCards
      .filter((card) => card.day === index + 1)
      .sort((a, b) => (a.day_order ?? 0) - (b.day_order ?? 0)),
  })
);

// 실측한 이동 정보가 없으므로 시간을 만들어 넣지 않습니다.
// 지도는 카드 좌표로 순서 연결선을 그릴 수 있습니다.
export const demoRouteLegsResponse: RouteLegsResponse = {
  route_legs: [],
};
