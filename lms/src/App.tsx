import {Suspense, lazy} from "react";
import {BrowserRouter as Router, Routes, Route} from "react-router-dom";
import {AuthProvider} from "./contexts/AuthContext";
import AuthLayout from "./layouts/AuthLayout";
import {RequiredAuthProvider} from "@/contexts/RequiredAuthContext";

const Layout = lazy(() => import("./layouts/Layout"));
const LMSHome = lazy(() => import("./pages/LmsHomePage"));
const CourseCataloguePage = lazy(() => import("./pages/CourseCataloguePage"));
const CourseWorkspacePage = lazy(() => import("./pages/CourseWorkspacePage"));
const CourseCreatePage = lazy(() => import("./pages/CourseWorkspacePage/CourseCreatePage"));
const AssignmentDetailPage = lazy(() => import('./pages/AssignmentDetailPage'));
const AssignmentEditorPage = lazy(() => import('./pages/AssignmentEditorPage'));
const AssignmentGradingPage = lazy(() => import('./pages/AssignmentGradingPage'));
const AssignmentSubmissionPage = lazy(() => import('./pages/AssignmentSubmissionPage'));
const NotificationSubjectPage = lazy(() => import('./pages/NotificationSubjectPage'));
const CourseEventsPage = lazy(() => import('./pages/CourseEventsPage'));
const CourseAnnouncementsPage = lazy(() => import('./pages/CourseAnnouncementsPage'));
const CourseSchedulePage = lazy(() => import('./pages/CourseSchedulePage'));
const CourseGroupsPage = lazy(() => import('./pages/CourseGroupsPage'));
const GroupSetDetailPage = lazy(() => import('./pages/GroupSetDetailPage'));
const QuizPage = lazy(() => import('./pages/QuizPage'));
const QuizEditorPage = lazy(() => import('./pages/QuizEditorPage'));
const QuizGradingPage = lazy(() => import('./pages/QuizGradingPage'));
const CourseGradesPage = lazy(() => import('./pages/CourseGradesPage'));
const Post = lazy(() => import("./pages/post"));
const PostDetail = lazy(() => import("./sections/posts/post-detail"));
const Roster = lazy(() => import("./pages/RosterPage"));
const Profile = lazy(() => import("./pages/profile"));
const CreateContent = lazy(() => import("./sections/dashboard/new-content/create-content"));
const AIBot = lazy(() => import("./pages/aibot"));
const Settings = lazy(() => import("./pages/settings"));
const Login = lazy(() => import("@/pages/LoginPage"));
const Signup = lazy(() => import("./pages/signup/SignUpView"));
const ForgotPassword = lazy(() => import("./pages/ForgotPasswordPage"));
const AdminConsolePage = lazy(() => import('./pages/AdminConsolePage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Suspense fallback={<div role="status">Loading…</div>}>
          <Routes>
            <Route path="/login"
                   element={
                     <AuthLayout>
                       <Login/>
                     </AuthLayout>
                   }
            />

            <Route path="/signup"
                   element={
                     <AuthLayout>
                       <Signup/>
                     </AuthLayout>
                   }
            />

            <Route path="/forgotpassword"
                   element={
                     <AuthLayout>
                       <ForgotPassword/>
                     </AuthLayout>
                   }
            />

            <Route path="/" element={<RequiredAuthProvider><Layout/></RequiredAuthProvider>}>
              <Route index element={<LMSHome/>}/>
              <Route path="course" element={<CourseCataloguePage/>}/>
              <Route path="course/:courseId" element={<CourseWorkspacePage/>}/>
              <Route path="course/:courseId/assignments/:assignmentId" element={<AssignmentDetailPage/>}/>
              <Route path="course/:courseId/assignments/new" element={<AssignmentEditorPage/>}/>
              <Route path="course/:courseId/assignments/:assignmentId/edit" element={<AssignmentEditorPage/>}/>
              <Route path="course/:courseId/assignments/:assignmentId/grading" element={<AssignmentGradingPage/>}/>
              <Route path="course/:courseId/assignments/:assignmentId/submissions/:submissionId" element={<AssignmentSubmissionPage/>}/>
              <Route path="course/:courseId/announcements/:subjectId" element={<NotificationSubjectPage kind="announcement"/>}/>
              <Route path="course/:courseId/announcements" element={<CourseAnnouncementsPage/>}/>
              <Route path="course/:courseId/events" element={<CourseEventsPage/>}/>
              <Route path="course/:courseId/events/:eventId" element={<CourseEventsPage/>}/>
              <Route path="course/:courseId/schedule" element={<CourseSchedulePage/>}/>
              <Route path="course/:courseId/groups" element={<CourseGroupsPage/>}/>
              <Route path="course/:courseId/group-sets/:groupSetId" element={<GroupSetDetailPage/>}/>
              <Route path="course/:courseId/weeks/:subjectId" element={<NotificationSubjectPage kind="week"/>}/>
              <Route path="course/:courseId/quizzes/new" element={<QuizEditorPage/>}/>
              <Route path="course/:courseId/quizzes/:quizId" element={<QuizPage/>}/>
              <Route path="course/:courseId/quizzes/:quizId/edit" element={<QuizEditorPage/>}/>
              <Route path="course/:courseId/quizzes/:quizId/grading" element={<QuizGradingPage/>}/>
              <Route path="course/:courseId/grades" element={<CourseGradesPage/>}/>
              <Route path="post" element={<Post/>}/>
              <Route path="post/:postId" element={<PostDetail/>}/>
              <Route path="roster" element={<Roster/>}/>
              <Route path="roster/:courseId" element={<Roster/>}/>
              <Route path="profile" element={<Profile/>}/>
              <Route path="course/add-content" element={<CourseCreatePage/>}/>
              <Route path="create/:contentType" element={<CreateContent/>}/>
              <Route path="aibot" element={<AIBot/>}/>
              <Route path="settings" element={<Settings/>}/>
              <Route path="admin" element={<AdminConsolePage/>}/>
              <Route path="*" element={<NotFoundPage/>}/>
            </Route>
            <Route
              path="*"
              element={
                <AuthLayout>
                  <NotFoundPage/>
                </AuthLayout>
              }
            />
          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );
};

export default App;
