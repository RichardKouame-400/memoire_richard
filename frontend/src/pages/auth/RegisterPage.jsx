import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '../../api/client'
import { UserPlus, AlertCircle, CheckCircle } from 'lucide-react'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    username: '', email: '', password: '', password2: '',
    first_name: '', last_name: '', role: 'soumissionnaire',
    phone: '', company_name: '', rccm: '', nif: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await authApi.register(form)
      setSuccess(true)
      setTimeout(() => navigate('/login'), 2000)
    } catch (err) {
      const data = err.response?.data
      if (data) {
        const msgs = Object.entries(data).map(([k, v]) => `${k}: ${Array.isArray(v) ? v[0] : v}`).join(' | ')
        setError(msgs)
      } else {
        setError('Erreur lors de l\'inscription.')
      }
    } finally {
      setLoading(false)
    }
  }

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  if (success) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="card text-center max-w-md w-full">
        <CheckCircle size={48} className="text-accent-500 mx-auto mb-4" />
        <h2 className="font-display text-2xl font-bold text-slate-800 mb-2">Compte créé !</h2>
        <p className="text-slate-500">Redirection vers la connexion...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-xl animate-fade-in">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-primary-800 flex items-center justify-center text-white font-bold mx-auto mb-3">
            DAO
          </div>
          <h1 className="font-display text-2xl font-bold text-slate-800">Créer un compte</h1>
        </div>

        <div className="card">
          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Prénom</label>
                <input className="input-field" placeholder="Prénom" value={form.first_name} onChange={set('first_name')} />
              </div>
              <div>
                <label className="label">Nom</label>
                <input className="input-field" placeholder="Nom de famille" value={form.last_name} onChange={set('last_name')} />
              </div>
            </div>

            <div>
              <label className="label">Nom d'utilisateur *</label>
              <input className="input-field" placeholder="ex: btpsolutions_ci" value={form.username} onChange={set('username')} required />
            </div>

            <div>
              <label className="label">Email *</label>
              <input type="email" className="input-field" placeholder="email@entreprise.com" value={form.email} onChange={set('email')} required />
            </div>

            <div>
              <label className="label">Type de compte *</label>
              <select className="input-field" value={form.role} onChange={set('role')}>
                <option value="soumissionnaire">Soumissionnaire (Fournisseur)</option>
                <option value="acheteur">Acheteur Public</option>
                <option value="evaluateur">Évaluateur</option>
                <option value="auditeur">Auditeur</option>
              </select>
            </div>

            {form.role === 'soumissionnaire' && (
              <div className="space-y-3 border-t border-slate-100 pt-3">
                <p className="text-sm font-semibold text-slate-600">Informations entreprise</p>
                <div>
                  <label className="label">Nom de l'entreprise</label>
                  <input className="input-field" placeholder="BTP Solutions CI SARL" value={form.company_name} onChange={set('company_name')} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">RCCM</label>
                    <input className="input-field" placeholder="CI-ABJ-2020-B-XXXXX" value={form.rccm} onChange={set('rccm')} />
                  </div>
                  <div>
                    <label className="label">NIF</label>
                    <input className="input-field" placeholder="2020A1234567" value={form.nif} onChange={set('nif')} />
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Mot de passe *</label>
                <input type="password" className="input-field" placeholder="Min. 8 caractères" value={form.password} onChange={set('password')} required minLength={8} />
              </div>
              <div>
                <label className="label">Confirmation *</label>
                <input type="password" className="input-field" placeholder="Répéter" value={form.password2} onChange={set('password2')} required />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <UserPlus size={18} />}
              {loading ? 'Création...' : 'Créer le compte'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-4">
            Déjà un compte ?{' '}
            <Link to="/login" className="text-primary-500 font-semibold hover:underline">Se connecter</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
