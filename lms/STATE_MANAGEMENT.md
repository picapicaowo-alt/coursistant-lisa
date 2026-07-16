# **Layered Zustand Store Framework**

## **Overview**

A scalable, type-safe state management architecture for React applications built on Zustand and Immer. This framework
promotes separation of concerns, normalized state structures, and optimized rendering patterns.

## **Architecture Layers**

### **Core Data Layer**

The single source of truth for all application entities, stored in normalized form.

```typescript
// Normalized state structure
interface NormalizedState<T> {
  byId: Record<string, T>;
  allIds: string[];
}

// Example data layer state
interface DataState {
  users: NormalizedState<User>;
  products: NormalizedState<Product>;
  orders: NormalizedState<Order>;
  
  // Relationships
  userOrders: Record<string, string[]>;  // userId -> orderIds
  productCategories: Record<string, string[]>; // productId -> categoryIds
}
```

### **Meta Layer**

Manages operational metadata separate from core data.

```typescript
interface MetaState {
  // Loading states by operation type
  loading: Record<string, boolean>;
  
  // Errors by operation type
  errors: Record<string, string | null>;
  
  // Dirty state tracking
  dirtyEntities: Set<string>; // Format: "entityType:id"
  
  // Operation history for undo/redo
  operations: Operation[];
  operationIndex: number;
  
  // Current selections
  selectedIds: Record<string, string | null>;
}

interface Operation {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  timestamp: Date;
  entityType: string;
  entityId: string;
  previousState: any;
  newState: any;
}
```

### **View Layer**

Component-specific derived state and selectors.

```typescript
// Each view gets its own selector slice
interface ProductListViewSelectors {
  getFilteredProducts: (filters: ProductFilters) => Product[];
  getProductCountByCategory: () => Record<string, number>;
  getSelectedProductDetails: () => ProductDetails | null;
}

interface DashboardViewSelectors {
  getRecentOrders: () => OrderSummary[];
  getSalesMetrics: () => SalesMetrics;
  getUserActivity: () => UserActivity[];
}
```

## **Core Features**

### **1. Normalized Data Management**

```typescript
// All entities are stored flat
interface Data {
  products: {
    byId: {
      'p1': { id: 'p1', name: 'Product A', categoryId: 'cat1' },
      'p2': { id: 'p2', name: 'Product B', categoryId: 'cat2' }
    },
    allIds: ['p1', 'p2']
  },
  
  categories: {
    byId: {
      'cat1': { id: 'cat1', name: 'Electronics' },
      'cat2': { id: 'cat2', name: 'Books' }
    },
    allIds: ['cat1', 'cat2']
  },
  
  // Relationships
  categoryProducts: {
    'cat1': ['p1'],
    'cat2': ['p2']
  }
}
```

### **2. Automatic Dirty State Tracking**

```typescript
// Mark entities as dirty when modified
const updateProduct = (productId: string, updates: Partial<Product>) =>
  set((state) => {
    state.data.products.byId[productId] = {
      ...state.data.products.byId[productId],
      ...updates,
      updatedAt: new Date()
    };
    
    // Auto-mark as dirty
    state.meta.markDirty(`product:${productId}`);
  });

// Check if any changes need saving
const hasUnsavedChanges = store.meta.isDirty();
```

### **3. Operation History & Undo/Redo**

```typescript
// Every mutation is tracked
const updatePrice = (productId: string, newPrice: number) => {
  const previousPrice = store.data.products.byId[productId].price;
  
  store.meta.pushOperation({
    type: 'UPDATE',
    entityType: 'product',
    entityId: productId,
    previousState: {price: previousPrice},
    newState: {price: newPrice}
  });
  
  store.data.updateProduct(productId, {price: newPrice});
};

// Undo last operation
store.meta.undo();
```

### **4. Optimized Selectors**

```typescript
// Memoized selectors prevent unnecessary re-renders
const getExpensiveProducts = createMemoizedSelector(
  (state) => state.data.products,
  (products) =>
    products.allIds
      .map(id => products.byId[id])
      .filter(p => p.price > 100)
);
```

### **5. Batch Updates**

```typescript
// Update multiple entities efficiently
store.data.batchUpdate({
  products: {
    'p1': {price: 99.99},
    'p2': {stock: 50}
  },
  categories: {
    'cat1': {name: 'Updated Category'}
  }
});
```

## **Store Factory**

### **Basic Usage**

