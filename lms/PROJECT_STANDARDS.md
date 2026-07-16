# Project Standards Document

## 1. Overview

This document establishes comprehensive project standards for the LMS Frontend project based on the refactored implementation in the `src/pages/LmsHomePage/` directory. These standards define clear coding guidelines, component organization principles, and best practices to ensure consistency, maintainability, and scalability across the entire codebase.

## 2. Component Structure

### 2.1 Component Organization
- **Container vs. Presentational Components**: Separate container components (handling logic) from presentational components (focused on UI)
- **Widget-Based Architecture**: Adopt a modular widget-based approach where complex pages are composed of smaller, reusable widgets
- **Single Responsibility Principle**: Each component should have a single, well-defined responsibility
- **Component Size**: Keep components focused and concise; split large components into smaller, manageable pieces

### 2.2 Component Design
- **Props Typing**: All component props must be properly typed using TypeScript interfaces
- **Default Props**: Provide sensible default values for optional props
- **Component Composition**: Favor composition over inheritance for building complex UIs
- **Reusability**: Design components to be reusable across different parts of the application
- **Lifecycle Management**: Use appropriate React hooks for lifecycle management and side effects

## 3. Naming Conventions

### 3.1 File Naming
- **Components**: Use PascalCase for component files (e.g., `Dashboard.tsx`)
- **Hooks**: Use camelCase with `use` prefix for hook files (e.g., `useWidgetLayout.tsx`)
- **Utilities**: Use camelCase for utility files (e.g., `layoutCalculations.ts`)
- **Styles**: Use component name with `.module.scss` extension for SCSS modules (e.g., `Dashboard.module.scss`)
- **Types**: Use `types.ts` for type definitions relevant to a specific directory

### 3.2 Naming Patterns
- **Components**: Use descriptive, semantic names that reflect the component's purpose
- **Hooks**: Use `use` prefix followed by a descriptive name of the hook's functionality
- **Variables**: Use camelCase for variables and functions
- **Constants**: Use UPPER_SNAKE_CASE for constants
- **Types/Interfaces**: Use PascalCase for TypeScript interfaces and types
- **CSS Classes**: Use kebab-case for CSS class names (e.g., `grid-layout-container`)

## 4. Folder Organization

### 4.1 Directory Structure
```
src/
├── pages/
│   ├── PageName/
│   │   ├── components/      # Reusable components specific to this page
│   │   ├── hooks/           # Custom hooks specific to this page
│   │   ├── utils/           # Utility functions specific to this page
│   │   ├── constants.ts     # Constants specific to this page
│   │   ├── types.ts         # Type definitions specific to this page
│   │   ├── index.tsx        # Main page component
│   │   └── styles.module.scss # Main page styles
├── components/              # Global reusable components
├── hooks/                   # Global custom hooks
├── utils/                   # Global utility functions
├── contexts/                # React contexts
├── services/                # API services
└── types/                   # Global type definitions
```

### 4.2 Folder Guidelines
- **Page-Specific Components**: Components used only within a specific page should be placed in that page's `components/` directory
- **Shared Components**: Components used across multiple pages should be placed in the global `components/` directory
- **Hooks Organization**: Custom hooks should be organized by their functionality and scope (page-specific vs. global)
- **Utility Functions**: Utility functions should be grouped by their purpose and scope
- **Type Definitions**: Type definitions should be organized by their scope (page-specific vs. global)

## 5. State Management Approach

### 5.1 Local State
- **useState Hook**: Use React's built-in `useState` hook for local component state
- **State Initialization**: Initialize state with appropriate default values
- **State Updates**: Use functional updates for complex state changes
- **Derivative State**: Use `useMemo` for computationally expensive derived state

### 5.2 Data Fetching and Caching
- **React Query**: Use React Query for data fetching, caching, and state management
- **Custom Hooks**: Encapsulate data fetching logic in custom hooks
- **Error Handling**: Implement proper error handling for API requests
- **Loading States**: Use React Suspense or loading states for asynchronous operations
- **Cache Management**: Configure appropriate cache times and invalidation strategies

### 5.3 Global State
- **Context API**: Use React's Context API for global state that needs to be accessed by multiple components
- **State Scope**: Keep global state minimal and focused on application-wide concerns
- **Performance Optimization**: Use `useMemo` and `useCallback` to optimize context consumers

