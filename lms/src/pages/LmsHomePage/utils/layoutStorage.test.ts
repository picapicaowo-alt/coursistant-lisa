import {beforeEach, describe, expect, it} from 'vitest';
import {clearStoredLayout, loadStoredLayout, saveStoredLayout} from './layoutStorage';

const KEY = 'xlearn.dashboard.layout.v1';

const layoutItem = (i: string) => ({i, x: 0, y: 0, w: 4, h: 9});

describe('layoutStorage', () => {
  beforeEach(() => localStorage.clear());

  it('round-trips an arrangement', () => {
    saveStoredLayout({
      instances: [{id: 'course', type: 'course'}],
      layouts: {large: [layoutItem('course')]},
    });

    expect(loadStoredLayout()).toEqual({
      instances: [{id: 'course', type: 'course'}],
      layouts: {large: [layoutItem('course')]},
    });
  });

  it('returns null when nothing is stored', () => {
    expect(loadStoredLayout()).toBeNull();
  });

  // The store is user-writable and outlives releases, so a bad entry must not
  // be able to take the dashboard down on load.
  it.each([
    ['not json at all', 'not json at all'],
    ['a bare array', '[]'],
    ['a null document', 'null'],
    ['no instances key', '{"layouts":{}}'],
    ['instances of the wrong shape', '{"instances":[{"id":1}],"layouts":{}}'],
    ['an empty instance list', '{"instances":[],"layouts":{}}'],
  ])('rejects %s', (_label, raw) => {
    localStorage.setItem(KEY, raw);
    expect(loadStoredLayout()).toBeNull();
  });

  it('drops a widget type that no longer exists', () => {
    localStorage.setItem(KEY, JSON.stringify({
      instances: [{id: 'ghost', type: 'widget-from-a-past-release'}],
      layouts: {},
    }));
    expect(loadStoredLayout()).toBeNull();
  });

  it('ignores malformed layout items but keeps the instances', () => {
    localStorage.setItem(KEY, JSON.stringify({
      instances: [{id: 'course', type: 'course'}],
      layouts: {large: [{i: 'course', x: 'nope'}]},
    }));

    expect(loadStoredLayout()).toEqual({
      instances: [{id: 'course', type: 'course'}],
      layouts: {},
    });
  });

  // A position left behind by a deleted widget would otherwise put it back.
  it('drops positions belonging to widgets that are gone', () => {
    saveStoredLayout({
      instances: [{id: 'course', type: 'course'}],
      layouts: {large: [layoutItem('course'), layoutItem('deleted-widget')]},
    });

    expect(loadStoredLayout()?.layouts.large).toEqual([layoutItem('course')]);
  });

  it('clears the arrangement', () => {
    saveStoredLayout({instances: [{id: 'course', type: 'course'}], layouts: {}});
    clearStoredLayout();
    expect(loadStoredLayout()).toBeNull();
  });
});
