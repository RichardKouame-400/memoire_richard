import { motion, AnimatePresence } from 'framer-motion'
import { clsx } from 'clsx'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'

// ── Fade in wrapper ──────────────────────────────────────────
export const FadeIn = ({ children, delay = 0, className = '' }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.35, delay, ease: [0.25, 0.1, 0.25, 1] }}
    className={className}
  >
    {children}
  </motion.div>
)

// ── Stagger container ────────────────────────────────────────
export const StaggerList = ({ children, className = '' }) => (
  <motion.div
    initial="hidden"
    animate="visible"
    variants={{ visible: { transition: { staggerChildren: 0.07 } } }}
    className={className}
  >
    {children}
  </motion.div>
)

export const StaggerItem = ({ children, className = '' }) => (
  <motion.div
    variants={{
      hidden: { opacity: 0, y: 12 },
      visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
    }}
    className={className}
  >
    {children}
  </motion.div>
)

// ── Animated Card ────────────────────────────────────────────
export const Card = ({ children, className = '', hover = true, onClick }) => (
  <motion.div
    whileHover={hover ? { y: -2, boxShadow: '0 8px 30px rgba(0,0,0,0.08)' } : {}}
    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    className={clsx('bg-white rounded-2xl border border-slate-100 shadow-sm', className)}
    onClick={onClick}
  >
    {children}
  </motion.div>
)

// ── Stat card ────────────────────────────────────────────────
export const StatCard = ({ icon: Icon, label, value, color = 'blue', sub, trend }) => {
  const colors = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', icon: 'bg-blue-100' },
    green: { bg: 'bg-green-50', text: 'text-green-600', icon: 'bg-green-100' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600', icon: 'bg-amber-100' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600', icon: 'bg-purple-100' },
    red: { bg: 'bg-red-50', text: 'text-red-600', icon: 'bg-red-100' },
    navy: { bg: 'bg-slate-50', text: 'text-slate-700', icon: 'bg-slate-200' },
  }
  const c = colors[color] || colors.blue

  return (
    <Card className="p-5" hover>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 font-medium mb-1">{label}</p>
          <motion.p
            className={clsx('text-3xl font-bold font-display', c.text)}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, type: 'spring' }}
          >
            {value}
          </motion.p>
          {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
        </div>
        <div className={clsx('w-11 h-11 rounded-xl flex items-center justify-center', c.icon)}>
          <Icon size={22} className={c.text} />
        </div>
      </div>
    </Card>
  )
}

