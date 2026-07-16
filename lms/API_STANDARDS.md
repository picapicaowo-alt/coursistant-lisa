## API Service & Type Architecture

### Overview

This architecture establishes a structured approach to API integration, promoting type safety, consistency, and
maintainability across our frontend application.

### Core Principles

**1. Service-Centric Organization**

- Each service (`ICourseService`, `ICourseUnitService`, `IAssignmentService`) encapsulates all operations for a specific
  domain entity
- Services act as clean abstraction layers between UI components and backend APIs
- Follows Single Responsibility Principle—one service, one entity

**2. Consistent Method Signatures**

- **Query-first pattern**: All methods accept a query object as the first parameter
- **Create operations**: Use `Omit<Query, 'id'>` to exclude the identifier (which doesn't exist yet)
- **HTTP method alignment**: `get*` → GET, `delete*` → DELETE, other mutations → POST/PUT

**3. Type Safety & Naming Conventions**

- **Request types**: Suffixed with `Request` (e.g., `CreateCourseRequest`)
- **Response types**: Suffixed with `Response` (e.g., `CourseDetailResponse`)
- **Query types**: Define required identifiers for API calls
- **Type reuse**: Leverage TypeScript's utility types (`Omit`, `Pick`, etc.) to minimize duplication

### Type System Structure

```
/api
  /services    # Service interfaces defining API contracts
  /types       # API-specific type definitions (Request/Response/Query)
/types         # Core business entities (shared across application)
```

**Separation of Concerns:**

- **API types**: Mirror backend API contracts exactly
- **Business types**: Define frontend domain models
- **Lightweight mapping**: Use TypeScript's type system for compile-time transformations without runtime overhead

---

## API Specification Template for Backend Implementation

### 1. Overview

This document provides API specifications for the Course Management System. All endpoints should follow RESTful
conventions and include proper OpenAPI/SpringDoc annotations for documentation generation.

### 2. Core Design Patterns

#### 2.1 Request/Response Pattern

- **Query Parameters**: Always passed as path variables or query parameters
- **Request Body**: Used for create/update operations with DTOs
- **Response Body**: Always returns JSON with consistent structure

#### 2.2 Naming Conventions

- **Endpoints**: `/api/{resource}/{action}` format
- **DTO Classes**: Suffix with `Request`, `Response`, or `Query`
- **Methods**: Follow HTTP verb semantics (`GET`, `POST`, `PUT`, `DELETE`)

### 3. Course Service API Specifications

#### 3.1 Endpoints Structure

```java
@RestController
@RequestMapping("/api/courses")
public class CourseController {
    // Implementations below
}
```

#### 3.2 Data Transfer Objects (DTOs)

**Base Entity Types:**

```java
// CourseInfo.java
public class CourseInfo {
    private String courseCode;
    private String name;
    private String description;
    private String school;
    private String semester;
    private String teacherName;
    private String teacherPhone;
    private String teacherEmail;
    private List<CourseUnit> courseUnits;
    
    // Getters, setters, constructors
}

// CourseUnit.java
public class CourseUnit {
    private String id;
    private Integer index; // Starting from 0
    private String title;
    private String description; // Markdown content (HTML disallowed)
    private List<AssignmentThumbnail> assignments;
    
    // Getters, setters, constructors
}

// AssignmentThumbnail.java
public class AssignmentThumbnail {
    private String id;
    private Integer index; // Starting from 0
    private String title;
    private String type;
    private String dueTime; // ISO 8601 format
    
    // Role-specific information (mutually exclusive fields)
    // For students:
    private Integer submissionsCount;
    private Double grade; // null if not graded
    
    // For teachers:
    private Integer totalStudentsCount;
    private Integer submittedCount;
    private Integer gradedCount;
    private Double averageGrade;
    
    // IMPORTANT: These fields are mutually exclusive
    // - For student view: only student-specific fields are populated (submissionsCount, grade)
    // - For teacher view: only teacher-specific fields are populated (totalStudentsCount, submittedCount, gradedCount, averageGrade)
    // Documentation should clearly indicate this mutual exclusivity
    
    // Getters, setters, constructors
}
```

**API-Specific DTOs:**

```java
// CourseQuery.java - For path/query parameters
public class CourseQuery {
    @PathVariable
    private String courseCode;
    
    // Getters, setters
}

// CourseDetailResponse.java - Exactly matches CourseInfo
public class CourseDetailResponse extends CourseInfo {
    // Inherits all fields from CourseInfo
}

// CreateCourseRequest.java - CourseInfo without courseUnits
public class CreateCourseRequest {
    // All fields from CourseInfo EXCEPT courseUnits
    private String name;
    private String description;
    private String school;
    private String semester;
    private String teacherName;
    private String teacherPhone;
    private String teacherEmail;
    
    // Getters, setters
}

// CourseUpdateRequest.java - CourseInfo without courseCode and courseUnits
public class CourseUpdateRequest {
    // All fields from CourseInfo EXCEPT courseCode and courseUnits
    private String name;
    private String description;
    private String school;
    private String semester;
    private String teacherName;
    private String teacherPhone;
    private String teacherEmail;
    
    // Getters, setters
}
```

### 3.3 API Endpoints Implementation

```java
@RestController
@RequestMapping("/api/courses")
public class CourseController {
    
    /**
     * Get course details
     * GET /api/courses/{courseCode}
     * 
     * @param courseCode Path variable
     * @return CourseDetailResponse containing full course information
     */
    @GetMapping("/{courseCode}")
    @Operation(summary = "Get course details")
    public ResponseEntity<CourseDetailResponse> getCourseDetail(
            @PathVariable String courseCode) {
        // Implementation
    }
    
    /**
     * Create a new course
     * POST /api/courses
     * 
     * Note: courseCode is generated by the server, not provided by client
     * 
     * @param request CreateCourseRequest containing course information
     * @return 201 Created with location header
     */
    @PostMapping
    @Operation(summary = "Create a new course")
    @ResponseStatus(HttpStatus.CREATED)
    public ResponseEntity<Void> createCourse(
            @Valid @RequestBody CreateCourseRequest request) {
        // Implementation
    }
    
    /**
     * Update an existing course
     * PUT /api/courses/{courseCode}
     * 
     * @param courseCode Path variable
     * @param updates CourseUpdateRequest with fields to update
     * @return 204 No Content on success
     */
    @PutMapping("/{courseCode}")
    @Operation(summary = "Update course information")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public ResponseEntity<Void> updateCourse(
            @PathVariable String courseCode,
            @Valid @RequestBody CourseUpdateRequest updates) {
        // Implementation
    }
    
    /**
     * Delete a course
     * DELETE /api/courses/{courseCode}
     * 
     * @param courseCode Path variable
     * @return 204 No Content on success
     */
    @DeleteMapping("/{courseCode}")
    @Operation(summary = "Delete a course")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public ResponseEntity<Void> deleteCourse(
            @PathVariable String courseCode) {
        // Implementation
    }
}
```

### 4. Important Implementation Notes

#### 4.1 TypeScript Type Equivalents

When you see TypeScript utility types in the frontend specifications:

- `Omit<Type, Keys>` → Create a new DTO class without those fields
- `Type & OtherType` → Combine all fields from both types in one DTO
- `Partial<Type>` → All fields optional (use `@Nullable` or `Optional` in Java)

#### 4.2 Mutual Exclusive Fields Pattern

For the `AssignmentThumbnail` role-specific fields:

- **Approach 1**: Single DTO with all fields, document mutual exclusivity
- **Approach 2**: Use inheritance with `@JsonTypeInfo` for polymorphic serialization
- **Recommendation**: Approach 1 is simpler; add clear Javadoc about field usage

#### 4.3 Validation

- Use Jakarta Bean Validation annotations (`@NotNull`, `@Size`, `@Pattern`, etc.)
- Add `@Valid` annotation on controller method parameters
- Implement custom validators for complex validation rules

---

## Appendix: New Api Designs

### Business types

```typescript
// course.ts
import {AssignmentThumbnail} from "./assignment";

export interface CourseInfo {
  courseCode: string;
  name: string;
  description: string;
  school: string;
  semester: string;
  teacherName: string;
  teacherPhone: string;
  teacherEmail: string;
  courseUnits: CourseUnit[];
}

export interface CourseUnit {
  id: string;
  // The index (starting from 0) the unit appears in the units list
  index: number;
  title: string;
  // A markdown string (disallow html for safety)
  description: string;
  assignments: AssignmentThumbnail[]
}

// file.ts
export interface FileDto {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: string;
}


// assignment/base.ts
import {FileDto} from '../file';

export interface AssignmentBase {
  id: string;
  title: string;
  description: string;
  type: string;
  dueTime: string;
  attachments: FileDto[];
  updatedAt: string;
  settings: AssignmentSettings;
}

export interface AssignmentSettings {
  allowLateSubmission: boolean;
  allowedResubmissionCount: number;
}


// assignment/review.ts
import {AssignmentBase} from "./base";
import {
  ReviewState,
  SubmissionState
} from "./state";

export interface AssignmentForReview extends AssignmentBase {
  studentStates: StudentState[];
}

export interface StudentState {
  studentId: string;
  studentName: string;
  submission?: SubmissionState;
  review?: ReviewState;
}


// assignment/state.ts
import {FileDto} from '../file';

export interface SubmissionState {
  // The number of submissions made by the student
  submissionCount: number;
  submittedAt: string;
  submissionContent: string;
  submissionFiles: FileDto[];
}

export interface ReviewState {
  grade: number;
  gradedAt: string;
  teacherComment: string;
}


// assignment/student.ts
import {AssignmentBase} from "./base";
import {
  ReviewState,
  SubmissionState
} from "./state";

export interface AssignmentForStudent extends AssignmentBase {
  submission?: SubmissionState;
  review?: ReviewState;
}


// assignment/thumbnail.ts
export interface AssignmentThumbnail {
  id: string;
  // The index (starting from 0) the assignment appears in the assignments list
  index: number;
  title: string;
  type: string;
  // A specified time format should be agreed
  dueTime: string;
  roleSpecificInfo: EitherOr<TeacherAssignmentThumbnail, StudentAssignmentThumbnail>;
}

export interface StudentAssignmentThumbnail {
  // The number of submissions made by the student
  submissionsCount: number;
  // The grade the student received for submission, null if not graded
  grade?: number;
}

export interface TeacherAssignmentThumbnail {
  totalStudentsCount: number;
  submittedCount: number;
  gradedCount: number;
  averageGrade?: number;
}
```

### Final DTO types

```typescript
// assignment.ts
import {
  AssignmentBase,
  AssignmentThumbnail,
  AssignmentForStudent,
  AssignmentForReview,
  SubmissionState,
  ReviewState
} from "../../types";

export interface AssignmentQuery {
  courseCode: string,
  courseUnitId: string,
  assignmentId: string
}

export type CreateAssignmentRequest = Omit<AssignmentThumbnail, 'roleSpecificInfo'>;

export type AssignmentForStudentResponse = AssignmentForStudent;

export type AssignmentSubmissionRequest = SubmissionState;

export type AssignmentForEditResponse = AssignmentBase;

export type UpdateAssignmentRequest = Omit<AssignmentBase, 'id' | 'updatedAt'>;

export type AssignmentForReviewResponse = AssignmentForReview;

export type ReviewSubmissionRequest = ReviewState;


// course.ts
import {
  CourseInfo
} from "../../types";

export interface CourseQuery {
  courseCode: string;
}

export type CourseDetailResponse = CourseInfo;

export type CreateCourseRequest = Omit<CourseInfo, 'courseUnits'>

export type CourseUpdateRequest = Omit<CourseInfo, 'courseCode' | 'courseUnits'>;


// courseUnit.ts
import {
  CourseUnit
} from "../../types";

export interface CourseUnitQuery {
  courseCode: string;
  courseUnitId: string;
}

export type CreateCourseUnitRequest = Omit<CourseUnit, 'assignments'>;

export type UpdateCourseUnitRequest = Omit<CourseUnit, 'id' | 'assignments'>;
```

### Services and endpoints

```typescript
import {
  CourseQuery,
  CourseDetailResponse,
  CreateCourseRequest,
  CourseUpdateRequest,
} from "./types/course";
import {
  CourseUnitQuery,
  CreateCourseUnitRequest,
  UpdateCourseUnitRequest,
} from "./types/courseUnit";
import {
  AssignmentQuery,
  CreateAssignmentRequest,
  AssignmentForStudentResponse,
  AssignmentSubmissionRequest,
  AssignmentForEditResponse,
  AssignmentForReviewResponse,
  ReviewSubmissionRequest,
  UpdateAssignmentRequest,
} from './types/assignment';

export interface ICourseService {
  getCourseDetail(query: CourseQuery): Promise<CourseDetailResponse>;
  
  createCourse(query: Omit<CourseQuery, 'courseCode'>, courseInfo: CreateCourseRequest): Promise<void>;
  
  updateCourse(query: CourseQuery, updates: CourseUpdateRequest): Promise<void>;
  
  deleteCourse(query: CourseQuery): Promise<void>;
}

export interface ICourseUnitService {
  createCourseUnit(query: Omit<CourseUnitQuery, 'courseUnitId'>, courseUnit: CreateCourseUnitRequest): Promise<void>;
  
  updateCourseUnit(query: CourseUnitQuery, updates: UpdateCourseUnitRequest): Promise<void>;
  
  deleteCourseUnit(query: CourseUnitQuery): Promise<void>;
}

export interface IAssignmentService {
  createAssignment(query: Omit<AssignmentQuery, 'assignmentId'>, assignment: CreateAssignmentRequest): Promise<void>;
  
  deleteAssignment(query: AssignmentQuery): Promise<void>;
  
  getAssignmentForStudent(query: AssignmentQuery): Promise<AssignmentForStudentResponse>;
  
  submitAssignment(query: AssignmentQuery, submission: AssignmentSubmissionRequest): Promise<void>;
  
  getAssignmentForEdit(query: AssignmentQuery): Promise<AssignmentForEditResponse>;
  
  updateAssignment(query: AssignmentQuery, updates: UpdateAssignmentRequest): Promise<void>;
  
  getAssignmentForReview(query: AssignmentQuery): Promise<AssignmentForReviewResponse>;
  
  reviewSubmission(query: AssignmentQuery & { studentId: string }, review: ReviewSubmissionRequest): Promise<void>;
}

export interface IServiceFactory {
  getCourseService(): ICourseService;
  
  getCourseUnitService(): ICourseUnitService;
  
  getAssignmentService(): IAssignmentService;
}
```