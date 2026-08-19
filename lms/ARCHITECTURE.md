# Frontend Architecture for Educational Management System

> **Status:** Historical / aspirational design notes.  
> **Current practice:** follow [`PROJECT_STANDARDS.md`](./PROJECT_STANDARDS.md).  
> This file still describes useful normalized-store ideas, but the live app does **not** require Zod or Socket.io, and day-to-day work uses TanStack Query + page Zustand stores + `src/apis/*`.

## 1. Overview

This document outlines the frontend architecture for a complex educational management system using modern state management patterns. The system manages courses, units, assignments, and student/teacher workflows with real-time collaboration features.

## 2. Technology Stack

- **State Management**: Zustand + Immer
- **Type Safety**: TypeScript
- **Server State**: React Query (TanStack Query)
- **Build Tool**: Vite
- **UI Framework**: React 18+
- **Validation**: (optional / not adopted repo-wide)
- **Real-time**: (optional / not adopted repo-wide)

## 3. Core Principles

### 3.1 Entity Separation
Business entities are stored separately and connected via foreign keys rather than nested structures.

### 3.2 Normalized State
State is organized in a database-like structure with entity tables and relationship indices.

### 3.3 Caching Strategy
Multi-level caching with intelligent invalidation for optimal performance.

### 3.4 Optimistic Updates
Immediate UI feedback followed by background synchronization.

## 4. Type System Architecture

### 4.1 Base Entity Types

```typescript
// types/core/base.ts
export interface BaseEntity<ID = string> {
  id: ID;
  createdAt: Date;
  updatedAt: Date;
  version: number;
}

export interface OwnedEntity<ID = string, OwnerID = string> extends BaseEntity<ID> {
  ownerId: OwnerID;
}

export interface OrderedEntity<ID = string> extends BaseEntity<ID> {
  order: number;
}

export interface StatefulEntity<ID = string, State extends string = string> 
  extends BaseEntity<ID> {
  state: State;
  stateHistory: StateTransition<State>[];
}
```

### 4.2 Domain Entities

```typescript
// types/domain/education.ts
export interface Course extends BaseEntity {
  code: string;
  name: string;
  description: string;
  semester: Semester;
  teacherIds: string[];
  studentIds: string[];
}

export interface CourseUnit extends OrderedEntity, OwnedEntity {
  courseId: string;
  title: string;
  description: string;
}

export interface Assignment extends OrderedEntity, StatefulEntity {
  courseUnitId: string;
  title: string;
  type: AssignmentType;
  dueTime: Date;
  settings: AssignmentSettings;
}

// View models for UI consumption
export interface CourseWithRelations {
  course: Course;
  units: CourseUnit[];
  assignments: Assignment[];
  statistics: CourseStatistics;
}
```

### 4.3 Type Transformations

```typescript
// types/transformations.ts
export type CreateModel<T extends BaseEntity> = Omit<
  T,
  'id' | 'createdAt' | 'updatedAt' | 'version'
>;

export type UpdateModel<T extends BaseEntity> = Partial<CreateModel<T>>;

export type ViewModel<T extends BaseEntity> = T & {
  _meta?: {
    isLoading?: boolean;
    isSelected?: boolean;
    error?: string;
  };
};
```

## 5. Store Architecture

### 5.1 Core Store Structure

```typescript
// store/core/types.ts
import { Draft } from 'immer';

export interface EntityStoreState<T extends BaseEntity> {
  entities: Record<string, T>;
  ids: string[];
  selectedId: string | null;
}

export interface RelationshipState {
  [relationName: string]: Record<string, string[]>;
}

export interface QueryCacheState {
  queries: Record<string, {
    data: any;
    timestamp: number;
    stale: boolean;
  }>;
}

export interface UIState {
  viewMode: 'list' | 'detail' | 'edit';
  filters: Record<string, any>;
  sort: { field: string; order: 'asc' | 'desc' };
  pagination: { page: number; pageSize: number; total: number };
}
```

### 5.2 Entity Store Factory

