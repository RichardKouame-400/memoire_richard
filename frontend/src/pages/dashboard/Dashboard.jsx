import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { tendersApi, submissionsApi } from '../../api/client'
import {
  FadeIn, StaggerList, StaggerItem, StatCard, Card, StatusBadge, ScoreBar, Spinner, PageHeader, Btn
} from '../../components/ui'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import {
  FileText, Send, CheckSquare, Trophy, Clock, TrendingUp,
  Plus, Eye, AlertCircle, ArrowRight, Building
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'

const PIE_COLORS = ['#16a34a', '#1a3a6b', '#f59e0b', '#6366f1', '#ef4444']

function formatFCFA(n) {
  if (!n) return '—'
  const num = Number(n)
  if (num >= 1e9) return `${(num / 1e9).toFixed(1)} Mrd`
  if (num >= 1e6) return `${(num / 1e6).toFixed(0)} M`
  return `${num.toLocaleString('fr-FR')} FCFA`
}

export default function Dashboard() {
  const { user } = useAuth()

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['tender-stats'],
    queryFn: () => tendersApi.stats().then(r => r.data),
  })

  const { data: tenders, isLoading: tendersLoading } = useQuery({
    queryKey: ['tenders-recent'],
    queryFn: () => tendersApi.list({ page_size: 5 }).then(r => r.data),
  })

  const { data: submissions } = useQuery({
    queryKey: ['my-submissions'],
    queryFn: () => submissionsApi.list({ page_size: 5 }).then(r => r.data),
    enabled: user?.role === 'soumissionnaire',
  })

  const tenderList = tenders?.results || []
  const submissionList = submissions?.results || []

  const pieData = stats ? [
    { name: 'Publiés', value: stats.published },
    { name: 'Évaluation', value: stats.evaluation },
    { name: 'Attribués', value: stats.attributed },
    { name: 'Clôturés', value: stats.closed },
    { name: 'Brouillons', value: stats.draft },
  ].filter(d => d.value > 0) : []

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Bonjour'
    if (h < 18) return 'Bon après-midi'
    return 'Bonsoir'
  }

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <FadeIn>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-slate-900">
              {greeting()}, {user?.first_name || user?.display_name} 👋
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">
              {format(new Date(), "EEEE d MMMM yyyy", { locale: fr })}
            </p>
          </div>
          {(user?.role === 'acheteur' || user?.role === 'super_admin') && (
            <Btn icon={Plus} onClick={() => window.location.href = '/app/tenders/create'}>
              Nouvel AO
            </Btn>
          )}
          {user?.role === 'soumissionnaire' && (
            <Btn icon={FileText} variant="secondary" onClick={() => window.location.href = '/app/tenders'}>
              Voir les AO ouverts
            </Btn>
          )}
        </div>
      </FadeIn>

      {/* Stats grid */}
      {statsLoading ? (
        <div className="flex justify-center py-10"><Spinner /></div>
      ) : (
        <StaggerList className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {user?.role === 'soumissionnaire' ? (
            <>
              <StaggerItem><StatCard icon={FileText} label="AO disponibles" value={stats?.published || 0} color="blue" /></StaggerItem>
              <StaggerItem><StatCard icon={Send} label="Mes soumissions" value={submissionList.length || 0} color="green" /></StaggerItem>
              <StaggerItem><StatCard icon={Trophy} label="Offres évaluées" value={submissionList.filter(s => s.status === 'evaluated').length} color="amber" /></StaggerItem>
              <StaggerItem><StatCard icon={Clock} label="En cours" value={submissionList.filter(s => ['submitted', 'processing', 'complete'].includes(s.status)).length} color="purple" /></StaggerItem>
            </>
          ) : (
            <>
              <StaggerItem><StatCard icon={FileText} label="Total AO" value={stats?.total || 0} color="navy" /></StaggerItem>
              <StaggerItem><StatCard icon={TrendingUp} label="Publiés" value={stats?.published || 0} color="green" sub="En cours" /></StaggerItem>
              <StaggerItem><StatCard icon={CheckSquare} label="En évaluation" value={stats?.evaluation || 0} color="amber" /></StaggerItem>
              <StaggerItem><StatCard icon={Trophy} label="Attribués" value={stats?.attributed || 0} color="blue" /></StaggerItem>
            </>
          )}
        </StaggerList>
      )}

      {/* Charts + Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Pie chart */}
        {user?.role !== 'soumissionnaire' && pieData.length > 0 && (
          <FadeIn delay={0.15}>
            <Card className="p-5 col-span-1">
              <h2 className="font-semibold text-slate-800 mb-4 text-sm">Répartition des AO</h2>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75}
                    paddingAngle={3} dataKey="value">
                    {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v, n) => [v, n]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {pieData.map((d, i) => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i] }} />
                      <span className="text-slate-600">{d.name}</span>
                    </div>
                    <span className="font-semibold text-slate-800">{d.value}</span>
                  </div>
                ))}
              </div>
            </Card>
          </FadeIn>
        )}

        {/* Recent tenders */}
        <FadeIn delay={0.2} className={user?.role !== 'soumissionnaire' ? 'col-span-2' : 'col-span-3'}>
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-800 text-sm">
                {user?.role === 'soumissionnaire' ? 'Appels d\'offres ouverts' : 'Derniers appels d\'offres'}
              </h2>
              <Link to="/app/tenders" className="text-xs text-primary-600 hover:underline font-medium flex items-center gap-1">
                Voir tout <ArrowRight size={12} />
              </Link>
            </div>

            {tendersLoading ? (
              <div className="flex justify-center py-6"><Spinner size={20} /></div>
            ) : tenderList.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">
                <FileText size={28} className="mx-auto mb-2 opacity-40" />
                Aucun appel d'offres
              </div>
            ) : (
              <div className="space-y-2">
                {tenderList.map((t) => (
                  <Link key={t.id} to={`/app/tenders/${t.id}`}>
                    <motion.div
                      whileHover={{ x: 2 }}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all cursor-pointer group"
                    >
                      <div className="w-9 h-9 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center shrink-0">
                        <FileText size={16} className="text-primary-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-slate-400">{t.reference}</span>
                          <StatusBadge status={t.status} />
                        </div>
                        <p className="text-sm font-semibold text-slate-800 truncate mt-0.5">{t.title}</p>
                        <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-400">
                          <span>{t.tender_type}</span>
                          {t.budget_public && t.budget_estimated && (
                            <span className="font-medium text-slate-600">{formatFCFA(t.budget_estimated)}</span>
                          )}
                          {t.days_remaining > 0 && (
                            <span className="text-amber-600 font-medium">J-{t.days_remaining}</span>
                          )}
                        </div>
                      </div>
                      <ArrowRight size={14} className="text-slate-300 group-hover:text-primary-500 transition-colors shrink-0" />
                    </motion.div>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </FadeIn>
      </div>

      {/* My submissions (soumissionnaire) */}
      {user?.role === 'soumissionnaire' && submissionList.length > 0 && (
        <FadeIn delay={0.25}>
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-800 text-sm">Mes soumissions récentes</h2>
              <Link to="/app/submissions" className="text-xs text-primary-600 hover:underline font-medium flex items-center gap-1">
                Voir tout <ArrowRight size={12} />
              </Link>
            </div>
            <div className="space-y-2">
              {submissionList.map(s => (
                <Link key={s.id} to={`/app/submissions/${s.id}`}>
                  <motion.div whileHover={{ x: 2 }}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all cursor-pointer">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-slate-400">{s.tender_reference}</span>
                        <StatusBadge status={s.status} />
                      </div>
                      <p className="text-sm font-semibold text-slate-800 truncate mt-0.5">{s.tender_title}</p>
                    </div>
                    {s.total_score != null && (
                      <div className="w-32 shrink-0">
                        <ScoreBar score={s.total_score} size="sm" />
                      </div>
                    )}
                    {s.rank && (
                      <div className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg shrink-0">
                        #{s.rank}
                      </div>
                    )}
                  </motion.div>
                </Link>
              ))}
            </div>
          </Card>
        </FadeIn>
      )}
    </div>
  )
}
