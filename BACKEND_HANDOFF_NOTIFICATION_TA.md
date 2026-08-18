# Backend handoff: notification encoding and TA permissions

Updated: 2026-08-17

## 1. Live notification rows containing `?`

Test account:

- User ID: `385`
- Email: `regtest1@example.com`
- Name: `Alex Rivera`

`GET /v2/me/notifications` returned five rows. The two affected rows are:

| notificationId | courseId | courseCode | notificationType | message | subjectType | subjectId | createdAt |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 20 | 19 | DASH-024730-2 | ANNOUNCEMENT_POSTED | `Dashboard ?? ?2` | ANNOUNCEMENT | 5 | 2026-07-25T02:47:31 |
| 19 | 18 | DASH-024730-1 | ANNOUNCEMENT_POSTED | `Dashboard ?? ?1` | ANNOUNCEMENT | 4 | 2026-07-25T02:47:31 |

Source lookups succeeded:

| Endpoint | Source title | Source body returned by API |
| --- | --- | --- |
| `GET /v2/courses/19/announcements/5` | `Dashboard 公告 课2` | `???? dashboard??? 2` |
| `GET /v2/courses/18/announcements/4` | `Dashboard 公告 课1` | `???? dashboard??? 1` |

The announcement titles are intact, while both notification messages and announcement bodies already contain question marks in authenticated API responses. This is not a frontend font or rendering problem.

Run these read-only queries against `lms_v2` to distinguish persisted corruption from response-time transformation:

```sql
SELECT
    id,
    tenant_id,
    recipient_user_id,
    course_id,
    notification_type,
    message,
    HEX(message) AS message_hex,
    subject_type,
    subject_id,
    created_at
FROM user_notification
WHERE id IN (19, 20)
  AND recipient_user_id = 385;

SELECT
    id,
    course_id,
    title,
    HEX(title) AS title_hex,
    body_html,
    HEX(body_html) AS body_hex,
    posted_at,
    edited_at
FROM course_announcement
WHERE id IN (4, 5);
```

The current repository schema uses `utf8mb4`, and the current JDBC URL includes `useUnicode=true&characterEncoding=utf-8`. Because these are historical rows and their message shape predates the current `NotificationMessageFactory` English prefix, check the data-generation/import path that created them before changing the frontend.

A safe regression test should create an announcement whose title and body both contain Chinese, commit the source transaction, then assert the exact Unicode values in `course_announcement`, `user_notification`, and `GET /v2/me/notifications`.

## 2. PRD-defined course-level TA contract

The PRD defines TA as a Student-level account elevated within one course. Permissions must be evaluated against the current course enrollment; a TA in Course A remains a Student in Course B.

A new TA may view course content, all submissions and attempts, all grades, groups, and member contacts. The TA cannot submit assignments or take quizzes in that course. All five action toggles are off by default:

| Course capability | TA rule |
| --- | --- |
| `canGrade` | Enter and edit grades and feedback; never release grades. |
| `canPostAnnouncements` | Post announcements; edit or delete only their own posts. |
| `canManageGroups` | Create groups and group sets; assign, move, or remove members. |
| `canManageContent` | Upload materials and delete only their own uploads. |
| `canManageCourseEvents` | Create, edit, and delete course events. |

Instructor-only actions remain: manage course details or syllabus, create/publish weeks, create/archive a course, create/edit/delete assignments or quizzes, release grades, and assign/revoke TA status.

Permission changes apply to the next request and must be audited. Promotion to TA freezes existing student submissions/attempts after a warning. Revocation restores Student behavior while preserving and attributing grades previously entered by the TA.

## 3. Current backend/Swagger mismatches

Reviewed backend `main` at commit `d2ae84a4ac3369205320e0e4386d6268a5e3067d` and live `GET /v3/api-docs` on port 8081.

Already aligned:

- Course-scoped roles are stored on active enrollment.
- `canGrade`, `canPostAnnouncements`, `canManageGroups`, and `canManageCourseEvents` exist.
- TA assignment/quiz submission is blocked.
- TA grade release remains Instructor-only.
- Announcement ownership rules match the PRD.

Required alignment:

1. Add `can_manage_content` to enrollment with a default of `false`.
2. Add `canManageContent` to `Enrollment`, mapper SQL, `UpdateTaPermissionsRequest`, member responses, `/v2/me/courses`, and Swagger schemas.
3. Change material upload/delete authorization from “any Active TA” to “Active TA with `canManageContent=true`”; keep delete limited to the TA's own uploads.
4. Keep all five toggles off when promoting a new TA unless the Instructor explicitly grants them.
5. Decide how `/v2/me/teaching/*` serves TAs. It currently requires global `INSTRUCTOR` level and selects only `course_role='Instructor'`, so a Student-level TA with `canGrade` cannot receive a TA grading queue.
6. Add integration tests for Chinese announcement notification persistence, all five TA toggles, promotion freezes, open-page revocation, and audit records.

The frontend now recognizes optional `canManageContent` and fails closed when the field is absent. That prevents accidentally showing TA material actions until the backend contract is aligned.
