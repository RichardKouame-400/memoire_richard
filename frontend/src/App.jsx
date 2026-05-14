import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import Layout from './components/layout/Layout'

// ── Auth pages ──────────────────────────────────────────────
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import ResetPasswordPage from './pages/auth/ResetPasswordPage'
import ProfilePage from './pages/auth/ProfilePage'

// ── Public pages ─────────────────────────────────────────────
import LandingPage from './pages/public/LandingPage'
import NotFoundPage from './pages/public/NotFoundPage'

// ── Legal pages ──────────────────────────────────────────────
import PrivacyPage from './pages/legal/PrivacyPage'
import TermsPage from './pages/legal/TermsPage'

// ── App pages ────────────────────────────────────────────────
import Dashboard from './pages/dashboard/Dashboard'
import TenderListPage from './pages/tenders/TenderListPage'
import TenderDetailPage from './pages/tenders/TenderDetailPage'
import TenderCreatePage from './pages/tenders/TenderCreatePage'
import TenderEditPage from './pages/tenders/TenderEditPage'
import SubmissionListPage from './pages/submissions/SubmissionListPage'
import SubmissionCreatePage from './pages/submissions/SubmissionCreatePage'
import SubmissionDetailPage from './pages/submissions/SubmissionDetailPage'
import EvaluationPage from './pages/evaluation/EvaluationPage'
import RankingPage from './pages/evaluation/RankingPage'
import AuditPage from './pages/admin/AuditPage'
import UsersPage from './pages/admin/UsersPage'

// ── Route guards ─────────────────────────────────────────────
function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="w-8 h-8 border-4 border-[#0f2444]/20 border-t-[#0f2444] rounded-full animate-spin" />
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />
  return children
}

function PublicOnlyRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (user) return <Navigate to="/dashboard" replace />
  return children
}

// ── App Routes ───────────────────────────────────────────────
function AppRoutes() {
  return (
    <Routes>
      {/* Public — accessible sans connexion */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/terms" element={<TermsPage />} />

      {/* Auth — redirige vers dashboard si déjà connecté */}
      <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
      <Route path="/register" element={<PublicOnlyRoute><RegisterPage /></PublicOnlyRoute>} />
      <Route path="/forgot-password" element={<PublicOnlyRoute><ForgotPasswordPage /></PublicOnlyRoute>} />
      <Route path="/reset-password" element={<PublicOnlyRoute><ResetPasswordPage /></PublicOnlyRoute>} />

      {/* App — protégé par auth */}
      <Route path="/app" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/app/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />

        {/* Tenders */}
        <Route path="tenders" element={<TenderListPage />} />
        <Route path="tenders/create" element={
          <ProtectedRoute roles={['super_admin', 'acheteur']}>
            <TenderCreatePage />
          </ProtectedRoute>
        } />
        <Route path="tenders/:id" element={<TenderDetailPage />} />
        <Route path="tenders/:id/edit" element={
          <ProtectedRoute roles={['super_admin', 'acheteur']}>
            <TenderEditPage />
          </ProtectedRoute>
        } />

        {/* Submissions */}
        <Route path="submissions" element={<SubmissionListPage />} />
        <Route path="submissions/new" element={
          <ProtectedRoute roles={['soumissionnaire']}>
            <SubmissionCreatePage />
          </ProtectedRoute>
        } />
        <Route path="submissions/:id" element={<SubmissionDetailPage />} />

        {/* Evaluation */}
        <Route path="evaluation/:tenderId" element={
          <ProtectedRoute roles={['super_admin', 'acheteur', 'evaluateur']}>
            <EvaluationPage />
          </ProtectedRoute>
        } />
        <Route path="ranking/:tenderId" element={<RankingPage />} />

        {/* Admin */}
        <Route path="audit" element={
          <ProtectedRoute roles={['super_admin', 'auditeur', 'acheteur']}>
            <AuditPage />
          </ProtectedRoute>
        } />
        <Route path="users" element={
          <ProtectedRoute roles={['super_admin', 'acheteur']}>
            <UsersPage />
          </ProtectedRoute>
        } />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      {/* Legacy paths redirect — maintient la compatibilité avec les anciens liens */}
      <Route path="/dashboard" element={<Navigate to="/app/dashboard" replace />} />
      <Route path="/tenders/*" element={<Navigate to="/app/tenders" replace />} />
      <Route path="/submissions/*" element={<Navigate to="/app/submissions" replace />} />
      <Route path="/evaluation/*" element={<Navigate to="/app/dashboard" replace />} />
      <Route path="/ranking/*" element={<Navigate to="/app/dashboard" replace />} />
      <Route path="/audit" element={<Navigate to="/app/audit" replace />} />
      <Route path="/users" element={<Navigate to="/app/users" replace />} />
      <Route path="/profile" element={<Navigate to="/app/profile" replace />} />

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
