import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import styles from "./modal.module.scss";
import axios from "axios";
import { useAuth } from "../../contexts/AuthContext.js";

const HOW_TO_JOIN = { FREE: "free", APPROVAL: "approval" };

export default function CreateGroupModal({
  open,
  onClose,
  courseId,
  existingGroupCount = 0, // passed from Roster so we can continue numbering
}) {
  const { user } = useAuth();
  const isTeacher = user?.level === "TEACHER";

  const GROUPING_API_DOMAIN =
    import.meta.env.VITE_GROUPING_API_DOMAIN_NAME?.replace(/\/$/, "");
  const COURSE_API_DOMAIN =
    import.meta.env.VITE_COURSE_API_DOMAIN_NAME?.replace(/\/$/, "");

  // --- local state ---
  const [summary, setSummary] = useState("");
  const [howToJoin, setHowToJoin] = useState(HOW_TO_JOIN.FREE);
  const [desc, setDesc] = useState("");
  const containerRef = useRef(null);
  const [totalStudents, setTotalStudents] = useState(null); // number | null, STUDENT only
  const [loadingTotal, setLoadingTotal] = useState(false);
  const [totalErr, setTotalErr] = useState(null);
  const [numStudents, setNumStudents] = useState("");
  const [extraGroups, setExtraGroups] = useState(0);

  const commonProps = {
    contentEditable: true,
    suppressContentEditableWarning: true,
    ref: (el) => {
      if (el && el.innerHTML !== desc) el.innerHTML = desc;
    },
    onInput: (e) => setDesc(e.currentTarget.innerHTML),
    className:
      "w-full min-h-[10rem] rounded p-2 focus:outline-none overflow-hidden",
    "data-placeholder": "Type your description...",
  };

  // initialize on open
  useEffect(() => {
    if (!open) return;
    setSummary("");
    setHowToJoin(HOW_TO_JOIN.FREE);
    setDesc("");
    setNumStudents("");
    setExtraGroups(0);
    setTotalStudents(null);
    setTotalErr(null);

    const onEsc = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onEsc);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onEsc);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  useEffect(() => {
    if (open) containerRef.current?.focus();
  }, [open]);

  // Fetch total number of students in course (excluding TEACHER / non-students)
  const fetchTotal = useCallback(async () => {
    if (!open || !courseId || !COURSE_API_DOMAIN) return;
    setLoadingTotal(true);
    setTotalErr(null);
    try {
      const url = `${COURSE_API_DOMAIN}/learn/selectByCourseId/${courseId}`;
      const res = await axios.get(url, {
        headers: { token: user?.accessToken },
        validateStatus: () => true,
      });

      if (res.status !== 200 || !Array.isArray(res.data?.data)) {
        throw new Error(
          `Unexpected response: ${res.status} ${JSON.stringify(res.data)}`
        );
      }

      const list = res.data.data ?? [];
      // Count only STUDENT level (exclude TEACHER, TA, etc.)
      const onlyStudents = list.filter((s) => {
        const lvl = (s.level ?? s.type ?? "").toString().toUpperCase();
        return lvl === "STUDENT";
      });

      setTotalStudents(onlyStudents.length);
    } catch (e) {
      console.error("Failed to load total students:", e);
      setTotalStudents(null);
      setTotalErr("Failed to load total students");
    } finally {
      setLoadingTotal(false);
    }
  }, [open, courseId, COURSE_API_DOMAIN, user?.accessToken]);

  useEffect(() => {
    if (open && courseId) fetchTotal();
  }, [open, courseId, fetchTotal]);

  // Preview: how many groups will be created in total
  const groupsToCreate = useMemo(() => {
    const total = Number(totalStudents);
    const per = Number(numStudents);
    const autoGroups =
      total && per && per > 0 ? Math.ceil(total / per) : 0;
    const extras =
      Number.isFinite(extraGroups) && extraGroups > 0 ? extraGroups : 0;
    return autoGroups + extras;
  }, [totalStudents, numStudents, extraGroups]);

  if (!open) return null;

  const publish = async () => {
    if (!isTeacher) {
      alert("Only teachers can create groups.");
      return;
    }

    const confirm = window.confirm(
      "Are you sure you want to create group(s)?"
    );
    if (!confirm) return;

    const total = Number(totalStudents);
    let perGroup = Number(numStudents);

    // If "Students per group" is not provided:
    // allow creating only extra empty groups, but still provide a valid max_student
    if (!perGroup || perGroup < 1) {
      perGroup = Number(totalStudents) || 1;
    }

    if (!GROUPING_API_DOMAIN)
      return alert("Missing VITE_GROUPING_API_DOMAIN_NAME");
    if (!COURSE_API_DOMAIN)
      return alert("Missing VITE_COURSE_API_DOMAIN_NAME");
    if (!courseId) return alert("Missing courseId.");
    if (!total || total < 1)
      return alert("Total students not loaded.");
    if (!perGroup || perGroup < 1)
      return alert("Enter students per group (min 1).");

    const autoGroups =
      Number(numStudents) > 0 && total > 0
        ? Math.ceil(total / perGroup)
        : 0;
    const extras =
      Number.isFinite(extraGroups) && extraGroups > 0 ? extraGroups : 0;
    const n = autoGroups + extras;
    if (n < 1)
      return alert(
        "Nothing to create. Set 'Students per group' or 'Extra empty groups'."
      );

    const baseName = (summary || "Group").trim();
    // For creation: FREE = 1, APPROVAL = 0 (per your backend convention)
    const join_mode = howToJoin === HOW_TO_JOIN.FREE ? 1 : 0;

    // Offset by existing groups so we don't restart numbering from 1
    const startIndex = Number(existingGroupCount) || 0;

    try {
      // 1) Create groups
      const newGroupNames = [];
      const autoGroupNames = []; // only the first `autoGroups` are for auto-assignment

      for (let i = 1; i <= n; i++) {
        const index = startIndex + i;
        const name = `${baseName} ${index}`;

        const payload = {
          assignmentId: -1,
          courseId: parseInt(courseId, 10),
          title: name,
          description: desc,
          group_name: name,
          max_student: perGroup,
          join_mode, // FREE=1, APPROVAL=0
        };

        await axios.post(
          `${GROUPING_API_DOMAIN}/grouping/teacher/add`,
          payload,
          {
            headers: { token: user.accessToken },
          }
        );

        newGroupNames.push(name);
        if (i <= autoGroups) {
          autoGroupNames.push(name);
        }
      }

      // 2) Auto-assign students only when:
      //    - "Students per group" is given
      //    - and "How to join" is "Approval required"
      //    - "Free to join" should create empty groups only
      if (
        howToJoin === HOW_TO_JOIN.APPROVAL &&
        Number(numStudents) > 0 &&
        autoGroupNames.length > 0
      ) {
        // 2-1) Fetch course enrollments
        const studentsRes = await axios.get(
          `${COURSE_API_DOMAIN}/learn/selectByCourseId/${courseId}`,
          { headers: { token: user.accessToken } }
        );
        const allRaw = studentsRes.data?.data ?? [];

        // Keep only STUDENT level, normalize id to number
        const allStudents = allRaw
          .filter((s) => {
            const lvl = (s.level ?? s.type ?? "")
              .toString()
              .toUpperCase();
            return lvl === "STUDENT";
          })
          .map((s) => ({ id: Number(s.id) }))
          .filter((s) => Number.isFinite(s.id));

        // 2-2) Find all students who are already a member of any group
        const groupsRes = await axios.get(
          `${GROUPING_API_DOMAIN}/grouping/selectByCourse/${courseId}`,
          { headers: { token: user.accessToken } }
        );
        const allGroups = groupsRes.data?.data ?? [];

        const alreadyInGroup = new Set();

        for (const g of allGroups) {
          const gmRes = await axios.get(
            `${GROUPING_API_DOMAIN}/grouping/membersByGroupId/${g.id}`,
            { headers: { token: user.accessToken } }
          );
          const members = gmRes.data?.data ?? [];
          for (const m of members) {
            const sid = Number(m.userId ?? m.id);
            if (Number.isFinite(sid)) alreadyInGroup.add(sid);
          }
        }

        // 2-3) Only students who are not yet in any group
        const ungroupedStudents = allStudents.filter(
          (s) => !alreadyInGroup.has(s.id)
        );

        if (ungroupedStudents.length > 0) {
          // 2-4) Fetch groups again to map created group names to ids
          const groupsRes2 = await axios.get(
            `${GROUPING_API_DOMAIN}/grouping/selectByCourse/${courseId}`,
            { headers: { token: user.accessToken } }
          );
          const allGroups2 = groupsRes2.data?.data ?? [];

          const nameToId = {};
          for (const g of allGroups2) {
            const gName = g.groupName || g.title;
            if (!gName) continue;
            if (newGroupNames.includes(gName)) {
              nameToId[gName] = g.id;
            }
          }

          // Collect ids of the auto groups only, in the same order
          const autoGroupIds = autoGroupNames
            .map((name) => nameToId[name])
            .filter((id) => id != null)
            .map((id) => Number(id));

          // 2-5) Fill only the auto groups in order (extras stay empty)
          let groupIdx = 0;
          let inCurrent = 0;
          const per = Number(numStudents);

          for (const stu of ungroupedStudents) {
            if (groupIdx >= autoGroupIds.length) break;

            const groupId = autoGroupIds[groupIdx];
            const payload = {
              groupId: Number(groupId),
              studentId: Number(stu.id),
              assignmentId: -1,
            };

            await axios.post(
              `${GROUPING_API_DOMAIN}/grouping/teacher/addStudent`,
              payload,
              { headers: { token: user.accessToken } }
            );

            inCurrent += 1;
            if (inCurrent >= per) {
              groupIdx += 1;
              inCurrent = 0;
            }
          }
        }
      }

      onClose?.();
      window.location.reload();
    } catch (e) {
      console.error(e);
      alert("Failed to create groups.");
    }
  };

  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div
        className={styles.modalContent}
        ref={containerRef}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.modalHeader}>
          <h2>Create Group</h2>
          <button onClick={onClose} className={styles.closeButton}>
            ×
          </button>
        </div>

        <div className={styles.modalBody}>
          {/* Title */}
          <input
            type="text"
            value={summary}
            onChange={(e) =>
              setSummary(e.target.value.slice(0, 100))
            }
            placeholder="Enter a one line summary, 100 characters or less"
            className={styles.titleInput}
          />

          {/* Meta rows */}
          <div className="mt-4 grid grid-cols-[220px_1fr] items-center gap-y-2 gap-x-6 text-sm text-slate-600">
            {/* Total students */}
            <div className="flex items-center gap-2 text-slate-400">
              <span>Total students in course</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-32">
                {loadingTotal ? (
                  <div className="h-9 w-full rounded-xl bg-slate-100 animate-pulse" />
                ) : totalErr ? (
                  <div className="h-9 w-full rounded-xl border border-red-100 bg-red-50 text-red-700 px-3 flex items-center justify-center text-sm font-medium">
                    Failed to load
                  </div>
                ) : (
                  <div className="h-9 w-full rounded-xl border border-indigo-100 bg-indigo-50 text-indigo-700 px-3 flex items-center justify-between shadow-sm">
                    <span className="text-base font-semibold leading-none">
                      {totalStudents}
                    </span>
                    <span className="text-xs font-medium opacity-70 leading-none">
                      {totalStudents === 1 ? "student" : "students"}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Students per group */}
            <div className="flex items-center gap-2 text-slate-400">
              <span>Students per group</span>
            </div>
            <div className="flex items-center gap-3 w-full">
              <input
                type="number"
                min={1}
                value={numStudents}
                onChange={(e) => setNumStudents(e.target.value)}
                placeholder="e.g., 4 or 5"
                className="h-9 w-32 rounded-xl border border-slate-200 bg-white px-3 text-slate-900 outline-none focus:ring-2 focus:ring-indigo-200"
              />

              <span className="text-xs text-gray-500">
                {groupsToCreate > 0
                  ? `→ Will create ${groupsToCreate} group(s)`
                  : ""}
              </span>
            </div>

            {/* Extra manual groups */}
            <div className="flex items-center gap-2 text-slate-400">
              <span>Extra empty groups</span>
            </div>
            <div className="flex items-center gap-3 w-full">
              <input
                type="number"
                min={0}
                value={extraGroups}
                onChange={(e) =>
                  setExtraGroups(Number(e.target.value) || 0)
                }
                placeholder="0"
                className="h-9 w-32 rounded-xl border border-slate-200 bg-white px-3 text-slate-900 outline-none focus:ring-2 focus:ring-indigo-200"
              />
              <span className="text-xs text-gray-500">
                Creates this many additional groups (empty).
              </span>
            </div>

            {/* How to join */}
            <div className="flex items-center gap-2 text-slate-400">
              <span>How to join</span>
            </div>
            <div className="flex items-center gap-6">
              {/* Free */}
              <div
                className={`flex cursor-pointer items-center gap-2 w-30 h-10 select-none 
                  ${
                    howToJoin === HOW_TO_JOIN.FREE
                      ? "text-indigo-600"
                      : "text-slate-500"
                  }`}
                onClick={() => setHowToJoin(HOW_TO_JOIN.FREE)}
              >
                <span
                  className={`cursor-pointer grid h-5 w-5 place-items-center rounded-full border 
                    ${
                      howToJoin === HOW_TO_JOIN.FREE
                        ? "border-indigo-500"
                        : "border-slate-300"
                    }`}
                >
                  {howToJoin === HOW_TO_JOIN.FREE && (
                    <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
                  )}
                </span>
                <span>Free to join</span>
              </div>

              {/* Approval */}
              <div
                className={`flex cursor-pointer items-center gap-2 w-40 h-10 select-none 
                  ${
                    howToJoin === HOW_TO_JOIN.APPROVAL
                      ? "text-indigo-600"
                      : "text-slate-500"
                  }`}
                onClick={() => setHowToJoin(HOW_TO_JOIN.APPROVAL)}
              >
                <span
                  className={`cursor-pointer grid h-5 w-5 place-items-center rounded-full border 
                    ${
                      howToJoin === HOW_TO_JOIN.APPROVAL
                        ? "border-indigo-500"
                        : "border-slate-300"
                    }`}
                >
                  {howToJoin === HOW_TO_JOIN.APPROVAL && (
                    <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
                  )}
                </span>
                <span>Auto Assign</span>
              </div>
            </div>
          </div>

          <div className="mt-4 mb-4 border-t border-slate-200"></div>

          {/* Description */}
          <div className="flex flex-col items-start relative">
            <div {...commonProps} />
            {desc === "" && (
              <div className="absolute top-2 left-2 text-gray-400 pointer-events-none">
                Type description here...
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className={styles.modalFooter}>
          <button
            className={styles.publishButtonDraft}
            onClick={onClose}
          >
            Cancel
          </button>
          {isTeacher && (
            <button
              className={styles.publishButton}
              onClick={publish}
              disabled={
                !GROUPING_API_DOMAIN ||
                !COURSE_API_DOMAIN ||
                !courseId ||
                typeof totalStudents !== "number" ||
                totalStudents < 1 ||
                (Number(extraGroups) < 1 &&
                  (!numStudents || Number(numStudents) < 1))
              }
              title={
                typeof totalStudents !== "number"
                  ? "Total students not loaded"
                  : Number(extraGroups) < 1 &&
                    (!numStudents || Number(numStudents) < 1)
                  ? "Enter students per group or extra groups"
                  : ""
              }
            >
              Publish
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
