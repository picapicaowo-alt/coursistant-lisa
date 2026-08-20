import {createServer} from 'node:http';

const port = Number(process.env.MOCK_LMS_API_PORT || 18081);
const now = () => new Date().toISOString();

const assignment = {
  id: 9,
  courseId: 4,
  title: 'Week 3 Lab Report',
  description: 'Complete the lab investigation and upload a clearly written report. Include your method, observations, analysis, and conclusion.',
  pointsPossible: 100,
  dueAtUtc: '2026-09-16T06:59:00Z',
  dueAtLocal: '2026-09-15T23:59:00',
  timezone: 'America/Los_Angeles',
  submissionType: 'Individual',
  state: 'Published',
  allowedFileTypes: ['pdf', 'docx'],
  maxFileCount: 3,
  maxFileSizeBytes: 10 * 1024 * 1024,
  attachments: [
    {
      id: 33,
      assignmentId: 9,
      originalName: 'Lab instructions.pdf',
      contentType: 'application/pdf',
      sizeBytes: 284132,
      uploadedBy: 2,
      previewAvailable: true,
      previewUrl: '/api/v2/courses/4/assignments/9/attachments/33/preview',
      downloadUrl: '/api/v2/courses/4/assignments/9/attachments/33/download',
      createdAt: '2026-08-10T19:30:00Z',
    },
  ],
  createdAt: '2026-08-10T19:30:00Z',
  updatedAt: '2026-08-10T19:30:00Z',
};

const studentAssignment = {
  ...assignment,
  submissionStatus: 'NotSubmitted',
  acceptingSubmissions: true,
  windowOpen: true,
};

const closedStudentAssignment = {
  ...studentAssignment,
  id: 37,
  title: 'Reading notes — closed submission preview',
  description: 'This fixture verifies that “no formal submission yet” is an empty state, not an API outage.',
  dueAtUtc: '2026-07-31T21:34:00Z',
  dueAtLocal: '2026-07-31T14:34:00',
  submissionStatus: 'NotSubmittedClosed',
  acceptingSubmissions: false,
  windowOpen: false,
  stagedFileCount: 0,
};

const staffAssignment = {
  ...assignment,
  activeStudentCount: 4,
  submissionCount: 3,
  gradedCount: 2,
  releasedCount: 1,
  canEditStructure: true,
};

const submission = {
  assignmentId: 9,
  ownerUserId: 7,
  submissionStatus: 'NotSubmitted',
  dueAtUtc: assignment.dueAtUtc,
  dueAtLocal: assignment.dueAtLocal,
  timezone: assignment.timezone,
  windowOpen: true,
  acceptingSubmissions: true,
  graceWindowActive: false,
  submitFrozen: false,
  totalVersions: 0,
  stagingFiles: [],
};

const previewCourse = {
  id: 4,
  courseId: 4,
  tenantId: 1,
  courseCode: 'BIO-210',
  title: 'Cell Biology',
  name: 'Cell Biology',
  termStartDate: '2026-08-24',
  termEndDate: '2026-12-12',
  description: 'Structure and function of cells, with a weekly laboratory.',
  location: 'Science 204',
  instructorId: 7,
  primaryInstructor: {userId: 7, name: 'Demo Instructor', email: 'instructor@example.test'},
  state: 'Active',
  status: 'Active',
  archivedAt: null,
  gradingGraceEndsAt: null,
  createdAt: '2026-08-01T00:00:00Z',
  updatedAt: '2026-08-01T00:00:00Z',
};
let createdCourse = null;

let nextEventId = 32;
let previewEvents = [{
  id: 31,
  courseId: 4,
  name: 'Microscopy workshop',
  date: '2026-09-04',
  startTime: '14:00:00',
  endTime: '15:30:00',
  location: 'Science 204',
  description: 'Optional guided practice using the fluorescence microscopes.',
  timezone: 'America/Los_Angeles',
  createdAt: '2026-08-17T19:00:00Z',
  updatedAt: '2026-08-17T19:00:00Z',
}];

let nextGroupSetId = 12;
let nextGroupId = 113;
let previewGroupSets = [{
  id: 11,
  courseId: 4,
  name: 'Lab partners',
  defaultCapacity: 4,
  joinOpensAtUtc: '2026-08-24T15:00:00Z',
  joinOpensAtLocal: '2026-08-24T08:00:00',
  joinClosesAtUtc: '2026-08-29T00:00:00Z',
  joinClosesAtLocal: '2026-08-28T17:00:00',
  timezone: 'America/Los_Angeles',
  locked: false,
  openForSelfService: true,
  capacityShortenWarning: false,
  windowShortenWarning: false,
  myGroup: {groupId: 111, userId: 8, displayName: 'Demo Student', joinedAt: '2026-08-25T10:00:00', addedByType: 'SELF', addedByUserId: 8},
  groups: [
    {id: 111, groupSetId: 11, name: 'Cell Explorers', capacity: 4, capacityOverride: null, memberCount: 1, members: [{groupId: 111, userId: 8, displayName: 'Demo Student', joinedAt: '2026-08-25T10:00:00', addedByType: 'SELF', addedByUserId: 8}]},
    {id: 112, groupSetId: 11, name: 'Membrane Team', capacity: 4, capacityOverride: null, memberCount: 0, members: []},
  ],
}];

let previewStudents = [
  {id: 101, courseId: 4, userId: 8, userName: 'Demo Student', userEmail: 'student@example.test', courseRole: 'Student', active: true, level: 'STUDENT', assignmentSubmitFrozen: false},
  {id: 102, courseId: 4, userId: 9, userName: 'Ava Patel', userEmail: 'ava@example.test', courseRole: 'Student', active: true, level: 'STUDENT', assignmentSubmitFrozen: false},
  {id: 103, courseId: 4, userId: 10, userName: 'Liam Chen', userEmail: 'liam@example.test', courseRole: 'Student', active: true, level: 'STUDENT', assignmentSubmitFrozen: false},
];

let previewSyllabus = {
  posted: true,
  versionId: 1,
  originalFilename: 'BIO-210-syllabus.pdf',
  contentType: 'application/pdf',
  sizeBytes: 184000,
  uploadedBy: 7,
  uploadedAt: '2026-08-15T18:00:00Z',
  canRestorePrevious: false,
};
let previousSyllabus = null;

const previewMyGrades = [
  {assignmentId: 5, assignmentTitle: 'Cell worksheet', itemType: 'ASSIGNMENT', pointsPossible: 100, pointsEarned: 84, score: 84, dueAtUtc: '2026-05-20T06:59:00Z', releasedAt: '2026-05-22T18:00:00Z', released: true, submissionStatus: 'Submitted'},
  {assignmentId: 6, assignmentTitle: 'Microscopy notes', itemType: 'ASSIGNMENT', pointsPossible: 100, pointsEarned: 91, score: 91, dueAtUtc: '2026-06-20T06:59:00Z', releasedAt: '2026-06-22T18:00:00Z', released: true, submissionStatus: 'Submitted'},
  {assignmentId: 7, assignmentTitle: 'Membrane lab', itemType: 'ASSIGNMENT', pointsPossible: 100, pointsEarned: 86, score: 86, dueAtUtc: '2026-07-20T06:59:00Z', releasedAt: '2026-07-22T18:00:00Z', released: true, submissionStatus: 'Submitted'},
  {assignmentId: 8, assignmentTitle: 'Cell cycle quiz', itemType: 'ASSIGNMENT', pointsPossible: 100, pointsEarned: 94, score: 94, dueAtUtc: '2026-08-15T06:59:00Z', releasedAt: '2026-08-17T18:00:00Z', released: true, submissionStatus: 'Submitted'},
];

let nextWeekId = 13;
let nextMaterialId = 83;
let previewWeeks = [
  {
    id: 11,
    courseId: 4,
    title: 'Cell structure and microscopy',
    orderPosition: 0,
    state: 'Published',
    materials: [
      {
        id: 81,
        weekId: 11,
        courseId: 4,
        materialType: 'FILE',
        displayName: 'Week 1 lecture slides',
        orderPosition: 0,
        originalFilename: 'week-1-slides.pdf',
        contentType: 'application/pdf',
        extension: 'pdf',
        sizeBytes: 248000,
        linkUrl: null,
        uploadedBy: 7,
        previewAvailable: true,
        downloadUrl: '/api/v2/courses/4/weeks/11/materials/81/download',
      },
      {
        id: 82,
        weekId: 11,
        courseId: 4,
        materialType: 'LINK',
        displayName: 'Interactive cell explorer',
        orderPosition: 1,
        originalFilename: null,
        contentType: null,
        extension: null,
        sizeBytes: null,
        linkUrl: 'https://example.com/cell-explorer',
        uploadedBy: 7,
        previewAvailable: false,
        downloadUrl: '/api/v2/courses/4/weeks/11/materials/82/download',
      },
    ],
    createdAt: '2026-08-01T00:00:00Z',
    updatedAt: '2026-08-01T00:00:00Z',
  },
  {
    id: 12,
    courseId: 4,
    title: 'Membranes and transport',
    orderPosition: 1,
    state: 'Draft',
    materials: [],
    createdAt: '2026-08-02T00:00:00Z',
    updatedAt: '2026-08-02T00:00:00Z',
  },
];

