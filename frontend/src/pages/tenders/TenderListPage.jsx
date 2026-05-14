import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { tendersApi } from '../../api/client'
import { useAuth } from '../../hooks/useAuth'
import {
  FadeIn, StaggerList, StaggerItem, Card, StatusBadge, PageHeader, Btn, EmptyState, Spinner
} from '../../components/ui'
import {
  FileText, Plus, Search, Filter, Calendar, DollarSign,
  Building, Users, ChevronRight, Clock, Tag
} from 'lucide-react'

const TYPE_LABELS = {
  travaux: 'Travaux',
  fournitures: 'Fournitures',
  services: 'Services',
  prestations: 'Prestations',
}

const TYPE_COLORS = {
  travaux: 'bg-orange-100 text-orange-700',
  fournitures: 'bg-blue-100 text-blue-700',
  services: 'bg-purple-100 text-purple-700',
  prestations: 'bg-teal-100 text-teal-700',
}

function formatFCFA(n) {
  if (!n) return null
  const num = Number(n)
  if (num >= 1e9) return `${(num / 1e9).toFixed(1)} Mrd FCFA`
  if (num >= 1e6) return `${(num / 1e6).toFixed(0)} M FCFA`
  return `${num.toLocaleString('fr-FR')} FCFA`
}

export default function TenderListPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [type, setType] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['tenders', search, status, type],
    queryFn: () => tendersApi.list({
      search: search || undefined,
      status: status || undefined,
      tender_type: type || undefined,
    }).then(r => r.data),
    keepPreviousData: true,
  })

  const tenders = data?.results || []
  const canCreate = ['acheteur', 'super_admin'].includes(user?.role)

  return (
    <div className="max-w-7xl space-y-5">
      <PageHeader
        title="Appels d'offres"
        subtitle={`${data?.count || 0} appel${(data?.count || 0) > 1 ? 's' : ''} d'offres`}
        actions={canCreate && (
          <Btn icon={Plus} onClick={() => navigate('/tenders/create')}>
            Créer un AO
          </Btn>
        )}
      />

      {/* Filters */}
      <FadeIn>
        <Card className="p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="input-field pl-9"
              placeholder="Rechercher par titre, référence..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            className="input-field sm:w-44"
            value={status}
            onChange={e => setStatus(e.target.value)}
          >
            <option value="">Tous les statuts</option>
            <option value="published">Publiés</option>
            <option value="evaluation">Évaluation</option>
            <option value="attributed">Attribués</option>
            <option value="closed">Clôturés</option>
            {canCreate && <option value="draft">Brouillons</option>}
          </select>
          <select
            className="input-field sm:w-44"
            value={type}
            onChange={e => setType(e.target.value)}
          >
            <option value="">Tous les types</option>
            <option value="travaux">Travaux</option>
            <option value="fournitures">Fournitures</option>
            <option value="services">Services</option>
            <option value="prestations">Prestations</option>
          </select>
        </Card>
      </FadeIn>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : tenders.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Aucun appel d'offres trouvé"
          description="Modifiez vos filtres ou créez un nouvel AO."
          action={canCreate && <Btn icon={Plus} onClick={() => navigate('/tenders/create')}>Créer le premier AO</Btn>}
        />
      ) : (
        <StaggerList className="space-y-3">
          {tenders.map((t) => (
            <StaggerItem key={t.id}>
              <Link to={`/app/tenders/${t.id}`}>
                <motion.div
                  whileHover={{ y: -1, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}
                  className="bg-white rounded-2xl border border-slate-100 p-5 flex gap-4 cursor-pointer transition-all group"
                >
                  {/* Icon */}
                  <div className="w-12 h-12 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center shrink-0 mt-0.5">
                    <FileText size={22} className="text-primary-600" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 flex-wrap">
                      <span className="text-xs font-mono text-slate-400 bg-slate-50 px-2 py-0.5 rounded">
                        {t.reference}
                      </span>
                      <StatusBadge status={t.status} />
                      {t.tender_type && (
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${TYPE_COLORS[t.tender_type] || 'bg-slate-100 text-slate-600'}`}>
                          {TYPE_LABELS[t.tender_type] || t.tender_type}
                        </span>
                      )}
                    </div>

                    <h3 className="text-[15px] font-semibold text-slate-900 mt-1.5 mb-2 leading-snug">
                      {t.title}
                    </h3>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                      {t.organization_name && (
                        <span className="flex items-center gap-1.5">
                          <Building size={12} />
                          {t.organization_name}
                        </span>
                      )}
                      {t.budget_public && t.budget_estimated && (
                        <span className="flex items-center gap-1.5 font-semibold text-slate-600">
                          <DollarSign size={12} />
                          {formatFCFA(t.budget_estimated)}
                        </span>
                      )}
                      {t.sector && (
                        <span className="flex items-center gap-1.5">
                          <Tag size={12} />
                          {t.sector}
                        </span>
                      )}
                      <span className="flex items-center gap-1.5">
                        <Users size={12} />
                        {t.submissions_count} soumission{t.submissions_count > 1 ? 's' : ''}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Calendar size={12} />
                        Clôture: {t.deadline ? new Date(t.deadline).toLocaleDateString('fr-FR') : '—'}
                      </span>
                      {t.is_open && t.days_remaining > 0 && (
                        <span className="flex items-center gap-1 text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded-full">
                          <Clock size={11} />
                          J-{t.days_remaining}
                        </span>
                      )}
                    </div>
                  </div>

                  <ChevronRight size={18} className="text-slate-300 group-hover:text-primary-500 transition-colors shrink-0 mt-1" />
                </motion.div>
              </Link>
            </StaggerItem>
          ))}
        </StaggerList>
      )}

      {/* Pagination */}
      {data?.next && (
        <FadeIn className="flex justify-center pt-2">
          <Btn variant="secondary" onClick={() => {}}>Charger plus</Btn>
        </FadeIn>
      )}
    </div>
  )
}
