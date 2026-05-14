import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth, ROLE_LABELS } from '../../hooks/useAuth'
import { Toaster } from 'react-hot-toast'
import {
  LayoutDashboard, FileText, Send, CheckSquare, Users,
  Shield, LogOut, User, Menu, X, ClipboardList, Plus, BarChart3
} from 'lucide-react'
import { useState } from 'react'

const NAV = {
  super_admin: [
    { to: '/app/dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
    { to: '/app/tenders', icon: FileText, label: "Appels d'offres" },
    { to: '/app/submissions', icon: ClipboardList, label: 'Soumissions' },
    { to: '/app/users', icon: Users, label: 'Utilisateurs' },
    { to: '/app/audit', icon: Shield, label: "Piste d'audit" },
  ],
  acheteur: [
    { to: '/app/dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
    { to: '/app/tenders', icon: FileText, label: "Mes Appels d'offres" },
    { to: '/app/submissions', icon: ClipboardList, label: 'Soumissions reçues' },
    { to: '/app/audit', icon: Shield, label: "Piste d'audit" },
  ],
  evaluateur: [
    { to: '/app/dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
    { to: '/app/tenders', icon: FileText, label: "AO à évaluer" },
    { to: '/app/submissions', icon: CheckSquare, label: 'Évaluations' },
  ],
  soumissionnaire: [
    { to: '/app/dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
    { to: '/app/tenders', icon: FileText, label: "Appels d'offres" },
    { to: '/app/submissions', icon: Send, label: 'Mes soumissions' },
  ],
  auditeur: [
    { to: '/app/dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
    { to: '/app/tenders', icon: FileText, label: "Appels d'offres" },
    { to: '/app/audit', icon: Shield, label: "Piste d'audit" },
  ],
}

function SidebarContent({ onClose }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const links = NAV[user?.role] || NAV.soumissionnaire

  return (
    <div className="flex flex-col h-full bg-[#0f2444] text-white w-64">
      <div className="px-5 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center font-bold text-sm shadow">DAO</div>
          <div>
            <div className="font-display font-bold text-[15px]">DAO Platform</div>
            <div className="text-[11px] text-slate-400">IIT Grand-Bassam</div>
          </div>
          {onClose && <button onClick={onClose} className="ml-auto p-1 rounded hover:bg-white/10 lg:hidden"><X size={16} /></button>}
        </div>
      </div>

      <div className="px-3 py-3 border-b border-white/10">
        <div className="flex items-center gap-2.5 bg-white/5 rounded-xl px-3 py-2.5">
          <div className="w-8 h-8 rounded-full bg-emerald-500/70 flex items-center justify-center text-xs font-bold uppercase shrink-0">
            {user?.display_name?.[0] || '?'}
          </div>
          <div className="min-w-0">
            <div className="text-[13px] font-semibold truncate">{user?.display_name}</div>
            <div className="text-[11px] text-slate-400">{ROLE_LABELS[user?.role]}</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all ${
                isActive ? 'bg-white/12 text-white border border-white/15' : 'text-slate-400 hover:text-white hover:bg-white/7'
              }`
            }>
            {({ isActive }) => <><Icon size={16} className={isActive ? 'text-emerald-400' : ''} />{label}</>}
          </NavLink>
        ))}

        {(user?.role === 'acheteur' || user?.role === 'super_admin') && (
          <div className="pt-3 mt-2 border-t border-white/10">
            <NavLink to="/tenders/create" onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all ${
                  isActive ? 'bg-emerald-600 text-white' : 'bg-emerald-600/15 text-emerald-300 hover:bg-emerald-600/30'
                }`
              }>
              <Plus size={16} />Créer un AO
            </NavLink>
          </div>
        )}
      </nav>

      <div className="px-2 py-3 border-t border-white/10 space-y-0.5">
        <NavLink to="/profile"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all ${
              isActive ? 'bg-white/12 text-white' : 'text-slate-400 hover:text-white hover:bg-white/7'
            }`
          }>
          <User size={16} />Mon profil
        </NavLink>
        <button
          onClick={() => { logout(); navigate('/login') }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all">
          <LogOut size={16} />Déconnexion
        </button>
      </div>
    </div>
  )
}

export default function Layout() {
  const [open, setOpen] = useState(false)
  const location = useLocation()

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <div className="hidden lg:block shrink-0"><SidebarContent /></div>

      <AnimatePresence>
        {open && (
          <>
            <motion.div className="fixed inset-0 z-40 bg-black/50 lg:hidden"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setOpen(false)} />
            <motion.div className="fixed left-0 top-0 bottom-0 z-50 lg:hidden"
              initial={{ x: -264 }} animate={{ x: 0 }} exit={{ x: -264 }}
              transition={{ type: 'spring', stiffness: 350, damping: 35 }}>
              <SidebarContent onClose={() => setOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <header className="shrink-0 bg-white border-b border-slate-200 h-14 px-4 lg:px-6 flex items-center justify-between">
          <button className="lg:hidden p-2 rounded-lg hover:bg-slate-100" onClick={() => setOpen(true)}>
            <Menu size={20} />
          </button>
          <div className="ml-auto flex items-center gap-1.5 text-xs text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Système opérationnel
          </div>
        </header>

        <AnimatePresence mode="wait">
          <motion.main key={location.pathname}
            className="flex-1 overflow-y-auto p-4 lg:p-6"
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}>
            <Outlet />
          </motion.main>
        </AnimatePresence>
      </div>

      <Toaster position="top-right" toastOptions={{
        style: { fontFamily: "'Source Sans 3',sans-serif", fontSize: '13px', borderRadius: '12px', border: '1px solid #e2e8f0' },
        success: { iconTheme: { primary: '#16a34a', secondary: '#fff' } },
        error: { iconTheme: { primary: '#dc2626', secondary: '#fff' } },
      }} />
    </div>
  )
}