## 6. Code Style Guidelines

### 6.1 TypeScript Usage
- **Type Definitions**: Define clear, descriptive interfaces for props, state, and data structures
- **Type Inference**: Use TypeScript's type inference where appropriate, but explicitly define types for complex structures
- **Nullable Types**: Use nullable types (`string | null`) instead of optional types when null is a valid value
- **Union Types**: Use union types for values that can be one of several types
- **Type Guards**: Implement type guards for runtime type checking when necessary

### 6.2 React Best Practices
- **Functional Components**: Use functional components with hooks instead of class components
- **Hooks Order**: Follow the recommended order for React hooks within components
- **Custom Hooks**: Extract complex logic into custom hooks for reusability and clarity
- **Memoization**: Use `React.memo`, `useMemo`, and `useCallback` for performance optimization
- **Cleanup**: Properly clean up side effects in `useEffect` hooks
- **Prop Drilling**: Avoid excessive prop drilling by using context or custom hooks

### 6.3 Styling Guidelines
- **SCSS Modules**: Use SCSS modules for component-specific styling
- **BEM Convention**: Follow BEM (Block, Element, Modifier) principles for CSS class naming
- **CSS Variables**: Use CSS variables for consistent theming
- **Responsive Design**: Implement responsive design using CSS Grid, Flexbox, and media queries
- **Performance**: Optimize CSS by removing unused styles and using efficient selectors
- **Accessibility**: Ensure styles do not compromise accessibility (e.g., proper color contrast)

### 6.4 Import Organization
- **Absolute Imports**: Use absolute imports with `@` alias for better maintainability
- **Import Order**: Group imports by type (React, external libraries, internal components, styles)
- **Named Imports**: Use named imports instead of default imports when possible
- **Barrel Exports**: Use barrel exports for better import organization in larger directories

## 7. Areas for Improvement in Existing Codebase

### 7.1 File Extension Consistency
- **Issue**: Mix of `.jsx`, `.js`, and `.tsx` files across the codebase
- **Impact**: Inconsistent tooling support and potential type safety issues
- **Recommendation**: Standardize on `.tsx` for all React components and `.ts` for TypeScript files

### 7.2 Naming Convention Inconsistencies
- **Issue**: Mixed case in filenames (e.g., `creategroupmodal.jsx` vs `AutoAssignModal.jsx`)
- **Impact**: Reduced code readability and maintainability
- **Recommendation**: Enforce consistent PascalCase for component files and camelCase for other files

### 7.3 TypeScript Adoption
- **Issue**: Many pages still use JavaScript instead of TypeScript
- **Impact**: Lack of type safety, increased potential for runtime errors
- **Recommendation**: Migrate all components to TypeScript and define proper type interfaces

### 7.4 Folder Organization
- **Issue**: Some pages have components directly in the page directory without clear separation of concerns
- **Impact**: Reduced code organization and maintainability
- **Recommendation**: Adopt the folder structure defined in Section 4 for all pages

### 7.5 Styling Approach
- **Issue**: Mix of SCSS modules, regular SCSS, and CSS files
- **Impact**: Inconsistent styling methodology and potential style conflicts
- **Recommendation**: Standardize on SCSS modules for all component styling

### 7.6 Custom Hook Usage
- **Issue**: Direct API calls in components instead of using custom hooks
- **Impact**: Reduced code reusability and testability
- **Recommendation**: Extract data fetching logic into custom hooks following the pattern in LmsHomePage

### 7.7 State Management Strategy
- **Issue**: Inconsistent approach to state management across pages
- **Impact**: Increased complexity and reduced maintainability
- **Recommendation**: Adopt the state management approach defined in Section 5 consistently across all pages

### 7.8 Component Structure
- **Issue**: Some components are large and handle multiple responsibilities
- **Impact**: Reduced code readability and maintainability
- **Recommendation**: Refactor large components into smaller, focused components following the widget-based approach

## 8. Conclusion

The project standards defined in this document are based on the successful refactoring of the LmsHomePage directory, which demonstrates best practices for component organization, state management, and code style. By adopting these standards across the entire codebase, the project will benefit from improved consistency, maintainability, and scalability.

These standards should be used as a reference for all new development and as a guide for refactoring existing pages and components. Regular reviews should be conducted to ensure adherence to these standards and to identify opportunities for further improvement.