```typescript
// store/core/entity-store.ts
import { produce, Draft } from 'immer';
import { StateCreator } from 'zustand';

export const createEntitySlice = <T extends BaseEntity>(
  name: string,
  initialState: EntityStoreState<T> = {
    entities: {},
    ids: [],
    selectedId: null,
  }
): StateCreator<any> => (set, get) => ({
  [name]: {
    ...initialState,
    
    // Core CRUD operations
    addOne: (entity: T) => {
      set(produce((draft: any) => {
        draft[name].entities[entity.id] = entity;
        if (!draft[name].ids.includes(entity.id)) {
          draft[name].ids.push(entity.id);
        }
      }));
    },
    
    addMany: (entities: T[]) => {
      set(produce((draft: any) => {
        entities.forEach(entity => {
          draft[name].entities[entity.id] = entity;
          if (!draft[name].ids.includes(entity.id)) {
            draft[name].ids.push(entity.id);
          }
        });
      }));
    },
    
    updateOne: (id: string, changes: Partial<T>) => {
      set(produce((draft: any) => {
        const entity = draft[name].entities[id];
        if (entity) {
          Object.assign(entity, changes);
          entity.updatedAt = new Date();
          entity.version++;
        }
      }));
    },
    
    removeOne: (id: string) => {
      set(produce((draft: any) => {
        delete draft[name].entities[id];
        draft[name].ids = draft[name].ids.filter(
          (entityId: string) => entityId !== id
        );
      }));
    },
    
    // Selectors
    selectById: (id: string) => {
      const state = get();
      return state[name].entities[id];
    },
    
    selectAll: () => {
      const state = get();
      return state[name].ids.map((id: string) => state[name].entities[id]);
    },
    
    selectWhere: (predicate: (entity: T) => boolean) => {
      const state = get();
      return state[name].ids
        .map((id: string) => state[name].entities[id])
        .filter(predicate);
    },
  },
});
```

### 5.3 Relationship Manager

```typescript
// store/core/relationship-manager.ts
export const createRelationshipSlice = (
  relations: Record<string, { parent: string; child: string }>
) => (set: any, get: any) => {
  const initialState = Object.keys(relations).reduce((acc, key) => {
    acc[key] = {};
    return acc;
  }, {} as Record<string, Record<string, string[]>>);
  
  return {
    relationships: initialState,
    
    addRelation: (
      relationName: string,
      parentId: string,
      childId: string
    ) => {
      set(produce((draft: any) => {
        if (!draft.relationships[relationName]) {
          draft.relationships[relationName] = {};
        }
        if (!draft.relationships[relationName][parentId]) {
          draft.relationships[relationName][parentId] = [];
        }
        if (!draft.relationships[relationName][parentId].includes(childId)) {
          draft.relationships[relationName][parentId].push(childId);
        }
      }));
    },
    
    removeRelation: (
      relationName: string,
      parentId: string,
      childId?: string
    ) => {
      set(produce((draft: any) => {
        if (childId) {
          const children = draft.relationships[relationName]?.[parentId];
          if (children) {
            draft.relationships[relationName][parentId] = 
              children.filter((id: string) => id !== childId);
          }
        } else {
          delete draft.relationships[relationName][parentId];
        }
      }));
    },
    
    getRelatedIds: (relationName: string, parentId: string) => {
      const state = get();
      return state.relationships[relationName]?.[parentId] || [];
    },
    
    getRelatedEntities: <T>(
      relationName: string,
      parentId: string,
      entityStore: string
    ): T[] => {
      const state = get();
      const childIds = state.relationships[relationName]?.[parentId] || [];
      const store = state[entityStore];
      return childIds.map((id: string) => store.entities[id]);
    },
  };
};
```

### 5.4 Composite Store Implementation

