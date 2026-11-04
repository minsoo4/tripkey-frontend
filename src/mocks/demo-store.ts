import { demoCardsResponse, demoTrip } from '@/dev-fixtures/demo-trip';
import type {
  DayViewModel,
  Groups04Response,
  PlacementSaveResponse,
} from '@/types/arrange-api';
import type { Groups03Response } from '@/types/grouping-api';

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
  cards = structuredClone(demoCardsResponse.cards);
  // 기존 예제 배치를 기간에 맞춰 조정합니다. 3일 이상이면 나머지 날짜는 비워둡니다.
  const orders = new Map<number, number>();
  for (const card of cards) {
    card.day = Math.min(card.day ?? 1, trip.travel_days);
    card.day_order = (orders.get(card.day) ?? 0) + 1;
    orders.set(card.day, card.day_order);
  }
  return { trip_id: trip.trip_id, created_at: trip.created_at };
};

export const getDemoCards = () =>
  structuredClone({
    ...demoCardsResponse,
    cards,
    context_summary: `${trip.companion_count}명이 함께하는 오사카 ${trip.travel_days}일 예제 여행`,
  });

export const getDemoGroups03 = (): Groups03Response => ({
  view: '03',
  input_required: [],
  select_required: [],
  fix_required: [],
  review_only: getDemoCards().cards,
  excluded: [],
});

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
      cards: structuredClone(cards.filter((card) => card.day === null)),
    },
  ],
  pending_reorder: [],
  unavailable: [],
  excluded: [],
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
      if (!card) throw invalid();
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
