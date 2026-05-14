import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { tendersApi, evaluationApi } from '../../api/client'
import { useAuth } from '../../hooks/useAuth'
import {
  FadeIn, StaggerList, StaggerItem, Card, StatusBadge, PageHeader,
  Btn, Spinner, ScoreBar, Modal
} from '../../components/ui'
import {
  Trophy, Medal, Award, AlertCircle, BarChart3,
  DollarSign, Clock, FileDown, RefreshCw, ChevronRight
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const RANK_COLORS = ['#f59e0b', '#94a3b8', '#b45309', '#1a3a6b', '#6366f1']
const RANK_BG = ['bg-amber-100 text-amber-700', 'bg-slate-100 text-slate-600', 'bg-orange-100 text-orange-700']

function RankIcon({ rank }) {
  if (rank === 1) return <Trophy size={18} className="text-amber-500" />
  if (rank === 2) return <Medal size={18} className="text-slate-400" />
  if (rank === 3) return <Award size={18} className="text-amber-700" />
  return <span className="text-sm font-bold text-slate-500">{rank}</span>
}

export default function RankingPage() {
  const { tenderId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const qc = useQueryClient()
  const [attributionModal, setAttributionModal] = useState(false)
  const [selectedWinner, setSelectedWinner] = useState(null)

  const { data: tender } = useQuery({
    queryKey: ['tender', tenderId],
    queryFn: () => tendersApi.detail(tenderId).then(r => r.data),
  })

  const { data: ranking, isLoading, refetch } = useQuery({
    queryKey: ['ranking', tenderId],
    queryFn: () => evaluationApi.tenderRanking(tenderId).then(r => r.data),
    refetchInterval: 10000,
  })

  const attributeMut = useMutation({
    mutationFn: () => tendersApi.attribute(tenderId, { winner_id: selectedWinner }),
    onSuccess: () => {
      toast.success('Marché attribué ! Notifications envoyées aux soumissionnaires.')
      setAttributionModal(false)
      qc.invalidateQueries(['tender', tenderId])
      qc.invalidateQueries(['ranking', tenderId])
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Erreur lors de l\'attribution'),
  })

  const autoScoreMut = useMutation({
    mutationFn: () => evaluationApi.runAutoScoring(parseInt(tenderId)),
    onSuccess: () => {
      toast.success('Recalcul lancé.')
      setTimeout(() => refetch(), 3000)
    },
    onError: () => toast.error('Erreur'),
  })

  const submissions = Array.isArray(ranking) ? ranking : []
  const valid = submissions.filter(s => !s.is_eliminated).sort((a, b) => (b.total_score || 0) - (a.total_score || 0))
  const eliminated = submissions.filter(s => s.is_eliminated)

  const canAttribute = ['acheteur', 'super_admin'].includes(user?.role) &&
    tender?.status === 'evaluation' && valid.length > 0

  const chartData = valid.slice(0, 8).map((s, i) => ({
    name: (s.submitter_detail?.display_name || s.submitter_name || `S${i + 1}`).slice(0, 18),
    score: parseFloat(Number(s.total_score || 0).toFixed(2)),
    rank: i + 1,
  }))

  if (isLoading) return <div className="flex justify-center py-20"><Spinner /></div>

  return (
    <div className="max-w-5xl space-y-5">
      <PageHeader
        title="Classement final"
        subtitle={tender ? `${tender.reference} — ${tender.title?.slice(0, 60)}` : ''}
        back={{ label: 'Détail AO', onClick: () => navigate(`/app/tenders/${tenderId}`) }}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={tender?.status} />
            <Btn icon={RefreshCw} variant="secondary" size="sm"
              loading={autoScoreMut.isLoading}
              onClick={() => autoScoreMut.mutate()}>
              Recalculer
            </Btn>
            <Btn icon={FileDown} variant="secondary" size="sm"
              onClick={() => evaluationApi.downloadReport(tenderId)}>
              PDF
            </Btn>
            {canAttribute && (
              <Btn icon={Award} variant="success"
                onClick={() => { setSelectedWinner(valid[0]?.id); setAttributionModal(true) }}>
                Attribuer le marché
              </Btn>
            )}
          </div>
        }
      />

      {/* Attribution banner */}
      {tender?.status === 'attributed' && tender?.winner_detail && (
        <FadeIn>
          <motion.div
            className="bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 rounded-2xl p-5 flex items-center gap-5 shadow-lg"
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}>
            <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
              <Trophy size={28} className="text-white" />
            </div>
            <div>
              <p className="text-white/80 text-sm font-medium">Marché attribué à</p>
              <p className="text-white text-xl font-bold font-display">{tender.winner_detail.display_name}</p>
              {tender.winner_score && (
                <p className="text-white/70 text-sm mt-0.5">
                  Score final: <strong>{Number(tender.winner_score).toFixed(2)}/100</strong>
                </p>
              )}
            </div>
          </motion.div>
        </FadeIn>
      )}

      {valid.length === 0 ? (
        <FadeIn>
          <Card className="p-12 text-center">
            <BarChart3 size={40} className="mx-auto mb-4 text-slate-300" />
            <p className="font-display font-semibold text-lg text-slate-600 mb-1">Aucune offre évaluée</p>
            <p className="text-sm text-slate-400 mb-6">
              Les scores apparaîtront après l'évaluation automatique et manuelle des offres.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Btn loading={autoScoreMut.isLoading} icon={RefreshCw} onClick={() => autoScoreMut.mutate()}>
                Lancer l'évaluation auto
              </Btn>
              <Btn icon={BarChart3} variant="secondary" onClick={() => navigate(`/app/evaluation/${tenderId}`)}>
                Aller à l'évaluation
              </Btn>
            </div>
          </Card>
        </FadeIn>
      ) : (
        <>
          {/* Chart */}
          {chartData.length > 1 && (
            <FadeIn delay={0.05}>
              <Card className="p-5">
                <h2 className="font-semibold text-slate-800 mb-4 text-sm">Scores comparatifs</h2>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={chartData} margin={{ top: 0, right: 0, bottom: 20, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-20} textAnchor="end"
                      axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      formatter={(v) => [`${v}/100`, 'Score']}
                      contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                    />
                    <Bar dataKey="score" radius={[6, 6, 0, 0]} maxBarSize={60}>
                      {chartData.map((_, i) => (
                        <Cell key={i} fill={RANK_COLORS[i] || '#6366f1'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </FadeIn>
          )}

          {/* Ranking table */}
          <FadeIn delay={0.1}>
            <Card className="overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="font-semibold text-slate-800 text-sm">
                  Classement — {valid.length} offre(s) valide(s)
                </h2>
                {tender?.criteria?.length > 0 && (
                  <p className="text-xs text-slate-400">{tender.criteria.length} critères</p>
                )}
              </div>

              <div className="divide-y divide-slate-100">
                {valid.map((s, i) => (
                  <motion.div key={s.id}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                    className={`flex items-center gap-4 p-4 transition-colors hover:bg-slate-50/70 cursor-pointer ${
                      i === 0 && tender?.status === 'attributed' ? 'bg-amber-50/50' : ''
                    }`}
                    onClick={() => navigate(`/app/submissions/${s.id}`)}>
                    {/* Rank */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      RANK_BG[i] || 'bg-slate-50 text-slate-500'
                    }`}>
                      <RankIcon rank={i + 1} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-slate-900">
                          {s.submitter_detail?.display_name || s.submitter_name}
                        </p>
                        {i === 0 && tender?.status === 'attributed' && (
                          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">
                            🏆 Lauréat
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-0.5 text-xs text-slate-400">
                        {s.price_ht && (
                          <span className="flex items-center gap-1">
                            <DollarSign size={11} />
                            {Number(s.price_ht).toLocaleString('fr-FR')} FCFA
                          </span>
                        )}
                        {s.execution_delay && (
                          <span className="flex items-center gap-1">
                            <Clock size={11} />
                            {s.execution_delay} jours
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Score */}
                    <div className="w-44 shrink-0">
                      <div className="flex justify-between mb-1 text-xs">
                        <span className="text-slate-400">Score</span>
                        <span className="font-bold text-slate-800">
                          {Number(s.total_score || 0).toFixed(2)}/100
                        </span>
                      </div>
                      <ScoreBar score={s.total_score || 0} size="sm" />
                    </div>

                    {/* Attribuer btn for rank 1 */}
                    {canAttribute && i === 0 && (
                      <Btn size="sm" icon={Award} variant="success"
                        onClick={e => { e.stopPropagation(); setSelectedWinner(s.id); setAttributionModal(true) }}>
                        Attribuer
                      </Btn>
                    )}
                    <ChevronRight size={14} className="text-slate-300 shrink-0" />
                  </motion.div>
                ))}
              </div>
            </Card>
          </FadeIn>

          {/* Eliminated */}
          {eliminated.length > 0 && (
            <FadeIn delay={0.2}>
              <Card className="overflow-hidden">
                <div className="px-5 py-3 bg-red-50 border-b border-red-100 flex items-center gap-2">
                  <AlertCircle size={15} className="text-red-600" />
                  <h3 className="font-semibold text-red-700 text-sm">
                    Offres éliminées ({eliminated.length})
                  </h3>
                </div>
                <div className="divide-y divide-slate-100">
                  {eliminated.map(s => (
                    <div key={s.id} className="flex items-start gap-4 p-4 opacity-60">
                      <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                        <AlertCircle size={16} className="text-red-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-slate-700">
                          {s.submitter_detail?.display_name || s.submitter_name}
                        </p>
                        <p className="text-xs text-red-600 mt-0.5">{s.elimination_reason || 'Éliminé'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </FadeIn>
          )}
        </>
      )}

      {/* Attribution modal */}
      <Modal open={attributionModal} onClose={() => setAttributionModal(false)}
        title="Confirmer l'attribution du marché" size="sm">
        <div className="space-y-4">
          {selectedWinner && (() => {
            const w = valid.find(s => s.id === selectedWinner)
            return w ? (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                <p className="text-xs text-amber-600 font-semibold mb-1">Lauréat sélectionné</p>
                <p className="font-bold text-amber-800 text-lg font-display">
                  {w.submitter_detail?.display_name || w.submitter_name}
                </p>
                <p className="text-amber-700 text-sm mt-1">
                  Rang #1 — Score: {Number(w.total_score || 0).toFixed(2)}/100
                </p>
              </div>
            ) : null
          })()}

          <div>
            <label className="label">Modifier le choix du lauréat</label>
            <select className="input-field" value={selectedWinner || ''}
              onChange={e => setSelectedWinner(parseInt(e.target.value))}>
              {valid.map((s, i) => (
                <option key={s.id} value={s.id}>
                  #{i + 1} — {s.submitter_detail?.display_name || s.submitter_name} — {Number(s.total_score || 0).toFixed(2)}/100
                </option>
              ))}
            </select>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-800">
            <strong>⚠ Action irréversible.</strong> L'attribution sera enregistrée dans la piste d'audit.
            Tous les soumissionnaires recevront une notification par email.
          </div>

          <div className="flex gap-3 pt-1">
            <Btn variant="secondary" onClick={() => setAttributionModal(false)} className="flex-1">Annuler</Btn>
            <Btn icon={Award} variant="success" loading={attributeMut.isLoading}
              onClick={() => attributeMut.mutate()} className="flex-1">
              Confirmer l'attribution
            </Btn>
          </div>
        </div>
      </Modal>
    </div>
  )
}
