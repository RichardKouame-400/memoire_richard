import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { submissionsApi } from '../../api/client'
import { useAuth } from '../../hooks/useAuth'
import {
  FadeIn, StaggerList, StaggerItem, Card, StatusBadge, PageHeader,
  Btn, EmptyState, Spinner, ScoreBar
} from '../../components/ui'
import { Send, Search, ChevronRight, Upload, CheckCircle, Clock, FileText } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export default function SubmissionListPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [tenderId, setTenderId] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['submissions', search, status],
    queryFn: () => submissionsApi.list({ status: status || undefined }).then(r => r.data),
  })

  const submissions = data?.results || []
  const isSoumissionnaire = user?.role === 'soumissionnaire'

  const filtered = submissions.filter(s => {
    if (!search) return true
    return (
      s.tender_reference?.toLowerCase().includes(search.toLowerCase()) ||
      s.tender_title?.toLowerCase().includes(search.toLowerCase()) ||
      s.submitter_name?.toLowerCase().includes(search.toLowerCase())
    )
  })

  return (
    <div className="max-w-6xl space-y-5">
      <PageHeader
        title={isSoumissionnaire ? 'Mes soumissions' : 'Soumissions reçues'}
        subtitle={`${filtered.length} soumission${filtered.length > 1 ? 's' : ''}`}
        actions={isSoumissionnaire && (
          <Btn icon={Send} onClick={() => navigate('/app/tenders')}>
            Soumettre une offre
          </Btn>
        )}
      />

      {/* Filters */}
      <FadeIn>
        <Card className="p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className="input-field pl-9" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="input-field sm:w-48" value={status} onChange={e => setStatus(e.target.value)}>
            <option value="">Tous les statuts</option>
            <option value="draft">Brouillon</option>
            <option value="submitted">Soumis</option>
            <option value="processing">Traitement OCR</option>
            <option value="complete">Complet</option>
            <option value="evaluated">Évalué</option>
            <option value="elimine">Éliminé</option>
          </select>
        </Card>
      </FadeIn>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Send}
          title="Aucune soumission"
          description={isSoumissionnaire ? "Vous n'avez pas encore soumis d'offre. Consultez les AO ouverts." : "Aucune soumission reçue pour l'instant."}
          action={isSoumissionnaire && (
            <Btn icon={FileText} onClick={() => navigate('/app/tenders')}>Voir les AO ouverts</Btn>
          )}
        />
      ) : (
        <StaggerList className="space-y-3">
          {filtered.map((s) => (
            <StaggerItem key={s.id}>
              <Link to={`/app/submissions/${s.id}`}>
                <motion.div
                  whileHover={{ y: -1, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}
                  className="bg-white rounded-2xl border border-slate-100 p-5 flex gap-4 cursor-pointer group transition-all"
                >
                  {/* Status icon */}
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    s.status === 'evaluated' ? 'bg-emerald-50' :
                    s.status === 'elimine' ? 'bg-red-50' :
                    s.status === 'processing' ? 'bg-purple-50' : 'bg-blue-50'
                  }`}>
                    {s.status === 'evaluated' ? <CheckCircle size={20} className="text-emerald-600" /> :
                     s.status === 'processing' ? <Clock size={20} className="text-purple-600" /> :
                     <Send size={20} className="text-blue-600" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono text-slate-400">{s.tender_reference}</span>
                      <StatusBadge status={s.status} />
                      {s.rank && (
                        <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">
                          Rang #{s.rank}
                        </span>
                      )}
                    </div>
                    <p className="text-[15px] font-semibold text-slate-900 mt-1 truncate">{s.tender_title}</p>
                    {!isSoumissionnaire && (
                      <p className="text-sm text-slate-500 mt-0.5">{s.submitter_name}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                      {s.price_ht && (
                        <span className="font-semibold text-slate-600">
                          {Number(s.price_ht).toLocaleString('fr-FR')} FCFA HT
                        </span>
                      )}
                      {s.execution_delay && <span>{s.execution_delay} jours</span>}
                      {s.submitted_at && (
                        <span>Soumis le {format(new Date(s.submitted_at), 'd MMM yyyy', { locale: fr })}</span>
                      )}
                    </div>
                  </div>

                  {s.total_score != null && (
                    <div className="w-28 shrink-0 flex flex-col justify-center">
                      <p className="text-[11px] text-slate-400 mb-1.5">Score</p>
                      <ScoreBar score={s.total_score} size="sm" />
                    </div>
                  )}

                  <ChevronRight size={18} className="text-slate-300 group-hover:text-primary-500 transition-colors shrink-0 self-center" />
                </motion.div>
              </Link>
            </StaggerItem>
          ))}
        </StaggerList>
      )}
    </div>
  )
}
