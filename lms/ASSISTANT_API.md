# Assistant page API

The `/aibot` page uses the same Assistant transport for Student and Instructor:

- `POST /api/assistant/turn/stream`, JSON `{message, chip, conversationId?, history}`.
- `POST /api/assistant/decision` for explicit Allow/Reject actions.
- Both requests read the current LMS bearer token when dispatched and reuse the
  existing shared refresh flow for one HTTP 401 retry.
- Only UUID conversation IDs are sent or retained from responses. New threads
  and invalid legacy IDs omit the field. Local thread IDs are separate.
- Existing suggested prompts are sent as text messages, with `chip: null`.
  No server chip identifiers have been supplied for those prompts.

The new request contract has no course ID. The Assistant page therefore no
longer presents a course selector; the existing student exam guard checks the
student's active courses. Course-specific Study Support consumers are unchanged.

Response handling currently accepts SSE `delta` text, final `answer`/`message`
objects using the existing reply/pendingAction fields, and `done` or `[DONE]`.
Card decisions retain the existing `{actionId, decision: "ALLOW" | "REJECT"}`
body. These response/decision shapes are covered by frontend fixtures; Steven's
quoted instruction did not supply their schemas. Live compatibility is not yet
verified. Dev 8084 returned HTTP 401 to the integration probe.
