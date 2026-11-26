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
  // Day 1: 오사카성에서 나카노시마까지 서쪽으로 이동
  createDemoCard({
    instance_id: 'demo-osaka-history',
    name: '오사카 역사박물관',
    category: 'place',
    coordinates: { lat: 34.6826, lng: 135.5208 },
    estimated_duration_min: 60,
    day: 1,
    day_order: 1,
  }),
  createDemoCard({
    instance_id: 'demo-osaka-castle',
    name: '오사카성',
    category: 'place',
    coordinates: { lat: 34.6873, lng: 135.5262 },
    estimated_duration_min: 90,
    day: 1,
    day_order: 2,
  }),
  createDemoCard({
    instance_id: 'demo-nakanoshima',
    name: '나카노시마 공원',
    category: 'place',
    coordinates: { lat: 34.6926, lng: 135.5062 },
    estimated_duration_min: 60,
    day: 1,
    day_order: 3,
  }),
  // Day 2: 난바에서 도톤보리를 거쳐 신사이바시로 북상
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
  createDemoCard({
    instance_id: 'demo-shinsaibashi',
    name: '신사이바시 상점가',
    category: 'place',
    coordinates: { lat: 34.673, lng: 135.501 },
    estimated_duration_min: 90,
    day: 2,
    day_order: 3,
  }),
  // Day 3: 우메다 역 주변에서 스카이 빌딩 방향으로 이동
  createDemoCard({
    instance_id: 'demo-grand-front',
    name: '그랜드 프런트 오사카',
    category: 'place',
    coordinates: { lat: 34.7037, lng: 135.4959 },
    estimated_duration_min: 90,
    day: 3,
    day_order: 1,
  }),
  createDemoCard({
    instance_id: 'demo-umeda-sky',
    name: '우메다 스카이 빌딩',
    category: 'place',
    coordinates: { lat: 34.7053, lng: 135.49 },
    estimated_duration_min: 90,
    day: 3,
    day_order: 2,
  }),
  // Day 4: 덴포잔 항만 지역 안에서 이동
  createDemoCard({
    instance_id: 'demo-tempozan',
    name: '덴포잔 대관람차',
    category: 'activity',
    coordinates: { lat: 34.6563, lng: 135.4309 },
    estimated_duration_min: 45,
    day: 4,
    day_order: 1,
  }),
  createDemoCard({
    instance_id: 'demo-kaiyukan',
    name: '가이유칸',
    category: 'activity',
    coordinates: { lat: 34.6545, lng: 135.4289 },
    estimated_duration_min: 150,
    day: 4,
    day_order: 2,
  }),
  // Day 5: 시텐노지에서 덴노지 공원을 거쳐 아베노로 이동
  createDemoCard({
    instance_id: 'demo-shitennoji',
    name: '시텐노지',
    category: 'place',
    coordinates: { lat: 34.6545, lng: 135.5165 },
    estimated_duration_min: 60,
    day: 5,
    day_order: 1,
  }),
  createDemoCard({
    instance_id: 'demo-abeno-harukas',
    name: '아베노 하루카스',
    category: 'place',
    coordinates: { lat: 34.6461, lng: 135.5135 },
    estimated_duration_min: 90,
    day: 5,
    day_order: 2,
  }),
  // Day 6: 스미요시에서 동쪽 나가이 공원 지역으로 이동
  createDemoCard({
    instance_id: 'demo-sumiyoshi-taisha',
    name: '스미요시 타이샤',
    category: 'place',
    coordinates: { lat: 34.6128, lng: 135.4938 },
    estimated_duration_min: 60,
    day: 6,
    day_order: 1,
  }),
  createDemoCard({
    instance_id: 'demo-nagai-park',
    name: '나가이 공원',
    category: 'place',
    coordinates: { lat: 34.6139, lng: 135.5208 },
    estimated_duration_min: 60,
    day: 6,
    day_order: 2,
  }),
];

// 일정 밖에서 서로 다른 검토 상태를 살펴보기 위한 예제입니다.
const createReviewCard = (overrides: Partial<Card>): Card => ({
  ...createDemoCard({
    instance_id: '',
    name: '',
    category: 'etc',
    coordinates: null,
    estimated_duration_min: null,
    day: null,
    day_order: null,
  }),
  ...overrides,
});

export const demoReviewCards: Card[] = [
  createReviewCard({
    instance_id: 'demo-dinner-choice',
    name: '난바 저녁 메뉴 고르기',
    category: 'food',
    classification: 'open_question',
    placement_status: 'needs_input',
    action_type: 'select_required',
    question_text: '저녁으로 어떤 메뉴가 좋으세요?',
    options: ['오코노미야키', '라멘', '스시'],
    user_context: '도톤보리 구경 후 근처에서 저녁을 먹고 싶어요.',
    tips: '메뉴 하나를 선택하고 확인하면 예제 식사 카드가 만들어져요.',
  }),
];

// 선택한 기간 밖의 카드는 미배치 후보로 남겨 직접 일정에 추가할 수 있습니다.
export const createDemoCardsForDays = (travelDays: number): Card[] =>
  structuredClone([...demoCards, ...demoReviewCards]).map((card) =>
    card.day !== null && card.day > travelDays
      ? { ...card, day: null, day_order: null }
      : card
  );

export const demoCardsResponse: CardsResponse = {
  cards: createDemoCardsForDays(demoTrip.travel_days),
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
    cards: demoCardsResponse.cards
      .filter((card) => card.day === index + 1)
      .sort((a, b) => (a.day_order ?? 0) - (b.day_order ?? 0)),
  })
);

// 실측한 이동 정보가 없으므로 시간을 만들어 넣지 않습니다.
// 지도는 카드 좌표로 순서 연결선을 그릴 수 있습니다.
export const demoRouteLegsResponse: RouteLegsResponse = {
  route_legs: [],
};