let nextQuizId = 4;
let nextQuestionId = 104;
let previewQuizzes = [{
  id: 3,
  courseId: 4,
  title: 'Cell structure knowledge check',
  instructions: 'Answer every question. Save each response before submitting.',
  opensAtUtc: '2026-08-17T07:00:00Z',
  opensAtLocal: '2026-08-17T00:00:00',
  closesAtUtc: '2026-09-20T06:59:00Z',
  closesAtLocal: '2026-09-19T23:59:00',
  timezone: 'America/Los_Angeles',
  timeLimitSeconds: 1800,
  attemptsAllowed: 2,
  resultVisibility: 'AfterRelease',
  state: 'Published',
  version: 1,
  totalPoints: 7,
  questionCount: 3,
  hasAttempts: false,
  createdAt: '2026-08-17T18:00:00Z',
  updatedAt: '2026-08-17T18:00:00Z',
}];

const withQuizWindow = (quiz) => {
  const nowMs = Date.now();
  const opens = Date.parse(quiz.opensAtUtc);
  const closes = Date.parse(quiz.closesAtUtc);
  return {
    ...quiz,
    windowOpen: Number.isFinite(opens) && Number.isFinite(closes) && nowMs >= opens && nowMs < closes,
  };
};

const quizQuestions = new Map([[3, [
  {
    id: 101, quizId: 3, type: 'SingleChoice', stem: 'Which organelle contains most of a eukaryotic cell’s DNA?',
    points: 2, position: 1, version: 1,
    options: [
      {id: 1001, label: 'Nucleus', isCorrect: true, position: 1},
      {id: 1002, label: 'Golgi apparatus', isCorrect: false, position: 2},
      {id: 1003, label: 'Lysosome', isCorrect: false, position: 3},
    ],
  },
  {
    id: 102, quizId: 3, type: 'MultipleSelect', stem: 'Select structures found in plant cells.',
    points: 3, position: 2, version: 1,
    options: [
      {id: 1004, label: 'Cell wall', isCorrect: true, position: 1},
      {id: 1005, label: 'Chloroplast', isCorrect: true, position: 2},
      {id: 1006, label: 'Centriole only', isCorrect: false, position: 3},
    ],
  },
  {
    id: 103, quizId: 3, type: 'ShortAnswer', stem: 'Explain one advantage of compartmentalization in a cell.',
    points: 2, position: 3, version: 1, options: [],
  },
]]]);

let previewQuizAttempt = null;
let previewQuizAttemptHistory = [];
let previewQuizReleased = false;
let previewShortAnswerGrade = null;
let previewShortAnswerFeedback = null;

const latestSubmittedQuizAttempt = () => (
  previewQuizAttemptHistory[previewQuizAttemptHistory.length - 1]
  || (previewQuizAttempt?.status === 'Submitted' ? previewQuizAttempt : null)
);

const refreshQuizTotals = quizId => {
  const questions = quizQuestions.get(quizId) || [];
  previewQuizzes = previewQuizzes.map(quiz => quiz.id === quizId ? {
    ...quiz,
    totalPoints: questions.reduce((total, question) => total + Number(question.points || 0), 0),
    questionCount: questions.length,
    version: quiz.version + 1,
    updatedAt: now(),
  } : quiz);
};

const normalizePreviewOrder = () => {
  previewWeeks = previewWeeks.map((week, weekIndex) => ({
    ...week,
    orderPosition: weekIndex,
    materials: week.materials.map((material, materialIndex) => ({
      ...material,
      weekId: week.id,
      orderPosition: materialIndex,
    })),
  }));
};

const gradingRoster = {
  assignmentId: 9,
  assignmentTitle: assignment.title,
  pointsPossible: assignment.pointsPossible,
  dueAtUtc: assignment.dueAtUtc,
  dueAtLocal: assignment.dueAtLocal,
  timezone: assignment.timezone,
  totalStudents: 4,
  submittedCount: 3,
  lateCount: 1,
  notSubmittedCount: 1,
  ungradedCount: 2,
  enteredCount: 1,
  releasedCount: 1,
  gradingWritable: true,
  items: [
    {
      studentUserId: 7,
      studentName: 'Mia Watson',
      studentEmail: 'mia@example.test',
      submissionStatus: 'Submitted',
      submissionId: 21,
      submissionVersionId: 31,
      versionNo: 1,
      submittedAt: '2026-09-14T18:00:00Z',
      fileCount: 1,
      gradeStatus: 'Ungraded',
    },
    {
      studentUserId: 8,
      studentName: 'Noah Williams',
      studentEmail: 'noah@example.test',
      submissionStatus: 'SubmittedLate',
      submissionId: 22,
      submissionVersionId: 32,
      versionNo: 1,
      submittedAt: '2026-09-16T07:20:00Z',
      fileCount: 2,
      gradeStatus: 'Entered',
      score: 88,
    },
    {
      studentUserId: 9,
      studentName: 'Ava Patel',
      studentEmail: 'ava@example.test',
      submissionStatus: 'Submitted',
      submissionId: 23,
      submissionVersionId: 33,
      versionNo: 1,
      submittedAt: '2026-09-15T03:45:00Z',
      fileCount: 1,
      gradeStatus: 'Released',
      score: 94,
      releasedAt: '2026-09-16T20:00:00Z',
    },
    {
      studentUserId: 10,
      studentName: 'Liam Chen',
      studentEmail: 'liam@example.test',
      submissionStatus: 'NotSubmitted',
      gradeStatus: 'Ungraded',
    },
  ],
};

let notifications = [
  {
    notificationId: 507,
    tenantId: 1,
    recipientUserId: 7,
    courseId: 4,
    courseCode: 'BIO-210',
    notificationType: 'ASSIGNMENT_SUBMISSION_RECEIVED',
    message: 'Mia Watson submitted Week 3 Lab Report.',
    subjectType: 'ASSIGNMENT_SUBMISSION',
    subjectId: 21,
    deepLink: '/courses/4/assignments/9/submissions/21',
    createdAt: '2026-08-18T00:20:00Z',
    readAt: null,
    availability: 'AVAILABLE',
  },
  {
    notificationId: 501,
    tenantId: 1,
    recipientUserId: 7,
    courseId: 4,
    courseCode: 'BIO-210',
    notificationType: 'ASSIGNMENT_PUBLISHED',
    message: 'New assignment published: Week 3 Lab Report',
    subjectType: 'ASSIGNMENT',
    subjectId: 9,
    deepLink: '/courses/4/assignments/9',
    createdAt: '2026-08-17T23:30:00Z',
    readAt: null,
    availability: 'AVAILABLE',
  },
  {
    notificationId: 502,
    tenantId: 1,
    recipientUserId: 7,
    courseId: 4,
    courseCode: 'BIO-210',
    notificationType: 'ASSIGNMENT_GRADE_RELEASED',
    message: 'Your grade for Cell Structure Worksheet is now available.',
    subjectType: 'ASSIGNMENT_GRADE',
    subjectId: 8,
    deepLink: '/courses/4/assignments/8',
    createdAt: '2026-08-17T20:15:00Z',
    readAt: null,
    availability: 'AVAILABLE',
  },
  {
    notificationId: 503,
    tenantId: 1,
    recipientUserId: 7,
    courseId: 4,
    courseCode: 'BIO-210',
    notificationType: 'GROUP_MEMBER_MOVED',
    message: 'Your lab group membership was updated.',
    subjectType: 'GROUP_SET',
    subjectId: 11,
    deepLink: '/courses/4/groups/11',
    createdAt: '2026-08-16T18:00:00Z',
    readAt: null,
    availability: 'AVAILABLE',
  },
  {
    notificationId: 505,
    tenantId: 1,
    recipientUserId: 7,
    courseId: 4,
    courseCode: 'BIO-210',
    notificationType: 'QUIZ_PUBLISHED',
    message: 'A new knowledge check is ready.',
    subjectType: 'QUIZ',
    subjectId: 3,
    deepLink: '/courses/4/quizzes/3',
    createdAt: '2026-08-17T21:30:00Z',
    readAt: null,
    availability: 'AVAILABLE',
  },
  {
    notificationId: 506,
    tenantId: 1,
    recipientUserId: 7,
    courseId: 4,
    courseCode: 'BIO-210',
    notificationType: 'ANNOUNCEMENT_POSTED',
    message: 'Lab orientation update',
    subjectType: 'ANNOUNCEMENT',
    subjectId: 21,
    deepLink: '/courses/4/announcements/21',
    createdAt: '2026-08-17T19:00:00Z',
    readAt: null,
    availability: 'AVAILABLE',
  },
  {
    notificationId: 504,
    tenantId: 1,
    recipientUserId: 7,
    courseId: 4,
    courseCode: 'BIO-210',
    notificationType: 'WEEK_PUBLISHED',
    message: 'Week 1 course materials were published.',
    subjectType: 'WEEK',
    subjectId: 2,
    deepLink: '/courses/4/weeks/2',
    createdAt: '2026-08-12T16:45:00Z',
    readAt: '2026-08-12T17:00:00Z',
    availability: 'NO_LONGER_AVAILABLE',
  },
];

const send = (response, status, data, code = 'SUCCESS', message = 'Success') => {
  response.writeHead(status, {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
  });
  response.end(JSON.stringify({status, code, message, timestamp: now(), data}));
};