```typescript
// Create a typed store
const useProductStore = createLayeredStore({
  // Data layer implementation
  dataSlice: (set, get) => ({
    products: {byId: {}, allIds: []},
    categories: {byId: {}, allIds: []},
    
    addProduct: (product: Product) => set(/* ... */),
    updateProduct: (id: string, updates: Partial<Product>) => set(/* ... */),
  }),
  
  // Meta layer implementation
  metaSlice: (set, get) => ({
    loading: {},
    errors: {},
    dirtyEntities: new Set(),
    
    setLoading: (operation: string, loading: boolean) => set(/* ... */),
    markDirty: (entityId: string) => set(/* ... */),
  }),
  
  // View selectors
  viewSelectors: (get) => ({
    getProductById: (id: string) => {
      const {data} = get();
      return data.products.byId[id];
    },
    
    getProductsByCategory: (categoryId: string) => {
      const {data} = get();
      const productIds = data.categoryProducts[categoryId] || [];
      return productIds.map(id => data.products.byId[id]);
    },
  }),
  
  // Optional configuration
  options: {
    enableDevtools: true,
    persist: {
      key: 'product-store',
      whitelist: ['data.products']
    }
  }
});
```

### **Advanced Configuration**

```typescript
// With middleware support
const useEnhancedStore = createLayeredStore({
  dataSlice: createDataSlice,
  metaSlice: createMetaSlice,
  viewSelectors: createViewSelectors,
  
  options: {
    enableDevtools: process.env.NODE_ENV === 'development',
    
    // Persistence
    persist: {
      key: 'app-store',
      whitelist: ['data.products', 'data.categories'],
      blacklist: ['meta.dirtyEntities'],
      version: 1,
      migrate: (persistedState, version) => {
        // Migration logic
        return persistedState;
      }
    },
    
    // Custom middleware
    middleware: [
      loggerMiddleware,
      analyticsMiddleware,
      customMiddleware
    ],
    
    // Immutable updates (enforced by Immer)
    enforceImmutable: true
  }
});
```

## **Custom Hooks Pattern**

### **Domain-Specific Hooks**

```tsx
// Product domain hook
export function useProducts() {
  const store = useProductStore();
  
  // Derived state
  const products = useMemo(
    () => store.view.getFilteredProducts({}),
    [store]
  );
  
  const isLoading = store.meta.loading.products || false;
  
  // Actions
  const updateProductPrice = useCallback((productId: string, price: number) => {
    store.meta.setLoading('updateProduct', true);
    
    try {
      store.data.updateProduct(productId, {price});
      store.meta.markDirty(`product:${productId}`);
    } catch (error) {
      store.meta.setError('updateProduct', error.message);
    } finally {
      store.meta.setLoading('updateProduct', false);
    }
  }, [store]);
  
  return {
    // State
    products,
    isLoading,
    error: store.meta.errors.updateProduct,
    
    // Actions
    updateProductPrice,
    saveChanges: () => store.meta.saveAllDirty(),
    undo: store.meta.undo,
    redo: store.meta.redo,
  };
}

// Usage in component
function ProductList() {
  const {products, updateProductPrice, isLoading} = useProducts();
  
  return (
    <div>
      {products.map(product => (
        <ProductItem
          key={product.id}
          product={product}
          onPriceChange={updateProductPrice}
        />
      ))}
    </div>
  );
}
```

## **Performance Optimizations**

### **1. Selective Subscription**

```typescript
// Component only re-renders when specific data changes
function ProductPrice({productId}) {
  const price = useProductStore(
    state => state.data.products.byId[productId]?.price
  );
  
  // Only re-renders when this specific product's price changes
  return <span>{price} < /span>;
}
```

### **2. Memoized Computations**

```typescript
const useMemoizedProducts = () => {
  const selectProducts = useCallback(
    (state) => state.view.getFilteredProducts(state.filters),
    []
  );
  
  return useProductStore(selectProducts);
};
```

### **3. Batch Selectors**

```typescript
// Multiple selections in one subscription
const {products, categories} = useProductStore(state => ({
  products: state.view.getProducts(),
  categories: state.view.getCategories(),
  loading: state.meta.loading.products
}));
```

## **Testing Strategy**

### **Unit Testing Store Slices**

