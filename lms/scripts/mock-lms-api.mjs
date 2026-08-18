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
      downloadUrl: '#',
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

const readBody = request => new Promise((resolve, reject) => {
  const chunks = [];
  request.on('data', chunk => chunks.push(chunk));
  request.on('end', () => {
    try {
      const raw = Buffer.concat(chunks).toString('utf8');
      resolve(raw ? JSON.parse(raw) : {});
    } catch (error) {
      reject(error);
    }
  });
  request.on('error', reject);
});

const server = createServer(async (request, response) => {
  const url = new URL(request.url || '/', `http://${request.headers.host}`);

  if (request.method === 'POST' && url.pathname === '/api/v1/auth/login') {
    try {
      const credentials = await readBody(request);
      if (!credentials.email || !credentials.password) {
        send(response, 400, null, 'PARAM_MISSING', 'Email and password are required');
        return;
      }

      const isInstructor = String(credentials.email).toLowerCase().includes('instructor');
      send(response, 200, {
        userId: 7,
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

  if (request.method === 'GET' && url.pathname === '/api/v2/courses/4/assignments/9') {
    const isInstructor = request.headers.authorization === 'Bearer local-instructor-token';
    send(response, 200, isInstructor ? staffAssignment : studentAssignment);
    return;
  }

  if (request.method === 'GET' && url.pathname === '/api/v2/courses/4/assignments/9/grading-roster') {
    send(response, 200, gradingRoster);
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

  send(response, 404, null, 'NOT_FOUND', `No preview fixture for ${request.method} ${url.pathname}`);
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Coursistant preview API listening on http://127.0.0.1:${port}`);
});
