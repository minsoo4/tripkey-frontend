import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'vite';
import { getResponse } from 'msw';

// 실제 handlers를 Vite로 묶어 실행합니다. 별도 서버나 테스트용 API 복제본은 없습니다.
const outDir = await mkdtemp(resolve('node_modules/.tripkey-test-'));
try {
  await build({
    configFile: false,
    mode: 'demo',
    logLevel: 'error',
    resolve: { alias: { '@': resolve('src') } },
    define: { 'import.meta.env.VITE_API_BASE_URL': JSON.stringify('/api') },
    build: {
      ssr: resolve('src/mocks/handlers.ts'),
      outDir,
      rollupOptions: { output: { entryFileNames: 'handlers.mjs' } },
    },
  });
  const { handlers } = await import(pathToFileURL(resolve(outDir, 'handlers.mjs')));
  const baseUrl = 'http://localhost:3000';
  const root = '/api/trips/demo-osaka';
  const request = async (path, body, method = 'POST') => {
    const response = await getResponse(handlers, new Request(baseUrl + path,
      body === undefined ? {} : {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }), { baseUrl });
    assert.ok(response, `No handler for ${path}`);
    return { status: response.status, data: await response.json() };
  };
  const create = (days, people = 3) => request('/api/trips', {
    tripName: '테스트 여행', destinations: ['오사카'], travel_days: days,
    companion_count: people, has_flight: false, has_accommodation: false,
  });

  assert.equal((await create(3, 4)).status, 201);
  let detail = (await request(root)).data;
  assert.equal(detail.travel_days, 3);
  assert.equal(detail.companion_count, 4);
  assert.equal(detail.start_date, null);
  assert.equal(detail.confirmed, false);
  assert.equal((await request(root + '/days/3')).data.cards.length, 2);
  assert.equal((await request(root + '/days/4')).status, 404);
  const cards = (await request(root + '/cards')).data.cards;
  assert.equal(cards.length, 15);
  assert.equal(new Set(cards.map(c => c.instance_id)).size, cards.length);
  const groups = await request(root + '/groups?view=03');
  assert.equal(groups.status, 200);
  assert.equal(groups.data.review_only.length, 14);
  assert.equal(groups.data.select_required.length, 1);
  assert.equal(groups.data.excluded.length, 0);
  assert.equal(groups.data.fix_required.length, 0);
  assert.equal(groups.data.input_required.length, 0);
  const categorized = (await request(root + '/groups?view=04')).data;
  assert.equal(categorized.unavailable.length, 1);
  assert.equal(categorized.excluded.length, 0);
  assert.equal((await request(root + '/groups?view=04')).status, 200);
  console.log('✓ 온보딩 기간·인원 반영, 정리/배치 조회, 3일차 배치');

  const placement = { days: [{ day_number: 3, cards: [
    { instance_id: cards[0].instance_id, order: 2, estimated_duration_min: 120 },
    { instance_id: cards[1].instance_id, order: 1 },
  ] }] };
  assert.equal((await request(root + '/confirm', placement)).status, 200);
  assert.equal((await request(root)).data.confirmed, true);
  assert.equal((await request(root + '/days/1')).data.cards.length, 0);
  const saved = (await request(root + '/days/3')).data.cards;
  assert.deepEqual(saved.map(c => c.instance_id), [cards[1].instance_id, cards[0].instance_id]);
  assert.equal(saved[1].estimated_duration_min, 120);
  assert.equal((await request(root + '/groups?view=04')).data.available[0].cards.length, 12);
  console.log('✓ 날짜 이동·순서·체류 시간 저장, 미배치 카드 복원, 확정 상태');

  const before = (await request(root + '/cards')).data;
  for (const invalid of [null, {}, { days: [{ day_number: 4, cards: [] }] },
    { days: [{ day_number: 1, cards: [{ instance_id: 'unknown', order: 1 }] }] },
    { days: [{ day_number: 1, cards: [
      { instance_id: cards[0].instance_id, order: 1 },
      { instance_id: cards[0].instance_id, order: 2 },
    ] }] },
  ]) {
    assert.equal((await request(root + '/confirm', invalid)).status, 400);
    assert.deepEqual((await request(root + '/cards')).data, before);
  }
  for (const id of ['demo-dinner-choice']) {
    assert.equal((await request(root + '/confirm', { days: [{ day_number: 1, cards: [{ instance_id: id, order: 1 }] }] })).status, 400);
    assert.deepEqual((await request(root + '/cards')).data, before);
  }
  for (const days of [0, 31, 1.5]) assert.equal((await create(days)).status, 400);
  assert.equal((await create(2, 0)).status, 400);
  assert.equal((await request('/api/trips', { destinations: ['서울'], travel_days: 2, companion_count: 1 })).status, 400);
  assert.deepEqual((await request(root + '/cards')).data, before);
  assert.equal((await request(root)).data.travel_days, 3);
  console.log('✓ 잘못된 요청 거절, 실패 시 기존 여행·일정 보존');

  assert.equal((await create(1, 1)).status, 201);
  detail = (await request(root)).data;
  assert.equal(detail.confirmed, false);
  const oneDay = (await request(root + '/days/1')).data.cards;
  assert.equal(oneDay.length, 3);
  assert.deepEqual(oneDay.map(c => c.day_order), [1, 2, 3]);
  assert.equal(oneDay[0].estimated_duration_min, cards[0].estimated_duration_min);
  assert.equal((await request(root + '/days/2')).status, 404);
  assert.equal((await request('/api/trips/unknown/cards')).status, 404);
  assert.equal((await request(root + '/groups?view=99')).status, 501);
  assert.equal((await request(root + '/dump', {})).status, 501);
  console.log('✓ 새 여행 초기화, 1일 여행 배치, 잘못된 ID·미지원 API');

  const dayCounts = [3, 3, 2, 2, 2, 2];
  for (const days of [2, 3, 4, 5, 6, 7]) {
    assert.equal((await create(days)).status, 201);
    for (let day = 1; day <= days; day++) {
      const scheduled = (await request(root + '/days/' + day)).data.cards;
      const count = dayCounts[day - 1] ?? 0;
      assert.equal(scheduled.length, count);
      assert.deepEqual(scheduled.map(c => c.day_order), Array.from({ length: count }, (_, i) => i + 1));
    }
    const stock = (await request(root + '/groups?view=04')).data.available[0].cards;
    assert.equal(stock.length, 14 - dayCounts.slice(0, days).reduce((sum, count) => sum + count, 0));
    assert.ok(stock.every(c => c.day === null && c.day_order === null));
  }
  for (const menu of ['오코노미야키', '라멘', '스시']) {
    await create(2);
    const endpoint = root + '/cards/demo-dinner-choice';
    const initial = (await request(root + '/cards')).data;
    for (const notes of ['', '사용자가 선택한 후보: 피자', '사용자가 선택한 후보: 라멘, 스시']) {
      assert.equal((await request(endpoint, { notes }, 'PATCH')).status, 400);
      assert.deepEqual((await request(root + '/cards')).data, initial);
    }
    const result = await request(endpoint, { notes: `사용자가 선택한 후보: ${menu}\n기존 카드명: 난바 저녁 메뉴 고르기` }, 'PATCH');
    assert.equal(result.status, 200);
    assert.ok(result.data.name.includes(menu));
    assert.equal(result.data.day, null);
    assert.equal(result.data.action_type, 'review_only');
    assert.equal((await request(root + '/groups?view=03')).data.select_required.length, 0);
    const stock = (await request(root + '/groups?view=04')).data;
    assert.equal(stock.unavailable.length, 0);
    assert.ok(stock.available[0].cards.some(c => c.instance_id === result.data.instance_id));
    assert.equal((await request(root + '/confirm', { days: [{ day_number: 2, cards: [{ instance_id: result.data.instance_id, order: 1 }] }] })).status, 200);
    assert.equal((await request(root + '/days/2')).data.cards[0].instance_id, result.data.instance_id);
  }
  await create(2);
  assert.equal((await request(root + '/groups?view=03')).data.select_required.length, 1);
  console.log('✓ 세 메뉴 답변·미배치 전환·일정 배치·새 여행 초기화');
  console.log('✓ 2~6일 기간별 예제 배치, 초과 카드 미배치, 7일차 빈 일정');
} finally {
  await rm(outDir, { recursive: true, force: true });
}
