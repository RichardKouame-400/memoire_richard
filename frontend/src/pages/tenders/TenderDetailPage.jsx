import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { tendersApi, submissionsApi } from '../../api/client'
import { useAuth } from '../../hooks/useAuth'
import {
  FadeIn, StaggerList, StaggerItem, Card, StatusBadge, PageHeader,
  Btn, Modal, Spinner, ScoreBar, Field
} from '../../components/ui'
import {
  FileText, Calendar, DollarSign, Users, Send, CheckSquare,
  Play, Award, AlertTriangle, Download, Eye, BarChart3,
  Building, Tag, Lock, Plus, Trash2
} from 'lucide-react'

function formatFCFA(n) {
  if (!n) return '—'
  return Number(n).toLocaleString('fr-FR') + ' FCFA'
}

const EVAL_TYPE_LABELS = {
  auto_price: '🤖 Auto (Prix)',
  auto_delay: '🤖 Auto (Délai)',
  auto_financial: '🤖 Auto (Capacité fin.)',
  manual: '👤 Manuel',
}

export default function TenderDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const qc = useQueryClient()
  const [submitModal, setSubmitModal] = useState(false)
  const [offerForm, setOfferForm] = useState({ price_ht: '', price_ttc: '', execution_delay: '', notes: '' })

  const { data: tender, isLoading } = useQuery({
    queryKey: ['tender', id],
    queryFn: () => tendersApi.detail(id).then(r => r.data),
  })

  const publishMut = useMutation({
    mutationFn: () => tendersApi.publish(id),
    onSuccess: () => { toast.success('AO publié !'); qc.invalidateQueries(['tender', id]) },
    onError: (e) => toast.error(e.response?.data?.error || 'Erreur'),
  })

  const closeMut = useMutation({
    mutationFn: () => tendersApi.close(id),
    onSuccess: () => { toast.success('AO clôturé.'); qc.invalidateQueries(['tender', id]) },
    onError: (e) => toast.error(e.response?.data?.error || 'Erreur'),
  })

  const startEvalMut = useMutation({
    mutationFn: () => tendersApi.startEvaluation(id),
    onSuccess: () => { toast.success('Évaluation automatique lancée !'); qc.invalidateQueries(['tender', id]) },
    onError: (e) => toast.error(e.response?.data?.error || 'Erreur'),
  })

  const createSubmissionMut = useMutation({
    mutationFn: (data) => submissionsApi.create(data),
    onSuccess: (res) => {
      toast.success('Soumission créée ! Ajoutez vos documents.')
      setSubmitModal(false)
      navigate(`/app/submissions/${res.data.id}`)
    },
    onError: (e) => toast.error(e.response?.data?.error || Object.values(e.response?.data || {})[0]?.[0] || 'Erreur'),
  })

  if (isLoading) return <div className="flex justify-center py-20"><Spinner /></div>
  if (!tender) return <div className="text-center py-20 text-slate-400">AO introuvable.</div>

  const isAcheteur = ['acheteur', 'super_admin'].includes(user?.role)
  const isSoumissionnaire = user?.role === 'soumissionnaire'
  const isEvaluateur = ['evaluateur', 'acheteur', 'super_admin'].includes(user?.role)
  const hasSubmitted = tender.submissions_count > 0

  return (
    <div className="max-w-5xl space-y-5">
      <PageHeader
        title={tender.title}
        subtitle={tender.reference}
        back={{ label: "Appels d'offres", onClick: () => navigate('/app/tenders') }}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={tender.status} />

            {/* Acheteur actions */}
            {isAcheteur && tender.status === 'draft' && (
              <Btn icon={Play} variant="success"
                loading={publishMut.isLoading}
                onClick={() => publishMut.mutate()}>
                Publier
              </Btn>
            )}
            {isAcheteur && tender.status === 'published' && (
              <Btn icon={Lock} variant="secondary"
                onClick={() => closeMut.mutate()}>
                Clôturer
              </Btn>
            )}
            {isAcheteur && tender.status === 'closed' && (
              <Btn icon={CheckSquare} variant="amber"
                loading={startEvalMut.isLoading}
                onClick={() => startEvalMut.mutate()}>
                Lancer l'évaluation
              </Btn>
            )}
            {isEvaluateur && tender.status === 'evaluation' && (
              <Btn icon={BarChart3}
                onClick={() => navigate(`/app/evaluation/${id}`)}>
                Évaluer les offres
              </Btn>
            )}
            {(tender.status === 'evaluation' || tender.status === 'attributed') && (
              <Btn icon={Award} variant="secondary"
                onClick={() => navigate(`/app/ranking/${id}`)}>
                Classement
              </Btn>
            )}

            {/* Soumissionnaire action */}
            {isSoumissionnaire && tender.is_open && (
              <Btn icon={Send} variant="success"
                onClick={() => setSubmitModal(true)}>
                Soumettre une offre
              </Btn>
            )}

            {tender.dao_file && (
              <Btn icon={Download} variant="secondary" size="sm"
                onClick={() => window.open(tender.dao_file, '_blank')}>
                DAO
              </Btn>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-5">
          {/* Description */}
          <FadeIn>
            <Card className="p-5">
              <h2 className="font-semibold text-slate-800 mb-3 text-sm uppercase tracking-wide">Description</h2>
              <p className="text-slate-600 text-sm leading-relaxed">{tender.description}</p>
            </Card>
          </FadeIn>

          {/* Criteria */}
          {tender.criteria?.length > 0 && (
            <FadeIn delay={0.1}>
              <Card className="p-5">
                <h2 className="font-semibold text-slate-800 mb-3 text-sm uppercase tracking-wide">
                  Grille d'évaluation
                </h2>
                <div className="space-y-2">
                  {tender.criteria.map((c, i) => (
                    <motion.div key={c.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-800">{c.name}</span>
                          {c.locked && <Lock size={12} className="text-slate-400" />}
                          {c.is_eliminating && (
                            <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-semibold">
                              Éliminatoire
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-slate-400">{EVAL_TYPE_LABELS[c.evaluation_type]}</span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="w-20">
                          <div className="h-1.5 bg-slate-200 rounded-full">
                            <motion.div
                              className="h-full bg-primary-500 rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${c.weight}%` }}
                              transition={{ delay: 0.3 + i * 0.05, duration: 0.6 }}
                            />
                          </div>
                        </div>
                        <span className="text-sm font-bold text-primary-600 w-10 text-right">{c.weight}%</span>
                      </div>
                    </motion.div>
                  ))}
                  <div className="flex justify-between px-3 pt-2 text-xs font-semibold text-slate-600 border-t border-slate-100">
                    <span>Total</span>
                    <span>{tender.criteria.reduce((s, c) => s + c.weight, 0).toFixed(0)}%</span>
                  </div>
                </div>
              </Card>
            </FadeIn>
          )}

          {/* Add criteria button for draft */}
          {isAcheteur && tender.status === 'draft' && (
            <FadeIn>
              <Link to={`/app/tenders/${id}/criteria`} className="block">
                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-4 text-center text-slate-400 hover:border-primary-300 hover:text-primary-500 transition-all cursor-pointer">
                  <Plus size={20} className="mx-auto mb-1" />
                  <span className="text-sm font-medium">Gérer les critères d'évaluation</span>
                </div>
              </Link>
            </FadeIn>
          )}

          {/* Required documents */}
          {tender.required_documents?.length > 0 && (
            <FadeIn delay={0.15}>
              <Card className="p-5">
                <h2 className="font-semibold text-slate-800 mb-3 text-sm uppercase tracking-wide">
                  Documents requis
                </h2>
                <div className="space-y-1.5">
                  {tender.required_documents.map((doc, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-slate-600">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary-400 shrink-0" />
                      {doc}
                    </div>
                  ))}
                </div>
                {tender.eliminating_documents?.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <p className="text-xs font-semibold text-red-600 mb-2">Documents éliminatoires :</p>
                    {tender.eliminating_documents.map((doc, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-red-600">
                        <AlertTriangle size={12} />
                        {doc}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </FadeIn>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <FadeIn delay={0.05}>
            <Card className="p-5 space-y-4">
              <h2 className="font-semibold text-slate-800 text-sm uppercase tracking-wide">Informations</h2>

              {[
                { icon: Building, label: 'Organisme', value: tender.organization_detail?.name },
                { icon: Tag, label: 'Type', value: tender.tender_type },
                { icon: Tag, label: 'Secteur', value: tender.sector || '—' },
                { icon: DollarSign, label: 'Budget', value: tender.budget_public ? formatFCFA(tender.budget_estimated) : 'Confidentiel' },
                { icon: Calendar, label: 'Publication', value: tender.published_at ? new Date(tender.published_at).toLocaleDateString('fr-FR') : '—' },
                { icon: Calendar, label: 'Clôture', value: new Date(tender.deadline).toLocaleDateString('fr-FR') },
                { icon: Users, label: 'Soumissions', value: tender.submissions_count },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-3">
                  <Icon size={15} className="text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-slate-400">{label}</p>
                    <p className="text-sm font-semibold text-slate-800">{value || '—'}</p>
                  </div>
                </div>
              ))}

              {tender.is_open && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-2">
                  <Calendar size={15} className="text-amber-600 shrink-0" />
                  <div>
                    <p className="text-xs text-amber-700 font-semibold">Clôture dans</p>
                    <p className="text-lg font-bold text-amber-700">{tender.days_remaining} jours</p>
                  </div>
                </div>
              )}

              {tender.status === 'attributed' && tender.winner_detail && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                  <p className="text-xs text-emerald-700 font-semibold mb-1 flex items-center gap-1">
                    <Award size={13} /> Lauréat
                  </p>
                  <p className="text-sm font-bold text-emerald-800">{tender.winner_detail.display_name}</p>
                  {tender.winner_score && (
                    <p className="text-xs text-emerald-600 mt-0.5">Score: {Number(tender.winner_score).toFixed(2)}/100</p>
                  )}
                </div>
              )}
            </Card>
          </FadeIn>

          {/* Evaluators */}
          {isAcheteur && tender.evaluator_assignments?.length > 0 && (
            <FadeIn delay={0.1}>
              <Card className="p-5">
                <h2 className="font-semibold text-slate-800 text-sm uppercase tracking-wide mb-3">Évaluateurs</h2>
                {tender.evaluator_assignments.map(a => (
                  <div key={a.id} className="flex items-center gap-2 py-2">
                    <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center text-xs font-bold text-primary-700">
                      {a.evaluator_detail?.display_name?.[0]}
                    </div>
                    <span className="text-sm text-slate-700">{a.evaluator_detail?.display_name}</span>
                  </div>
                ))}
              </Card>
            </FadeIn>
          )}
        </div>
      </div>

      {/* Submit offer modal */}
      <Modal open={submitModal} onClose={() => setSubmitModal(false)} title="Déposer une offre" size="md">
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            Votre offre sera créée pour l'AO <strong>{tender.reference}</strong>. Vous pourrez ensuite
            ajouter vos documents et la soumettre définitivement.
          </p>
          <Field label="Prix HT (FCFA)">
            <input type="number" className="input-field" placeholder="ex: 150000000"
              value={offerForm.price_ht}
              onChange={e => setOfferForm({ ...offerForm, price_ht: e.target.value })} />
          </Field>
          <Field label="Prix TTC (FCFA)">
            <input type="number" className="input-field" placeholder="ex: 177000000"
              value={offerForm.price_ttc}
              onChange={e => setOfferForm({ ...offerForm, price_ttc: e.target.value })} />
          </Field>
          <Field label="Délai d'exécution (jours)">
            <input type="number" className="input-field" placeholder="ex: 180"
              value={offerForm.execution_delay}
              onChange={e => setOfferForm({ ...offerForm, execution_delay: e.target.value })} />
          </Field>
          <Field label="Notes / Commentaires">
            <textarea className="input-field" rows={3} placeholder="Observations sur votre offre..."
              value={offerForm.notes}
              onChange={e => setOfferForm({ ...offerForm, notes: e.target.value })} />
          </Field>
          <div className="flex gap-3 pt-2">
            <Btn variant="secondary" onClick={() => setSubmitModal(false)} className="flex-1">Annuler</Btn>
            <Btn
              loading={createSubmissionMut.isLoading}
              onClick={() => createSubmissionMut.mutate({
                tender: parseInt(id),
                price_ht: offerForm.price_ht || null,
                price_ttc: offerForm.price_ttc || null,
                execution_delay: offerForm.execution_delay || null,
                notes: offerForm.notes,
              })}
              className="flex-1"
            >
              Créer ma soumission
            </Btn>
          </div>
        </div>
      </Modal>
    </div>
  )
}
