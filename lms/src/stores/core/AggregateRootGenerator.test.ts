// noinspection DuplicatedCode

import {describe, it, expect, vi} from 'vitest';
import {AggregateRootGenerator} from './AggregateRootGenerator';
import {DataSliceConfig, BaseEntity, RelationConfig} from '@/types/core/base';

// Define test entity types
interface TestUser extends BaseEntity {
  name: string;
  email: string;
  age: number;
}

interface TestPost extends BaseEntity {
  title: string;
  content: string;
  authorId: string;
}

// Define relation configuration type
type TestRelationConfig = [
    RelationConfig & {
    sourceEntity: 'users';
    targetEntity: 'posts';
    relationName: 'userPosts';
    type: 'oneToMany';
  }
];

describe('AggregateRootGenerator', () => {
  // Mock configuration for users entity
  const userEntityConfig = {
    defaultValues: {
      name: '',
      email: '',
      age: 0
    },
    validate: (data: Omit<TestUser, keyof BaseEntity>) => {
      const errors: Record<string, string> = {};
      if (!data.name) errors.name = 'Name is required';
      if (!data.email) errors.email = 'Email is required';
      if (data.age < 0) errors.age = 'Age must be positive';
      return Object.keys(errors).length > 0 ? errors : null;
    },
    beforeSave: (entity: Partial<TestUser>) => ({
      ...entity,
      name: entity.name?.trim()
    })
  };
  
  // Mock configuration for posts entity
  const postEntityConfig = {
    defaultValues: {
      title: '',
      content: '',
      authorId: ''
    },
    validate: (data: Omit<TestPost, keyof BaseEntity>) => {
      const errors: Record<string, string> = {};
      if (!data.title) errors.title = 'Title is required';
      if (!data.authorId) errors.authorId = 'Author ID is required';
      return Object.keys(errors).length > 0 ? errors : null;
    }
  };
  
  // Mock relation configuration
  const relationsConfig: TestRelationConfig = [{
    sourceEntity: 'users',
    targetEntity: 'posts',
    relationName: 'userPosts',
    type: 'oneToMany'
  }];
  
  describe('createAggregateRoot', () => {
    it('should create an aggregate root with initial state', () => {
      const config: DataSliceConfig<{ users: TestUser }, []> = {
        entities: {
          users: userEntityConfig
        },
        options: {
          generateId: () => 'test-id'
        }
      };
      
      const createStore = AggregateRootGenerator.createAggregateRoot(config);
      const store = createStore(vi.fn(), vi.fn(), {} as any);
      
      expect(store.entities.users).toBeDefined();
      expect(store.entities.users.byId).toEqual({});
      expect(store.entities.users.allIds).toEqual([]);
      expect(store.__relations).toEqual({});
      expect(store.__meta.dirty).toBeInstanceOf(Set);
      expect(store.__meta.loading).toEqual({});
      expect(store.__meta.errors).toEqual({});
    });
    
    it('should create entities with proper base properties', () => {
      const config: DataSliceConfig<{ users: TestUser }> = {
        entities: {
          users: userEntityConfig
        },
        options: {
          generateId: () => 'test-user-id'
        }
      };
      
      const createStore = AggregateRootGenerator.createAggregateRoot(config);
      const store = createStore(vi.fn(), vi.fn(), {} as any);
      
      // Call create method
      const newUser = store.create('users', {name: 'John Doe', email: 'john@example.com', age: 30});
      
      // Verify the entity was created with proper base properties
      expect(newUser.id).toBe('test-user-id');
      expect(newUser.createdAt).toBeInstanceOf(Date);
      expect(newUser.updatedAt).toBeInstanceOf(Date);
      expect(newUser.name).toBe('John Doe');
      expect(newUser.email).toBe('john@example.com');
      expect(newUser.age).toBe(30);
    });
    
    it('should add created entity to the state', () => {
      const config: DataSliceConfig<{ users: TestUser }> = {
        entities: {
          users: userEntityConfig
        },
        options: {
          generateId: () => 'test-user-id'
        }
      };
      
      const mockSet = vi.fn();
      const mockGet = vi.fn();
      const createStore = AggregateRootGenerator.createAggregateRoot(config);
      const store = createStore(mockSet, mockGet, {} as any);
      
      // Mock the state that will be updated
      const mockState = {
        entities: {
          users: {byId: {}, allIds: []}
        },
        __relations: {},
        __meta: {
          dirty: new Set<string>(),
          loading: {},
          errors: {}
        }
      };
      
      mockGet.mockReturnValue(mockState);
      mockSet.mockImplementation((callback) => {
        callback(mockState);
      });
      
      // Call create method
      const newUser = store.create('users', {name: 'Jane Doe', email: 'jane@example.com', age: 25});
      
      // Verify the state was updated correctly
      expect(mockState.entities.users.byId[newUser.id]).toEqual(newUser);
      expect(mockState.entities.users.allIds).toContain(newUser.id);
      expect(mockState.__meta.dirty.has(`users:${newUser.id}`)).toBe(true);
    });
    
    it('should apply default values when creating entities', () => {
      const config: DataSliceConfig<{ users: TestUser }> = {
        entities: {
          users: {
            defaultValues: {
              name: 'Default Name',
              email: 'default@example.com',
              age: 18
            }
          }
        },
        options: {
          generateId: () => 'test-user-id'
        }
      };
      
      const mockSet = vi.fn();
      const mockGet = vi.fn();
      const createStore = AggregateRootGenerator.createAggregateRoot(config);
      const store = createStore(mockSet, mockGet, {} as any);
      
      // Mock the state
      const mockState = {
        entities: {
          users: {byId: {}, allIds: []}
        },
        __relations: {},
        __meta: {
          dirty: new Set<string>(),
          loading: {},
          errors: {}
        }
      };
      
      mockGet.mockReturnValue(mockState);
      mockSet.mockImplementation((callback) => {
        callback(mockState);
      });
      
      // Create entity with partial data
      const newUser = store.create('users', {name: 'Custom Name', email: 'default@example.com', age: 18});
      
      // Should have custom name but default email and age
      expect(newUser.name).toBe('Custom Name');
      expect(newUser.email).toBe('default@example.com');
      expect(newUser.age).toBe(18);
    });
    
    it('should validate entities on creation', () => {
      const config: DataSliceConfig<{ users: TestUser }> = {
        entities: {
          users: userEntityConfig
        },
        options: {
          generateId: () => 'test-user-id',
          errorHandling: 'throw'
        }
      };
      
      const mockSet = vi.fn();
      const mockGet = vi.fn();
      const createStore = AggregateRootGenerator.createAggregateRoot(config);
      const store = createStore(mockSet, mockGet, {} as any);
      
      // Mock the state
      const mockState = {
        entities: {
          users: {byId: {}, allIds: []}
        },
        __relations: {},
        __meta: {
          dirty: new Set<string>(),
          loading: {},
          errors: {}
        }
      };
      
      mockGet.mockReturnValue(mockState);
      mockSet.mockImplementation((callback) => {
        callback(mockState);
      });
      
      // Should throw error for invalid data
      expect(() => {
        store.create('users', {name: '', email: 'invalid-email', age: -5});
      }).toThrow(/Validation failed/);
    });
    
    it('should update existing entities', () => {
      const config: DataSliceConfig<{ users: TestUser }> = {
        entities: {
          users: userEntityConfig
        },
        options: {
          generateId: () => 'test-user-id'
        }
      };
      
      const mockSet = vi.fn();
      const mockGet = vi.fn();
      const createStore = AggregateRootGenerator.createAggregateRoot(config);
      const store = createStore(mockSet, mockGet, {} as any);
      
      // Setup initial state with an existing user
      const existingUser: TestUser = {
        id: 'existing-user-id',
        name: 'Existing User',
        email: 'existing@example.com',
        age: 30,
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01')
      };
      
      const mockState = {
        entities: {
          users: {
            byId: {'existing-user-id': existingUser},
            allIds: ['existing-user-id']
          }
        },
        __relations: {},
        __meta: {
          dirty: new Set<string>(),
          loading: {},
          errors: {}
        }
      };
      
      mockGet.mockReturnValue(mockState);
      mockSet.mockImplementation((callback) => {
        callback(mockState);
      });
      
      // Update the user
      const updatedUser = store.update('users', 'existing-user-id', {name: 'Updated Name', age: 35});
      
      // Verify the user was updated
      expect(updatedUser).toBeDefined();
      expect(updatedUser!.name).toBe('Updated Name');
      expect(updatedUser!.age).toBe(35);
      expect(updatedUser!.updatedAt.getTime()).toBeGreaterThan(existingUser.updatedAt.getTime()); // UpdatedAt should be newer
      
      // Verify the state was updated
      expect(mockState.entities.users.byId['existing-user-id']).toEqual(updatedUser);
      expect(mockState.__meta.dirty.has(`users:existing-user-id`)).toBe(true);
    });
    
    it('should return undefined when updating non-existent entity', () => {
      const config: DataSliceConfig<{ users: TestUser }> = {
        entities: {
          users: userEntityConfig
        }
      };
      
      const mockSet = vi.fn();
      const mockGet = vi.fn(() => ({
        entities: {users: {byId: {}, allIds: []}},
        __relations: {},
        __meta: {dirty: new Set<string>(), loading: {}, errors: {}}
      }));
      const createStore = AggregateRootGenerator.createAggregateRoot(config);
      const store = createStore(mockSet, mockGet as any, {} as any);
      
      const result = store.update('users', 'non-existent-id', {name: 'New Name'});
      
      expect(result).toBeUndefined();
    });
    
    it('should delete existing entities', () => {
      const config: DataSliceConfig<{ users: TestUser }> = {
        entities: {
          users: userEntityConfig
        }
      };
      
      const mockSet = vi.fn();
      const mockGet = vi.fn();
      const createStore = AggregateRootGenerator.createAggregateRoot(config);
      const store = createStore(mockSet, mockGet, {} as any);
      
      // Setup initial state with an existing user
      const existingUser: TestUser = {
        id: 'to-delete-id',
        name: 'To Delete',
        email: 'delete@example.com',
        age: 40,
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01')
      };
      
      const mockState = {
        entities: {
          users: {
            byId: {'to-delete-id': existingUser},
            allIds: ['to-delete-id']
          }
        },
        __relations: {},
        __meta: {
          dirty: new Set<string>(),
          loading: {},
          errors: {}
        }
      };
      
      mockGet.mockReturnValue(mockState);
      mockSet.mockImplementation((callback) => {
        callback(mockState);
      });
      
      // Delete the user
      store.delete('users', 'to-delete-id');
      
      // Verify the user was removed from state
      expect(mockState.entities.users.byId['to-delete-id']).toBeUndefined();
      expect(mockState.entities.users.allIds).not.toContain('to-delete-id');
      expect(mockState.__meta.dirty.has(`users:to-delete-id`)).toBe(false);
    });
    
    it('should handle relations properly', () => {
      const config: DataSliceConfig<{ users: TestUser; posts: TestPost }, TestRelationConfig> = {
        entities: {
          users: userEntityConfig,
          posts: postEntityConfig
        },
        relations: relationsConfig
      };
      
      const mockSet = vi.fn();
      const mockGet = vi.fn();
      const createStore = AggregateRootGenerator.createAggregateRoot(config);
      const store = createStore(mockSet, mockGet, {} as any);
      
      // Setup initial state
      const mockState = {
        entities: {
          users: {byId: {}, allIds: []},
          posts: {byId: {}, allIds: []}
        },
        __relations: {},
        __meta: {
          dirty: new Set<string>(),
          loading: {},
          errors: {}
        }
      };
      
      mockGet.mockReturnValue(mockState);
      mockSet.mockImplementation((callback) => {
        callback(mockState);
      });
      
      // Add a relation
      store.addRelations('userPosts', 'user-123', ['post-456', 'post-789']);
      
      // Verify the relation was added
      expect(mockState.__relations['users.userPosts']['user-123']).toEqual(['post-456', 'post-789']);
    });
    
    it('should retrieve entities by ID', () => {
      const config: DataSliceConfig<{ users: TestUser }> = {
        entities: {
          users: userEntityConfig
        }
      };
      
      const mockUser: TestUser = {
        id: 'get-test-id',
        name: 'Get Test',
        email: 'get-test@example.com',
        age: 28,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const mockSet = vi.fn();
      const mockGet = vi.fn(() => ({
        entities: {
          users: {
            byId: {'get-test-id': mockUser},
            allIds: ['get-test-id']
          }
        },
        __relations: {},
        __meta: {dirty: new Set<string>(), loading: {}, errors: {}}
      }));
      
      const createStore = AggregateRootGenerator.createAggregateRoot(config);
      const store = createStore(mockSet, mockGet as any, {} as any);
      
      const retrievedUser = store.get('users', 'get-test-id');
      
      expect(retrievedUser).toEqual(mockUser);
    });
    
    it('should retrieve all entities of a type', () => {
      const config: DataSliceConfig<{ users: TestUser }> = {
        entities: {
          users: userEntityConfig
        }
      };
      
      const mockUsers: TestUser[] = [
        {
          id: 'user-1',
          name: 'User One',
          email: 'user1@example.com',
          age: 25,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'user-2',
          name: 'User Two',
          email: 'user2@example.com',
          age: 30,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      
      const mockSet = vi.fn();
      const mockGet = vi.fn(() => ({
        entities: {
          users: {
            byId: {
              'user-1': mockUsers[0],
              'user-2': mockUsers[1]
            },
            allIds: ['user-1', 'user-2']
          }
        },
        __relations: {},
        __meta: {dirty: new Set<string>(), loading: {}, errors: {}}
      }));
      
      const createStore = AggregateRootGenerator.createAggregateRoot(config);
      const store = createStore(mockSet, mockGet as any, {} as any);
      
      const allUsers = store.getAll('users');
      
      expect(allUsers).toHaveLength(2);
      expect(allUsers).toContainEqual(mockUsers[0]);
      expect(allUsers).toContainEqual(mockUsers[1]);
    });
    
    it('should handle dirty state tracking', () => {
      const config: DataSliceConfig<{ users: TestUser }> = {
        entities: {
          users: userEntityConfig
        },
        options: {
          generateId: () => 'test-id'
        }
      };
      
      const mockSet = vi.fn();
      const mockGet = vi.fn();
      const createStore = AggregateRootGenerator.createAggregateRoot(config);
      const store = createStore(mockSet, mockGet, {} as any);
      
      // Mock the state
      const mockState = {
        entities: {
          users: {byId: {}, allIds: []}
        },
        __relations: {},
        __meta: {
          dirty: new Set<string>(),
          loading: {},
          errors: {}
        }
      };
      
      mockGet.mockReturnValue(mockState);
      mockSet.mockImplementation((callback) => {
        callback(mockState);
      });
      
      // Create an entity
      const newUser = store.create('users', {name: 'Dirty Test', email: 'dirty@example.com', age: 22});
      
      // Check if it's marked as dirty
      expect(store.isDirty('users', newUser.id)).toBe(true);
      
      // Mark as clean
      store.markAsClean('users', newUser.id);
      
      // Check if it's no longer marked as dirty
      expect(store.isDirty('users', newUser.id)).toBe(false);
    });
    
    it('should apply beforeSave transformations', () => {
      const config: DataSliceConfig<{ users: TestUser }> = {
        entities: {
          users: {
            ...userEntityConfig,
            beforeSave: (entity: Partial<TestUser>) => ({
              ...entity,
              name: entity.name?.toUpperCase()
            })
          }
        },
        options: {
          generateId: () => 'test-id'
        }
      };
      
      const mockSet = vi.fn();
      const mockGet = vi.fn();
      const createStore = AggregateRootGenerator.createAggregateRoot(config);
      const store = createStore(mockSet, mockGet, {} as any);
      
      // Mock the state
      const mockState = {
        entities: {
          users: {byId: {}, allIds: []}
        },
        __relations: {},
        __meta: {
          dirty: new Set<string>(),
          loading: {},
          errors: {}
        }
      };
      
      mockGet.mockReturnValue(mockState);
      mockSet.mockImplementation((callback) => {
        callback(mockState);
      });
      
      // Create an entity with lowercase name
      const newUser = store.create('users', {name: 'lowercase name', email: 'test@example.com', age: 25});
      
      // Verify the name was transformed by beforeSave
      expect(newUser.name).toBe('LOWERCASE NAME');
    });
    
    it('should clear all entities and reset to initial state', () => {
      const config: DataSliceConfig<{ users: TestUser; posts: TestPost }, TestRelationConfig> = {
        entities: {
          users: userEntityConfig,
          posts: postEntityConfig
        },
        relations: relationsConfig,
        options: {
          generateId: () => 'test-id'
        }
      };
      
      const mockSet = vi.fn();
      const mockGet = vi.fn();
      const createStore = AggregateRootGenerator.createAggregateRoot(config);
      const store = createStore(mockSet, mockGet, {} as any);
      
      // Setup initial state with some data
      const mockState = {
        entities: {
          users: {
            byId: {
              'user-1': {
                id: 'user-1',
                name: 'Test User',
                email: 'test@example.com',
                age: 30,
                createdAt: new Date(),
                updatedAt: new Date(),
                version: 1
              }
            },
            allIds: ['user-1']
          },
          posts: {
            byId: {
              'post-1': {
                id: 'post-1',
                title: 'Test Post',
                content: 'Test Content',
                authorId: 'user-1',
                createdAt: new Date(),
                updatedAt: new Date(),
                version: 1
              }
            },
            allIds: ['post-1']
          }
        },
        __relations: {
          'users.userPosts': {
            'user-1': ['post-1']
          }
        },
        __meta: {
          dirty: new Set<string>(['users:user-1', 'posts:post-1']),
          loading: {'users:fetch': true},
          errors: {'users:create': 'Some error'}
        }
      };
      
      mockGet.mockReturnValue(mockState);
      mockSet.mockImplementation((callback) => {
        callback(mockState);
      });
      
      // Call clearAll method
      store.clearAll();
      
      // Verify the state was reset to initial state
      expect(mockState.entities.users.byId).toEqual({});
      expect(mockState.entities.users.allIds).toEqual([]);
      expect(mockState.entities.posts.byId).toEqual({});
      expect(mockState.entities.posts.allIds).toEqual([]);
      // Relations should be reset to initial state (with relation keys but empty mappings)
      expect(mockState.__relations).toEqual({'users.userPosts': {}});
      expect(mockState.__meta.dirty).toEqual(new Set());
      expect(mockState.__meta.loading).toEqual({});
      expect(mockState.__meta.errors).toEqual({});
    });
  });
});