const createPdfFixture = label => {
  const safeLabel = String(label).replace(/[()\\]/g, value => `\\${value}`);
  const stream = `BT /F1 18 Tf 72 720 Td (${safeLabel}) Tj ET`;
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
    `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];
  let document = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(document));
    document += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = Buffer.byteLength(document);
  document += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach(offset => {
    document += `${String(offset).padStart(10, '0')} 00000 n \n`;
  });
  document += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return Buffer.from(document, 'utf8');
};

const sendFileBytes = (response, {filename, contentType = 'application/octet-stream', action, label}) => {
  const content = contentType === 'application/pdf'
    ? createPdfFixture(label || filename)
    : Buffer.from(`Coursistant file fixture\nFile: ${filename}\nAction: ${action}\n`, 'utf8');
  response.writeHead(200, {
    'Content-Type': contentType,
    'Content-Disposition': `${action === 'preview' ? 'inline' : 'attachment'}; filename="${filename}"`,
    'Content-Length': content.length,
    'Cache-Control': 'no-store',
  });
  response.end(content);
};

const sendMaterialBytes = (response, material, action) => {
  sendFileBytes(response, {
    filename: material.originalFilename || material.displayName,
    contentType: material.contentType || 'application/octet-stream',
    action,
    label: `Course material: ${material.displayName}`,
  });
};

const sendSyllabusBytes = (response, action) => {
  sendFileBytes(response, {
    filename: previewSyllabus.originalFilename,
    contentType: 'application/pdf',
    action,
    label: 'Coursistant mock syllabus',
  });
};

const readRawBody = request => new Promise((resolve, reject) => {
  const chunks = [];
  request.on('data', chunk => chunks.push(chunk));
  request.on('end', () => {
    resolve(Buffer.concat(chunks));
  });
  request.on('error', reject);
});

const readBody = async request => {
  const raw = (await readRawBody(request)).toString('utf8');
  return raw ? JSON.parse(raw) : {};
};

const multipartField = (raw, fieldName) => {
  const pattern = new RegExp(`name="${fieldName}"\\r\\n\\r\\n([^\\r]+)`);
  return raw.match(pattern)?.[1]?.trim();
};

const multipartFilenames = raw => Array.from(raw.matchAll(/filename="([^"]+)"/g), match => match[1]);

const server = createServer(async (request, response) => {
  const url = new URL(request.url || '/', `http://${request.headers.host}`);

  if (request.method === 'POST' && url.pathname === '/api/v1/auth/email-verifications/register') {
    const email = url.searchParams.get('email')?.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      send(response, 400, null, 'PARAM_MISSING', 'A valid email is required');
      return;
    }
    send(response, 200);
    return;
  }

  if (request.method === 'POST' && url.pathname === '/api/v1/auth/register') {
    try {
      const registration = await readBody(request);
      if (!registration.name || !registration.email || !registration.password || !registration.verificationCode) {
        send(response, 400, null, 'PARAM_MISSING', 'Registration fields are required');
        return;
      }
      if (!/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(registration.password)) {
        send(response, 400, null, 'INVALID_PASSWORD_FORMAT', 'Password does not meet requirements');
        return;
      }
      if (registration.verificationCode !== '123456') {
        send(response, 400, null, 'INVALID_VERIFICATION_CODE', 'Incorrect Verification Code');
        return;
      }

      const normalizedEmail = String(registration.email).trim().toLowerCase();
      send(response, 200, {
        userId: 9,
        email: normalizedEmail,
        name: String(registration.name).trim(),
        username: normalizedEmail.split('@')[0],
        role: 'USER',
        level: 'STUDENT',
        avatar: null,
        accessToken: 'local-registered-user-token',
        mustChangePassword: false,
      });
      return;
    } catch {
      send(response, 400, null, 'INVALID_JSON', 'Request body must be JSON');
      return;
    }
  }

  if (request.method === 'POST' && url.pathname === '/api/v1/auth/login') {
    try {
      const credentials = await readBody(request);
      if (!credentials.email || !credentials.password) {
        send(response, 400, null, 'PARAM_MISSING', 'Email and password are required');
        return;
      }

      const isInstructor = String(credentials.email).toLowerCase().includes('instructor');
      send(response, 200, {
        userId: isInstructor ? 7 : 8,
        email: credentials.email,
        name: isInstructor ? 'Demo Instructor' : 'Demo Student',
        username: isInstructor ? 'demo.instructor' : 'demo.student',
        role: 'USER',
        level: isInstructor ? 'INSTRUCTOR' : 'STUDENT',
        avatar: null,
        accessToken: isInstructor ? 'local-instructor-token' : 'local-preview-token',
        mustChangePassword: false,
      });
      return;
    } catch {
      send(response, 400, null, 'INVALID_JSON', 'Request body must be JSON');
      return;
    }
  }

  if (request.method === 'GET' && url.pathname === '/api/v2/me/courses') {
    const isInstructor = request.headers.authorization === 'Bearer local-instructor-token';
    const courseRole = isInstructor ? 'Instructor' : 'Student';
    send(response, 200, {
      items: [{
        id: 4,
        courseId: 4,
        courseCode: previewCourse.courseCode,
        title: previewCourse.title,
        name: previewCourse.name,
        state: previewCourse.state,
        status: previewCourse.status,
        courseRole,
        role: courseRole,
        canGrade: isInstructor,
        canPostAnnouncements: isInstructor,
        canManageGroups: isInstructor,
        canManageCourseEvents: isInstructor,
        canManageContent: isInstructor,
      }],
      page: 0,
      size: 100,
      total: 1,
    });
    return;
  }

  if (url.pathname === '/api/v2/me/profile') {
    const isInstructor = request.headers.authorization === 'Bearer local-instructor-token';
    if (request.method === 'GET') {
      send(response, 200, {
        userId: isInstructor ? 7 : 8,
        displayName: isInstructor ? 'Demo Instructor' : 'Demo Student',
        email: isInstructor ? 'instructor@example.com' : 'student@example.com',
        role: 'USER',
        level: isInstructor ? 'INSTRUCTOR' : 'STUDENT',
        avatarUrl: null,
        emailNotifications: true,
      });
      return;
    }
    if (request.method === 'PATCH') {
      const body = await readBody(request);
      send(response, 200, {
        userId: isInstructor ? 7 : 8,
        displayName: body.displayName || (isInstructor ? 'Demo Instructor' : 'Demo Student'),
        email: isInstructor ? 'instructor@example.com' : 'student@example.com',
        role: 'USER',
        level: isInstructor ? 'INSTRUCTOR' : 'STUDENT',
        avatarUrl: null,
        emailNotifications: body.emailNotifications !== undefined ? body.emailNotifications : true,
      });
      return;
    }
  }

  if (request.method === 'PUT' && url.pathname === '/api/v1/auth/password') {
    send(response, 200, {});
    return;
  }

  if (request.method === 'GET' && url.pathname === '/api/v2/courses/4') {
    send(response, 200, previewCourse);
    return;
  }

  if (request.method === 'POST' && url.pathname === '/api/v2/courses') {
    const body = await readBody(request);
    createdCourse = {...previewCourse, ...body, id: 5, courseId: 5, createdAt: now(), updatedAt: now()};
    send(response, 200, createdCourse);
    return;
  }

  if (request.method === 'GET' && url.pathname === '/api/v2/courses/5' && createdCourse) {
    send(response, 200, createdCourse);
    return;
  }

  if (url.pathname === '/api/v2/courses/4/syllabus' && request.method === 'GET') {
    send(response, 200, previewSyllabus);
    return;
  }
  if (url.pathname === '/api/v2/courses/4/syllabus' && request.method === 'POST') {
    const raw = await readRawBody(request);
    const filename = multipartFilenames(raw.toString('latin1'))[0] || 'syllabus.pdf';
    previousSyllabus = previewSyllabus.posted ? previewSyllabus : previousSyllabus;
    previewSyllabus = {
      posted: true,
      versionId: (previewSyllabus.versionId || 0) + 1,
      originalFilename: filename,
      contentType: 'application/pdf',
      sizeBytes: raw.length,
      uploadedBy: 7,
      uploadedAt: now(),
      canRestorePrevious: Boolean(previousSyllabus?.posted),
    };
    send(response, 200, previewSyllabus);
    return;
  }
  if (url.pathname === '/api/v2/courses/4/syllabus' && request.method === 'DELETE') {
    previousSyllabus = previewSyllabus.posted ? previewSyllabus : previousSyllabus;
    previewSyllabus = {posted: false};
    send(response, 200, previewSyllabus);
    return;
  }
  if (url.pathname === '/api/v2/courses/4/syllabus/restore' && request.method === 'POST') {
    if (!previousSyllabus?.posted) send(response, 409, null, 'NO_PREVIOUS_VERSION', 'No previous syllabus version');
    else {
      const current = previewSyllabus;
      previewSyllabus = {...previousSyllabus, canRestorePrevious: Boolean(current?.posted)};
      previousSyllabus = current?.posted ? current : null;
      send(response, 200, previewSyllabus);
    }
    return;
  }
  const syllabusFileMatch = url.pathname.match(/^\/api\/v2\/courses\/4\/syllabus\/(preview|download)$/);
  if (syllabusFileMatch && request.method === 'GET') {
    if (!previewSyllabus.posted) send(response, 404, null, 'SYLLABUS_NOT_FOUND', 'No syllabus is posted');
    else sendSyllabusBytes(response, syllabusFileMatch[1]);
    return;
  }

  if (request.method === 'GET' && url.pathname === '/api/v2/courses/4/weeks') {
    send(response, 200, previewWeeks);
    return;
  }

  if (request.method === 'GET' && url.pathname === '/api/v2/courses/4/sessions') {
    send(response, 200, [
      {id: 1, courseId: 4, type: 'Lecture', dayOfWeek: 'MON', startTime: '10:00:00', endTime: '11:15:00', location: 'Science 204', timezone: 'America/Los_Angeles'},
      {id: 2, courseId: 4, type: 'Lab', dayOfWeek: 'WED', startTime: '14:00:00', endTime: '16:50:00', location: 'Lab 3', timezone: 'America/Los_Angeles'},
    ]);
    return;
  }

  if (request.method === 'GET' && url.pathname === '/api/v2/courses/4/announcements/21') {
    send(response, 200, {
      id: 21,
      courseId: 4,
      title: 'Lab orientation update',
      body: 'Please bring closed-toe shoes and your lab notebook to the first lab session.',
      authorUserId: 7,
      authorName: 'Demo Instructor',
      postedAt: '2026-08-17T19:00:00Z',
      editedAt: null,
      read: false,
    });
    return;
  }

  if (url.pathname === '/api/v2/courses/4/events' && request.method === 'GET') {
    send(response, 200, previewEvents);
    return;
  }
  if (url.pathname === '/api/v2/courses/4/events' && request.method === 'POST') {
    const body = await readBody(request);
    const created = {...body, id: nextEventId++, courseId: 4, timezone: 'America/Los_Angeles', createdAt: now(), updatedAt: now()};
    previewEvents.push(created);
    send(response, 200, created);
    return;
  }
  const eventMatch = url.pathname.match(/^\/api\/v2\/courses\/4\/events\/(\d+)$/);
  if (eventMatch) {
    const eventId = Number(eventMatch[1]);
    const item = previewEvents.find(event => event.id === eventId);
    if (request.method === 'GET') {
      if (!item) send(response, 404, null, 'NOT_FOUND', 'Event not found');
      else send(response, 200, item);
      return;
    }
    if (request.method === 'PUT') {
      const body = await readBody(request);
      previewEvents = previewEvents.map(event => event.id === eventId ? {...event, ...body, updatedAt: now()} : event);
      send(response, 200, previewEvents.find(event => event.id === eventId));
      return;
    }
    if (request.method === 'DELETE') {
      previewEvents = previewEvents.filter(event => event.id !== eventId);
      send(response, 200, null);
      return;
    }
  }

  const groupSetForViewer = item => request.headers.authorization === 'Bearer local-instructor-token'
    ? {...item, myGroup: null}
    : item;
  if (url.pathname === '/api/v2/courses/4/group-sets' && request.method === 'GET') {
    send(response, 200, previewGroupSets.map(groupSetForViewer));
    return;
  }
  if (url.pathname === '/api/v2/courses/4/group-sets' && request.method === 'POST') {
    const body = await readBody(request);
    const created = {
      id: nextGroupSetId++, courseId: 4, name: body.name, defaultCapacity: body.defaultCapacity ?? null,
      joinOpensAtUtc: null, joinOpensAtLocal: body.joinOpensAt ?? null,
      joinClosesAtUtc: null, joinClosesAtLocal: body.joinClosesAt ?? null,
      timezone: 'America/Los_Angeles', locked: Boolean(body.locked), openForSelfService: !body.locked,
      capacityShortenWarning: false, windowShortenWarning: false, myGroup: null, groups: [],
    };
    previewGroupSets.push(created);
    send(response, 200, created);
    return;
  }
  const groupSetMatch = url.pathname.match(/^\/api\/v2\/courses\/4\/group-sets\/(\d+)$/);
  if (groupSetMatch) {
    const id = Number(groupSetMatch[1]);
    const item = previewGroupSets.find(groupSet => groupSet.id === id);
    if (request.method === 'GET') {
      if (!item) send(response, 404, null, 'NOT_FOUND', 'Group set not found');
      else send(response, 200, groupSetForViewer(item));
      return;
    }
    if (request.method === 'PATCH') {
      const body = await readBody(request);
      previewGroupSets = previewGroupSets.map(groupSet => groupSet.id === id ? {
        ...groupSet,
        ...(body.name !== undefined ? {name: body.name} : {}),
        ...(body.defaultCapacity !== undefined ? {defaultCapacity: body.defaultCapacity} : {}),
        joinOpensAtLocal: body.clearJoinOpensAt ? null : body.joinOpensAt ?? groupSet.joinOpensAtLocal,
        joinClosesAtLocal: body.clearJoinClosesAt ? null : body.joinClosesAt ?? groupSet.joinClosesAtLocal,
        ...(body.locked !== undefined ? {locked: body.locked, openForSelfService: !body.locked} : {}),
      } : groupSet);
      send(response, 200, previewGroupSets.find(groupSet => groupSet.id === id));
      return;
    }
    if (request.method === 'DELETE') {
      previewGroupSets = previewGroupSets.filter(groupSet => groupSet.id !== id);
      send(response, 200, null);
      return;
    }
  }

  const groupCollectionMatch = url.pathname.match(/^\/api\/v2\/courses\/4\/group-sets\/(\d+)\/groups$/);
  if (groupCollectionMatch && request.method === 'POST') {
    const setId = Number(groupCollectionMatch[1]);
    const body = await readBody(request);
    const set = previewGroupSets.find(item => item.id === setId);
    const created = {id: nextGroupId++, groupSetId: setId, name: body.name, capacity: body.capacityOverride ?? set?.defaultCapacity ?? null, capacityOverride: body.capacityOverride ?? null, memberCount: 0, members: []};
    set?.groups.push(created);
    send(response, 200, created);
    return;
  }
  const groupBatchMatch = url.pathname.match(/^\/api\/v2\/courses\/4\/group-sets\/(\d+)\/groups\/batch$/);
  if (groupBatchMatch && request.method === 'POST') {
    const setId = Number(groupBatchMatch[1]);
    const body = await readBody(request);
    const set = previewGroupSets.find(item => item.id === setId);
    const created = Array.from({length: Number(body.count) || 0}, (_, index) => ({id: nextGroupId++, groupSetId: setId, name: `${body.namePrefix} ${index + 1}`, capacity: set?.defaultCapacity ?? null, capacityOverride: null, memberCount: 0, members: []}));
    set?.groups.push(...created);
    send(response, 200, created);
    return;
  }
  const groupMatch = url.pathname.match(/^\/api\/v2\/courses\/4\/group-sets\/(\d+)\/groups\/(\d+)$/);
  if (groupMatch) {
    const set = previewGroupSets.find(item => item.id === Number(groupMatch[1]));
    const groupId = Number(groupMatch[2]);
    if (request.method === 'PATCH') {
      const body = await readBody(request);
      set.groups = set.groups.map(group => group.id === groupId ? {...group, ...(body.name ? {name: body.name} : {}), capacityOverride: body.clearCapacityOverride ? null : body.capacityOverride ?? group.capacityOverride, capacity: body.clearCapacityOverride ? set.defaultCapacity : body.capacityOverride ?? group.capacity} : group);
      send(response, 200, set.groups.find(group => group.id === groupId));
      return;
    }
    if (request.method === 'DELETE') {
      set.groups = set.groups.filter(group => group.id !== groupId);
      send(response, 200, null);
      return;
    }
  }

  const joinLeaveMatch = url.pathname.match(/^\/api\/v2\/courses\/4\/group-sets\/(\d+)\/groups\/(\d+)\/(join|leave)$/);
  if (joinLeaveMatch && request.method === 'POST') {
    const set = previewGroupSets.find(item => item.id === Number(joinLeaveMatch[1]));
    const group = set?.groups.find(item => item.id === Number(joinLeaveMatch[2]));
    const existingGroup = set?.groups.find(item => item.members.some(member => member.userId === 8));
    if (existingGroup) {
      existingGroup.members = existingGroup.members.filter(member => member.userId !== 8);
      existingGroup.memberCount = existingGroup.members.length;
    }
    if (joinLeaveMatch[3] === 'join' && group) {
      const membership = {groupId: group.id, userId: 8, displayName: 'Demo Student', joinedAt: now(), addedByType: 'SELF', addedByUserId: 8};
      group.members.push(membership);
      group.memberCount = group.members.length;
      set.myGroup = membership;
      send(response, 200, {membership, group, groups: set.groups});
    } else {
      set.myGroup = null;
      send(response, 200, {membership: null, group, groups: set?.groups || []});
    }
    return;
  }
  const switchMatch = url.pathname.match(/^\/api\/v2\/courses\/4\/group-sets\/(\d+)\/switch$/);
  if (switchMatch && request.method === 'POST') {
    const body = await readBody(request);
    const set = previewGroupSets.find(item => item.id === Number(switchMatch[1]));
    const source = set?.groups.find(group => group.members.some(member => member.userId === 8));
    if (source) { source.members = source.members.filter(member => member.userId !== 8); source.memberCount = source.members.length; }
    const target = set?.groups.find(group => group.id === Number(body.targetGroupId));
    const membership = {groupId: target.id, userId: 8, displayName: 'Demo Student', joinedAt: now(), addedByType: 'SELF', addedByUserId: 8};
    target.members.push(membership); target.memberCount = target.members.length; set.myGroup = membership;
    send(response, 200, {membership, group: target, groups: set.groups});
    return;
  }
  const ungroupedMatch = url.pathname.match(/^\/api\/v2\/courses\/4\/group-sets\/(\d+)\/ungrouped-students$/);
  if (ungroupedMatch && request.method === 'GET') {
    const set = previewGroupSets.find(item => item.id === Number(ungroupedMatch[1]));
    const grouped = new Set(set?.groups.flatMap(group => group.members.map(member => member.userId)) || []);
    send(response, 200, previewStudents.filter(student => !grouped.has(student.userId)).map(student => ({userId: student.userId, displayName: student.userName})));
    return;
  }
  const assignMatch = url.pathname.match(/^\/api\/v2\/courses\/4\/group-sets\/(\d+)\/groups\/(\d+)\/members$/);
  if (assignMatch && request.method === 'POST') {
    const body = await readBody(request);
    const set = previewGroupSets.find(item => item.id === Number(assignMatch[1]));
    const group = set?.groups.find(item => item.id === Number(assignMatch[2]));
    const student = previewStudents.find(item => item.userId === Number(body.userId));
    const membership = {groupId: group.id, userId: student.userId, displayName: student.userName, joinedAt: now(), addedByType: 'STAFF', addedByUserId: 7};
    group.members.push(membership); group.memberCount = group.members.length;
    send(response, 200, {membership, group, groups: set.groups});
    return;
  }
  const moveMatch = url.pathname.match(/^\/api\/v2\/courses\/4\/group-sets\/(\d+)\/members\/(\d+)\/move$/);
  if (moveMatch && request.method === 'POST') {
    const body = await readBody(request);
    const set = previewGroupSets.find(item => item.id === Number(moveMatch[1]));
    const userId = Number(moveMatch[2]);
    const source = set?.groups.find(group => group.members.some(member => member.userId === userId));
    const existing = source?.members.find(member => member.userId === userId);
    if (source) { source.members = source.members.filter(member => member.userId !== userId); source.memberCount = source.members.length; }
    const target = set?.groups.find(group => group.id === Number(body.targetGroupId));
    const membership = {...existing, groupId: target.id, joinedAt: now(), addedByType: 'STAFF', addedByUserId: 7};
    target.members.push(membership); target.memberCount = target.members.length;
    send(response, 200, {membership, group: target, groups: set.groups});
    return;
  }
  const removeMemberMatch = url.pathname.match(/^\/api\/v2\/courses\/4\/group-sets\/(\d+)\/groups\/(\d+)\/members\/(\d+)$/);
  if (removeMemberMatch && request.method === 'DELETE') {
    const set = previewGroupSets.find(item => item.id === Number(removeMemberMatch[1]));
    const group = set?.groups.find(item => item.id === Number(removeMemberMatch[2]));
    group.members = group.members.filter(member => member.userId !== Number(removeMemberMatch[3]));
    group.memberCount = group.members.length;
    send(response, 200, {membership: null, group, groups: set.groups});
    return;
  }
  const distributeMatch = url.pathname.match(/^\/api\/v2\/courses\/4\/group-sets\/(\d+)\/distribute-random$/);
  if (distributeMatch && request.method === 'POST') {
    const set = previewGroupSets.find(item => item.id === Number(distributeMatch[1]));
    const grouped = new Set(set?.groups.flatMap(group => group.members.map(member => member.userId)) || []);
    const assigned = [];
    previewStudents.filter(student => !grouped.has(student.userId)).forEach((student, index) => {
      const group = set.groups[index % set.groups.length];
      const membership = {groupId: group.id, userId: student.userId, displayName: student.userName, joinedAt: now(), addedByType: 'RANDOM', addedByUserId: 7};
      group.members.push(membership); group.memberCount = group.members.length; assigned.push(membership);
    });
    send(response, 200, assigned);
    return;
  }

  if (url.pathname === '/api/v2/courses/4/members' && request.method === 'GET') {
    const query = (url.searchParams.get('q') || '').toLowerCase();
    const role = url.searchParams.get('courseRole');
    const active = url.searchParams.get('active');
    const page = Number(url.searchParams.get('page') || 0);
    const size = Number(url.searchParams.get('size') || 20);
    const filtered = previewStudents.filter(student => (
      (!query || `${student.userName} ${student.userEmail}`.toLowerCase().includes(query))
      && (!role || student.courseRole === role)
      && (active === null || student.active === (active === 'true'))
    ));
    send(response, 200, {items: filtered.slice(page * size, page * size + size), page, size, total: filtered.length});
    return;
  }

  if (url.pathname === '/api/v2/courses/4/students/batch' && request.method === 'POST') {
    const body = await readBody(request);
    const items = (body.emails || []).map((email, index) => {
      const existing = previewStudents.find(student => student.userEmail.toLowerCase() === String(email).toLowerCase());
      if (existing) return {userId: existing.userId, status: 'SUCCESS', errorType: null, message: 'Already enrolled', member: existing};
      const member = {id: 200 + index, courseId: 4, userId: 200 + index, userName: String(email).split('@')[0], userEmail: email, courseRole: 'Student', active: true, level: 'STUDENT', assignmentSubmitFrozen: false};
      previewStudents.push(member);
      return {userId: member.userId, status: 'SUCCESS', errorType: null, message: null, member};
    });
    send(response, 200, {requestedCount: items.length, successCount: items.length, failureCount: 0, items});
    return;
  }

  if (url.pathname === '/api/v2/courses/4/tas' && request.method === 'POST') {
    const body = await readBody(request);
    previewStudents = previewStudents.map(student => student.userId === Number(body.userId) ? {...student, courseRole: 'TA', assignmentSubmitFrozen: true} : student);
    send(response, 200, previewStudents.find(student => student.userId === Number(body.userId)));
    return;
  }

  const taMatch = url.pathname.match(/^\/api\/v2\/courses\/4\/tas\/(\d+)$/);
  if (taMatch && request.method === 'DELETE') {
    const userId = Number(taMatch[1]);
    previewStudents = previewStudents.map(student => student.userId === userId ? {...student, courseRole: 'Student'} : student);
    send(response, 200, previewStudents.find(student => student.userId === userId));
    return;
  }

  const studentMatch = url.pathname.match(/^\/api\/v2\/courses\/4\/students\/(\d+)$/);
  if (studentMatch && request.method === 'DELETE') {
    const userId = Number(studentMatch[1]);
    previewStudents = previewStudents.map(student => student.userId === userId ? {...student, active: false, withdrawnAt: now()} : student);
    send(response, 200, previewStudents.find(student => student.userId === userId));
    return;
  }

  if (request.method === 'GET' && url.pathname === '/api/v2/courses/4/my-grades') {
    send(response, 200, previewMyGrades);
    return;
  }

  if (request.method === 'GET' && url.pathname === '/api/v2/courses/4/assignments/summaries') {
    send(response, 200, [{
      id: 9,
      title: assignment.title,
      dueAtUtc: assignment.dueAtUtc,
      dueAtLocal: assignment.dueAtLocal,
      timezone: assignment.timezone,
      submissionType: assignment.submissionType,
    }]);
    return;
  }

  if (url.pathname === '/api/v2/courses/4/quizzes' && request.method === 'GET') {
    const isInstructor = request.headers.authorization === 'Bearer local-instructor-token';
    send(response, 200, previewQuizzes.filter(quiz => isInstructor || quiz.state === 'Published').map(withQuizWindow));
    return;
  }

  if (url.pathname === '/api/v2/courses/4/quizzes' && request.method === 'POST') {
    const body = await readBody(request);
    const created = {
      id: nextQuizId++, courseId: 4, title: body.title, instructions: body.instructions || null,
      opensAtUtc: new Date(body.opensAt).toISOString(), opensAtLocal: body.opensAt,
      closesAtUtc: new Date(body.closesAt).toISOString(), closesAtLocal: body.closesAt,
      timezone: 'America/Los_Angeles', timeLimitSeconds: body.timeLimitSeconds ?? null,
      attemptsAllowed: body.attemptsAllowed ?? 1, resultVisibility: body.resultVisibility || 'AfterRelease',
      state: 'Draft', version: 1, totalPoints: 0, questionCount: 0, hasAttempts: false,
      createdAt: now(), updatedAt: now(),
    };
    previewQuizzes.push(created);
    quizQuestions.set(created.id, []);
    send(response, 200, withQuizWindow(created));
    return;
  }

  const quizMatch = url.pathname.match(/^\/api\/v2\/courses\/4\/quizzes\/(\d+)$/);
  if (quizMatch && request.method === 'GET') {
    const quiz = previewQuizzes.find(item => item.id === Number(quizMatch[1]));
    if (!quiz) send(response, 404, null, 'QUIZ_NOT_FOUND', 'Quiz not found');
    else send(response, 200, withQuizWindow(quiz));
    return;
  }
  if (quizMatch && request.method === 'PATCH') {
    const quizId = Number(quizMatch[1]);
    const body = await readBody(request);
    previewQuizzes = previewQuizzes.map(quiz => quiz.id === quizId ? {
      ...quiz,
      ...Object.fromEntries(Object.entries(body).filter(([key, value]) => key !== 'expectedVersion' && value !== undefined)),
      opensAtLocal: body.opensAt ?? quiz.opensAtLocal,
      opensAtUtc: body.opensAt ? new Date(body.opensAt).toISOString() : quiz.opensAtUtc,
      closesAtLocal: body.closesAt ?? quiz.closesAtLocal,
      closesAtUtc: body.closesAt ? new Date(body.closesAt).toISOString() : quiz.closesAtUtc,
      version: quiz.version + 1,
      updatedAt: now(),
    } : quiz);
    send(response, 200, withQuizWindow(previewQuizzes.find(quiz => quiz.id === quizId)));
    return;
  }
  if (quizMatch && request.method === 'DELETE') {
    const quizId = Number(quizMatch[1]);
    previewQuizzes = previewQuizzes.filter(quiz => quiz.id !== quizId);
    quizQuestions.delete(quizId);
    send(response, 200, null);
    return;
  }

  const quizStateMatch = url.pathname.match(/^\/api\/v2\/courses\/4\/quizzes\/(\d+)\/(publish|unpublish)$/);
  if (quizStateMatch && request.method === 'POST') {
    const quizId = Number(quizStateMatch[1]);
    const state = quizStateMatch[2] === 'publish' ? 'Published' : 'Draft';
    previewQuizzes = previewQuizzes.map(quiz => quiz.id === quizId
      ? {...quiz, state, version: quiz.version + 1, updatedAt: now()}
      : quiz);
    send(response, 200, withQuizWindow(previewQuizzes.find(quiz => quiz.id === quizId)));
    return;
  }

  const quizQuestionsMatch = url.pathname.match(/^\/api\/v2\/courses\/4\/quizzes\/(\d+)\/questions$/);
  if (quizQuestionsMatch && request.method === 'GET') {
    const quizId = Number(quizQuestionsMatch[1]);
    const isInstructor = request.headers.authorization === 'Bearer local-instructor-token';
    const questions = (quizQuestions.get(quizId) || []).map(question => isInstructor
      ? question
      : {
          id: question.id, quizId: question.quizId, type: question.type, stem: question.stem,
          points: question.points, position: question.position,
          options: question.options.map(({id, label, position}) => ({id, label, position})),
        });
    send(response, 200, questions);
    return;
  }
  if (quizQuestionsMatch && request.method === 'POST') {
    const quizId = Number(quizQuestionsMatch[1]);
    const body = await readBody(request);
    const current = quizQuestions.get(quizId) || [];
    const questionId = nextQuestionId++;
    const created = {
      id: questionId, quizId, type: body.type, stem: body.stem, points: Number(body.points),
      position: current.length + 1, version: 1,
      options: (body.options || []).map((option, index) => ({
        id: questionId * 10 + index + 1, label: option.label,
        isCorrect: Boolean(option.isCorrect), position: option.position ?? index + 1,
      })),
    };
    quizQuestions.set(quizId, [...current, created]);
    refreshQuizTotals(quizId);
    send(response, 200, created);
    return;
  }

  const quizQuestionOrderMatch = url.pathname.match(/^\/api\/v2\/courses\/4\/quizzes\/(\d+)\/questions\/order$/);
  if (quizQuestionOrderMatch && request.method === 'PUT') {
    const quizId = Number(quizQuestionOrderMatch[1]);
    const body = await readBody(request);
    const byId = new Map((quizQuestions.get(quizId) || []).map(question => [question.id, question]));
    const ordered = (body.questionIds || []).map((id, index) => ({...byId.get(id), position: index + 1})).filter(Boolean);
    quizQuestions.set(quizId, ordered);
    send(response, 200, ordered);
    return;
  }

  const quizQuestionMatch = url.pathname.match(/^\/api\/v2\/courses\/4\/quizzes\/(\d+)\/questions\/(\d+)$/);
  if (quizQuestionMatch && request.method === 'PATCH') {
    const quizId = Number(quizQuestionMatch[1]);
    const questionId = Number(quizQuestionMatch[2]);
    const body = await readBody(request);
    quizQuestions.set(quizId, (quizQuestions.get(quizId) || []).map(question => question.id === questionId ? {
      ...question,
      ...(body.stem !== undefined ? {stem: body.stem} : {}),
      ...(body.points !== undefined ? {points: Number(body.points)} : {}),
      ...(body.options !== undefined ? {options: body.options.map((option, index) => ({id: option.id ?? questionId * 10 + index + 1, label: option.label, isCorrect: Boolean(option.isCorrect), position: index + 1}))} : {}),
      version: question.version + 1,
    } : question));
    refreshQuizTotals(quizId);
    send(response, 200, (quizQuestions.get(quizId) || []).find(question => question.id === questionId));
    return;
  }
  if (quizQuestionMatch && request.method === 'DELETE') {
    const quizId = Number(quizQuestionMatch[1]);
    const questionId = Number(quizQuestionMatch[2]);
    quizQuestions.set(quizId, (quizQuestions.get(quizId) || [])
      .filter(question => question.id !== questionId)
      .map((question, index) => ({...question, position: index + 1})));
    refreshQuizTotals(quizId);
    send(response, 200, null);
    return;
  }

  const currentAttemptMatch = url.pathname.match(/^\/api\/v2\/courses\/4\/quizzes\/(\d+)\/attempts\/current$/);
  if (currentAttemptMatch && request.method === 'GET') {
    if (!previewQuizAttempt || previewQuizAttempt.status !== 'InProgress') {
      send(response, 404, null, 'QUIZ_ATTEMPT_NOT_FOUND', 'No in-progress attempt');
    } else send(response, 200, previewQuizAttempt);
    return;
  }

  const startAttemptMatch = url.pathname.match(/^\/api\/v2\/courses\/4\/quizzes\/(\d+)\/attempts$/);
  if (startAttemptMatch && request.method === 'GET') {
    const requestedUserId = Number(url.searchParams.get('userId'));
    const attempts = [
      ...previewQuizAttemptHistory,
      ...(previewQuizAttempt?.status === 'InProgress' ? [previewQuizAttempt] : []),
    ].filter(attempt => !requestedUserId || attempt.userId === requestedUserId);
    send(response, 200, attempts.map(attempt => ({
      id: attempt.id,
      attemptNumber: attempt.attemptNumber,
      status: attempt.status,
      closeReason: attempt.closeReason,
      startedAt: attempt.startedAt,
      submittedAt: attempt.submittedAt,
      receiptId: attempt.receiptId,
    })));
    return;
  }
  if (startAttemptMatch && request.method === 'POST') {
    const quizId = Number(startAttemptMatch[1]);
    const startedAt = now();
    const attemptNumber = previewQuizAttemptHistory.length + 1;
    previewQuizAttempt = {
      id: 200 + attemptNumber, quizId, userId: 8, attemptNumber, status: 'InProgress', closeReason: null,
      receiptId: null, startedAt, deadlineAt: new Date(Date.now() + 30 * 60_000).toISOString(),
      submittedAt: null, serverNowUtc: startedAt, autoScore: null, manualScore: null,
      totalScore: null, manualGradingComplete: false, answers: [],
    };
    previewQuizReleased = false;
    previewShortAnswerGrade = null;
    previewShortAnswerFeedback = null;
    previewQuizzes = previewQuizzes.map(quiz => quiz.id === quizId ? {...quiz, hasAttempts: true} : quiz);
    send(response, 200, previewQuizAttempt);
    return;
  }

  const autosaveMatch = url.pathname.match(/^\/api\/v2\/courses\/4\/quizzes\/(\d+)\/attempts\/(\d+)\/answers\/(\d+)$/);
  if (autosaveMatch && request.method === 'PUT') {
    const questionId = Number(autosaveMatch[3]);
    const body = await readBody(request);
    const existing = previewQuizAttempt?.answers.find(answer => answer.questionId === questionId);
    const answer = {
      questionId, selectedOptionIds: body.selectedOptionIds || [], textAnswer: body.textAnswer ?? null,
      revision: (existing?.revision || 0) + 1, savedAt: now(),
    };
    previewQuizAttempt = {
      ...previewQuizAttempt,
      answers: [...(previewQuizAttempt?.answers || []).filter(item => item.questionId !== questionId), answer],
    };
    send(response, 200, {
      attemptId: previewQuizAttempt.id, questionId, revision: answer.revision,
      savedAtUtc: answer.savedAt, serverNowUtc: now(), deadlineAtUtc: previewQuizAttempt.deadlineAt,
    });
    return;
  }

  const submitAttemptMatch = url.pathname.match(/^\/api\/v2\/courses\/4\/quizzes\/(\d+)\/attempts\/(\d+)\/submit$/);
  if (submitAttemptMatch && request.method === 'POST') {
    const submittedAt = now();
    previewQuizAttempt = {
      ...previewQuizAttempt, status: 'Submitted', submittedAt, receiptId: 'QUIZ-DEMO-201',
      autoScore: 5, totalScore: null, manualGradingComplete: false,
    };
    previewQuizAttemptHistory = [
      ...previewQuizAttemptHistory.filter(attempt => attempt.id !== previewQuizAttempt.id),
      previewQuizAttempt,
    ].sort((left, right) => left.attemptNumber - right.attemptNumber);
    send(response, 200, {attemptId: previewQuizAttempt.id, receiptId: previewQuizAttempt.receiptId, submittedAt});
    return;
  }

  const myResultMatch = url.pathname.match(/^\/api\/v2\/courses\/4\/quizzes\/(\d+)\/my-result$/);
  if (myResultMatch && request.method === 'GET') {
    const countedAttempt = latestSubmittedQuizAttempt();
    if (!countedAttempt) {
      send(response, 404, null, 'NOT_FOUND', 'No counted result');
      return;
    }
    const totalScore = previewShortAnswerGrade === null ? null : 5 + previewShortAnswerGrade;
    send(response, 200, {
      quizId: Number(myResultMatch[1]), countedAttemptId: countedAttempt.id,
      gradeStatus: previewQuizReleased ? 'Released' : 'Entered', closeReason: null,
      receiptId: countedAttempt.receiptId, autoScore: 5, manualScore: previewShortAnswerGrade,
      totalScore, manualGradingPending: previewShortAnswerGrade === null,
      showCorrectAnswers: previewQuizReleased,
      questions: (quizQuestions.get(Number(myResultMatch[1])) || []).map(question => ({
        questionId: question.id, type: question.type, points: question.points,
        score: question.type === 'ShortAnswer' ? previewShortAnswerGrade : question.points,
        selectedOptionIds: countedAttempt.answers.find(answer => answer.questionId === question.id)?.selectedOptionIds || [],
        textAnswer: countedAttempt.answers.find(answer => answer.questionId === question.id)?.textAnswer || null,
        correctOptionIds: previewQuizReleased ? question.options.filter(option => option.isCorrect).map(option => option.id) : undefined,
      })),
    });
    return;
  }

  const attemptResultMatch = url.pathname.match(/^\/api\/v2\/courses\/4\/quizzes\/(\d+)\/attempts\/(\d+)\/result$/);
  if (attemptResultMatch && request.method === 'GET') {
    const resultAttempt = previewQuizAttemptHistory.find(attempt => attempt.id === Number(attemptResultMatch[2]));
    if (!resultAttempt) {
      send(response, 404, null, 'NOT_FOUND', 'Attempt result not found');
      return;
    }
    const totalScore = previewShortAnswerGrade === null ? null : 5 + previewShortAnswerGrade;
    send(response, 200, {
      quizId: Number(attemptResultMatch[1]), countedAttemptId: resultAttempt.id,
      gradeStatus: previewQuizReleased ? 'Released' : 'Entered', closeReason: null,
      receiptId: resultAttempt.receiptId, autoScore: 5, manualScore: previewShortAnswerGrade,
      totalScore, manualGradingPending: previewShortAnswerGrade === null,
      showCorrectAnswers: previewQuizReleased, questions: [],
    });
    return;
  }

  const gradingSummaryMatch = url.pathname.match(/^\/api\/v2\/courses\/4\/quizzes\/(\d+)\/grading-summary$/);
  if (gradingSummaryMatch && request.method === 'GET') {
    const submitted = Boolean(latestSubmittedQuizAttempt());
    send(response, 200, {
      pendingShortAnswerCount: submitted && previewShortAnswerGrade === null ? 1 : 0,
      submittedAttemptCount: submitted ? 1 : 0,
      releasedUserCount: previewQuizReleased ? 1 : 0,
      manualIncompleteAttemptCount: submitted && previewShortAnswerGrade === null ? 1 : 0,
    });
    return;
  }

  const shortAnswersMatch = url.pathname.match(/^\/api\/v2\/courses\/4\/quizzes\/(\d+)\/grading\/questions\/(\d+)\/answers$/);
  if (shortAnswersMatch && request.method === 'GET') {
    const questionId = Number(shortAnswersMatch[2]);
    const submittedAttempt = latestSubmittedQuizAttempt();
    const answer = submittedAttempt?.answers.find(item => item.questionId === questionId);
    send(response, 200, submittedAttempt ? [{
      attemptId: submittedAttempt.id, userId: submittedAttempt.userId, questionId,
      textAnswer: answer?.textAnswer || null, score: previewShortAnswerGrade,
      pendingManual: previewShortAnswerGrade === null, feedback: previewShortAnswerFeedback,
    }] : []);
    return;
  }

  const gradeAnswerMatch = url.pathname.match(/^\/api\/v2\/courses\/4\/quizzes\/(\d+)\/attempts\/(\d+)\/answers\/(\d+)\/grade$/);
  if (gradeAnswerMatch && request.method === 'PUT') {
    const body = await readBody(request);
    const questionId = Number(gradeAnswerMatch[3]);
    const submittedAttempt = latestSubmittedQuizAttempt();
    previewShortAnswerGrade = Number(body.score);
    previewShortAnswerFeedback = body.feedback || null;
    send(response, 200, {
      attemptId: submittedAttempt.id, userId: submittedAttempt.userId, questionId,
      textAnswer: submittedAttempt.answers.find(item => item.questionId === questionId)?.textAnswer || null,
      score: previewShortAnswerGrade, pendingManual: false, feedback: previewShortAnswerFeedback,
    });
    return;
  }

  const gradeReleaseMatch = url.pathname.match(/^\/api\/v2\/courses\/4\/quizzes\/(\d+)\/grades\/(release|retract)$/);
  if (gradeReleaseMatch && request.method === 'POST') {
    await readBody(request);
    previewQuizReleased = gradeReleaseMatch[2] === 'release';
    send(response, 200, null);
    return;
  }

  if (request.method === 'POST' && url.pathname === '/api/v2/courses/4/weeks') {
    const body = await readBody(request);
    const created = {
      id: nextWeekId++,
      courseId: 4,
      title: body.title || 'Untitled week',
      orderPosition: previewWeeks.length,
      state: 'Draft',
      materials: [],
      createdAt: now(),
      updatedAt: now(),
    };
    previewWeeks.push(created);
    send(response, 200, created);
    return;
  }

  if (request.method === 'PUT' && url.pathname === '/api/v2/courses/4/weeks/reorder') {
    const body = await readBody(request);
    const byId = new Map(previewWeeks.map(week => [week.id, week]));
    previewWeeks = (body.weekIds || []).map(id => byId.get(id)).filter(Boolean);
    normalizePreviewOrder();
    send(response, 200, previewWeeks);
    return;
  }

  const weekMatch = url.pathname.match(/^\/api\/v2\/courses\/4\/weeks\/(\d+)$/);
  if (weekMatch && request.method === 'PATCH') {
    const weekId = Number(weekMatch[1]);
    const body = await readBody(request);
    previewWeeks = previewWeeks.map(week => week.id === weekId
      ? {...week, title: body.title || week.title, updatedAt: now()}
      : week);
    send(response, 200, previewWeeks.find(week => week.id === weekId));
    return;
  }
  if (weekMatch && request.method === 'DELETE') {
    const weekId = Number(weekMatch[1]);
    const week = previewWeeks.find(item => item.id === weekId);
    if (week?.materials.length) {
      send(response, 409, null, 'WEEK_NOT_EMPTY', 'Delete the materials first');
      return;
    }
    previewWeeks = previewWeeks.filter(item => item.id !== weekId);
    normalizePreviewOrder();
    send(response, 200, null);
    return;
  }

  const weekStateMatch = url.pathname.match(/^\/api\/v2\/courses\/4\/weeks\/(\d+)\/(publish|unpublish)$/);
  if (weekStateMatch && request.method === 'POST') {
    const weekId = Number(weekStateMatch[1]);
    const state = weekStateMatch[2] === 'publish' ? 'Published' : 'Draft';
    previewWeeks = previewWeeks.map(week => week.id === weekId ? {...week, state, updatedAt: now()} : week);
    send(response, 200, previewWeeks.find(week => week.id === weekId));
    return;
  }

  const materialsMatch = url.pathname.match(/^\/api\/v2\/courses\/4\/weeks\/(\d+)\/materials$/);
  if (materialsMatch && request.method === 'POST') {
    const weekId = Number(materialsMatch[1]);
    const raw = (await readRawBody(request)).toString('utf8');
    const linkUrl = multipartField(raw, 'linkUrl');
    const linkDisplayName = multipartField(raw, 'linkDisplayName');
    const filenames = multipartFilenames(raw);
    const created = [];
    for (const filename of filenames) {
      const materialId = nextMaterialId++;
      created.push({
        id: materialId, weekId, courseId: 4, materialType: 'FILE', displayName: filename,
        orderPosition: 0, originalFilename: filename, contentType: 'text/plain',
        extension: filename.includes('.') ? filename.split('.').pop() : null, sizeBytes: 1024,
        linkUrl: null, uploadedBy: 7, previewAvailable: true,
        downloadUrl: `/api/v2/courses/4/weeks/${weekId}/materials/${materialId}/download`,
      });
    }
    if (linkUrl) {
      created.push({
        id: nextMaterialId++, weekId, courseId: 4, materialType: 'LINK',
        displayName: linkDisplayName || linkUrl, orderPosition: 0, originalFilename: null,
        contentType: null, extension: null, sizeBytes: null, linkUrl, uploadedBy: 7,
        previewAvailable: false, downloadUrl: '#',
      });
    }
    previewWeeks = previewWeeks.map(week => week.id === weekId
      ? {...week, materials: [...week.materials, ...created]}
      : week);
    normalizePreviewOrder();
    send(response, 200, created);
    return;
  }

  const materialBytesMatch = url.pathname.match(
    /^\/api\/v2\/courses\/4\/weeks\/(\d+)\/materials\/(\d+)\/(preview|download)$/,
  );
  if (materialBytesMatch && request.method === 'GET') {
    const weekId = Number(materialBytesMatch[1]);
    const materialId = Number(materialBytesMatch[2]);
    const action = materialBytesMatch[3];
    const material = previewWeeks
      .find(week => week.id === weekId)
      ?.materials.find(item => item.id === materialId && item.materialType === 'FILE');

    if (!material) {
      send(response, 404, null, 'OBJECT_NOT_FOUND', 'Object is not present in S3');
      return;
    }

    sendMaterialBytes(response, material, action);
    return;
  }

  const materialMatch = url.pathname.match(/^\/api\/v2\/courses\/4\/weeks\/(\d+)\/materials\/(\d+)$/);
  if (materialMatch && request.method === 'PATCH') {
    const weekId = Number(materialMatch[1]);
    const materialId = Number(materialMatch[2]);
    const body = await readBody(request);
    previewWeeks = previewWeeks.map(week => week.id === weekId
      ? {...week, materials: week.materials.map(material => material.id === materialId
        ? {...material, displayName: body.displayName || material.displayName}
        : material)}
      : week);
    send(response, 200, previewWeeks.find(week => week.id === weekId)?.materials.find(item => item.id === materialId));
    return;
  }
  if (materialMatch && request.method === 'DELETE') {
    const weekId = Number(materialMatch[1]);
    const materialId = Number(materialMatch[2]);
    previewWeeks = previewWeeks.map(week => week.id === weekId
      ? {...week, materials: week.materials.filter(material => material.id !== materialId)}
      : week);
    normalizePreviewOrder();
    send(response, 200, null);
    return;
  }

  const materialMoveMatch = url.pathname.match(/^\/api\/v2\/courses\/4\/weeks\/(\d+)\/materials\/(\d+)\/move$/);
  if (materialMoveMatch && request.method === 'POST') {
    const sourceWeekId = Number(materialMoveMatch[1]);
    const materialId = Number(materialMoveMatch[2]);
    const body = await readBody(request);
    const material = previewWeeks.find(week => week.id === sourceWeekId)?.materials.find(item => item.id === materialId);
    previewWeeks = previewWeeks.map(week => {
      if (week.id === sourceWeekId) return {...week, materials: week.materials.filter(item => item.id !== materialId)};
      if (week.id === body.targetWeekId && material) return {...week, materials: [...week.materials, {...material, weekId: week.id}]};
      return week;
    });
    normalizePreviewOrder();
    send(response, 200, material ? {...material, weekId: body.targetWeekId} : null);
    return;
  }

  const materialReorderMatch = url.pathname.match(/^\/api\/v2\/courses\/4\/weeks\/(\d+)\/materials\/reorder$/);
  if (materialReorderMatch && request.method === 'PUT') {
    const weekId = Number(materialReorderMatch[1]);
    const body = await readBody(request);
    previewWeeks = previewWeeks.map(week => {
      if (week.id !== weekId) return week;
      const byId = new Map(week.materials.map(material => [material.id, material]));
      return {...week, materials: (body.materialIds || []).map(id => byId.get(id)).filter(Boolean)};
    });
    normalizePreviewOrder();
    send(response, 200, previewWeeks.find(week => week.id === weekId)?.materials || []);
    return;
  }

  if (request.method === 'GET' && url.pathname === '/api/v2/courses/4/assignments/9') {
    const isInstructor = request.headers.authorization === 'Bearer local-instructor-token';
    send(response, 200, isInstructor ? staffAssignment : studentAssignment);
    return;
  }

  const assignmentAttachmentMatch = url.pathname.match(
    /^\/api\/v2\/courses\/4\/assignments\/9\/attachments\/33\/(preview|download)$/,
  );
  if (request.method === 'GET' && assignmentAttachmentMatch) {
    sendFileBytes(response, {
      filename: 'Lab instructions.pdf',
      contentType: 'application/pdf',
      action: assignmentAttachmentMatch[1],
      label: 'Assignment instructor attachment',
    });
    return;
  }

  if (request.method === 'GET' && url.pathname === '/api/v2/courses/4/assignments/9/rubric') {
    send(response, 200, {
      posted: true,
      assignmentId: 9,
      versionId: 41,
      versionNo: 1,
      originalName: 'Lab rubric.pdf',
      contentType: 'application/pdf',
      sizeBytes: 2048,
      totalVersions: 1,
      canRestorePrevious: false,
      previewUrl: '/api/v2/courses/4/assignments/9/rubric/preview',
      downloadUrl: '/api/v2/courses/4/assignments/9/rubric/download',
    });
    return;
  }

  const rubricFileMatch = url.pathname.match(
    /^\/api\/v2\/courses\/4\/assignments\/9\/rubric\/(preview|download)$/,
  );
  if (request.method === 'GET' && rubricFileMatch) {
    sendFileBytes(response, {
      filename: 'Lab rubric.pdf',
      contentType: 'application/pdf',
      action: rubricFileMatch[1],
      label: 'Assignment grading rubric',
    });
    return;
  }

  if (request.method === 'GET' && url.pathname === '/api/v2/courses/4/assignments/37') {
    send(response, 200, closedStudentAssignment);
    return;
  }

  if (request.method === 'GET' && url.pathname === '/api/v2/courses/4/assignments/9/grading-roster') {
    send(response, 200, gradingRoster);
    return;
  }

  if (request.method === 'GET' && url.pathname === '/api/v2/courses/4/assignments/9/submissions/21/versions') {
    send(response, 200, [{
      id: 31,
      submissionId: 21,
      assignmentId: 9,
      ownerUserId: 8,
      versionNo: 1,
      submittedAt: '2026-09-14T18:00:00Z',
      usedGraceBuffer: false,
      submissionStatus: 'Submitted',
      fileCount: 1,
      receiptIssuedAt: '2026-09-14T18:00:00Z',
      files: [{
        id: 301,
        submissionVersionId: 31,
        originalName: 'cell-lab-report.pdf',
        contentType: 'application/pdf',
        sizeBytes: 24800,
        checksumSha256: 'preview',
        sortOrder: 0,
        previewAvailable: true,
        downloadUrl: '/api/v2/courses/4/assignments/9/submissions/21/files/301/download',
        previewUrl: '/api/v2/courses/4/assignments/9/submissions/21/files/301/preview',
        createdAt: '2026-09-14T18:00:00Z',
      }],
    }]);
    return;
  }
  const submissionFileMatch = url.pathname.match(/^\/api\/v2\/courses\/4\/assignments\/9\/submissions\/21\/files\/301\/(preview|download)$/);
  if (request.method === 'GET' && submissionFileMatch) {
    sendFileBytes(response, {
      filename: 'cell-lab-report.pdf',
      contentType: 'application/pdf',
      action: submissionFileMatch[1],
      label: 'Student submission file',
    });
    return;
  }

  if (request.method === 'GET' && url.pathname === '/api/v2/me/notifications/unread-count') {
    send(response, 200, {unreadCount: notifications.filter(item => !item.readAt).length});
    return;
  }

  if (request.method === 'GET' && url.pathname === '/api/v2/me/notifications') {
    const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
    const size = Math.min(100, Math.max(1, Number(url.searchParams.get('size')) || 20));
    const start = (page - 1) * size;
    send(response, 200, {
      items: notifications.slice(start, start + size),
      page,
      size,
      total: notifications.length,
    });
    return;
  }

  const markReadMatch = url.pathname.match(/^\/api\/v2\/me\/notifications\/(\d+)\/read$/);
  if (request.method === 'PATCH' && markReadMatch) {
    const notificationId = Number(markReadMatch[1]);
    notifications = notifications.map(item => item.notificationId === notificationId
      ? {...item, readAt: item.readAt || now()}
      : item);
    send(response, 200, null);
    return;
  }

  if (request.method === 'PATCH' && url.pathname === '/api/v2/me/notifications/read-all') {
    const readAt = now();
    notifications = notifications.map(item => ({...item, readAt: item.readAt || readAt}));
    send(response, 200, {unreadCount: 0});
    return;
  }

  if (request.method === 'GET' && url.pathname === '/api/v2/courses/4/assignments/9/submission') {
    send(response, 200, submission);
    return;
  }


  if (request.method === 'GET' && url.pathname === '/api/v2/courses/4/assignments/37/submission') {
    send(response, 404, null, 'NOT_FOUND', 'No formal submission yet');
    return;
  }

  send(response, 404, null, 'NOT_FOUND', `No preview fixture for ${request.method} ${url.pathname}`);
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Coursistant preview API listening on http://127.0.0.1:${port}`);
});