```typescript
// store/education-store.ts
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { createEntitySlice } from './core/entity-store';
import { createRelationshipSlice } from './core/relationship-manager';

interface EducationStore {
  // Entity stores
  courses: EntityStoreState<Course>;
  courseUnits: EntityStoreState<CourseUnit>;
  assignments: EntityStoreState<Assignment>;
  
  // Relationship stores
  relationships: Record<string, Record<string, string[]>>;
  
  // UI state
  ui: {
    currentCourseId: string | null;
    currentUnitId: string | null;
    viewMode: 'list' | 'detail' | 'edit';
    filters: Record<string, any>;
  };
  
  // Composite views (cached)
  compositeViews: {
    courseWithUnits: Record<string, CourseWithUnits>;
    unitWithAssignments: Record<string, UnitWithAssignments>;
  };
  
  // Actions
  actions: {
    // Course operations
    createCourse: (data: CreateModel<Course>) => Promise<Course>;
    updateCourse: (id: string, data: UpdateModel<Course>) => Promise<void>;
    
    // Unit operations with automatic relationship management
    createCourseUnit: (
      courseId: string,
      data: CreateModel<CourseUnit>
    ) => Promise<CourseUnit>;
    
    updateUnitOrder: (courseId: string, unitIds: string[]) => Promise<void>;
    
    // Assignment operations
    createAssignment: (
      unitId: string,
      data: CreateModel<Assignment>
    ) => Promise<Assignment>;
    
    // Query methods
    getCourseWithUnits: (courseId: string) => CourseWithUnits;
    getUnitWithAssignments: (unitId: string) => UnitWithAssignments;
    
    // Cache management
    invalidateCache: (entityType: string, entityId?: string) => void;
  };
}

export const useEducationStore = create<EducationStore>()(
  immer((set, get) => ({
    // Initialize entity stores
    ...createEntitySlice<Course>('courses')(set, get),
    ...createEntitySlice<CourseUnit>('courseUnits')(set, get),
    ...createEntitySlice<Assignment>('assignments')(set, get),
    
    // Initialize relationships
    ...createRelationshipSlice({
      courseUnits: { parent: 'course', child: 'courseUnit' },
      unitAssignments: { parent: 'courseUnit', child: 'assignment' },
    })(set, get),
    
    // UI state
    ui: {
      currentCourseId: null,
      currentUnitId: null,
      viewMode: 'list',
      filters: {},
    },
    
    // Composite views cache
    compositeViews: {
      courseWithUnits: {},
      unitWithAssignments: {},
    },
    
    actions: {
      createCourse: async (data) => {
        // Generate initial entity
        const course: Course = {
          id: `temp_${Date.now()}`,
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
          version: 0,
        };
        
        // Optimistic update
        get().courses.addOne(course);
        
        try {
          // API call
          const created = await api.courses.create(data);
          
          // Replace temporary ID
          get().courses.removeOne(course.id);
          get().courses.addOne(created);
          
          // Invalidate cache
          get().actions.invalidateCache('courses');
          
          return created;
        } catch (error) {
          // Rollback
          get().courses.removeOne(course.id);
          throw error;
        }
      },
      
      createCourseUnit: async (courseId: string, data: CreateModel<CourseUnit>) => {
        const { courses, courseUnits, relationships } = get();
        
        // Calculate order
        const existingUnitIds = relationships.getRelatedIds('courseUnits', courseId);
        const order = existingUnitIds.length;
        
        // Create unit
        const unit: CourseUnit = {
          id: `temp_${Date.now()}`,
          ...data,
          courseId,
          order,
          createdAt: new Date(),
          updatedAt: new Date(),
          version: 0,
          ownerId: 'current-user-id', // Should come from auth
        };
        
        // Optimistic updates
        courseUnits.addOne(unit);
        relationships.addRelation('courseUnits', courseId, unit.id);
        
        try {
          // API call
          const created = await api.courseUnits.create(unit);
          
          // Update with server data
          courseUnits.removeOne(unit.id);
          courseUnits.addOne(created);
          relationships.removeRelation('courseUnits', courseId, unit.id);
          relationships.addRelation('courseUnits', courseId, created.id);
          
          // Invalidate composite cache
          delete get().compositeViews.courseWithUnits[courseId];
          
          return created;
        } catch (error) {
          // Rollback
          courseUnits.removeOne(unit.id);
          relationships.removeRelation('courseUnits', courseId, unit.id);
          throw error;
        }
      },
      
      updateUnitOrder: async (courseId: string, unitIds: string[]) => {
        const { courseUnits } = get();
        
        // Create batch updates
        const updates = unitIds.map((id, index) => ({
          id,
          changes: { order: index } as Partial<CourseUnit>,
        }));
        
        // Optimistic update
        set(produce((draft: Draft<EducationStore>) => {
          updates.forEach(({ id, changes }) => {
            const unit = draft.courseUnits.entities[id];
            if (unit) {
              Object.assign(unit, changes);
              unit.updatedAt = new Date();
            }
          });
        }));
        
        // API call
        await api.courseUnits.bulkUpdate(updates);
        
        // Update relationship order
        set(produce((draft: Draft<EducationStore>) => {
          draft.relationships.courseUnits[courseId] = unitIds;
        }));
        
        // Invalidate cache
        get().actions.invalidateCache('courses', courseId);
      },
      
      getCourseWithUnits: (courseId: string): CourseWithUnits => {
        const { courses, compositeViews } = get();
        
        // Return cached view if available
        if (compositeViews.courseWithUnits[courseId]) {
          return compositeViews.courseWithUnits[courseId];
        }
        
        const course = courses.selectById(courseId);
        if (!course) throw new Error('Course not found');
        
        const unitIds = get().relationships.getRelatedIds('courseUnits', courseId);
        const units = unitIds.map(id => 
          get().courseUnits.selectById(id)
        ).filter(Boolean) as CourseUnit[];
        
        // Build composite view
        const view: CourseWithUnits = {
          course,
          units,
          statistics: calculateCourseStatistics(course, units),
        };
        
        // Cache the view
        set(produce((draft: Draft<EducationStore>) => {
          draft.compositeViews.courseWithUnits[courseId] = view;
        }));
        
        return view;
      },
      
      invalidateCache: (entityType: string, entityId?: string) => {
        set(produce((draft: Draft<EducationStore>) => {
          if (entityType === 'courses' && entityId) {
            delete draft.compositeViews.courseWithUnits[entityId];
          }
          if (entityType === 'courseUnits' && entityId) {
            // Find related course and invalidate
            Object.entries(draft.relationships.courseUnits).forEach(([courseId, unitIds]) => {
              if (unitIds.includes(entityId)) {
                delete draft.compositeViews.courseWithUnits[courseId];
              }
            });
          }
        }));
      },
    },
  }))
);
```

