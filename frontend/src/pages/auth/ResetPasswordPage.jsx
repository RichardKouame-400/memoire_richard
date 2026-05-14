import { useState, useEffect } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { passwordResetApi } from '../../api/client'
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react'

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')

  const [tokenStatus, setTokenStatus] = useState('checking') // checking | valid | invalid
  const [tokenEmail, setTokenEmail] = useState('')
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [status, setStatus] = useState('idle') // idle | loading | success | error
  const [error, setError] = useState('')

  // Validate token on mount
  useEffect(() => {
    if (!token) {
      setTokenStatus('invalid')
      return
    }
    passwordResetApi.validateToken(token)
      .then(res => {
        if (res.data.valid) {
          setTokenStatus('valid')
          setTokenEmail(res.data.email || '')
        } else {
          setTokenStatus('invalid')
          setError(res.data.error || 'Token invalide.')
        }
      })
      .catch(() => setTokenStatus('invalid'))
  }, [token])

  const strength = (pwd) => {
    let s = 0
    if (pwd.length >= 8) s++
    if (/[A-Z]/.test(pwd)) s++
    if (/[0-9]/.test(pwd)) s++
    if (/[^A-Za-z0-9]/.test(pwd)) s++
    return s
  }
  const pwdStrength = strength(password)
  const strengthLabels = ['', 'Faible', 'Moyen', 'Bon', 'Fort']
  const strengthColors = ['', 'bg-red-400', 'bg-amber-400', 'bg-blue-400', 'bg-emerald-500']

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (password !== password2) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }
    if (password.length < 8) {
      setError('Le mot de passe doit avoir au moins 8 caractères.')
      return
    }
    setStatus('loading')
    setError('')
    try {
      await passwordResetApi.resetPassword(token, password)
      setStatus('success')
      setTimeout(() => navigate('/login'), 3000)
    } catch (err) {
      setStatus('error')
      setError(err.response?.data?.error || 'Erreur. Le lien est peut-être expiré.')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-[#0f2444] flex items-center justify-center text-white font-bold text-lg mx-auto mb-4 shadow-lg">
            DAO
          </div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Nouveau mot de passe</h1>
          {tokenEmail && (
            <p className="text-slate-500 text-sm mt-1">Compte : <strong>{tokenEmail}</strong></p>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-7">
          {tokenStatus === 'checking' && (
            <div className="flex flex-col items-center py-8 gap-3">
              <div className="w-8 h-8 border-3 border-[#0f2444]/20 border-t-[#0f2444] rounded-full animate-spin" />
              <p className="text-sm text-slate-500">Vérification du lien...</p>
            </div>
          )}

          {tokenStatus === 'invalid' && (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={30} className="text-red-600" />
              </div>
              <h2 className="font-semibold text-slate-800 text-lg mb-2">Lien invalide ou expiré</h2>
              <p className="text-slate-500 text-sm mb-6">
                {error || 'Ce lien de réinitialisation n\'est plus valide. Il a peut-être déjà été utilisé ou a expiré (2 heures).'}
              </p>
              <Link to="/forgot-password"
                className="inline-block bg-[#0f2444] text-white font-semibold px-6 py-2.5 rounded-xl text-sm hover:bg-[#1a3a6b] transition-all">
                Faire une nouvelle demande
              </Link>
            </div>
          )}

          {tokenStatus === 'valid' && status === 'success' && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-emerald-600" />
              </div>
              <h2 className="font-semibold text-slate-800 text-lg mb-2">Mot de passe modifié !</h2>
              <p className="text-slate-500 text-sm mb-4">
                Votre mot de passe a été réinitialisé avec succès. Vous allez être redirigé vers la connexion.
              </p>
              <div className="w-full bg-slate-100 rounded-full h-1 overflow-hidden">
                <motion.div className="h-full bg-emerald-500 rounded-full"
                  initial={{ width: 0 }} animate={{ width: '100%' }}
                  transition={{ duration: 3 }} />
              </div>
            </motion.div>
          )}

          {tokenStatus === 'valid' && status !== 'success' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm">
                  <AlertCircle size={16} className="shrink-0" />{error}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Nouveau mot de passe
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPwd ? 'text' : 'password'}
                    className="w-full border border-slate-200 rounded-xl pl-9 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f2444]/20 focus:border-[#0f2444]"
                    placeholder="Minimum 8 caractères"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                  <button type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    onClick={() => setShowPwd(!showPwd)}>
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {/* Strength indicator */}
                {password && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i <= pwdStrength ? strengthColors[pwdStrength] : 'bg-slate-100'}`} />
                      ))}
                    </div>
                    <p className={`text-xs ${pwdStrength <= 1 ? 'text-red-500' : pwdStrength === 2 ? 'text-amber-500' : 'text-emerald-600'}`}>
                      Force : {strengthLabels[pwdStrength]}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Confirmer le mot de passe
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPwd ? 'text' : 'password'}
                    className={`w-full border rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 transition-all ${
                      password2 && password !== password2
                        ? 'border-red-300 focus:ring-red-200 focus:border-red-400'
                        : 'border-slate-200 focus:ring-[#0f2444]/20 focus:border-[#0f2444]'
                    }`}
                    placeholder="Répétez le mot de passe"
                    value={password2}
                    onChange={e => setPassword2(e.target.value)}
                    required
                  />
                </div>
                {password2 && password !== password2 && (
                  <p className="text-xs text-red-500 mt-1">Les mots de passe ne correspondent pas.</p>
                )}
              </div>

              <motion.button
                type="submit"
                whileTap={{ scale: 0.97 }}
                disabled={status === 'loading' || password !== password2 || password.length < 8}
                className="w-full bg-[#0f2444] hover:bg-[#1a3a6b] text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
              >
                {status === 'loading' ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <CheckCircle size={16} />
                )}
                {status === 'loading' ? 'Enregistrement...' : 'Confirmer le nouveau mot de passe'}
              </motion.button>

              <div className="text-center">
                <Link to="/login"
                  className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-700">
                  <ArrowLeft size={14} />Retour à la connexion
                </Link>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  )
}
