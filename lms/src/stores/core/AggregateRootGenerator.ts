import {StateCreator} from 'zustand';
import {
  AggregateRootSlice,
  BaseEntity,
  DataSliceConfig,
  EntityConfig,
  NormalizedState,
  RelationConfig
} from "@/types/core/base";

export class AggregateRootGenerator {
  static createAggregateRoot<
    TEntities extends Record<string, BaseEntity>,
    TRelations extends readonly RelationConfig[] = readonly RelationConfig[]
  >(
    config: DataSliceConfig<TEntities, TRelations>
  ): StateCreator<
    AggregateRootSlice<TEntities>,
    [["zustand/immer", never]],
    [],
    AggregateRootSlice<TEntities>
  > {
    const initialState = this.createInitialState(config);
    
    return (set, get) => ({
      ...initialState,
      
      load: <K extends keyof TEntities>(entityType: K, data: TEntities[K]) => {
        set(
          (state) => {
            const entityName = entityType as string;
            
            state.entities[entityName].byId[data.id] = data;
            if (!state.entities[entityName].allIds.includes(data.id)) {
              state.entities[entityName].allIds.push(data.id);
            }
          }
        );
      },
      
      create: <K extends keyof TEntities>(entityType: K, data: Omit<TEntities[K], keyof BaseEntity<TEntities[K]['id']>>) => {
        const entityConfig = config.entities[entityType] as EntityConfig<TEntities[K], TEntities[K]['id']>;
        const generateId = config.options?.generateId || this.generateId;
        
        const now = new Date();
        const newEntity = {
          ...entityConfig.defaultValues,
          ...data,
          id: ((data as any).id || generateId()) as TEntities[K]['id'], // Preserve existing ID if provided, otherwise generate one
          createdAt: now,
          updatedAt: now
        } as TEntities[K];
        
        this.validate(entityConfig, data, config);
        
        const finalEntity = entityConfig.beforeSave
          ? {...newEntity, ...entityConfig.beforeSave(newEntity)}
          : newEntity;
        
        set(
          (state) => {
            const entityName = entityType as string;
            
            state.entities[entityName].byId[finalEntity.id] = finalEntity;
            if (!state.entities[entityName].allIds.includes(finalEntity.id)) {
              state.entities[entityName].allIds.push(finalEntity.id);
            }
            
            state.__meta.dirty.add(`${entityName}:${finalEntity.id}`);
            
            const errorKey = `${entityName}:create`;
            if (state.__meta.errors[errorKey]) {
              state.__meta.errors[errorKey] = null;
            }
          }
        );
        
        return finalEntity;
      },
      
      update: <K extends keyof TEntities>(entityType: K, id: TEntities[K]['id'], data: Partial<Omit<TEntities[K], keyof BaseEntity<TEntities[K]['id']>>>) => {
        const entityConfig = config.entities[entityType] as EntityConfig<TEntities[K], TEntities[K]['id']>;
        const state = get();
        const entityName = entityType as string;
        const existing = state.entities[entityName]?.byId[id] as TEntities[K];
        
        if (!existing) {
          const errorMsg = `Entity ${entityName} with id ${id} not found`;
          if (config.options?.errorHandling === 'throw') {
            throw new Error(errorMsg);
          }
          // Return undefined when entity is not found and error handling is not 'throw'
          return undefined as TEntities[K] | undefined;
        }
        
        // Prepare the data to update by combining existing and new data
        const combinedData = {...existing, ...data};
        
        const dataToUpdate = entityConfig.beforeSave
          ? entityConfig.beforeSave(combinedData)
          : data;
        
        const updatedEntity = {
          ...existing,
          ...dataToUpdate,
          updatedAt: new Date()
        } as TEntities[K];
        
        this.validate(entityConfig, data, config);
        
        set(
          (state) => {
            state.entities[entityName].byId[id] = updatedEntity;
            
            state.__meta.dirty.add(`${entityName}:${id}`);
          }
        );
        
        return updatedEntity;
      },
      
      delete: <K extends keyof TEntities>(entityType: K, id: TEntities[K]['id']) => {
        const state = get();
        const entityName = entityType as string;
        const existing = state.entities[entityName]?.byId[id];
        
        if (!existing) {
          const errorMsg = `Entity ${entityName} with id ${id} not found`;
          if (config.options?.errorHandling === 'throw') {
            throw new Error(errorMsg);
          }
          return;
        }
        
        set(
          (state) => {
            delete state.entities[entityName].byId[id];
            
            const index = state.entities[entityName].allIds.indexOf(id);
            if (index > -1) {
              state.entities[entityName].allIds.splice(index, 1);
            }
            
            state.__meta.dirty.delete(`${entityName}:${id}`);
            
            Object.keys(state.__relations).forEach(relationKey => {
              if (state.__relations[relationKey][id]) {
                delete state.__relations[relationKey][id];
              }
              
              Object.keys(state.__relations[relationKey]).forEach(sourceId => {
                const relations = state.__relations[relationKey][sourceId];
                if (relations.includes(id)) {
                  state.__relations[relationKey][sourceId] =
                    relations.filter(targetId => targetId !== id);
                }
              });
            });
          }
        );
      },
      
      get: <K extends keyof TEntities>(entityType: K, id: TEntities[K]['id']) => {
        const state = get();
        return state.entities[entityType as string]?.byId[id] as TEntities[K] | undefined;
      },
      
      getAll: <K extends keyof TEntities>(entityType: K) => {
        const state = get();
        const entityState = state.entities[entityType as string];
        if (!entityState) return [];
        
        return entityState.allIds.map(id => entityState.byId[id]) as TEntities[K][];
      },
      
      getRelated: <TSourceEntity extends keyof TEntities>(sourceEntity: TSourceEntity, sourceId: TEntities[TSourceEntity]['id'], relationName: string) => {
        const state = get();
        const relationKey = this.getRelationKey(sourceEntity as string, relationName);
        const relation = state.__relations[relationKey];
        
        if (!relation || !relation[sourceId]) {
          return [];
        }
        
        const targetIds = relation[sourceId];
        const relationConfigs = config.relations as readonly RelationConfig[] || [];
        const relationConfig = relationConfigs.find(
          r => r.sourceEntity === sourceEntity && r.relationName === relationName
        );
        
        if (!relationConfig) {
          return [];
        }
        
        const targetEntities = state.entities[relationConfig.targetEntity];
        return targetIds
          .map(id => targetEntities.byId[id])
          .filter(Boolean) as any[]; // Keeping as any[] to maintain compatibility with original return type
      },
      
      addRelations: (relationName: string, sourceId: string | number, targetIds: (string | number)[]) => {
        const relationConfigs = config.relations as readonly RelationConfig[] || [];
        const relationConfig = relationConfigs.find(
          r => r.relationName === relationName
        );
        
        if (!relationConfig) {
          const errorMsg = `Relation ${relationName} not found`;
          if (config.options?.errorHandling === 'throw') {
            throw new Error(errorMsg);
          }
          return;
        }
        
        set((state) => {
            const relationKey = this.getRelationKey(
              relationConfig.sourceEntity,
              relationName
            );
            
            if (!state.__relations[relationKey]) {
              state.__relations[relationKey] = {};
            }
            
            if (!state.__relations[relationKey][sourceId]) {
              state.__relations[relationKey][sourceId] = [];
            }
            
            const existing = state.__relations[relationKey][sourceId];
            const newIds = targetIds.filter(id => !existing.includes(id));
            state.__relations[relationKey][sourceId].push(...newIds);
          }
        );
      },
      
      removeRelations: (relationName: string, sourceId: string | number, targetIds?: (string | number)[]) => {
        const relationConfigs = config.relations as readonly RelationConfig[] || [];
        const relationConfig = relationConfigs.find(
          r => r.relationName === relationName
        );
        
        if (!relationConfig) {
          const errorMsg = `Relation ${relationName} not found`;
          if (config.options?.errorHandling === 'throw') {
            throw new Error(errorMsg);
          }
          return;
        }
        
        set((state) => {
            const relationKey = this.getRelationKey(
              relationConfig.sourceEntity,
              relationName
            );
            
            if (!state.__relations[relationKey] ||
              !state.__relations[relationKey][sourceId]) {
              return;
            }
            
            if (!targetIds) {
              delete state.__relations[relationKey][sourceId];
            } else {
              state.__relations[relationKey][sourceId] =
                state.__relations[relationKey][sourceId]
                  .filter(id => !targetIds.includes(id));
            }
          }
        );
      },
      
      clearErrors: (entityType?: keyof TEntities) => {
        set((state) => {
            if (!entityType) {
              state.__meta.errors = {};
            } else {
              Object.keys(state.__meta.errors).forEach(key => {
                if (key.startsWith(`${String(entityType)}:`)) {
                  delete state.__meta.errors[key];
                }
              });
            }
          }
        );
      },
      
      markAsClean: <K extends keyof TEntities>(entityType: K, id?: TEntities[K]['id']) => {
        set((state) => {
            if (id) {
              state.__meta.dirty.delete(`${String(entityType)}:${id}`);
            } else {
              Array.from(state.__meta.dirty).forEach(key => {
                if (key.startsWith(`${String(entityType)}:`)) {
                  state.__meta.dirty.delete(key);
                }
              });
            }
          }
        );
      },
      
      isDirty: <K extends keyof TEntities>(entityType: K, id?: TEntities[K]['id']) => {
        const state = get();
        if (id) {
          return state.__meta.dirty.has(`${String(entityType)}:${id}`);
        }
        return Array.from(state.__meta.dirty).some(key =>
          key.startsWith(`${String(entityType)}:`)
        );
      },
      
      clearAll: () => {
        const initialState = AggregateRootGenerator.createInitialState(config);
        
        set((state) => {
          // Reset entities to initial state
          Object.keys(initialState.entities).forEach(entityName => {
            state.entities[entityName] = initialState.entities[entityName as keyof TEntities];
          });
          
          // Reset relations to initial state
          state.__relations = initialState.__relations;
          
          // Reset metadata to initial state
          state.__meta = initialState.__meta;
        });
      },
    });
  }
  
