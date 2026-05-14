import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { authApi } from '../../api/client'
import { FadeIn, StaggerList, StaggerItem, Card, PageHeader, Spinner, EmptyState, Btn, Modal, Field } from '../../components/ui'
import { Users, Search, Mail, Phone, Building } from 'lucide-react'
import { ROLE_LABELS } from '../../hooks/useAuth'

const ROLE_COLORS = {
  super_admin: 'bg-red-100 text-red-700',
  acheteur: 'bg-blue-100 text-blue-700',
  evaluateur: 'bg-purple-100 text-purple-700',
  soumissionnaire: 'bg-emerald-100 text-emerald-700',
  auditeur: 'bg-slate-100 text-slate-600',
}

export default function UsersPage() {
  const [search, setSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => authApi.users().then(r => r.data),
  })

  const users = Array.isArray(data) ? data : (data?.results || [])

  const filtered = users.filter(u => {
    if (!search) return true
    return (
      u.username?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.display_name?.toLowerCase().includes(search.toLowerCase())
    )
  })

  return (
    <div className="max-w-5xl space-y-5">
      <PageHeader
        title="Gestion des utilisateurs"
        subtitle={`${users.length} utilisateur${users.length > 1 ? 's' : ''} enregistré${users.length > 1 ? 's' : ''}`}
      />

      <FadeIn>
        <Card className="p-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className="input-field pl-9" placeholder="Rechercher par nom, email, username..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </Card>
      </FadeIn>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Users} title="Aucun utilisateur" description="Aucun résultat pour votre recherche." />
      ) : (
        <StaggerList className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map(u => (
            <StaggerItem key={u.id}>
              <motion.div
                whileHover={{ y: -2 }}
                onClick={() => setSelectedUser(u)}
                className="bg-white rounded-2xl border border-slate-100 p-4 cursor-pointer hover:shadow-md transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-full bg-primary-50 border-2 border-primary-100 flex items-center justify-center font-bold text-primary-700 shrink-0 uppercase">
                    {u.display_name?.[0] || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-slate-900 truncate">{u.display_name}</p>
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${ROLE_COLORS[u.role] || 'bg-slate-100 text-slate-600'}`}>
                        {ROLE_LABELS[u.role] || u.role}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">@{u.username}</p>
                    {u.email && (
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <Mail size={11} />{u.email}
                      </p>
                    )}
                    {u.company_name && (
                      <p className="text-xs text-slate-500 font-medium mt-0.5">{u.company_name}</p>
                    )}
                  </div>
                  <div className={`w-2 h-2 rounded-full mt-1 shrink-0 ${u.is_verified ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                </div>
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerList>
      )}

      {/* User detail modal */}
      <Modal open={!!selectedUser} onClose={() => setSelectedUser(null)}
        title={selectedUser?.display_name} size="sm">
        {selectedUser && (
          <div className="space-y-3">
            {[
              ['Username', selectedUser.username],
              ['Email', selectedUser.email],
              ['Rôle', ROLE_LABELS[selectedUser.role]],
              ['Organisation', selectedUser.organization_detail?.name || '—'],
              ['Téléphone', selectedUser.phone || '—'],
              ['RCCM', selectedUser.rccm || '—'],
              ['NIF', selectedUser.nif || '—'],
              ['Vérifié', selectedUser.is_verified ? '✅ Oui' : '❌ Non'],
              ['Inscrit le', selectedUser.date_joined ? new Date(selectedUser.date_joined).toLocaleDateString('fr-FR') : '—'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between py-1.5 border-b border-slate-100 last:border-0">
                <span className="text-xs text-slate-400">{k}</span>
                <span className="text-sm font-medium text-slate-800">{v}</span>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  )
}