```typescript
// Test data slice in isolation
describe('Product Data Slice', () => {
  it('should add product to store', () => {
    const store = createTestStore();
    const product = {id: 'p1', name: 'Test Product'};
    
    store.getState().data.addProduct(product);
    
    expect(store.getState().data.products.byId['p1']).toEqual(product);
  });
});

// Test meta layer operations
describe('Meta Layer', () => {
  it('should track dirty state', () => {
    const store = createTestStore();
    
    store.getState().data.updateProduct('p1', {price: 99});
    
    expect(store.getState().meta.isDirty('product:p1')).toBe(true);
  });
});
```

### **Integration Testing**

```typescript
describe('Product Store Integration', () => {
  it('should update product and track operation', () => {
    const store = createTestStore();
    
    // Perform operation
    store.getState().data.updateProduct('p1', {price: 150});
    
    // Verify data update
    expect(store.getState().data.products.byId['p1'].price).toBe(150);
    
    // Verify meta tracking
    expect(store.getState().meta.dirtyEntities.has('product:p1')).toBe(true);
    expect(store.getState().meta.operations).toHaveLength(1);
  });
});
```

## **Best Practices**

### **1. Store Organization**

```
stores/
├── core/                    # Framework core
│   ├── types.ts            # Shared types
│   ├── base-store.ts       # Base store factory
│   └── middleware.ts       # Custom middleware
├── slices/                 # Data slices
│   ├── products/
│   ├── users/
│   └── orders/
├── views/                  # View selectors
│   ├── product-views.ts
│   ├── user-views.ts
│   └── dashboard-views.ts
└── hooks/                  # Custom hooks
    ├── use-products.ts
    ├── use-users.ts
    └── use-dashboard.ts
```

### **2. Type Safety Guidelines**

```typescript
// Use discriminated unions for actions
type ProductAction =
  | { type: 'ADD_PRODUCT'; payload: Product }
  | { type: 'UPDATE_PRODUCT'; payload: { id: string; updates: Partial<Product> } }
  | { type: 'DELETE_PRODUCT'; payload: string };

// Strict entity validation
const validateProduct = (product: any): Product => {
  if (!product.id || !product.name) {
    throw new Error('Invalid product entity');
  }
  return product as Product;
};
```

### **3. Error Handling**

```typescript
// Centralized error handling
const withErrorHandling = (operation: string, fn: () => void) => {
  try {
    store.meta.setLoading(operation, true);
    store.meta.setError(operation, null);
    
    fn();
  } catch (error) {
    store.meta.setError(operation, error.message);
    throw error;
  } finally {
    store.meta.setLoading(operation, false);
  }
};

// Usage
const updateProduct = (id: string, updates: Partial<Product>) => {
  withErrorHandling('updateProduct', () => {
    store.data.updateProduct(id, updates);
  });
};
```

## **Migration Guide**

### **From Classic Zustand**

```typescript
// Before: Monolithic store
const useStore = create((set) => ({
  products: [],
  loading: false,
  error: null,
  selectedProduct: null,
  
  // Mixed concerns
  fetchProducts: async () => { /* ... */
  },
  selectProduct: (id) => { /* ... */
  },
  updateProduct: (id, updates) => { /* ... */
  },
}));

// After: Layered architecture
const useProductStore = createLayeredStore({
  dataSlice: createProductDataSlice,    // Pure data operations
  metaSlice: createMetaSlice,           // Loading, errors, dirty state
  viewSelectors: createProductViews,    // Derived state
});
```

## **Benefits**

- **Scalability**: Add new entity types without modifying existing code
- **Performance**: Minimal re-renders with selective subscriptions
- **Maintainability**: Clear separation between data, meta, and view logic
- **Type Safety**: Full TypeScript support with minimal boilerplate
- **Developer Experience**: Built-in undo/redo, persistence, and devtools
- **Testability**: Isolated layers are easy to test independently

## **Getting Started**

```bash
npm install zustand immer
```

```tsx
// 1. Define your entity types
interface Product {
  id: string;
  name: string;
  price: number;
  categoryId: string;
}

// 2. Create your slices
const createProductSlice = (set, get) => ({
  products: {byId: {}, allIds: []},
  addProduct: (product: Product) => set(/* ... */),
});

// 3. Create the store
const useStore = createLayeredStore({
  dataSlice: createProductSlice,
  metaSlice: createMetaSlice,
  viewSelectors: createProductViews,
});

// 4. Use in components
function App() {
  const {products} = useStore(state => ({
    products: state.view.getAllProducts()
  }));
  
  return <ProductList products={products}/>;
}
```

This framework provides a production-ready foundation for state management that scales from small applications to
enterprise-level systems while maintaining excellent developer experience and performance characteristics.