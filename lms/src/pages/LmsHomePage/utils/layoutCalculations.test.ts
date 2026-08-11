import {describe, expect, it} from 'vitest';
import {calculateLayout, getColumns, getScreenSize} from '@/pages/LmsHomePage/utils/layoutCalculations';

const layoutAt = (containerWidth: number) => {
  const layout = calculateLayout({screenSize: getScreenSize(containerWidth), containerWidth});
  return Object.fromEntries(layout.map((i) => [i.i, {x: i.x, y: i.y, w: i.w, h: i.h}]));
};

describe('dashboard layout at full width', () => {
  const l = layoutAt(1400);

  it('uses three columns in a 4 : 5 : 3 ratio', () => {
    expect(getColumns(1400)).toBe(12);
    expect(l['chat'].w).toBe(4);
    expect(l['course'].w).toBe(5);
    expect(l['learning-schedule'].w).toBe(3);
  });

  it('puts the schedule at the top of the right rail, not below the course card', () => {
    expect(l['learning-schedule']).toMatchObject({x: 9, y: 0});
  });

  it('makes the schedule twice the height of a middle card', () => {
    expect(l['learning-schedule'].h).toBe(l['course'].h * 2);
  });

  it('runs the chat rail the full height of the middle stack', () => {
    expect(l['chat']).toMatchObject({x: 0, y: 0});
    expect(l['chat'].h).toBe(l['course'].h + l['assignments'].h + l['posts'].h);
  });

  it('stacks the middle column top to bottom without gaps', () => {
    expect(l['course']).toMatchObject({x: 4, y: 0});
    expect(l['assignments'].x).toBe(4);
    expect(l['assignments'].y).toBe(l['course'].h);
    expect(l['posts'].x).toBe(4);
    expect(l['posts'].y).toBe(l['course'].h + l['assignments'].h);
  });

  it('puts the bottom right card under the schedule', () => {
    expect(l['skill-graph'].x).toBe(9);
    expect(l['skill-graph'].y).toBe(l['learning-schedule'].h);
  });

  it('never overflows the grid or overlaps', () => {
    const items = Object.values(l);
    items.forEach((i) => expect(i.x + i.w).toBeLessThanOrEqual(12));
    for (let a = 0; a < items.length; a++) {
      for (let b = a + 1; b < items.length; b++) {
        const p = items[a], q = items[b];
        const overlaps = p.x < q.x + q.w && p.x + p.w > q.x && p.y < q.y + q.h && p.y + p.h > q.y;
        expect(overlaps).toBe(false);
      }
    }
  });
});

describe('narrow viewport', () => {
  it('stacks every widget full width', () => {
    const l = layoutAt(500);
    Object.values(l).forEach((i) => expect(i).toMatchObject({x: 0, w: 4}));
  });
});