  private static createInitialState<
    TEntities extends Record<string, BaseEntity>,
    TRelations extends readonly RelationConfig[]
  >(
    config: DataSliceConfig<TEntities, TRelations>
  ): {
    entities: { [K in keyof TEntities]: NormalizedState<TEntities[K], TEntities[K]['id']> };
    __relations: { [relationKey: string]: Record<string, (string | number)[]> };
    __meta: {
      dirty: Set<string>;
      loading: Record<string, boolean>;
      errors: Record<string, string | null>;
    };
  } {
    const entities = {} as { [K in keyof TEntities]: NormalizedState<TEntities[K], TEntities[K]['id']> };
    
    // Initialize entities state
    (Object.keys(config.entities) as (keyof TEntities)[]).forEach(entityName => {
      (entities as any)[entityName] = {
        byId: {},
        allIds: []
      };
    });
    
    const relations = {} as { [relationKey: string]: Record<string, (string | number)[]> };
    
    // Initialize relations state
    ((config.relations || []) as RelationConfig[]).forEach(relation => {
      const relationKey = this.getRelationKey(relation.sourceEntity, relation.relationName);
      relations[relationKey] = {};
    });
    
    const meta = {
      dirty: new Set<string>(),
      loading: {},
      errors: {}
    };
    
    return {
      entities,
      __relations: relations,
      __meta: meta
    };
  }
  
  private static validate<TData extends Record<string, unknown>>(
    entityConfig: EntityConfig<any, any>, // Using any here as the exact type isn't needed for validation
    data: TData,
    config: DataSliceConfig<any, any>
  ) {
    if (entityConfig.validate) {
      const errors = entityConfig.validate(data);
      if (errors && Object.keys(errors).length > 0) {
        const errorMsg = `Validation failed: ${JSON.stringify(errors)}`;
        if (config.options?.errorHandling === 'throw') {
          throw new Error(errorMsg);
        } else if (config.options?.errorHandling === 'log') {
          console.error(errorMsg);
        }
      }
    }
  }
  
  private static generateId(): string {
    return Math.random().toString(36).substring(2, 9);
  }
  
  private static getRelationKey(sourceEntity: string, relationName: string): string {
    return `${sourceEntity}.${relationName}`;
  }
}