import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { passwordResetApi } from '../../api/client'
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle') // idle | loading | success | error
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim()) return
    setStatus('loading')
    setError('')
    try {
      await passwordResetApi.forgotPassword(email.trim(), window.location.origin)
      setStatus('success')
    } catch (err) {
      setStatus('error')
      setError(err.response?.data?.error || 'Une erreur est survenue. Réessayez.')
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
          <h1 className="font-display text-2xl font-bold text-slate-900">Mot de passe oublié</h1>
          <p className="text-slate-500 text-sm mt-1">Saisissez votre email pour recevoir un lien de réinitialisation</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-7">
          {status === 'success' ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-emerald-600" />
              </div>
              <h2 className="font-semibold text-slate-800 text-lg mb-2">Email envoyé !</h2>
              <p className="text-slate-500 text-sm leading-relaxed mb-6">
                Si l'adresse <strong>{email}</strong> est associée à un compte, vous recevrez
                un lien de réinitialisation valable <strong>2 heures</strong>.
              </p>
              <p className="text-xs text-slate-400 mb-5">
                Vérifiez aussi vos spams. En développement, le lien s'affiche dans la console Django.
              </p>
              <Link to="/login"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#0f2444] hover:underline">
                <ArrowLeft size={16} />Retour à la connexion
              </Link>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm">
                  <AlertCircle size={16} className="shrink-0" />{error}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Adresse email
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    className="w-full border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f2444]/20 focus:border-[#0f2444] transition-all"
                    placeholder="votre@email.ci"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <motion.button
                type="submit"
                whileTap={{ scale: 0.97 }}
                disabled={status === 'loading' || !email.trim()}
                className="w-full bg-[#0f2444] hover:bg-[#1a3a6b] text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {status === 'loading' ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Mail size={16} />
                )}
                {status === 'loading' ? 'Envoi...' : 'Envoyer le lien'}
              </motion.button>

              <div className="text-center">
                <Link to="/login"
                  className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors">
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
