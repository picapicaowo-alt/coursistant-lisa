/**
 * Base interface that all entities should extend
 * Contains common properties for tracking entity state
 */
export interface BaseEntity<TId extends string | number = number> {
  /** Unique identifier for the entity */
  id: TId;
  /** Timestamp when the entity was created */
  createdAt: Date;
  /** Timestamp when the entity was last updated */
  updatedAt: Date;
}

/**
 * Extracts the ID type from an entity
 */
export type EntityId<T extends BaseEntity> = T['id'];

/**
 * Normalized state structure for efficient data storage and retrieval
 */
export interface NormalizedState<TEntity extends BaseEntity<TId>, TId extends string | number = number> {
  /** Map of entity IDs to entity instances */
  byId: Record<TId, TEntity>;
  /** Array of all entity IDs in order */
  allIds: TId[];
}

/**
 * Configuration options for defining entity behavior
 */
export interface EntityConfig<TEntity extends BaseEntity, TId extends EntityId<TEntity> = EntityId<TEntity>> {
  /** Default values to apply when creating new entities */
  defaultValues?: Partial<Omit<TEntity, keyof BaseEntity<TId>>>;
  /** Validation function that returns error messages keyed by field name */
  validate?: (entity: Omit<TEntity, keyof BaseEntity<TId>>) => Record<string, string> | null;
  /** Transformation function applied before saving an entity */
  beforeSave?: (entity: Partial<TEntity>) => Partial<TEntity>;
}

/**
 * Supported relationship types between entities
 */
export type RelationType = 'oneToMany' | 'manyToOne' | 'manyToMany';

/**
 * Configuration for defining relationships between entities
 */
export interface RelationConfig {
  /** Name of the source entity in the relationship */
  sourceEntity: string;
  /** Name of the target entity in the relationship */
  targetEntity: string;
  /** Name of the relationship property */
  relationName: string;
  /** Type of relationship */
  type: RelationType;
  /** Optional foreign key field name */
  foreignKey?: string;
  /** Optional join table name for many-to-many relationships */
  joinTable?: string;
}

/**
 * Configuration for creating aggregate root slices
 */
export interface DataSliceConfig<
  TEntities extends Record<string, BaseEntity>,
  TRelations extends readonly RelationConfig[] = readonly RelationConfig[]
> {
  /** Entity configurations mapped by entity name */
  entities: {
    [K in keyof TEntities]: EntityConfig<TEntities[K], TEntities[K]['id']>;
  };
  /** Optional relationship configurations */
  relations?: TRelations;
  
  /** Optional behavioral configuration options */
  options?: {
    /** Whether to use optimistic updates (default: false) */
    optimisticUpdates?: boolean;
    /** Custom ID generation function */
    generateId?: () => string;
    /** How to handle errors ('throw', 'log', or 'silent') */
    errorHandling?: 'throw' | 'log' | 'silent';
  };
}

/**
 * The main slice interface that provides CRUD operations and utilities for entities
 */
export interface AggregateRootSlice<TEntities extends Record<string, BaseEntity>> {
  /** Entity state organized by normalized structure */
  entities: {
    [K in keyof TEntities]: NormalizedState<TEntities[K], TEntities[K]['id']>;
  };
  
  /** Relationship mappings between entities */
  __relations: {
    [relationKey: string]: Record<string, (string | number)[]>;
  };
  
  /** Metadata for tracking entity state (dirty, loading, errors) */
  __meta: {
    /** Set of entity identifiers that have been modified since last save */
    dirty: Set<string>; // format: `${entityName}:${id}`
    /** Loading states for different operations */
    loading: Record<string, boolean>; // key: `${entityName}:${operation}`
    /** Error messages organized by entity and operation */
    errors: Record<string, string | null>;
  };
  
  /**
   * Loads an existing entity without modifying any property
   * @param entityType - The type/name of entity to load
   * @param data - Initial data for the entity (including all properties)
   */
  load: <K extends keyof TEntities>(
    entityType: K,
    data: TEntities[K],
  ) => void;
  
