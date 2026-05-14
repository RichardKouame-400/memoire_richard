import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../../hooks/useAuth'
import { Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react'

const DEMO = [
  { username: 'admin', password: 'admin123', role: 'Super Admin', color: 'bg-red-500' },
  { username: 'acheteur1', password: 'password123', role: 'Acheteur', color: 'bg-blue-500' },
  { username: 'evaluateur1', password: 'password123', role: 'Évaluateur', color: 'bg-purple-500' },
  { username: 'btpsolutions', password: 'password123', role: 'Soumissionnaire', color: 'bg-emerald-500' },
]

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(form.username, form.password)
      navigate('/app/dashboard')
    } catch {
      setError("Identifiants incorrects. Vérifiez votre nom d'utilisateur et mot de passe.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0f2444] flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-white/3" />
          <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-emerald-500/10 translate-x-1/3 translate-y-1/3" />
        </div>
        <div className="relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-white font-bold shadow-lg mb-8">DAO</div>
          <h1 className="font-display text-4xl font-bold text-white leading-tight mb-4">
            Plateforme Numérique<br />d'Évaluation des<br />Appels d'Offres
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed">
            Transparence algorithmique, piste d'audit complète, extraction OCR automatique.
          </p>
        </div>
        <div className="relative z-10 space-y-3">
          {['Scoring pondéré automatique', "Extraction OCR des dossiers", "Piste d'audit RGPD", 'Conformité marchés publics CI'].map(f => (
            <div key={f} className="flex items-center gap-3 text-slate-300">
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
              </div>
              <span className="text-sm">{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50">
        <div className="w-full max-w-md">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <div className="lg:hidden text-center mb-8">
              <div className="w-12 h-12 rounded-2xl bg-[#0f2444] flex items-center justify-center text-white font-bold mx-auto mb-3">DAO</div>
              <h1 className="font-display text-2xl font-bold text-slate-800">DAO Platform</h1>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-7">
              <h2 className="font-display text-2xl font-bold text-slate-800 mb-1">Connexion</h2>
              <p className="text-slate-500 text-sm mb-6">Accédez à votre espace sécurisé</p>

              {error && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 mb-5 text-sm">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />{error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nom d'utilisateur</label>
                  <input type="text" className="input-field" placeholder="Votre identifiant"
                    value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} required autoComplete="username" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-sm font-semibold text-slate-700">Mot de passe</label>
                    <Link to="/forgot-password" className="text-xs text-[#0f2444] hover:underline font-medium">
                      Mot de passe oublié ?
                    </Link>
                  </div>
                  <div className="relative">
                    <input type={showPwd ? 'text' : 'password'} className="input-field pr-10"
                      placeholder="••••••••" autoComplete="current-password"
                      value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
                    <button type="button" onClick={() => setShowPwd(!showPwd)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <motion.button type="submit" whileTap={{ scale: 0.97 }} disabled={loading}
                  className="w-full bg-[#0f2444] hover:bg-[#1a3a6b] text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                  {loading
                    ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <LogIn size={18} />}
                  {loading ? 'Connexion...' : 'Se connecter'}
                </motion.button>
              </form>

              <p className="text-center text-sm text-slate-500 mt-4">
                Pas de compte ?{' '}
                <Link to="/register" className="text-[#0f2444] font-semibold hover:underline">S'inscrire</Link>
              </p>
            </div>

            {/* Demo accounts */}
            <div className="mt-5">
              <p className="text-xs text-slate-400 text-center mb-3 font-semibold uppercase tracking-wide">Comptes de démonstration</p>
              <div className="grid grid-cols-2 gap-2">
                {DEMO.map(acc => (
                  <button key={acc.username}
                    onClick={() => setForm({ username: acc.username, password: acc.password })}
                    className="flex items-center gap-2.5 bg-white border border-slate-200 rounded-xl p-2.5 text-left hover:border-[#0f2444]/30 hover:bg-slate-50 transition-all">
                    <div className={`w-7 h-7 rounded-full ${acc.color} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                      {acc.role[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-700 truncate">{acc.role}</p>
                      <p className="text-xs text-slate-400 truncate">{acc.username}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 flex items-center justify-center gap-4 text-xs text-slate-400">
              <Link to="/" className="hover:text-slate-600 transition-colors">Accueil</Link>
              <span>·</span>
              <Link to="/privacy" className="hover:text-slate-600 transition-colors">Confidentialité</Link>
              <span>·</span>
              <Link to="/terms" className="hover:text-slate-600 transition-colors">CGU</Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
