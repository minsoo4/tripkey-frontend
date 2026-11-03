import { demoCardsResponse, demoTrip } from '@/dev-fixtures/demo-trip';
import type {
  DayViewModel,
  Groups04Response,
  PlacementSaveResponse,
} from '@/types/arrange-api';

// fixture는 초기값, 이 모듈은 현재 상태입니다. 새로고침하면 초기값으로 돌아갑니다.
let cards = structuredClone(demoCardsResponse.cards);

export const getDemoCards = () =>
  structuredClone({ ...demoCardsResponse, cards });

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
      day.day_number > demoTrip.travel_days ||
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
  // 실제 동선 계산은 하지 않습니다. 실측 이동 시간이나 검증 결과를 생성하지 않습니다.
  return {
    saved: true,
    trip_id: demoTrip.trip_id,
    skipped_instance_ids: [],
    route_warnings: [],
    route_legs: [],
  };
};
