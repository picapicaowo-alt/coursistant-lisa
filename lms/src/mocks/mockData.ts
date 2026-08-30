import {
  FileDto,
} from '@/types';

const generateDate = (offsetDays = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString();
};

// Mock files
// noinspection SpellCheckingInspection
const mockFiles: FileDto[] = [
  {
    id: 'file-1',
    filename: 'assignment-instructions.pdf',
    mimeType: 'application/pdf',
    fileSize: 1024 * 512, // 512KB
    updatedAt: generateDate(-7),
  },
  {
    id: 'file-2',
    filename: 'rubric.docx',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    fileSize: 1024 * 256, // 256KB
    updatedAt: generateDate(-5),
  },
];

// Mock assignment settings
const mockAssignmentSettings = {
  allowLateSubmission: true,
  allowedResubmissionCount: 3,
};

// Mock courses
export let mockCourses = [
  {
    courseCode: 'CS101',
    name: 'Introduction to Computer Science',
    description: 'Fundamental concepts of computer science and programming',
    school: 'School of Engineering',
    semester: 'Fall 2024',
    teacherName: 'Dr. Jane Smith',
    teacherPhone: '555-0101',
    teacherEmail: 'jane.smith@university.edu',
    courseUnits: [],
  },
  {
    courseCode: 'MATH201',
    name: 'Calculus II',
    description: 'Advanced topics in integral calculus and series',
    school: 'School of Mathematics',
    semester: 'Spring 2024',
    teacherName: 'Prof. John Doe',
    teacherPhone: '555-0102',
    teacherEmail: 'john.doe@university.edu',
    courseUnits: [],
  },
];

export const setMockCourses = (data: typeof mockCourses) => mockCourses = data;

// Mock course units
export let mockCourseUnits = [
  {
    id: 'unit-1',
    parentCourseCode: 'CS101',
    index: 0,
    title: 'Introduction to Programming',
    description: 'Basic programming concepts and algorithms',
    assignments: [],
  },
  {
    id: 'unit-2',
    parentCourseCode: 'CS101',
    index: 1,
    title: 'Data Structures',
    description: 'Arrays, linked lists, stacks, and queues',
    assignments: [],
  },
];

export const setMockCourseUnits = (data: typeof mockCourseUnits) => mockCourseUnits = data;

// Mock assignments
export let mockAssignments = [
  {
    id: 'assignment-1',
    parentUnitId: 'unit-1',
    title: 'Hello World Program',
    description: 'Write your first program that prints "Hello, World!"',
    type: 'homework',
    dueTime: generateDate(14), // Due in 2 weeks
    attachments: [mockFiles[0]],
    updatedAt: generateDate(-10),
    settings: mockAssignmentSettings,
  },
  {
    id: 'assignment-2',
    parentUnitId: 'unit-1',
    title: 'Linked List Implementation',
    description: 'Implement a singly linked list with basic operations',
    type: 'homework',
    dueTime: generateDate(21),
    attachments: mockFiles,
    updatedAt: generateDate(-7),
    settings: {...mockAssignmentSettings, allowLateSubmission: false},
  },
];

export const setMockAssignments = (data: typeof mockAssignments) => mockAssignments = data;

// Mock student states for review
export let mockStudentStates = [
  {
    studentId: 'student-1',
    studentFirstName: 'Alice',
    studentMiddleName: null,
    studentLastName: 'Johnson',
    assignmentId: 'assignment-1',
    submission: {
      submissionCount: 2,
      submittedAt: generateDate(-1),
      submissionContent: 'I implemented the linked list with Node class and LinkedList class...',
      submissionFiles: [mockFiles[0]],
    },
    review: {
      grade: 95,
      gradedAt: generateDate(0),
      teacherComment: 'Excellent implementation with good comments.',
    },
  },
  {
    studentId: 'student-2',
    studentFirstName: 'Bob',
    studentMiddleName: null,
    studentLastName: 'Williams',
    assignmentId: 'assignment-1',
    submission: {
      submissionCount: 1,
      submittedAt: generateDate(-2),
      submissionContent: 'Here is my linked list implementation...',
      submissionFiles: [],
    },
    review: null,
  },
  {
    studentId: 'student-3',
    studentFirstName: 'Charlie',
    studentMiddleName: null,
    studentLastName: 'Brown',
    assignmentId: 'assignment-1',
    submission: null,
    review: null,
  },
];

export const setMockStudentStates = (data: typeof mockStudentStates) => mockStudentStates = data;
