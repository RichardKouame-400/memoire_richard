import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { tendersApi, submissionsApi, evaluationApi, authApi } from '../../api/client'
import {
  FadeIn, StaggerList, StaggerItem, Card, StatusBadge, PageHeader,
  Btn, Spinner, ScoreBar, Modal, Field
} from '../../components/ui'
import {
  CheckSquare, ChevronDown, ChevronUp, Save, BarChart3, Play, Cpu,
  UserPlus, X, Award, FileDown, Users, Info
} from 'lucide-react'

export default function EvaluationPage() {
  const { tenderId } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [expanded, setExpanded] = useState(null)
  const [scores, setScores] = useState({})
  const [justifications, setJustifications] = useState({})
  const [saving, setSaving] = useState({})
  const [assignModal, setAssignModal] = useState(false)
  const [selectedEval, setSelectedEval] = useState('')

  const { data: tender, isLoading: tLoading } = useQuery({
    queryKey: ['tender', tenderId],
    queryFn: () => tendersApi.detail(tenderId).then(r => r.data),
  })

  const { data: submissions, isLoading: sLoading } = useQuery({
    queryKey: ['tender-submissions', tenderId],
    queryFn: () => submissionsApi.list({ tender: tenderId }).then(r => r.data),
    refetchInterval: 8000,
  })

  const { data: evaluateurs } = useQuery({
    queryKey: ['evaluateurs'],
    queryFn: () => authApi.evaluateurs().then(r => r.data),
  })

  const autoScoreMut = useMutation({
    mutationFn: () => evaluationApi.runAutoScoring(parseInt(tenderId)),
    onSuccess: (res) => {
      toast.success(res.data?.message || 'Calcul lancé.')
      setTimeout(() => qc.invalidateQueries(['tender-submissions', tenderId]), 2000)
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Erreur'),
  })

  const assignMut = useMutation({
    mutationFn: (evaluatorId) => tendersApi.assignEvaluator(tenderId, { evaluator_id: evaluatorId }),
    onSuccess: () => {
      toast.success('Évaluateur assigné !')
      setAssignModal(false)
      qc.invalidateQueries(['tender', tenderId])
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Erreur'),
  })

  const scoreMut = useMutation({
    mutationFn: (data) => evaluationApi.submitScore(data),
    onSuccess: (_, vars) => {
      const key = `${vars.submission_id}_${vars.criterion_id}`
      toast.success('Score enregistré !')
      setSaving(s => ({ ...s, [key]: false }))
      qc.invalidateQueries(['tender-submissions', tenderId])
    },
    onError: (e, vars) => {
      const key = `${vars.submission_id}_${vars.criterion_id}`
      setSaving(s => ({ ...s, [key]: false }))
      toast.error(e.response?.data?.error || 'Erreur')
    },
  })

  if (tLoading || sLoading) return <div className="flex justify-center py-20"><Spinner /></div>

  const submissionList = submissions?.results || []
  const manualCriteria = tender?.criteria?.filter(c => c.evaluation_type === 'manual') || []
  const autoCriteria = tender?.criteria?.filter(c => c.evaluation_type !== 'manual') || []
  const evaluatedCount = submissionList.filter(s => s.status === 'evaluated').length

  const handleSave = async (submissionId, criterion) => {
    const key = `${submissionId}_${criterion.id}`
    const raw = parseFloat(scores[key] ?? '')
    if (isNaN(raw) || raw < 0 || raw > criterion.max_score) {
      toast.error(`Score entre 0 et ${criterion.max_score}`)
      return
    }
    setSaving(s => ({ ...s, [key]: true }))
    scoreMut.mutate({
      submission_id: submissionId,
      criterion_id: criterion.id,
      raw_score: raw,
      justification: justifications[key] || '',
    })
  }

  return (
    <div className="max-w-5xl space-y-5">
      <PageHeader
        title="Interface d'évaluation"
        subtitle={`${tender?.reference} — ${tender?.title?.slice(0, 50)}...`}
        back={{ label: 'Détail AO', onClick: () => navigate(`/app/tenders/${tenderId}`) }}
        actions={
          <div className="flex gap-2 flex-wrap">
            <Btn icon={UserPlus} variant="secondary" size="sm" onClick={() => setAssignModal(true)}>
              Assigner
            </Btn>
            <Btn icon={Cpu} variant="secondary" size="sm" loading={autoScoreMut.isLoading}
              onClick={() => autoScoreMut.mutate()}>
              Auto-scoring
            </Btn>
            <Btn icon={BarChart3} size="sm" onClick={() => navigate(`/app/ranking/${tenderId}`)}>
              Classement
            </Btn>
            <Btn icon={FileDown} variant="secondary" size="sm"
              onClick={() => evaluationApi.downloadReport(tenderId)}>
              Rapport PDF
            </Btn>
          </div>
        }
      />

      {/* Stats bar */}
      <FadeIn>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Soumissions', value: submissionList.length, color: 'text-primary-700 bg-primary-50' },
            { label: 'Critères manuels', value: manualCriteria.length, color: 'text-amber-700 bg-amber-50' },
            { label: 'Critères auto', value: autoCriteria.length, color: 'text-emerald-700 bg-emerald-50' },
            { label: 'Évalués', value: evaluatedCount, color: 'text-blue-700 bg-blue-50' },
          ].map(({ label, value, color }) => (
            <div key={label} className={`rounded-xl p-4 ${color.split(' ')[1]}`}>
              <p className={`text-2xl font-bold font-display ${color.split(' ')[0]}`}>{value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </FadeIn>

      {/* Auto-scoring info */}
      {autoCriteria.length > 0 && (
        <FadeIn delay={0.05}>
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
            <Info size={16} className="text-blue-600 mt-0.5 shrink-0" />
            <div className="text-sm text-blue-800">
              <strong>{autoCriteria.length} critère(s) automatique(s)</strong> seront calculés par l'algorithme
              à partir des prix, délais et données OCR extraits des dossiers.
              Cliquez <strong>Auto-scoring</strong> pour lancer le calcul.
            </div>
          </div>
        </FadeIn>
      )}

      {/* Manual scoring */}
      {manualCriteria.length === 0 ? (
        <FadeIn>
          <Card className="p-10 text-center">
            <Cpu size={36} className="mx-auto mb-3 text-slate-300" />
            <p className="font-semibold text-slate-600 mb-1">Tous les critères sont automatiques</p>
            <p className="text-sm text-slate-400 mb-5">Utilisez Auto-scoring pour calculer les scores ou consultez le classement.</p>
            <div className="flex items-center justify-center gap-3">
              <Btn icon={Play} loading={autoScoreMut.isLoading} onClick={() => autoScoreMut.mutate()}>
                Lancer Auto-scoring
              </Btn>
              <Btn icon={BarChart3} variant="secondary" onClick={() => navigate(`/app/ranking/${tenderId}`)}>
                Voir le classement
              </Btn>
            </div>
          </Card>
        </FadeIn>
      ) : (
        <FadeIn delay={0.1}>
          <Card className="overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/60">
              <p className="text-sm font-semibold text-slate-700">
                Notation manuelle — {manualCriteria.length} critère(s) à noter pour chaque soumission
              </p>
              <p className="text-xs text-slate-400 mt-0.5">Cliquez sur une soumission pour déplier ses critères</p>
            </div>

            <div className="divide-y divide-slate-100">
              {submissionList.length === 0 ? (
                <div className="p-10 text-center text-slate-400">
                  <Users size={28} className="mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Aucune soumission reçue pour cet AO.</p>
                </div>
              ) : submissionList.map((sub, si) => {
                const isExpanded = expanded === sub.id
                // Get existing scores from submission detail
                return (
                  <div key={sub.id}>
                    <motion.button whileTap={{ scale: 0.995 }}
                      className="w-full flex items-center gap-4 p-4 hover:bg-slate-50/70 transition-colors text-left"
                      onClick={() => setExpanded(isExpanded ? null : sub.id)}>
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                        sub.status === 'evaluated' ? 'bg-emerald-50 text-emerald-700'
                        : sub.is_eliminated ? 'bg-red-50 text-red-600'
                        : 'bg-primary-50 text-primary-700'
                      }`}>
                        {sub.status === 'evaluated' ? '✓' : si + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-slate-900">{sub.submitter_name}</p>
                          <StatusBadge status={sub.status} />
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                          {sub.price_ht && <span>{Number(sub.price_ht).toLocaleString('fr-FR')} FCFA HT</span>}
                          {sub.execution_delay && <span>{sub.execution_delay} jours</span>}
                        </div>
                      </div>
                      {sub.total_score != null && (
                        <div className="w-32 shrink-0"><ScoreBar score={sub.total_score} size="sm" /></div>
                      )}
                      {isExpanded
                        ? <ChevronUp size={16} className="text-slate-400 shrink-0" />
                        : <ChevronDown size={16} className="text-slate-400 shrink-0" />}
                    </motion.button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }} className="overflow-hidden">
                          <div className="px-4 pb-5 pt-2 bg-slate-50/70 space-y-3 border-t border-slate-100">
                            {manualCriteria.map(criterion => {
                              const key = `${sub.id}_${criterion.id}`
                              const existing = sub.scores?.find(s => s.criterion === criterion.id)
                              const currentScore = scores[key] !== undefined ? scores[key] : (existing?.raw_score ?? '')
                              const currentJust = justifications[key] !== undefined ? justifications[key] : (existing?.justification ?? '')

                              return (
                                <div key={criterion.id} className="bg-white rounded-xl border border-slate-200 p-4">
                                  <div className="flex items-center justify-between mb-3">
                                    <div>
                                      <p className="text-sm font-semibold text-slate-800">{criterion.name}</p>
                                      <p className="text-xs text-slate-400">
                                        Poids: <strong>{criterion.weight}%</strong> — Note max: <strong>{criterion.max_score}</strong>
                                        {criterion.is_eliminating && <span className="ml-2 text-red-600 font-semibold">⚠ Éliminatoire</span>}
                                      </p>
                                    </div>
                                    {existing && (
                                      <div className="text-xs bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full font-semibold">
                                        ✓ {existing.raw_score}/{criterion.max_score}
                                      </div>
                                    )}
                                  </div>
                                  <div className="grid grid-cols-2 gap-3">
                                    <Field label={`Note (0–${criterion.max_score})`}>
                                      <input type="number" min="0" max={criterion.max_score} step="0.5"
                                        className="input-field"
                                        placeholder={existing ? `Actuel: ${existing.raw_score}` : '0'}
                                        value={currentScore}
                                        onChange={e => setScores(s => ({ ...s, [key]: e.target.value }))} />
                                    </Field>
                                    <Field label="Justification">
                                      <input type="text" className="input-field"
                                        placeholder="Motif de la notation..."
                                        value={currentJust}
                                        onChange={e => setJustifications(j => ({ ...j, [key]: e.target.value }))} />
                                    </Field>
                                  </div>
                                  {/* Score preview */}
                                  {currentScore !== '' && !isNaN(parseFloat(currentScore)) && (
                                    <div className="mt-2 text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-1.5">
                                      Score normalisé: {((parseFloat(currentScore) / criterion.max_score) * 100).toFixed(1)}/100
                                      {' → '}Score pondéré: {((parseFloat(currentScore) / criterion.max_score) * criterion.weight).toFixed(2)} pts
                                    </div>
                                  )}
                                  <div className="flex justify-end mt-3">
                                    <Btn size="sm" icon={Save} loading={saving[key]}
                                      onClick={() => handleSave(sub.id, criterion)}>
                                      Enregistrer
                                    </Btn>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })}
            </div>
          </Card>
        </FadeIn>
      )}

      {/* Assign evaluator modal */}
      <Modal open={assignModal} onClose={() => setAssignModal(false)} title="Assigner un évaluateur" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-slate-500">Sélectionnez un évaluateur pour cet AO. Il pourra noter les critères manuels.</p>
          <Field label="Évaluateur">
            <select className="input-field" value={selectedEval} onChange={e => setSelectedEval(e.target.value)}>
              <option value="">-- Sélectionner --</option>
              {(Array.isArray(evaluateurs) ? evaluateurs : []).map(u => (
                <option key={u.id} value={u.id}>{u.display_name} ({u.email})</option>
              ))}
            </select>
          </Field>
          {(Array.isArray(evaluateurs) ? evaluateurs : []).length === 0 && (
            <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
              Aucun évaluateur disponible. Créez d'abord un compte avec le rôle "Évaluateur".
            </div>
          )}
          <div className="flex gap-3">
            <Btn variant="secondary" onClick={() => setAssignModal(false)} className="flex-1">Annuler</Btn>
            <Btn icon={UserPlus} loading={assignMut.isLoading}
              disabled={!selectedEval}
              onClick={() => assignMut.mutate(parseInt(selectedEval))} className="flex-1">
              Assigner
            </Btn>
          </div>
        </div>
      </Modal>
    </div>
  )
}
