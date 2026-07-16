import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import GroupMenu from "../../sections/roster/menu";
import styles from "./styles.module.scss";
import { useAuth } from "../../contexts/AuthContext.js";
import axios from "axios";
import CreateGroupModal from "./createGroup";

const Roster = () => {
  const navigate = useNavigate();

  const VITE_GROUPING_API_DOMAIN =
    import.meta.env.VITE_GROUPING_API_DOMAIN_NAME;
  const VITE_COURSE_API_DOMAIN =
    import.meta.env.VITE_COURSE_API_DOMAIN_NAME;

  const { user } = useAuth();
  const userRole = user?.level;

  const params = useParams();
  const courseId = params.courseId;

  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [activeIndex, setActiveIndex] = useState(null);
  const [menuOpenIndex, setMenuOpenIndex] = useState(null);
  const [rightMenuOpenIndex, setRightMenuOpenIndex] = useState(null);
  const [groupDropdownOpen, setGroupDropdownOpen] = useState(false);
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] =
    useState(false);

  const [courseInfo, setCourseInfo] = useState(null);
  const [groupList, setGroupList] = useState([]);
  const [rosterStudentList, setRosterStudentList] = useState([]);
  const [initialRosterStudentList, setInitialRosterStudentList] =
    useState([]);

  // Track MY membership + button busy states (for student join/leave)
  const [myGroupId, setMyGroupId] = useState(null);
  const [joiningGroupId, setJoiningGroupId] = useState(null);
  const [leavingGroupId, setLeavingGroupId] = useState(null);

  const toggleStudentSelection = (studentId) => {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const isOk = (res) => {
    if (!res) return false;
    const d = res.data ?? {};
    const code = d.code ?? d.status ?? res.status;
    return (
      res.status >= 200 &&
      res.status < 300 &&
      (code === 200 ||
        code === "200" ||
        code === 0 ||
        code === "0" ||
        d.success === true)
    );
  };

  const getErrMsg = (res, fallback = "Request failed") => {
    const d = res?.data;
    return (
      d?.message ||
      d?.msg ||
      d?.error ||
      d?.errors?.[0]?.message ||
      (typeof d === "string" ? d : null) ||
      fallback
    );
  };

  useEffect(() => {
    fetchInformation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const fetchInformation = async () => {
    await fetchCourseInfo();

    const studentList = await fetchStudentList();
    const { groupInfoList, groupedStudentList } = await fetchGroupList();

    // Map group name onto each student
    const updatedStudentList = studentList.map((student) => {
      const match = groupedStudentList.find(
        (gs) => Number(gs.userId) === Number(student.student_id)
      );
      return match
        ? { ...student, group: match.groupName }
        : { ...student, group: "None" };
    });

    setGroupList(groupInfoList);
    setInitialRosterStudentList(updatedStudentList);

    // Derive MY membership from updated list
    const me = updatedStudentList.find(
      (s) => Number(s.id) === Number(user?.id)
    );
    if (me && me.group && me.group !== "None") {
      const g = groupInfoList.find((gi) => gi.groupName === me.group);
      setMyGroupId(g?.id ?? null);
    } else {
      setMyGroupId(null);
    }

    // Filter using the *fresh* groupInfoList (avoid stale state)
    if (activeIndex === null || !groupInfoList[activeIndex]) {
      setRosterStudentList(updatedStudentList);
    } else {
      const activeGroupName = groupInfoList[activeIndex].groupName;
      setRosterStudentList(
        updatedStudentList.filter((s) => s.group === activeGroupName)
      );
    }
  };

  const fetchCourseInfo = async () => {
    const response = await axios.get(
      `${VITE_COURSE_API_DOMAIN}/course/selectById/${courseId}`,
      { headers: { token: user.accessToken } }
    );
    setCourseInfo(response.data.data);
  };

  const fetchGroupList = async () => {
    const groupedStudentList = [];

    const res = await axios.get(
      `${VITE_GROUPING_API_DOMAIN}/grouping/selectByCourse/${courseId}`,
      { headers: { token: user.accessToken } }
    );

    const rawGroups = res.data?.data ?? [];

    // Normalize joinMode: 1 = FREE, 0 = APPROVAL
    const groupInfoList = rawGroups.map((g) => {
      const rawMode =
        g.joinMode ??
        g.join_mode ??
        g.joinmode ??
        g.mode ??
        g.joinType ??
        g.join_type;
      let joinMode = 0;
      if (typeof rawMode === "string") {
        const u = rawMode.toLowerCase();
        joinMode =
          u === "free" || u === "open" || u === "self" ? 1 : 0;
      } else if (rawMode != null) {
        const n = Number(rawMode);
        joinMode = Number.isFinite(n) ? n : 0;
      }
      return {
        ...g,
        joinMode, // 1 = FREE, 0 = APPROVAL
        maxStudent: g.maxStudent ?? g.max_student ?? g.maxstudent ?? Infinity,
      };
    });

    // Add member counts and flattened mapping
    for (const [idx, g] of groupInfoList.entries()) {
      const m = await axios.get(
        `${VITE_GROUPING_API_DOMAIN}/grouping/membersByGroupId/${g.id}`,
        { headers: { token: user.accessToken } }
      );
      const students = (m.data?.data ?? []).map((s) => ({
        ...s,
        userId: Number(s.userId ?? s.id),
        groupName: g.groupName,
      }));
      groupInfoList[idx].students = students.length;
      groupedStudentList.push(...students);
    }

    return { groupInfoList, groupedStudentList };
  };

  const fetchStudentList = async () => {
    const response = await axios.get(
      `${VITE_COURSE_API_DOMAIN}/learn/selectByCourseId/${courseId}`,
      { headers: { token: user.accessToken } }
    );
    return (response.data?.data ?? []).map((student) => ({
      id: Number(student.id),
      name: student.name,
      student_id: Number(student.id),
      email: student.email,
      type: student.level,
      profile_image: student.avatar || "/icons/default_avatar.jpg",
      progress: 0,
      progress_color: "#F56565",
      group: "",
      ai_status: "Normal",
      ai_status_color: "#28A745",
    }));
  };

  // -----------------------------
  // Teacher bulk add/remove flows
  // -----------------------------

  const handleGroupSelect = async (groupId) => {
    for (const studentId of selectedStudentIds) {
      const found = initialRosterStudentList.find(
        (s) => Number(s.id) === Number(studentId)
      );
      if (found?.group !== "None") {
        window.alert(
          "Please remove students from other groups before adding them to this group."
        );
        setGroupDropdownOpen(false);
        return;
      }
    }

    const confirm = window.confirm(
      "Are you sure you want to add selected students to this group?"
    );
    if (!confirm) return;

    for (const studentId of selectedStudentIds) {
      const payload = {
        groupId: Number(groupId),
        studentId: Number(studentId),
        assignmentId: -1,
      };
      await axios.post(
        `${VITE_GROUPING_API_DOMAIN}/grouping/teacher/addStudent`,
        payload,
        { headers: { token: user.accessToken } }
      );
    }

    await fetchInformation();
    setGroupDropdownOpen(false);
    setSelectedStudentIds([]);
  };

  const handleDelete = async () => {
    const confirm = window.confirm(
      "Are you sure you want to delete students from this group?"
    );
    if (!confirm) return;

    for (const studentId of selectedStudentIds) {
      const payload = {
        groupId: Number(groupList[activeIndex].id),
        studentId: Number(studentId),
        assignmentId: -1,
      };
      await axios.delete(
        `${VITE_GROUPING_API_DOMAIN}/grouping/teacher/deleteStudent`,
        {
          headers: { token: user.accessToken },
          data: payload,
        }
      );
    }

    await fetchInformation();
    setGroupDropdownOpen(false);
    setSelectedStudentIds([]);
  };

  // -----------------------------
  // Student self-join / self-leave
  // -----------------------------
  const handleSelfJoin = async (group) => {
    if (joiningGroupId) return;
    if (myGroupId)
      return alert("You’re already in a group. Please leave it first.");

    const isFree = Number(group.joinMode) === 1; // 1 = FREE
    if (!isFree) return alert("This group requires approval.");

    const max = Number(group.maxStudent);
    const hasLimit = Number.isFinite(max) && max > 0;
    if (hasLimit && Number(group.students) >= max) {
      return alert("This group is full.");
    }

    const assignmentId = Number(group.assignmentId);
    if (!Number.isFinite(assignmentId)) {
      return alert(
        "Missing assignmentId on group. Ensure fetchGroupList sets group.assignmentId."
      );
    }

    setJoiningGroupId(group.id);
    try {
      const payload = {
        groupId: Number(group.id),
        courseId: Number(courseId),
        assignmentId,
      };

      const res = await axios.post(
        `${VITE_GROUPING_API_DOMAIN}/grouping/join`,
        payload,
        { headers: { token: user.accessToken }, validateStatus: () => true }
      );

      if (!isOk(res)) {
        throw new Error(getErrMsg(res, `Join failed (${res?.status})`));
      }

      await fetchInformation();
    } catch (err) {
      console.error("Join failed:", err);
      alert(err.message || "Failed to join group.");
    } finally {
      setJoiningGroupId(null);
    }
  };

  const handleSelfLeave = async (group) => {
    if (leavingGroupId) return;
    if (Number(myGroupId) !== Number(group.id)) return;
    if (!window.confirm("Leave this group?")) return;

    setLeavingGroupId(group.id);
    try {
      // 1) Try minimal body
      let res = await axios.post(
        `${VITE_GROUPING_API_DOMAIN}/grouping/leave`,
        { groupId: Number(group.id) },
        { headers: { token: user.accessToken }, validateStatus: () => true }
      );

      // 2) Fallback to explicit body
      if (!isOk(res)) {
        res = await axios.post(
          `${VITE_GROUPING_API_DOMAIN}/grouping/leave`,
          {
            groupId: Number(group.id),
            studentId: Number(user.id),
            assignmentId: -1,
          },
          { headers: { token: user.accessToken }, validateStatus: () => true }
        );
        if (!isOk(res))
          throw new Error(getErrMsg(res, `Leave failed (${res.status})`));
      }

      await fetchInformation();
    } catch (err) {
      console.error("Leave failed:", err);
      alert(err.message || "Failed to leave group.");
    } finally {
      setLeavingGroupId(null);
    }
  };

  const rightGroup = ["Remove"];

  // -----------------------------
  // Teacher: rename / edit limit / delete group
  // -----------------------------

  const handleRenameGroup = async (group) => {
    if (userRole !== "TEACHER") return;

    const currentName = group.groupName || group.title || "";
    const newName = window.prompt("Rename group:", currentName);
    if (newName == null) return;
    const trimmed = newName.trim();
    if (!trimmed) {
      return alert("Group name cannot be empty.");
    }

    // joinMode string for API ("FREE" / "APPROVAL")
    let joinModeToSend;
    if (Number(group.joinMode) === 1) {
      joinModeToSend = "free";
    } else if (Number(group.joinMode) === 0) {
      joinModeToSend = "approval";
    } else {
      joinModeToSend = String(group.joinMode ?? "");
    }

    try {
      const payload = {
        id: Number(group.id),
        assignmentId:
          group.assignmentId != null ? Number(group.assignmentId) : -1,
        courseId: Number(courseId),
        title: trimmed,
        groupName: trimmed,
        groupStatus:
          group.groupStatus ||
          group.group_status ||
          group.status ||
          "ACTIVE",
        joinMode: joinModeToSend,
        description: group.description || "",
        currStudentCount: Number(group.students) || 0,
        maxStudent:
          Number(group.maxStudent) && Number(group.maxStudent) > 0
            ? Number(group.maxStudent)
            : 0,
        createAt: group.createAt || group.create_at || null,
      };

      // ✅ /grouping/update 는 PUT 이라 405 안나게 변경
      const res = await axios.put(
        `${VITE_GROUPING_API_DOMAIN}/grouping/update`,
        payload,
        {
          headers: { token: user.accessToken },
          validateStatus: () => true,
        }
      );

      if (!isOk(res)) {
        throw new Error(getErrMsg(res, "Rename failed"));
      }

      alert("Group renamed.");
      await fetchInformation();
    } catch (err) {
      console.error("Rename group failed:", err);
      alert(err.message || "Failed to rename group.");
    }
  };

  const handleEditCapacity = async (group) => {
    if (userRole !== "TEACHER") return;

    const rawMax = group.maxStudent;
    const maxNumber = Number(rawMax);
    const current =
      Number.isFinite(maxNumber) && maxNumber > 0 ? String(maxNumber) : "";

    const input = window.prompt(
      "Set max students for this group:",
      current
    );
    if (input == null) return;

    const n = Number(input);
    if (!Number.isFinite(n) || n < 1) {
      return alert("Please enter a valid number (>= 1).");
    }

    if (Number(group.students) > n) {
      return alert(
        `This group already has ${group.students} students. Max must be >= current students.`
      );
    }

    let joinModeToSend;
    if (Number(group.joinMode) === 1) {
      joinModeToSend = "free";
    } else if (Number(group.joinMode) === 0) {
      joinModeToSend = "approval";
    } else {
      joinModeToSend = String(group.joinMode ?? "");
    }

    try {
      const payload = {
        id: Number(group.id),
        assignmentId:
          group.assignmentId != null ? Number(group.assignmentId) : -1,
        courseId: Number(courseId),
        title: group.title || group.groupName || "",
        groupName: group.groupName || group.title || "",
        groupStatus:
          group.groupStatus ||
          group.group_status ||
          group.status ||
          "ACTIVE",
        joinMode: joinModeToSend,
        description: group.description || "",
        currStudentCount: Number(group.students) || 0,
        maxStudent: n,
        createAt: group.createAt || group.create_at || null,
      };

      // ✅ 여기도 PUT으로 변경해서 405 해결
      const res = await axios.put(
        `${VITE_GROUPING_API_DOMAIN}/grouping/update`,
        payload,
        {
          headers: { token: user.accessToken },
          validateStatus: () => true,
        }
      );

      if (!isOk(res)) {
        throw new Error(getErrMsg(res, "Update failed"));
      }

      alert("Group limit updated.");
      await fetchInformation();
    } catch (err) {
      console.error("Update group failed:", err);
      alert(err.message || "Failed to update group.");
    }
  };

  const handleDeleteGroup = async (group) => {
    if (userRole !== "TEACHER") return;
    const ok = window.confirm(
      `Are you sure you want to delete group "${group.groupName}"?`
    );
    if (!ok) return;

    try {
      // ⚠️ DELETE endpoint는 백엔드 스펙에 맞게 필요하면 수정해줘야 함
      // 예: /grouping/delete/{id} 혹은 /grouping/teacher/deleteGroup/{id}
      const res = await axios.delete(
        `${VITE_GROUPING_API_DOMAIN}/grouping/delete/${group.id}`,
        {
          headers: { token: user.accessToken },
          validateStatus: () => true,
        }
      );

      if (!isOk(res)) {
        throw new Error(getErrMsg(res, "Delete failed"));
      }

      alert("Group deleted.");
      setMenuOpenIndex(null);
      await fetchInformation();
    } catch (err) {
      console.error("Delete group failed:", err);
      alert(err.message || "Failed to delete group.");
    }
  };

  // Re-filter right table when active group changes
  useEffect(() => {
    if (!groupList[activeIndex]) {
      setRosterStudentList(initialRosterStudentList);
    } else {
      const activeGroupName = groupList[activeIndex].groupName;
      setRosterStudentList(
        initialRosterStudentList.filter((s) => s.group === activeGroupName)
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex]);

  return (
    <div className="w-full">
      <div className="w-full flex items-center justify-between px-6 py-3">
        {/* Back Button */}
        <button
          className="cursor-pointer hover:opacity-70 transition-opacity duration-300"
          onClick={() => navigate(-1)}
        >
          <img src="/icons/course/arrow-left-v2.png" alt="arrow-left" />
        </button>

        {/* Title */}
        <div
          className="cursor-pointer flex items-center gap-1 text-lg font-semibold text-[rgba(45,55,72,1)]"
          onClick={() => setActiveIndex(null)}
        >
          {courseInfo?.name}
        </div>

        {/* Create group (teacher only) */}
        <div className="flex items-center gap-2">
          {userRole === "TEACHER" && (
            <button
              className="bg-[rgba(86,111,232,1)] cursor-pointer hover:bg-[rgba(86,111,232,0.8)] text-white text-sm px-4 py-2 rounded-xl transition flex items-center gap-1"
              onClick={() => setIsCreateGroupModalOpen(true)}
            >
              Create group
              <img src="/icons/course/arrow-right-v2.png" alt="arrow-right" />
            </button>
          )}
        </div>
      </div>

      <div className={styles.horizontalDivider}></div>

      <div className={styles.rosterContainer}>
        <div className={styles.rosterContent}>
          <div className={styles.rosterHeader}>
            <div className={styles.rosterHeaderSearch}>
              <img src="/icons/roster/search.png" alt="search" />
              <input type="text" placeholder="Search" />
            </div>
          </div>

          <div className={styles.rosterBody}>
            {/* Left: Groups */}
            <div className={styles.rosterBodyList}>
              <div className={styles.rosterBodyListItems}>
                {groupList.map((classItem, index) => {
                  const isMyGroup =
                    Number(myGroupId) === Number(classItem.id);

                  const rawMax = classItem.maxStudent;
                  const maxNumber = Number(rawMax);
                  const hasLimit =
                    Number.isFinite(maxNumber) && maxNumber > 0;
                  const effectiveMax = hasLimit ? maxNumber : Infinity;

                  const isFree = Number(classItem.joinMode) === 1;
                  const isFull =
                    hasLimit &&
                    Number(classItem.students) >= effectiveMax;
                  const joining =
                    Number(joiningGroupId) === Number(classItem.id);
                  const leaving =
                    Number(leavingGroupId) === Number(classItem.id);

                  return (
                    <div
                      className={styles.rosterBodyListItem}
                      style={
                        activeIndex === index
                          ? { border: "1px solid #566FE8" }
                          : {}
                      }
                      key={index}
                      onClick={() => setActiveIndex(index)}
                    >
                      <div className="flex items-center justify-between mb-2 relative">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-sky-400 rounded-full" />
                            <span className="text-gray-800 font-medium text-lg">
                              {classItem.groupName}
                            </span>
                          </div>
                          {/* Capacity 표시 */}
                          <div className="text-xs text-slate-500 ml-5">
                            {hasLimit ? (
                              <>Capacity: {classItem.students}/{effectiveMax}</>
                            ) : (
                              <>Capacity: {classItem.students}/∞</>
                            )}
                          </div>
                        </div>

                        {/* Teacher-only menu: Rename / Edit limit / Delete group */}
                        {userRole === "TEACHER" && (
                          <div className="relative">
                            <div
                              className="text-gray-400 text-xl font-bold cursor-pointer px-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                setMenuOpenIndex(
                                  index === menuOpenIndex ? null : index
                                );
                              }}
                            >
                              ⋯
                            </div>

                            {menuOpenIndex === index && (
                              <div className="absolute right-0 top-7 z-20 w-44 rounded-xl bg-white shadow-lg border border-slate-200 py-1 text-sm text-slate-700">
                                <button
                                  className="w-full text-left px-3 py-2 hover:bg-slate-50"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setMenuOpenIndex(null);
                                    handleRenameGroup(classItem);
                                  }}
                                >
                                  Rename group
                                </button>
                                <button
                                  className="w-full text-left px-3 py-2 hover:bg-slate-50"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setMenuOpenIndex(null);
                                    handleEditCapacity(classItem);
                                  }}
                                >
                                  Edit limit
                                </button>
                                <button
                                  className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setMenuOpenIndex(null);
                                    handleDeleteGroup(classItem);
                                  }}
                                >
                                  Delete group
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className={styles.classInfo}>
                        <div className={styles.studentCount}>
                          <p>{classItem.students}</p>
                          <p className={styles.lightText}>
                            {classItem.students === 1
                              ? "Student"
                              : "Students"}
                          </p>
                        </div>
                      </div>

                      {/* Student self-join/leave controls */}
                      {userRole === "STUDENT" && (
                        <div className="mt-3 flex items-center gap-2">
                          {isMyGroup ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!leaving) handleSelfLeave(classItem);
                              }}
                              disabled={leaving}
                              className={`px-3 py-1.5 rounded-lg text-sm border cursor-pointer ${
                                leaving
                                  ? "border-red-100 bg-red-50 text-red-400 cursor-not-allowed"
                                  : "border-red-200 text-red-600 hover:bg-red-50"
                              }`}
                            >
                              {leaving ? "Leaving…" : "Leave"}
                            </button>
                          ) : isFree ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!myGroupId && !isFull && !joining) {
                                  handleSelfJoin(classItem);
                                }
                              }}
                              disabled={!!myGroupId || isFull || joining}
                              className={`px-3 py-1.5 rounded-lg text-sm border cursor-pointer ${
                                !!myGroupId || isFull || joining
                                  ? "border-slate-200 text-slate-400 bg-slate-50 cursor-not-allowed"
                                  : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                              }`}
                              title={
                                isFull
                                  ? "Group is full"
                                  : !!myGroupId
                                  ? "You are already in a group"
                                  : "Join this group"
                              }
                            >
                              {joining
                                ? "Joining…"
                                : isFull
                                ? "Full"
                                : "Join"}
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400">
                              Approval required
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: roster table */}
            <div className={styles.rosterBodyContent}>
              <div className={styles.rosterBodyContentFirstRow}>
                {userRole === "TEACHER" && (
                  <label className="inline-flex items-center cursor-pointer select-none">
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={
                        rosterStudentList.length > 0 &&
                        selectedStudentIds.length ===
                          rosterStudentList.length
                      }
                      onChange={() => {
                        if (
                          selectedStudentIds.length ===
                          rosterStudentList.length
                        ) {
                          setSelectedStudentIds([]);
                        } else {
                          setSelectedStudentIds(
                            rosterStudentList.map((s) => s.id)
                          );
                        }
                      }}
                    />
                    <div
                      className={
                        "w-6 h-6 border-2 border-[#A1ACC3] rounded-[7px] flex items-center justify-center mr-5 " +
                        (selectedStudentIds.length ===
                          rosterStudentList.length &&
                        rosterStudentList.length > 0
                          ? "bg-[#566FE8] border-none"
                          : "")
                      }
                    >
                      {selectedStudentIds.length ===
                        rosterStudentList.length &&
                        rosterStudentList.length > 0 && (
                          <svg
                            className="w-3 h-3 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                    </div>
                  </label>
                )}

                <div className={styles.student}>
                  <span>Name</span>
                </div>
                <div className={styles.group}>Group</div>
                <div className={styles.actions} />
              </div>

              <div className={styles.rosterBodyContentRows}>
                {rosterStudentList.map((item, index) => (
                  <div
                    className={styles.rosterBodyContentRowItem}
                    key={index}
                  >
                    {userRole === "TEACHER" && (
                      <label className="inline-flex items-center cursor-pointer select-none">
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={selectedStudentIds.includes(item.id)}
                          onChange={() => toggleStudentSelection(item.id)}
                        />
                        <div
                          className={
                            "w-6 h-6 border-2 border-[#A1ACC3] rounded-[7px] flex items-center justify-center mr-5 " +
                            (selectedStudentIds.includes(item.id)
                              ? "bg-[#566FE8] border-none"
                              : "")
                          }
                        >
                          {selectedStudentIds.includes(item.id) && (
                            <svg
                              className="w-3 h-3 text-white"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              viewBox="0 0 24 24"
                            >
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </div>
                      </label>
                    )}

                    <div className={styles.student}>
                      <img
                        className="w-12 h-12 rounded-full"
                        src={item.profile_image}
                        alt="profile"
                      />
                      <div className={styles.studentInfo}>
                        <div className={styles.studentInfoHeader}>
                          <h1>{item.name}</h1>
                          <p
                            className={`inline-block ml-2 px-2 py-0 text-xs rounded-full 
                              ${
                                item.type === "TEACHER"
                                  ? "bg-[#BFDBFE] text-[#1D4ED8]"
                                  : "bg-[#B2DFCC] text-[#2FB88F]"
                              }`}
                          >
                            {item.type}
                          </p>
                        </div>
                        <p>{item.email}</p>
                      </div>
                    </div>

                    <div className={styles.group}>
                      {item.group || "None"}
                    </div>

                    <div className={styles.actions}>
                      <img
                        className="cursor-pointer"
                        src="/icons/roster/sms-edit_color.png"
                        alt="sms-edit"
                      />
                    </div>

                    {rightMenuOpenIndex === index && (
                      <GroupMenu
                        group={rightGroup}
                        setMenuOpen={() => setRightMenuOpenIndex(null)}
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Teacher bulk footer */}
              {userRole === "TEACHER" &&
                selectedStudentIds.length > 0 && (
                  <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 z-50 bg-white shadow-md rounded-xl px-3 py-2 flex items-center">
                    <svg
                      onClick={() => {
                        setSelectedStudentIds([]);
                        setGroupDropdownOpen(false);
                      }}
                      className="cursor-pointer mr-1"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M7.5 16.5L16.5 7.5" stroke="#2D3748" />
                      <path d="M16.5 16.5L7.5 7.5" stroke="#2D3748" />
                    </svg>

                    <span className="text-gray-800 text-[14px] mr-10">
                      {selectedStudentIds.length} selected
                    </span>

                    {activeIndex === null && (
                      <button
                        onClick={() =>
                          setGroupDropdownOpen((prev) => !prev)
                        }
                        className={`flex items-center space-x-2 px-4 mr-1 py-2 rounded-lg text-gray-800 text-[14px] cursor-pointer ${
                          groupDropdownOpen
                            ? "bg-[#E2E8F0]"
                            : "hover:bg-gray-100"
                        }`}
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M12.3337 13H9.66699"
                            stroke="#2D3748"
                          />
                          <path
                            d="M11 14.3327V11.666"
                            stroke="#2D3748"
                          />
                          <path
                            d="M8.10673 7.24732C8.04006 7.24065 7.96006 7.24065 7.88673 7.24732C6.30006 7.19398 5.04006 5.89398 5.04006 4.29398C5.0334 2.66065 6.36006 1.33398 7.9934 1.33398C9.62673 1.33398 10.9534 2.66065 10.9534 4.29398C10.9534 5.89398 9.68673 7.19398 8.10673 7.24732Z"
                            stroke="#2D3748"
                          />
                          <path
                            d="M7.99336 14.5404C6.78003 14.5404 5.57336 14.2338 4.65336 13.6204C3.04003 12.5404 3.04003 10.7804 4.65336 9.70711C6.48669 8.48044 9.49336 8.48044 11.3267 9.70711"
                            stroke="#2D3748"
                          />
                        </svg>
                        <span>Add to Group</span>
                      </button>
                    )}

                    {groupDropdownOpen && (
                      <div className="absolute z-50 bg-white border-1 pt-[6px] pb-[6px] pl-[6px] border-[#E2E8F0] rounded-[16px] bottom-[62px] shadow-lg w-35 ml-33 max-h-60 overflow-y-auto">
                        {groupList.map((group, index) => (
                          <div
                            key={index}
                            onClick={() => handleGroupSelect(group.id)}
                            className="px-2 py-2 hover:bg-gray-100 cursor-pointer"
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-[#22CCEE]" />
                              <span className="text-[#2D3748] text-[14px]">
                                {group.groupName}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {activeIndex !== null && (
                      <button
                        className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-gray-100 cursor-pointer text-[14px]"
                        onClick={() => handleDelete()}
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M14 3.98763C11.78 3.76763 9.54667 3.6543 7.32 3.6543C6 3.6543 4.68 3.72096 3.36 3.8543L2 3.98763"
                            stroke="#2D3748"
                          />
                          <path
                            d="M5.66699 3.31398L5.81366 2.44065C5.92033 1.80732 6.00033 1.33398 7.12699 1.33398H8.87366C10.0003 1.33398 10.087 1.83398 10.187 2.44732L10.3337 3.31398"
                            stroke="#2D3748"
                          />
                          <path
                            d="M12.5669 6.09375L12.1336 12.8071C12.0603 13.8537 12.0003 14.6671 10.1403 14.6671H5.86026C4.00026 14.6671 3.94026 13.8537 3.86693 12.8071L3.43359 6.09375"
                            stroke="#2D3748"
                          />
                          <path
                            d="M6.88672 11H9.10672"
                            stroke="#2D3748"
                          />
                          <path
                            d="M6.33301 8.33398H9.66634"
                            stroke="#2D3748"
                          />
                        </svg>
                        <span>Delete</span>
                      </button>
                    )}
                  </div>
                )}
            </div>
          </div>
        </div>
      </div>

      <CreateGroupModal
        open={isCreateGroupModalOpen}
        onClose={() => setIsCreateGroupModalOpen(false)}
        courseId={courseId}
        existingGroupCount={groupList.length}
      />
    </div>
  );
};

export default Roster;
