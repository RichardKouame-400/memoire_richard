import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { tendersApi } from '../../api/client'
import { PageHeader, Card, FadeIn, Btn, Field, Spinner } from '../../components/ui'
import { Save, Plus, Trash2, AlertCircle, Lock } from 'lucide-react'

export default function TenderEditPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data: tender, isLoading } = useQuery({
    queryKey: ['tender', id],
    queryFn: () => tendersApi.detail(id).then(r => r.data),
  })

  const [form, setForm] = useState(null)

  useEffect(() => {
    if (tender) {
      setForm({
        title: tender.title || '',
        description: tender.description || '',
        tender_type: tender.tender_type || 'travaux',
        budget_estimated: tender.budget_estimated || '',
        budget_public: tender.budget_public ?? true,
        deadline: tender.deadline ? tender.deadline.slice(0, 16) : '',
        opening_date: tender.opening_date ? tender.opening_date.slice(0, 16) : '',
        region: tender.region || '',
        sector: tender.sector || '',
        required_documents: tender.required_documents || [],
        eliminating_documents: tender.eliminating_documents || [],
      })
    }
  }, [tender])

  const saveMut = useMutation({
    mutationFn: (data) => tendersApi.update(id, data),
    onSuccess: () => {
      toast.success('AO mis à jour !')
      qc.invalidateQueries(['tender', id])
      navigate(`/app/tenders/${id}`)
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Erreur lors de la sauvegarde'),
  })

  // Criteria mutations
  const addCritMut = useMutation({
    mutationFn: (data) => tendersApi.addCriterion(id, data),
    onSuccess: () => { toast.success('Critère ajouté'); qc.invalidateQueries(['tender', id]) },
    onError: (e) => toast.error(e.response?.data?.[0] || e.response?.data?.error || 'Erreur'),
  })

  const delCritMut = useMutation({
    mutationFn: (critId) => tendersApi.deleteCriterion(id, critId),
    onSuccess: () => { toast.success('Critère supprimé'); qc.invalidateQueries(['tender', id]) },
    onError: (e) => toast.error(e.response?.data?.error || 'Erreur'),
  })

  const [newCrit, setNewCrit] = useState({ name: '', weight: 0, evaluation_type: 'manual', max_score: 100, is_eliminating: false })

  if (isLoading || !form) return <div className="flex justify-center py-20"><Spinner /></div>

  if (tender?.status !== 'draft') {
    return (
      <FadeIn className="max-w-xl mx-auto mt-16">
        <Card className="p-8 text-center">
          <Lock size={32} className="mx-auto mb-4 text-slate-400" />
          <h2 className="font-display text-xl font-bold text-slate-800 mb-2">AO non modifiable</h2>
          <p className="text-slate-500 text-sm mb-4">
            Seuls les AO en <strong>brouillon</strong> peuvent être modifiés. Cet AO est en statut <strong>{tender.status}</strong>.
          </p>
          <Btn onClick={() => navigate(`/app/tenders/${id}`)}>Voir l'AO</Btn>
        </Card>
      </FadeIn>
    )
  }

  const set = f => e => setForm(v => ({ ...v, [f]: e.target ? e.target.value : e }))
  const totalWeight = (tender.criteria || []).reduce((s, c) => s + Number(c.weight), 0)

  return (
    <div className="max-w-3xl space-y-5">
      <PageHeader
        title="Modifier l'appel d'offres"
        subtitle={tender.reference}
        back={{ label: 'Détail AO', onClick: () => navigate(`/app/tenders/${id}`) }}
        actions={
          <Btn icon={Save} loading={saveMut.isLoading} onClick={() => saveMut.mutate(form)}>
            Enregistrer
          </Btn>
        }
      />

      {/* General info */}
      <FadeIn>
        <Card className="p-5 space-y-4">
          <h2 className="font-semibold text-slate-800 text-sm uppercase tracking-wide">Informations générales</h2>
          <Field label="Titre" required>
            <input className="input-field" value={form.title} onChange={set('title')} />
          </Field>
          <Field label="Description" required>
            <textarea className="input-field" rows={4} value={form.description} onChange={set('description')} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Type">
              <select className="input-field" value={form.tender_type} onChange={set('tender_type')}>
                <option value="travaux">Travaux</option>
                <option value="fournitures">Fournitures</option>
                <option value="services">Services</option>
                <option value="prestations">Prestations</option>
              </select>
            </Field>
            <Field label="Secteur">
              <input className="input-field" value={form.sector} onChange={set('sector')} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Budget (FCFA)">
              <input type="number" className="input-field" value={form.budget_estimated} onChange={set('budget_estimated')} />
            </Field>
            <Field label="Visibilité">
              <select className="input-field" value={form.budget_public ? 'true' : 'false'}
                onChange={e => setForm(v => ({ ...v, budget_public: e.target.value === 'true' }))}>
                <option value="true">Public</option>
                <option value="false">Confidentiel</option>
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Date limite">
              <input type="datetime-local" className="input-field" value={form.deadline} onChange={set('deadline')} />
            </Field>
            <Field label="Région">
              <input className="input-field" value={form.region} onChange={set('region')} />
            </Field>
          </div>
        </Card>
      </FadeIn>

      {/* Criteria */}
      <FadeIn delay={0.1}>
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800 text-sm uppercase tracking-wide">
              Critères d'évaluation
            </h2>
            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
              Math.abs(totalWeight - 100) < 0.5 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
            }`}>
              Total: {totalWeight.toFixed(0)}%
            </span>
          </div>

          <div className="space-y-2 mb-4">
            {(tender.criteria || []).map(c => (
              <div key={c.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800">{c.name}</p>
                  <p className="text-xs text-slate-400">{c.evaluation_type} — {c.weight}% — max {c.max_score}</p>
                </div>
                {c.locked ? (
                  <Lock size={14} className="text-slate-400 shrink-0" />
                ) : (
                  <button onClick={() => delCritMut.mutate(c.id)}
                    className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Add criterion */}
          <div className="border border-dashed border-slate-200 rounded-xl p-4 space-y-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Ajouter un critère</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Nom">
                <input className="input-field" placeholder="ex: Qualité technique"
                  value={newCrit.name} onChange={e => setNewCrit(c => ({ ...c, name: e.target.value }))} />
              </Field>
              <Field label="Type">
                <select className="input-field" value={newCrit.evaluation_type}
                  onChange={e => setNewCrit(c => ({ ...c, evaluation_type: e.target.value }))}>
                  <option value="auto_price">Auto (Prix)</option>
                  <option value="auto_delay">Auto (Délai)</option>
                  <option value="auto_financial">Auto (Capacité fin.)</option>
                  <option value="manual">Manuel</option>
                </select>
              </Field>
              <Field label="Poids (%)">
                <input type="number" className="input-field" value={newCrit.weight}
                  onChange={e => setNewCrit(c => ({ ...c, weight: Number(e.target.value) }))} />
              </Field>
              <Field label="Note max">
                <input type="number" className="input-field" value={newCrit.max_score}
                  onChange={e => setNewCrit(c => ({ ...c, max_score: Number(e.target.value) }))} />
              </Field>
            </div>
            <Btn size="sm" icon={Plus} loading={addCritMut.isLoading}
              disabled={!newCrit.name.trim()}
              onClick={() => {
                addCritMut.mutate(newCrit)
                setNewCrit({ name: '', weight: 0, evaluation_type: 'manual', max_score: 100, is_eliminating: false })
              }}>
              Ajouter
            </Btn>
          </div>
        </Card>
      </FadeIn>

      {/* Documents */}
      <FadeIn delay={0.15}>
        <Card className="p-5 space-y-4">
          <h2 className="font-semibold text-slate-800 text-sm uppercase tracking-wide">Documents requis</h2>
          <div className="space-y-2">
            {form.required_documents.map((doc, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary-400 shrink-0" />
                <input className="input-field flex-1" value={doc}
                  onChange={e => {
                    const docs = [...form.required_documents]
                    docs[i] = e.target.value
                    setForm(v => ({ ...v, required_documents: docs }))
                  }} />
                <button onClick={() => setForm(v => ({ ...v, required_documents: v.required_documents.filter((_, j) => j !== i) }))}
                  className="text-red-400 hover:text-red-600 p-1">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            <button onClick={() => setForm(v => ({ ...v, required_documents: [...v.required_documents, ''] }))}
              className="flex items-center gap-2 text-xs text-slate-400 hover:text-primary-600 transition-colors">
              <Plus size={14} />Ajouter un document
            </button>
          </div>
        </Card>
      </FadeIn>

      <FadeIn delay={0.2}>
        <div className="flex justify-end gap-3">
          <Btn variant="secondary" onClick={() => navigate(`/app/tenders/${id}`)}>Annuler</Btn>
          <Btn icon={Save} loading={saveMut.isLoading} onClick={() => saveMut.mutate(form)}>
            Enregistrer les modifications
          </Btn>
        </div>
      </FadeIn>
    </div>
  )
}