## 6. React Query Integration

### 6.1 Query Hooks with Store Integration

```typescript
// hooks/useCourse.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEducationStore } from '../store/education-store';

export const useCourse = (courseId: string) => {
  const queryClient = useQueryClient();
  const store = useEducationStore();
  
  const query = useQuery({
    queryKey: ['courses', courseId],
    queryFn: async () => {
      const course = await api.courses.getById(courseId);
      // Update store with fresh data
      store.courses.addOne(course);
      return course;
    },
    // Use store data as initial data
    initialData: () => store.courses.selectById(courseId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  const updateMutation = useMutation({
    mutationFn: (data: UpdateModel<Course>) =>
      api.courses.update(courseId, data),
    onMutate: async (data) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['courses', courseId] });
      
      // Snapshot previous value
      const previousCourse = queryClient.getQueryData(['courses', courseId]);
      
      // Optimistically update store
      store.courses.updateOne(courseId, data);
      
      return { previousCourse };
    },
    onError: (err, data, context) => {
      // Rollback to previous value
      if (context?.previousCourse) {
        store.courses.addOne(context.previousCourse);
      }
    },
    onSettled: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['courses', courseId] });
    },
  });
  
  return {
    course: query.data,
    isLoading: query.isLoading,
    updateCourse: updateMutation.mutateAsync,
  };
};
```

### 6.2 Composite Query Hooks

```typescript
// hooks/useCourseWithUnits.ts
import { useQuery } from '@tanstack/react-query';
import { useEducationStore } from '../store/education-store';

export const useCourseWithUnits = (courseId: string) => {
  const store = useEducationStore();
  
  return useQuery({
    queryKey: ['courses', courseId, 'with-units'],
    queryFn: async () => {
      // This could be an optimized API endpoint
      const data = await api.courses.getWithUnits(courseId);
      
      // Update stores
      store.courses.addOne(data.course);
      store.courseUnits.addMany(data.units);
      
      // Update relationships
      data.units.forEach(unit => {
        store.relationships.addRelation('courseUnits', courseId, unit.id);
      });
      
      return data;
    },
    // Use store composite view if available
    initialData: () => store.compositeViews.courseWithUnits[courseId],
    // Long cache time for composite views
    cacheTime: 30 * 60 * 1000, // 30 minutes
  });
};
```

## 7. Real-time Updates

### 7.1 WebSocket Integration

```typescript
// services/websocket.service.ts
class WebSocketService {
  private socket: WebSocket | null = null;
  private store: any;
  
  initialize(store: any) {
    this.store = store;
    this.socket = new WebSocket(import.meta.env.VITE_WS_URL);
    
    this.socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.handleMessage(message);
    };
  }
  
  private handleMessage(message: any) {
    switch (message.type) {
      case 'COURSE_UPDATED':
        this.store.courses.updateOne(message.data.id, message.data);
        break;
        
      case 'COURSE_UNIT_CREATED':
        this.store.courseUnits.addOne(message.data);
        this.store.relationships.addRelation(
          'courseUnits',
          message.data.courseId,
          message.data.id
        );
        break;
        
      case 'ASSIGNMENT_SUBMITTED':
        // Handle submission updates
        break;
    }
  }
  
  sendUpdate(entityType: string, action: string, data: any) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({
        type: `${entityType}_${action}`.toUpperCase(),
        data,
      }));
    }
  }
}
```

## 8. Performance Optimizations

### 8.1 Memoized Selectors