  /**
   * Creates a new entity instance
   * @param entityType - The type/name of entity to create
   * @param data - Initial data for the entity (excluding base properties)
   * @returns The newly created entity instance
   */
  create: <K extends keyof TEntities>(
    entityType: K,
    data: Omit<TEntities[K], keyof BaseEntity<TEntities[K]['id']>>
  ) => TEntities[K];
  
  /**
   * Updates an existing entity
   * @param entityType - The type/name of entity to update
   * @param id - The ID of the entity to update
   * @param data - Updated data for the entity (partial)
   * @returns The updated entity instance, or undefined if the entity was not found
   */
  update: <K extends keyof TEntities>(
    entityType: K,
    id: TEntities[K]['id'],
    data: Partial<Omit<TEntities[K], keyof BaseEntity<TEntities[K]['id']>>>
  ) => TEntities[K] | undefined;
  
  /**
   * Deletes an entity
   * @param entityType - The type/name of entity to delete
   * @param id - The ID of the entity to delete
   */
  delete: <K extends keyof TEntities>(
    entityType: K,
    id: TEntities[K]['id']
  ) => void;
  
  /**
   * Retrieves a single entity by ID
   * @param entityType - The type/name of entity to retrieve
   * @param id - The ID of the entity to retrieve
   * @returns The entity instance or undefined if not found
   */
  get: <K extends keyof TEntities>(entityType: K, id: TEntities[K]['id']) => TEntities[K] | undefined;
  
  /**
   * Retrieves all entities of a given type
   * @param entityType - The type/name of entity to retrieve
   * @returns Array of all entities of the specified type
   */
  getAll: <K extends keyof TEntities>(entityType: K) => TEntities[K][];
  
  /**
   * Retrieves related entities for a given source entity
   * @param sourceEntity - The name of the source entity
   * @param sourceId - The ID of the source entity
   * @param relationName - The name of the relationship to retrieve
   * @returns Array of related entities
   */
  getRelated: <TSourceEntity extends keyof TEntities>(
    sourceEntity: TSourceEntity,
    sourceId: TEntities[TSourceEntity]['id'],
    relationName: string
  ) => any[];
  
  /**
   * Adds relationships between entities
   * @param relationName - The name of the relationship
   * @param sourceId - The ID of the source entity
   * @param targetIds - Array of target entity IDs to relate
   */
  addRelations: (
    relationName: string,
    sourceId: string | number,
    targetIds: (string | number)[]
  ) => void;
  
  /**
   * Removes relationships between entities
   * @param relationName - The name of the relationship
   * @param sourceId - The ID of the source entity
   * @param targetIds - Optional array of target entity IDs to remove (removes all if not provided)
   */
  removeRelations: (
    relationName: string,
    sourceId: string | number,
    targetIds?: (string | number)[] // remove all relations if not passed
  ) => void;
  
  /**
   * Clears error messages
   * @param entityType - Optional entity type to clear errors for (clears all if not provided)
   */
  clearErrors: (entityType?: keyof TEntities) => void;
  
  /**
   * Marks entities as clean (no longer dirty)
   * @param entityType - The type/name of entity to mark
   * @param id - Optional ID to mark a specific entity (marks all if not provided)
   */
  markAsClean: <K extends keyof TEntities>(entityType: K, id?: TEntities[K]['id']) => void;
  
  /**
   * Checks if entities are marked as dirty
   * @param entityType - The type/name of entity to check
   * @param id - Optional ID to check a specific entity (checks all if not provided)
   * @returns True if the entity/ies are dirty, false otherwise
   */
  isDirty: <K extends keyof TEntities>(entityType: K, id?: TEntities[K]['id']) => boolean;
  
  /**
   * Clears all entities and resets the state to initial state
   */
  clearAll: () => void;
}