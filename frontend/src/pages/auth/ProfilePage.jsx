import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { authApi } from '../../api/client'
import { useAuth, ROLE_LABELS } from '../../hooks/useAuth'
import { FadeIn, Card, PageHeader, Btn, Field } from '../../components/ui'
import { User, Lock, Save } from 'lucide-react'

export default function ProfilePage() {
  const { user, fetchMe } = useAuth()
  const [profileForm, setProfileForm] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    company_name: user?.company_name || '',
    rccm: user?.rccm || '',
    nif: user?.nif || '',
  })
  const [pwdForm, setPwdForm] = useState({ old_password: '', new_password: '' })

  const profileMut = useMutation({
    mutationFn: (data) => authApi.updateProfile(data),
    onSuccess: () => { toast.success('Profil mis à jour !'); fetchMe() },
    onError: () => toast.error('Erreur lors de la mise à jour.'),
  })

  const pwdMut = useMutation({
    mutationFn: (data) => authApi.changePassword(data),
    onSuccess: () => { toast.success('Mot de passe modifié !'); setPwdForm({ old_password: '', new_password: '' }) },
    onError: (e) => toast.error(e.response?.data?.error || 'Erreur'),
  })

  const set = (form, setForm) => (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))

  return (
    <div className="max-w-2xl space-y-5">
      <PageHeader title="Mon profil" subtitle="Gérer vos informations personnelles" />

      {/* Profile header */}
      <FadeIn>
        <Card className="p-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary-500 flex items-center justify-center text-white text-2xl font-bold uppercase shadow">
            {user?.display_name?.[0] || '?'}
          </div>
          <div>
            <p className="font-display text-xl font-bold text-slate-900">{user?.display_name}</p>
            <p className="text-sm text-slate-500">{ROLE_LABELS[user?.role]}</p>
            <p className="text-xs text-slate-400">@{user?.username}</p>
          </div>
        </Card>
      </FadeIn>

      {/* Edit profile */}
      <FadeIn delay={0.1}>
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-5">
            <User size={18} className="text-primary-600" />
            <h2 className="font-semibold text-slate-800">Informations personnelles</h2>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Prénom">
                <input className="input-field" value={profileForm.first_name}
                  onChange={set(profileForm, setProfileForm)('first_name')} />
              </Field>
              <Field label="Nom">
                <input className="input-field" value={profileForm.last_name}
                  onChange={set(profileForm, setProfileForm)('last_name')} />
              </Field>
            </div>
            <Field label="Email">
              <input type="email" className="input-field" value={profileForm.email}
                onChange={set(profileForm, setProfileForm)('email')} />
            </Field>
            <Field label="Téléphone">
              <input className="input-field" placeholder="+225 XX XX XX XX XX" value={profileForm.phone}
                onChange={set(profileForm, setProfileForm)('phone')} />
            </Field>
            {user?.role === 'soumissionnaire' && (
              <>
                <Field label="Nom de l'entreprise">
                  <input className="input-field" value={profileForm.company_name}
                    onChange={set(profileForm, setProfileForm)('company_name')} />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="RCCM">
                    <input className="input-field" value={profileForm.rccm}
                      onChange={set(profileForm, setProfileForm)('rccm')} />
                  </Field>
                  <Field label="NIF">
                    <input className="input-field" value={profileForm.nif}
                      onChange={set(profileForm, setProfileForm)('nif')} />
                  </Field>
                </div>
              </>
            )}
            <div className="flex justify-end">
              <Btn icon={Save} loading={profileMut.isLoading}
                onClick={() => profileMut.mutate(profileForm)}>
                Sauvegarder
              </Btn>
            </div>
          </div>
        </Card>
      </FadeIn>

      {/* Change password */}
      <FadeIn delay={0.15}>
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-5">
            <Lock size={18} className="text-primary-600" />
            <h2 className="font-semibold text-slate-800">Changer le mot de passe</h2>
          </div>
          <div className="space-y-4">
            <Field label="Mot de passe actuel">
              <input type="password" className="input-field"
                value={pwdForm.old_password}
                onChange={e => setPwdForm(f => ({ ...f, old_password: e.target.value }))} />
            </Field>
            <Field label="Nouveau mot de passe" hint="Minimum 8 caractères">
              <input type="password" className="input-field"
                value={pwdForm.new_password}
                onChange={e => setPwdForm(f => ({ ...f, new_password: e.target.value }))} />
            </Field>
            <div className="flex justify-end">
              <Btn icon={Lock} variant="secondary" loading={pwdMut.isLoading}
                onClick={() => pwdMut.mutate(pwdForm)}
                disabled={!pwdForm.old_password || pwdForm.new_password.length < 8}>
                Modifier le mot de passe
              </Btn>
            </div>
          </div>
        </Card>
      </FadeIn>
    </div>
  )
}