```typescript
// store/selectors.ts
import { createSelector } from 'reselect';
import { useEducationStore } from './education-store';

// Base selectors
const selectCourses = (state: any) => state.courses;
const selectCourseUnits = (state: any) => state.courseUnits;
const selectRelationships = (state: any) => state.relationships;

// Memoized composite selector
export const selectCourseWithUnits = createSelector(
  [selectCourses, selectCourseUnits, selectRelationships],
  (courses, courseUnits, relationships) => (courseId: string) => {
    const course = courses.entities[courseId];
    if (!course) return null;
    
    const unitIds = relationships.courseUnits[courseId] || [];
    const units = unitIds.map(id => courseUnits.entities[id]).filter(Boolean);
    
    return {
      course,
      units,
      statistics: calculateStatistics(course, units),
    };
  }
);

// Hook for using memoized selector
export const useCourseWithUnits = (courseId: string) => {
  const selector = useEducationStore(selectCourseWithUnits);
  return selector(courseId);
};
```

### 8.2 Batch Updates

```typescript
// store/batch-updates.ts
class BatchProcessor {
  private queue: Array<() => void> = [];
  private timeout: NodeJS.Timeout | null = null;
  
  enqueue(update: () => void) {
    this.queue.push(update);
    
    if (!this.timeout) {
      this.timeout = setTimeout(() => this.process(), 16); // Next frame
    }
  }
  
  private process() {
    const updates = this.queue;
    this.queue = [];
    this.timeout = null;
    
    // Apply all updates in a single Immer transaction
    useEducationStore.setState(produce((draft: Draft<EducationStore>) => {
      updates.forEach(update => {
        // Apply update to draft state
        update();
      });
    }));
  }
}
```

## 9. Testing Strategy

### 9.1 Store Testing

```typescript
// __tests__/store/education-store.test.ts
import { act } from '@testing-library/react';
import { useEducationStore } from '../../store/education-store';

describe('EducationStore', () => {
  beforeEach(() => {
    useEducationStore.setState({
      courses: { entities: {}, ids: [] },
      courseUnits: { entities: {}, ids: [] },
      relationships: {},
      ui: { currentCourseId: null, viewMode: 'list' },
    });
  });
  
  test('creates course and updates store', async () => {
    const mockCourse = {
      id: '1',
      code: 'CS101',
      name: 'Introduction to CS',
      // ... other fields
    };
    
    await act(async () => {
      await useEducationStore.getState().actions.createCourse(mockCourse);
    });
    
    const course = useEducationStore.getState().courses.entities['1'];
    expect(course).toBeDefined();
    expect(course?.name).toBe('Introduction to CS');
  });
  
  test('maintains relationships when creating units', async () => {
    const courseId = 'course-1';
    const unitId = 'unit-1';
    
    await act(async () => {
      await useEducationStore.getState().actions.createCourseUnit(
        courseId,
        { title: 'Unit 1', description: 'First unit' }
      );
    });
    
    const relations = useEducationStore.getState().relationships;
    expect(relations.courseUnits[courseId]).toContain(unitId);
  });
});
```

## 10. Directory Structure

```
src/
├── types/
│   ├── core/
│   │   ├── base.ts
│   │   └── relations.ts
│   └── domain/
│       ├── education.ts
│       └── user.ts
├── store/
│   ├── core/
│   │   ├── entity-store.ts
│   │   ├── relationship-manager.ts
│   │   └── selectors.ts
│   ├── slices/
│   │   ├── courses.slice.ts
│   │   ├── units.slice.ts
│   │   └── ui.slice.ts
│   ├── education-store.ts
│   └── index.ts
├── hooks/
│   ├── useCourse.ts
│   ├── useCourseWithUnits.ts
│   └── useOptimisticUpdate.ts
├── services/
│   ├── api/
│   ├── websocket.service.ts
│   └── cache.service.ts
├── utils/
│   ├── validators/
│   ├── transformers/
│   └── batch-processor.ts
└── components/
    ├── Course/
    ├── Unit/
    └── Assignment/
```

## 11. Key Benefits

1. **Separation of Concerns**: Entities, relationships, and UI state are managed independently
2. **Type Safety**: Full TypeScript support with precise type definitions
3. **Performance**: Normalized state, memoized selectors, and batch updates
4. **Real-time Support**: WebSocket integration for collaborative features
5. **Optimistic UI**: Immediate feedback with automatic rollback on errors
6. **Testability**: Pure functions and isolated state slices
7. **Scalability**: Modular architecture that grows with the application

## 12. Implementation Roadmap

1. **Phase 1**: Implement base entity types and core store infrastructure
2. **Phase 2**: Build entity slices for Courses, Units, and Assignments
3. **Phase 3**: Add relationship management and composite views
4. **Phase 4**: Integrate React Query for server state
5. **Phase 5**: Implement real-time updates via WebSocket
6. **Phase 6**: Add advanced features (offline support, undo/redo, audit logging)

This architecture provides a solid foundation for building complex educational management applications while maintaining excellent developer experience and performance characteristics.