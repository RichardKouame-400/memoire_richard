import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { tendersApi } from '../../api/client'
import { PageHeader, Card, FadeIn, Steps, Btn, Field } from '../../components/ui'
import { Plus, Trash2, AlertCircle, CheckCircle, Info } from 'lucide-react'

const DOCS_DEFAULT = [
  'Attestation fiscale en cours de validité',
  'Registre de commerce (RCCM)',
  'Attestation de non-faillite',
  'Situation CNS / CNPS à jour',
  'Bilans des 3 derniers exercices',
  'Offre technique détaillée',
  'Bordereau des prix unitaires',
]

const STEP_LABELS = ['Identification', 'Calendrier & Budget', 'Critères', 'Documents', 'Récapitulatif']

const EVAL_TYPES = [
  { value: 'auto_price', label: '🤖 Automatique — Prix (moins-disant)' },
  { value: 'auto_delay', label: '🤖 Automatique — Délai (plus court)' },
  { value: 'auto_financial', label: '🤖 Automatique — Capacité financière' },
  { value: 'manual', label: '👤 Manuel — Notation par évaluateur' },
]

export default function TenderCreatePage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({
    title: '',
    description: '',
    tender_type: 'travaux',
    budget_estimated: '',
    budget_public: true,
    deadline: '',
    opening_date: '',
    region: '',
    sector: '',
    required_documents: [...DOCS_DEFAULT],
    eliminating_documents: [],
    criteria: [
      { name: "Prix de l'offre", weight: 40, evaluation_type: 'auto_price', max_score: 100, is_eliminating: false, description: '' },
      { name: "Délai d'exécution", weight: 20, evaluation_type: 'auto_delay', max_score: 100, is_eliminating: false, description: '' },
      { name: 'Expérience en marchés similaires', weight: 25, evaluation_type: 'manual', max_score: 25, is_eliminating: false, description: '' },
      { name: 'Capacité financière (CA)', weight: 15, evaluation_type: 'auto_financial', max_score: 100, is_eliminating: false, description: '' },
    ],
  })

  const setField = (field) => (e) => setForm(f => ({ ...f, [field]: e.target ? e.target.value : e }))
  const totalWeight = form.criteria.reduce((s, c) => s + Number(c.weight || 0), 0)
  const weightOk = Math.abs(totalWeight - 100) < 0.5

  const createMut = useMutation({
    mutationFn: () => {
      const payload = {
        ...form,
        budget_estimated: form.budget_estimated ? Number(form.budget_estimated) : null,
        budget_public: Boolean(form.budget_public),
        opening_date: form.opening_date || null,
        criteria: form.criteria.map((c, i) => ({
          ...c,
          order: i,
          weight: Number(c.weight),
          max_score: Number(c.max_score),
          is_eliminating: Boolean(c.is_eliminating),
        })),
      }
      return tendersApi.create(payload)
    },
    onSuccess: (res) => {
      toast.success("Appel d'offres créé ! Il est en brouillon.")
      navigate(`/app/tenders/${res.data.id}`)
    },
    onError: (e) => {
      const data = e.response?.data
      if (data && typeof data === 'object') {
        const msg = Object.entries(data).map(([k, v]) => `${k}: ${Array.isArray(v) ? v[0] : v}`).join(' | ')
        toast.error(msg)
      } else {
        toast.error('Erreur lors de la création.')
      }
    },
  })

  const addCriterion = () => setForm(f => ({
    ...f,
    criteria: [...f.criteria, { name: '', weight: 0, evaluation_type: 'manual', max_score: 100, is_eliminating: false, description: '' }]
  }))

  const removeCriterion = (i) => setForm(f => ({ ...f, criteria: f.criteria.filter((_, idx) => idx !== i) }))
  const updateCrit = (i, field, value) => setForm(f => ({
    ...f,
    criteria: f.criteria.map((c, idx) => idx === i ? { ...c, [field]: value } : c)
  }))

  const addDoc = (type) => setForm(f => ({
    ...f,
    [type]: [...f[type], '']
  }))

  const updateDoc = (type, i, value) => setForm(f => {
    const docs = [...f[type]]
    docs[i] = value
    return { ...f, [type]: docs }
  })

  const removeDoc = (type, i) => setForm(f => ({
    ...f,
    [type]: f[type].filter((_, idx) => idx !== i)
  }))

  const canNext = () => {
    if (step === 0) return form.title.length > 5 && form.description.length > 10 && form.tender_type
    if (step === 1) return !!form.deadline
    if (step === 2) return weightOk && form.criteria.length > 0 && form.criteria.every(c => c.name.trim())
    return true
  }

  const STEPS_CONTENT = [
    // Step 0 — Identification
    <div key="s0" className="space-y-4">
      <Field label="Titre de l'appel d'offres" required>
        <input className="input-field" placeholder="ex: Réhabilitation du marché central de Bassam"
          value={form.title} onChange={setField('title')} />
      </Field>
      <Field label="Description / Objet du marché" required>
        <textarea className="input-field" rows={5}
          placeholder="Décrivez l'objet, le périmètre des prestations, le contexte..."
          value={form.description} onChange={setField('description')} />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Type de marché" required>
          <select className="input-field" value={form.tender_type} onChange={setField('tender_type')}>
            <option value="travaux">Travaux</option>
            <option value="fournitures">Fournitures</option>
            <option value="services">Services intellectuels</option>
            <option value="prestations">Prestations de services</option>
          </select>
        </Field>
        <Field label="Secteur d'activité">
          <input className="input-field" placeholder="ex: BTP, Informatique, Santé..."
            value={form.sector} onChange={setField('sector')} />
        </Field>
      </div>
      <Field label="Région / Zone géographique">
        <input className="input-field" placeholder="ex: Abidjan, Sud-Comoé, National..."
          value={form.region} onChange={setField('region')} />
      </Field>
    </div>,

    // Step 1 — Calendar & Budget
    <div key="s1" className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Date limite de soumission" required>
          <input type="datetime-local" className="input-field"
            value={form.deadline} onChange={setField('deadline')} />
        </Field>
        <Field label="Date d'ouverture des plis">
          <input type="datetime-local" className="input-field"
            value={form.opening_date} onChange={setField('opening_date')} />
        </Field>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Budget estimatif (FCFA)" hint="Optionnel — laissez vide si confidentiel">
          <input type="number" min="0" className="input-field" placeholder="ex: 150000000"
            value={form.budget_estimated} onChange={setField('budget_estimated')} />
        </Field>
        <Field label="Visibilité du budget">
          <select className="input-field"
            value={form.budget_public ? 'true' : 'false'}
            onChange={e => setForm(f => ({ ...f, budget_public: e.target.value === 'true' }))}>
            <option value="true">Public — visible aux soumissionnaires</option>
            <option value="false">Confidentiel</option>
          </select>
        </Field>
      </div>
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
        <Info size={16} className="text-amber-600 mt-0.5 shrink-0" />
        <div className="text-sm text-amber-800">
          <strong>Délai minimum recommandé :</strong> 15 jours ouvrables pour les marchés nationaux,
          30 jours pour les marchés internationaux (conformément au Code des marchés publics ivoirien).
        </div>
      </div>
    </div>,

    // Step 2 — Criteria
    <div key="s2" className="space-y-3">
      <div className={`flex items-center justify-between p-3 rounded-xl text-sm font-semibold ${
        weightOk ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                 : 'bg-red-50 border border-red-200 text-red-700'
      }`}>
        {weightOk ? (
          <span className="flex items-center gap-2"><CheckCircle size={15} />Poids total : 100% ✓</span>
        ) : (
          <span className="flex items-center gap-2"><AlertCircle size={15} />Poids total : {totalWeight.toFixed(1)}% — doit être exactement 100%</span>
        )}
        <span className="text-xs opacity-70">{form.criteria.length} critère(s)</span>
      </div>

      {form.criteria.map((c, i) => (
        <motion.div key={i}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Critère #{i + 1}</span>
            <button onClick={() => removeCriterion(i)} className="p-1 rounded hover:bg-red-50 text-red-400 hover:text-red-600">
              <Trash2 size={14} />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Nom du critère" required>
              <input className="input-field" placeholder="ex: Prix de l'offre"
                value={c.name} onChange={e => updateCrit(i, 'name', e.target.value)} />
            </Field>
            <Field label="Type d'évaluation">
              <select className="input-field" value={c.evaluation_type}
                onChange={e => updateCrit(i, 'evaluation_type', e.target.value)}>
                {EVAL_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Poids (%)">
              <input type="number" min="0" max="100" className="input-field"
                value={c.weight} onChange={e => updateCrit(i, 'weight', Number(e.target.value))} />
            </Field>
            <Field label="Note max">
              <input type="number" min="1" className="input-field"
                value={c.max_score} onChange={e => updateCrit(i, 'max_score', Number(e.target.value))} />
            </Field>
            <Field label="Options">
              <label className="flex items-center gap-2 mt-2 cursor-pointer select-none">
                <input type="checkbox" checked={c.is_eliminating}
                  onChange={e => updateCrit(i, 'is_eliminating', e.target.checked)}
                  className="w-4 h-4 rounded text-primary-500" />
                <span className="text-sm text-slate-600">Éliminatoire</span>
              </label>
            </Field>
          </div>
        </motion.div>
      ))}

      <button onClick={addCriterion}
        className="w-full border-2 border-dashed border-slate-200 rounded-xl p-4 flex items-center justify-center gap-2 text-sm text-slate-400 hover:border-primary-300 hover:text-primary-500 transition-all">
        <Plus size={16} />Ajouter un critère
      </button>
    </div>,

    // Step 3 — Documents
    <div key="s3" className="space-y-5">
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="label text-sm font-semibold text-slate-700">Documents requis</label>
          <Btn size="sm" variant="secondary" icon={Plus} onClick={() => addDoc('required_documents')}>Ajouter</Btn>
        </div>
        <div className="space-y-2">
          {form.required_documents.map((doc, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary-400 shrink-0" />
              <input className="input-field flex-1" value={doc}
                onChange={e => updateDoc('required_documents', i, e.target.value)} />
              <button onClick={() => removeDoc('required_documents', i)} className="text-red-400 hover:text-red-600 p-1">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="label text-sm font-semibold text-red-700">
            Documents éliminatoires
            <span className="text-xs text-red-400 font-normal ml-1">(absence = rejet automatique)</span>
          </label>
          <Btn size="sm" variant="secondary" icon={Plus} onClick={() => addDoc('eliminating_documents')}>Ajouter</Btn>
        </div>
        {form.eliminating_documents.length === 0 ? (
          <p className="text-sm text-slate-400 italic p-3 bg-slate-50 rounded-lg">
            Aucun document éliminatoire défini. Cliquez "Ajouter" pour en créer un.
          </p>
        ) : (
          <div className="space-y-2">
            {form.eliminating_documents.map((doc, i) => (
              <div key={i} className="flex items-center gap-2">
                <AlertCircle size={14} className="text-red-400 shrink-0" />
                <input className="input-field flex-1 border-red-200 focus:border-red-400" value={doc}
                  onChange={e => updateDoc('eliminating_documents', i, e.target.value)} />
                <button onClick={() => removeDoc('eliminating_documents', i)} className="text-red-400 hover:text-red-600 p-1">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>,

    // Step 4 — Recap
    <div key="s4" className="space-y-4">
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-2.5">
        <h3 className="font-semibold text-slate-800 text-sm mb-3">Récapitulatif avant création</h3>
        {[
          ['Titre', form.title],
          ['Type', form.tender_type],
          ['Secteur', form.sector || '—'],
          ['Région', form.region || '—'],
          ['Budget', form.budget_estimated ? `${Number(form.budget_estimated).toLocaleString('fr-FR')} FCFA (${form.budget_public ? 'public' : 'confidentiel'})` : 'Non renseigné'],
          ['Date limite', form.deadline ? new Date(form.deadline).toLocaleString('fr-FR') : '—'],
          ['Critères', `${form.criteria.length} critères — Total ${totalWeight.toFixed(0)}%`],
          ['Documents requis', `${form.required_documents.filter(d => d.trim()).length} documents`],
          ['Documents éliminatoires', `${form.eliminating_documents.filter(d => d.trim()).length} documents`],
        ].map(([k, v]) => (
          <div key={k} className="flex items-start gap-2 text-sm border-b border-slate-100 pb-2 last:border-0">
            <span className="text-slate-400 w-40 shrink-0">{k}</span>
            <span className="font-semibold text-slate-800">{v}</span>
          </div>
        ))}
      </div>
      {!weightOk && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2 text-sm text-red-700">
          <AlertCircle size={16} />
          Les poids des critères ne totalisent pas 100%. Retournez à l'étape 3.
        </div>
      )}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-start gap-2 text-sm text-blue-800">
        <Info size={15} className="mt-0.5 shrink-0" />
        L'AO sera créé en <strong>brouillon</strong>. Vous devrez cliquer sur "Publier" depuis sa page pour le rendre visible aux soumissionnaires.
      </div>
    </div>,
  ]

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <PageHeader
        title="Créer un appel d'offres"
        subtitle="Nouveau marché public"
        back={{ label: "Appels d'offres", onClick: () => navigate('/app/tenders') }}
      />
      <FadeIn>
        <Card className="p-6">
          <Steps steps={STEP_LABELS} current={step} />
          <AnimatePresence mode="wait">
            <motion.div key={step}
              initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.2 }}>
              {STEPS_CONTENT[step]}
            </motion.div>
          </AnimatePresence>
          <div className="flex items-center justify-between mt-6 pt-5 border-t border-slate-100">
            <Btn variant="secondary"
              onClick={() => step === 0 ? navigate('/app/tenders') : setStep(s => s - 1)}>
              {step === 0 ? 'Annuler' : '← Retour'}
            </Btn>
            {step < STEP_LABELS.length - 1 ? (
              <Btn onClick={() => setStep(s => s + 1)} disabled={!canNext()}>
                Suivant →
              </Btn>
            ) : (
              <Btn icon={CheckCircle} loading={createMut.isLoading}
                disabled={!weightOk} onClick={() => createMut.mutate()}>
                Créer l'AO
              </Btn>
            )}
          </div>
        </Card>
      </FadeIn>
    </div>
  )
}