// ── Status badge ─────────────────────────────────────────────
const STATUS_MAP = {
  published: { label: 'Publié', cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  draft: { label: 'Brouillon', cls: 'bg-slate-100 text-slate-600 border-slate-200' },
  closed: { label: 'Clôturé', cls: 'bg-red-100 text-red-700 border-red-200' },
  evaluation: { label: 'Évaluation', cls: 'bg-amber-100 text-amber-700 border-amber-200' },
  attributed: { label: 'Attribué', cls: 'bg-blue-100 text-blue-700 border-blue-200' },
  cancelled: { label: 'Annulé', cls: 'bg-gray-100 text-gray-500 border-gray-200' },
  submitted: { label: 'Soumis', cls: 'bg-blue-100 text-blue-700 border-blue-200' },
  processing: { label: 'Traitement OCR', cls: 'bg-purple-100 text-purple-700 border-purple-200' },
  complete: { label: 'Complet', cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  incomplete: { label: 'Incomplet', cls: 'bg-orange-100 text-orange-700 border-orange-200' },
  elimine: { label: 'Éliminé', cls: 'bg-red-100 text-red-700 border-red-200' },
  evaluated: { label: 'Évalué', cls: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
}

export const StatusBadge = ({ status }) => {
  const s = STATUS_MAP[status] || { label: status, cls: 'bg-gray-100 text-gray-600 border-gray-200' }
  return (
    <span className={clsx('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border', s.cls)}>
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-60" />
      {s.label}
    </span>
  )
}

// ── Score bar ────────────────────────────────────────────────
export const ScoreBar = ({ score, max = 100, size = 'md' }) => {
  const pct = Math.min(100, (score / max) * 100)
  const color = pct >= 75 ? '#16a34a' : pct >= 50 ? '#f59e0b' : '#ef4444'

  return (
    <div className="flex items-center gap-3 w-full">
      <div className={clsx('flex-1 rounded-full bg-slate-100', size === 'sm' ? 'h-1.5' : 'h-2.5')}>
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
        />
      </div>
      <span className={clsx('font-semibold tabular-nums flex-shrink-0', size === 'sm' ? 'text-xs' : 'text-sm')}
        style={{ color }}>
        {score != null ? `${Number(score).toFixed(1)}` : '—'}
      </span>
    </div>
  )
}

// ── Modal ────────────────────────────────────────────────────
export const Modal = ({ open, onClose, title, children, size = 'md' }) => {
  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className={clsx('relative bg-white rounded-2xl shadow-2xl w-full', sizes[size])}
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
          >
            {title && (
              <div className="flex items-center justify-between p-6 border-b border-slate-100">
                <h3 className="font-display text-lg font-bold text-slate-800">{title}</h3>
                <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                  <X size={18} />
                </button>
              </div>
            )}
            <div className="p-6">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

// ── Empty state ──────────────────────────────────────────────
export const EmptyState = ({ icon: Icon, title, description, action }) => (
  <FadeIn className="flex flex-col items-center justify-center py-20 text-center">
    <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
      <Icon size={30} className="text-slate-400" />
    </div>
    <h3 className="font-display text-lg font-semibold text-slate-700 mb-1">{title}</h3>
    <p className="text-sm text-slate-400 max-w-xs mb-5">{description}</p>
    {action}
  </FadeIn>
)

// ── Loading spinner ──────────────────────────────────────────
export const Spinner = ({ size = 24 }) => (
  <div className="flex items-center justify-center">
    <motion.div
      className="border-4 border-slate-200 border-t-primary-500 rounded-full"
      style={{ width: size, height: size }}
      animate={{ rotate: 360 }}
      transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
    />
  </div>
)

// ── Page header ──────────────────────────────────────────────
export const PageHeader = ({ title, subtitle, actions, back }) => (
  <div className="flex items-start justify-between mb-6">
    <div>
      {back && (
        <motion.button whileTap={{ scale: 0.97 }} onClick={back.onClick}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary-600 mb-2 transition-colors">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {back.label}
        </motion.button>
      )}
      <h1 className="font-display text-2xl font-bold text-slate-900">{title}</h1>
      {subtitle && <p className="text-slate-500 mt-1 text-sm">{subtitle}</p>}
    </div>
    {actions && <div className="flex items-center gap-2 flex-shrink-0 ml-4">{actions}</div>}
  </div>
)

// ── Animated button ──────────────────────────────────────────
export const Btn = ({ children, variant = 'primary', onClick, disabled, loading, className = '', type = 'button', icon: Icon, size = 'md' }) => {
  const variants = {
    primary: 'bg-primary-500 hover:bg-primary-600 text-white shadow-sm hover:shadow',
    secondary: 'bg-white border border-slate-200 hover:border-primary-400 text-slate-700 hover:text-primary-600',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    success: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    ghost: 'text-slate-600 hover:bg-slate-100',
    amber: 'bg-amber-500 hover:bg-amber-600 text-white',
  }
  const sizes = {
    sm: 'px-3 py-1.5 text-xs rounded-lg',
    md: 'px-5 py-2.5 text-sm rounded-xl',
    lg: 'px-7 py-3.5 text-base rounded-xl',
  }

  return (
    <motion.button
      type={type}
      whileTap={{ scale: 0.97 }}
      whileHover={{ scale: disabled ? 1 : 1.01 }}
      onClick={onClick}
      disabled={disabled || loading}
      className={clsx(
        'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant], sizes[size], className
      )}
    >
      {loading ? (
        <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
      ) : Icon ? (
        <Icon size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} />
      ) : null}
      {children}
    </motion.button>
  )
}

// ── Input field ──────────────────────────────────────────────
export const Field = ({ label, error, required, children, hint }) => (
  <div className="space-y-1.5">
    {label && (
      <label className="block text-sm font-semibold text-slate-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
    )}
    {children}
    {hint && !error && <p className="text-xs text-slate-400">{hint}</p>}
    {error && <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle size={12} />{error}</p>}
  </div>
)

// ── Progress steps ───────────────────────────────────────────
export const Steps = ({ steps, current }) => (
  <div className="flex items-center gap-0 mb-8">
    {steps.map((step, i) => {
      const done = i < current
      const active = i === current
      return (
        <div key={i} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center">
            <motion.div
              className={clsx(
                'w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all',
                done ? 'bg-primary-500 border-primary-500 text-white' :
                  active ? 'bg-white border-primary-500 text-primary-600' :
                    'bg-white border-slate-200 text-slate-400'
              )}
              animate={{ scale: active ? 1.1 : 1 }}
            >
              {done ? <CheckCircle size={16} /> : i + 1}
            </motion.div>
            <span className={clsx('text-xs mt-1.5 font-medium whitespace-nowrap',
              active ? 'text-primary-600' : done ? 'text-slate-600' : 'text-slate-400')}>
              {step}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={clsx('flex-1 h-0.5 mb-5 mx-2 transition-all', done ? 'bg-primary-500' : 'bg-slate-200')} />
          )}
        </div>
      )
    })}
  </div>
)

// ── Toast wrapper (uses react-hot-toast) ─────────────────────
export { default as toast } from 'react-hot-toast'
