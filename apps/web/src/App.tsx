import { lazy, Suspense, useEffect, type ReactNode } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router';
import { useSession } from './state/session';
import { useOverlay } from './ui/overlays';
import { Spinner } from './ui/bits';
import { completeStripeRedirect } from './features/payments';

const page = (load: () => Promise<{ default: () => ReactNode }>) => lazy(load as never);
const P = {
  Landing: page(() => import('./pages/public/LandingPage')), Auth: page(() => import('./pages/public/AuthPage')),
  Dashboard: page(() => import('./pages/student/DashboardPage')), Roadmap: page(() => import('./pages/student/RoadmapPage')), Learn: page(() => import('./pages/student/LearnPage')),
  Progress: page(() => import('./pages/student/ProgressPage')), Report: page(() => import('./pages/student/ReportPage')),
  Lesson: page(() => import('./pages/learning/LessonPage')), Review: page(() => import('./pages/learning/ReviewPage')), Exams: page(() => import('./pages/learning/ExamsPage')),
  Exam: page(() => import('./pages/learning/ExamPage')), Certificate: page(() => import('./pages/learning/CertificatePage')),
  Rewards: page(() => import('./pages/rewards/RewardsPage')), Planner: page(() => import('./pages/planner/PlannerPage')),
  Family: page(() => import('./pages/account/FamilyPage')), Billing: page(() => import('./pages/account/BillingPage')), Settings: page(() => import('./pages/account/SettingsPage')), Help: page(() => import('./pages/account/HelpPage')),
  AdminOverview: page(() => import('./pages/admin/AdminOverviewPage')), AdminUsers: page(() => import('./pages/admin/AdminUsersPage')), AdminUser: page(() => import('./pages/admin/AdminUserPage')),
  AdminPayments: page(() => import('./pages/admin/AdminPaymentsPage')), AdminTickets: page(() => import('./pages/admin/AdminTicketsPage')),
  AdminCurriculum: page(() => import('./pages/admin/AdminCurriculumPage')), AdminContent: page(() => import('./pages/admin/AdminContentPage')),
};

function Guard({ roles, children }: { roles?: string[]; children: ReactNode }) {
  const s = useSession(); const loc = useLocation();
  if (s.loading) return <Spinner />;
  if (!s.me) return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  if (roles && !roles.includes(s.me.user.role)) return <Navigate to={s.me.user.role === 'admin' ? '/admin' : '/app'} replace />;
  return <>{children}</>;
}

export function App() {
  const { toast } = useOverlay(); const s = useSession();
  useEffect(() => { completeStripeRedirect().then((r) => { if (r) { toast('Payment confirmed', 'good'); s.refresh(); } }).catch((e) => toast(e.message, 'bad')); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const app = (el: ReactNode, roles?: string[]) => <Guard roles={roles}>{el}</Guard>;
  return (
    <Suspense fallback={<Spinner />}>
      <Routes>
        <Route path="/" element={<P.Landing />} />
        <Route path="/login" element={<P.Auth />} />
        <Route path="/register" element={<P.Auth />} />
        <Route path="/app" element={app(<P.Dashboard />)} />
        <Route path="/app/roadmap" element={app(<P.Roadmap />)} />
        <Route path="/app/learn/:topicId" element={app(<P.Learn />)} />
        <Route path="/app/progress" element={app(<P.Progress />)} />
        <Route path="/app/report" element={app(<P.Report />)} />
        <Route path="/app/report/:studentId" element={app(<P.Report />)} />
        <Route path="/app/lesson/:id" element={app(<P.Lesson />)} />
        <Route path="/app/review" element={app(<P.Review />)} />
        <Route path="/app/exams" element={app(<P.Exams />)} />
        <Route path="/app/exam/:id" element={app(<P.Exam />)} />
        <Route path="/app/certificate/:id" element={app(<P.Certificate />)} />
        <Route path="/app/rewards" element={app(<P.Rewards />)} />
        <Route path="/app/planner" element={app(<P.Planner />)} />
        <Route path="/app/family" element={app(<P.Family />, ['parent'])} />
        <Route path="/app/billing" element={app(<P.Billing />, ['parent'])} />
        <Route path="/app/settings" element={app(<P.Settings />)} />
        <Route path="/app/help" element={app(<P.Help />)} />
        <Route path="/admin" element={app(<P.AdminOverview />, ['admin'])} />
        <Route path="/admin/users" element={app(<P.AdminUsers />, ['admin'])} />
        <Route path="/admin/users/:id" element={app(<P.AdminUser />, ['admin'])} />
        <Route path="/admin/payments" element={app(<P.AdminPayments />, ['admin'])} />
        <Route path="/admin/tickets" element={app(<P.AdminTickets />, ['admin'])} />
        <Route path="/admin/curriculum" element={app(<P.AdminCurriculum />, ['admin'])} />
        <Route path="/admin/content/:topicId" element={app(<P.AdminContent />, ['admin'])} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
