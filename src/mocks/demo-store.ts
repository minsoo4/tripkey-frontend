import {
  createDemoCardsForDays,
  demoCardsResponse,
  demoTrip,
} from '@/dev-fixtures/demo-trip';
import type {
  DayViewModel,
  Groups04Response,
  PlacementSaveResponse,
} from '@/types/arrange-api';
import type { Card, Groups03Response } from '@/types/grouping-api';

// fixture는 초기값, 이 모듈은 현재 상태입니다. 새로고침하면 초기값으로 돌아갑니다.
let cards = structuredClone(demoCardsResponse.cards);
let trip = structuredClone(demoTrip);

export const getDemoTrip = () => structuredClone(trip);

export const createDemoTrip = (body: unknown) => {
  if (
    !isRecord(body) ||
    !Array.isArray(body.destinations) ||
    body.destinations.length !== 1 ||
    body.destinations[0] !== '오사카' ||
    typeof body.travel_days !== 'number' ||
    !Number.isInteger(body.travel_days) ||
    body.travel_days < 1 ||
    body.travel_days > 30 ||
    typeof body.companion_count !== 'number' ||
    !Number.isInteger(body.companion_count) ||
    body.companion_count < 1
  )
    throw new Error(
      '오사카 여행의 기간(1~30일)과 인원(1명 이상)을 확인해 주세요.'
    );

  trip = {
    ...structuredClone(demoTrip),
    travel_days: body.travel_days,
    companion_count: body.companion_count,
    confirmed: false,
    created_at: new Date().toISOString(),
    // 현재 생성 API에는 시작일이 없으므로 화면의 캘린더 상태를 사용합니다.
    start_date: null,
  };
  cards = createDemoCardsForDays(trip.travel_days);
  return { trip_id: trip.trip_id, created_at: trip.created_at };
};

export const getDemoCards = () =>
  structuredClone({
    ...demoCardsResponse,
    cards,
    context_summary: `${trip.companion_count}명이 함께하는 오사카 ${trip.travel_days}일 예제 여행`,
  });

const canPlace = (card: Card) =>
  !card.is_excluded &&
  card.action_type === 'review_only' &&
  card.placement_status === 'ready';

export const getDemoGroups03 = (): Groups03Response => {
  const snapshot = getDemoCards().cards;
  const byAction = (action: Card['action_type']) =>
    snapshot.filter((card) => !card.is_excluded && card.action_type === action);
  return {
    view: '03',
    input_required: byAction('input_required'),
    select_required: byAction('select_required'),
    fix_required: byAction('fix_required'),
    review_only: byAction('review_only'),
    excluded: snapshot.filter((card) => card.is_excluded),
  };
};

export const getDemoDay = (day: number): DayViewModel => ({
  day_id: `${demoTrip.trip_id}-day-${day}`,
  start_time_card: null,
  end_time_card: null,
  cards: structuredClone(
    cards
      .filter((card) => card.day === day)
      .sort((a, b) => (a.day_order ?? 0) - (b.day_order ?? 0))
  ),
});

export const getDemoGroups = (): Groups04Response => ({
  view: '04',
  available: [
    {
      label: '오사카',
      group_reason: '아직 일정에 배치하지 않은 예제 장소입니다.',
      cards: structuredClone(
        cards.filter((card) => card.day === null && canPlace(card))
      ),
    },
  ],
  pending_reorder: [],
  unavailable: structuredClone(
    cards.filter((card) => !card.is_excluded && !canPlace(card))
  ),
  excluded: structuredClone(cards.filter((card) => card.is_excluded)),
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

// 전체 배치를 받아 교체합니다. 검증 실패 시 기존 상태는 그대로 유지합니다.
export const confirmDemoPlacement = (body: unknown): PlacementSaveResponse => {
  const invalid = () =>
    new Error('예제 일정의 날짜, 카드 또는 순서가 올바르지 않습니다.');
  if (!isRecord(body) || !Array.isArray(body.days)) throw invalid();

  const nextCards = structuredClone(cards);
  for (const card of nextCards) {
    card.day = null;
    card.day_order = null;
  }
  const usedDays = new Set<number>();
  const usedCards = new Set<string>();

  for (const day of body.days) {
    if (
      !isRecord(day) ||
      typeof day.day_number !== 'number' ||
      !Number.isInteger(day.day_number) ||
      day.day_number < 1 ||
      day.day_number > trip.travel_days ||
      usedDays.has(day.day_number) ||
      !Array.isArray(day.cards)
    )
      throw invalid();
    usedDays.add(day.day_number);
    const usedOrders = new Set<number>();

    for (const item of day.cards) {
      if (
        !isRecord(item) ||
        typeof item.instance_id !== 'string' ||
        usedCards.has(item.instance_id) ||
        typeof item.order !== 'number' ||
        !Number.isInteger(item.order) ||
        item.order < 1 ||
        usedOrders.has(item.order)
      )
        throw invalid();
      const card = nextCards.find((c) => c.instance_id === item.instance_id);
      if (!card || !canPlace(card)) throw invalid();
      const duration = item.estimated_duration_min;
      if (
        duration !== undefined &&
        duration !== null &&
        (typeof duration !== 'number' ||
          !Number.isFinite(duration) ||
          duration < 0)
      ) {
        throw invalid();
      }
      card.day = day.day_number;
      card.day_order = item.order;
      if (duration !== undefined) card.estimated_duration_min = duration;
      usedCards.add(item.instance_id);
      usedOrders.add(item.order);
    }
  }

  cards = nextCards;
  trip.confirmed = true;
  // 실제 동선 계산은 하지 않습니다. 실측 이동 시간이나 검증 결과를 생성하지 않습니다.
  return {
    saved: true,
    trip_id: demoTrip.trip_id,
    skipped_instance_ids: [],
    route_warnings: [],
    route_legs: [],
  };
};

// 실제 AI/장소 검색 없이, 데모의 선택형 질문 하나만 미리 준비한 카드로 전환합니다.
export const resolveDemoDinner = (body: unknown): Card => {
  if (
    !isRecord(body) ||
    typeof body.notes !== 'string' ||
    Object.keys(body).some((key) => key !== 'notes')
  ) {
    throw new Error('데모에서는 저녁 메뉴 선택만 지원합니다.');
  }
  const selected = body.notes
    .match(/^사용자가 선택한 후보: ([^\n]+)(?:\n|$)/)?.[1]
    .trim();
  if (!selected || !['오코노미야키', '라멘', '스시'].includes(selected)) {
    throw new Error('오코노미야키, 라멘, 스시 중 메뉴 하나만 선택해 주세요.');
  }
  const index = cards.findIndex(
    (card) => card.instance_id === 'demo-dinner-choice'
  );
  const current = cards[index];
  if (!current || current.action_type !== 'select_required') {
    throw new Error(
      '이미 선택이 완료된 질문입니다. 새로고침하면 다시 체험할 수 있어요.'
    );
  }
  cards[index] = {
    ...current,
    name: `도톤보리 ${selected} 저녁`,
    classification: 'confirmed',
    placement_status: 'ready',
    processing_status: 'completed',
    action_type: 'review_only',
    estimated_duration_min: 60,
    coordinates: { lat: 34.6687, lng: 135.5013 },
    location: '도톤보리',
    question_text: null,
    options: null,
    blocked_reason: null,
    notes: body.notes,
    tips: '도톤보리 주변 식사를 가정한 예제입니다. 좌표는 특정 식당이 아닌 지역 위치예요.',
    day: null,
    day_order: null,
  };
  trip.confirmed = false;
  return structuredClone(cards[index]);
};
