import {beforeEach, describe, expect, it, vi} from 'vitest';
import {act, renderHook} from '@testing-library/react';

// The widget components pull in the API layer, router and editors. None of
// that matters for layout behaviour, so they are stubbed to keep the test
// about the hook.
vi.mock('@/pages/LmsHomePage/components/ChatComponent.js', () => ({default: () => null}));
vi.mock('@/sections/assignments/AssignmentComponent', () => ({default: () => null}));
vi.mock('../components/CourseComponent.js', () => ({default: () => null}));
vi.mock('@/sections/learning_schedule/LearningScheduleComponent', () => ({default: () => null}));
vi.mock('@/sections/posts/PostComponent', () => ({default: () => null}));
vi.mock('../../../sections/skill_graph/SkillGraphComponent.jsx', () => ({default: () => null}));

vi.mock('react-grid-layout', () => ({
  useContainerWidth: () => ({width: 1400, containerRef: {current: null}, mounted: true}),
}));

import {useWidgetLayout} from './useWidgetLayout';
import {loadStoredLayout} from '../utils/layoutStorage';
import {DEFAULT_WIDGET_INSTANCES} from '../constants';

describe('useWidgetLayout', () => {
  beforeEach(() => localStorage.clear());

  it('starts from the default canvas', () => {
    const {result} = renderHook(() => useWidgetLayout());
    expect(result.current.widgetConfigs.map((w) => w.key))
      .toEqual(DEFAULT_WIDGET_INSTANCES.map((i) => i.id));
  });

  // An untouched dashboard should not write a copy of its own defaults; doing
  // so would freeze today's defaults for every existing user.
  it('writes nothing until something changes', () => {
    renderHook(() => useWidgetLayout());
    expect(loadStoredLayout()).toBeNull();
  });

  it('adds a widget and selects it', () => {
    const {result} = renderHook(() => useWidgetLayout());
    const before = result.current.widgetConfigs.length;

    act(() => result.current.addWidget('course'));

    expect(result.current.widgetConfigs).toHaveLength(before + 1);
    const added = result.current.widgetConfigs[result.current.widgetConfigs.length - 1];
    expect(added.type).toBe('course');
    expect(result.current.selectedId).toBe(added.key);
  });

  it('gives an added widget an id of its own so both copies render', () => {
    const {result} = renderHook(() => useWidgetLayout());
    act(() => result.current.addWidget('course'));

    const courseIds = result.current.widgetConfigs
      .filter((w) => w.type === 'course')
      .map((w) => w.key);

    expect(courseIds).toHaveLength(2);
    expect(new Set(courseIds).size).toBe(2);
  });

  it('places a copy directly after its original', () => {
    const {result} = renderHook(() => useWidgetLayout());
    act(() => result.current.duplicateWidget('course'));

    const keys = result.current.widgetConfigs.map((w) => w.key);
    const originalIndex = keys.indexOf('course');
    expect(result.current.widgetConfigs[originalIndex + 1].type).toBe('course');
  });

  it('gives every widget a distinct position', () => {
    const {result} = renderHook(() => useWidgetLayout());
    act(() => result.current.duplicateWidget('course'));

    const positions = result.current.layout.map((item) => `${item.x},${item.y}`);
    expect(new Set(positions).size).toBe(positions.length);
  });

  it('removes a widget and its saved position', () => {
    const {result} = renderHook(() => useWidgetLayout());

    act(() => result.current.onLayoutChange([
      {i: 'course', x: 0, y: 0, w: 4, h: 9},
      {i: 'posts', x: 4, y: 0, w: 4, h: 9},
    ]));
    act(() => result.current.removeWidget('course'));

    expect(result.current.widgetConfigs.some((w) => w.key === 'course')).toBe(false);
    expect(loadStoredLayout()?.layouts.large?.some((i) => i.i === 'course')).toBe(false);
  });

  it('persists a rearrangement and restores it on the next mount', () => {
    const {result, unmount} = renderHook(() => useWidgetLayout());
    const moved = {i: 'course', x: 7, y: 3, w: 5, h: 9};

    act(() => result.current.onLayoutChange([moved]));
    unmount();

    const {result: remounted} = renderHook(() => useWidgetLayout());
    expect(remounted.current.layout).toContainEqual(moved);
  });

  // A layout saved before a widget was added must not leave it unplaced.
  it('places widgets the saved layout does not mention', () => {
    const {result} = renderHook(() => useWidgetLayout());
    act(() => result.current.onLayoutChange([{i: 'course', x: 0, y: 0, w: 4, h: 9}]));

    const placed = result.current.layout.map((item) => item.i);
    DEFAULT_WIDGET_INSTANCES.forEach(({id}) => expect(placed).toContain(id));
  });

  it('restores the default canvas on reset', () => {
    const {result} = renderHook(() => useWidgetLayout());
    act(() => result.current.removeWidget('course'));
    act(() => result.current.resetLayout());

    expect(result.current.widgetConfigs.map((w) => w.key))
      .toEqual(DEFAULT_WIDGET_INSTANCES.map((i) => i.id));
    expect(loadStoredLayout()).toBeNull();
  });

  it('toggles the lock', () => {
    const {result} = renderHook(() => useWidgetLayout());
    expect(result.current.locked).toBe(false);
    act(() => result.current.toggleLocked());
    expect(result.current.locked).toBe(true);
  });
});
