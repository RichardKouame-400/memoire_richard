import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { auditApi } from '../../api/client'
import { FadeIn, StaggerList, StaggerItem, Card, PageHeader, Spinner, EmptyState } from '../../components/ui'
import { Shield, Search, FileText, LogIn, CheckSquare, Award, Edit3, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

const ACTION_ICONS = {
  create: <FileText size={14} className="text-emerald-600" />,
  update: <Edit3 size={14} className="text-amber-600" />,
  delete: <Trash2 size={14} className="text-red-600" />,
  publish: <FileText size={14} className="text-blue-600" />,
  submit: <CheckSquare size={14} className="text-blue-600" />,
  evaluate: <CheckSquare size={14} className="text-purple-600" />,
  attribute: <Award size={14} className="text-amber-600" />,
  login: <LogIn size={14} className="text-slate-500" />,
  logout: <LogIn size={14} className="text-slate-400" />,
}

const ACTION_COLORS = {
  create: 'bg-emerald-50 border-emerald-100',
  update: 'bg-amber-50 border-amber-100',
  delete: 'bg-red-50 border-red-100',
  publish: 'bg-blue-50 border-blue-100',
  submit: 'bg-blue-50 border-blue-100',
  evaluate: 'bg-purple-50 border-purple-100',
  attribute: 'bg-amber-50 border-amber-100',
  login: 'bg-slate-50 border-slate-100',
  logout: 'bg-slate-50 border-slate-100',
}

export default function AuditPage() {
  const [search, setSearch] = useState('')
  const [action, setAction] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['audit', search, action],
    queryFn: () => auditApi.logs({ search: search || undefined, action: action || undefined }).then(r => r.data),
    keepPreviousData: true,
  })

  const logs = data?.results || []

  return (
    <div className="max-w-5xl space-y-5">
      <PageHeader
        title="Piste d'audit"
        subtitle="Traçabilité complète de toutes les actions sur la plateforme"
      />

      {/* Filters */}
      <FadeIn>
        <Card className="p-4 flex gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className="input-field pl-9" placeholder="Rechercher utilisateur, objet..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="input-field sm:w-48" value={action} onChange={e => setAction(e.target.value)}>
            <option value="">Toutes les actions</option>
            <option value="create">Création</option>
            <option value="update">Modification</option>
            <option value="publish">Publication</option>
            <option value="submit">Soumission</option>
            <option value="evaluate">Évaluation</option>
            <option value="attribute">Attribution</option>
            <option value="login">Connexion</option>
          </select>
        </Card>
      </FadeIn>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : logs.length === 0 ? (
        <EmptyState icon={Shield} title="Aucun log d'audit" description="Les actions sur la plateforme apparaîtront ici." />
      ) : (
        <FadeIn delay={0.1}>
          <Card className="overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center gap-2">
              <Shield size={16} className="text-primary-600" />
              <span className="text-sm font-semibold text-slate-700">{data?.count || logs.length} entrées</span>
            </div>

            <div className="divide-y divide-slate-50">
              {logs.map((log, i) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className="flex items-start gap-4 p-4 hover:bg-slate-50/60 transition-colors"
                >
                  {/* Icon */}
                  <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${ACTION_COLORS[log.action] || 'bg-slate-50 border-slate-100'}`}>
                    {ACTION_ICONS[log.action] || <FileText size={14} className="text-slate-400" />}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-slate-800">{log.user_name || 'Système'}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${ACTION_COLORS[log.action] || ''}`}>
                        {log.action}
                      </span>
                      <span className="text-xs text-slate-500">{log.model_name}</span>
                      {log.object_repr && (
                        <span className="text-xs text-slate-400 font-mono truncate max-w-xs">
                          "{log.object_repr}"
                        </span>
                      )}
                    </div>
                    {log.description && (
                      <p className="text-xs text-slate-500 mt-0.5">{log.description}</p>
                    )}
                  </div>

                  {/* Timestamp + IP */}
                  <div className="text-right shrink-0">
                    <p className="text-xs text-slate-600 font-medium">
                      {format(new Date(log.timestamp), 'd MMM HH:mm', { locale: fr })}
                    </p>
                    {log.ip_address && (
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">{log.ip_address}</p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        </FadeIn>
      )}
    </div>
  )
}
