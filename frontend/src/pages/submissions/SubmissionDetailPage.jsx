import { useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { useDropzone } from 'react-dropzone'
import toast from 'react-hot-toast'
import { submissionsApi } from '../../api/client'
import { useAuth } from '../../hooks/useAuth'
import {
  FadeIn, StaggerList, StaggerItem, Card, StatusBadge, PageHeader,
  Btn, Spinner, ScoreBar, Modal, Field
} from '../../components/ui'
import {
  Upload, FileText, CheckCircle, AlertCircle, Clock,
  Send, Eye, Download, Trash2, Cpu, Trophy
} from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

const DOC_TYPES = [
  { value: 'attestation_fiscale', label: 'Attestation fiscale' },
  { value: 'rccm', label: 'RCCM' },
  { value: 'non_faillite', label: 'Attestation de non-faillite' },
  { value: 'bilan', label: 'Bilan financier' },
  { value: 'offre_technique', label: 'Offre technique' },
  { value: 'offre_financiere', label: 'Offre financière' },
  { value: 'references', label: 'Références similaires' },
  { value: 'autres', label: 'Autres' },
]

function UploadZone({ onUpload }) {
  const [docType, setDocType] = useState('attestation_fiscale')
  const [uploading, setUploading] = useState(false)

  const onDrop = useCallback(async (files) => {
    if (!files.length) return
    setUploading(true)
    for (const file of files) {
      await onUpload(file, docType)
    }
    setUploading(false)
  }, [onUpload, docType])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'image/*': ['.jpg', '.png'] },
    maxSize: 10 * 1024 * 1024,
  })

  return (
    <div className="space-y-3">
      <Field label="Type de document">
        <select className="input-field" value={docType} onChange={e => setDocType(e.target.value)}>
          {DOC_TYPES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
        </select>
      </Field>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
          isDragActive ? 'border-primary-400 bg-primary-50' : 'border-slate-200 hover:border-primary-300 hover:bg-slate-50'
        }`}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Spinner size={28} />
            <p className="text-sm text-slate-500">Envoi en cours...</p>
          </div>
        ) : (
          <>
            <Upload size={28} className={`mx-auto mb-3 ${isDragActive ? 'text-primary-500' : 'text-slate-400'}`} />
            <p className="text-sm font-semibold text-slate-700">
              {isDragActive ? 'Déposez le fichier ici' : 'Glissez-déposez ou cliquez pour sélectionner'}
            </p>
            <p className="text-xs text-slate-400 mt-1">PDF, JPG, PNG — Max 10 Mo</p>
          </>
        )}
      </div>
    </div>
  )
}

export default function SubmissionDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const qc = useQueryClient()
  const [uploadModal, setUploadModal] = useState(false)

  const { data: submission, isLoading } = useQuery({
    queryKey: ['submission', id],
    queryFn: () => submissionsApi.detail(id).then(r => r.data),
    refetchInterval: (data) => ['processing', 'submitted'].includes(data?.status) ? 5000 : false,
  })

  const submitMut = useMutation({
    mutationFn: () => submissionsApi.submit(id),
    onSuccess: () => { toast.success('Offre soumise définitivement !'); qc.invalidateQueries(['submission', id]) },
    onError: (e) => toast.error(e.response?.data?.error || 'Erreur'),
  })

  const uploadMut = useMutation({
    mutationFn: ({ file, docType }) => {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('doc_type', docType)
      return submissionsApi.uploadDocument(id, fd)
    },
    onSuccess: () => { toast.success('Document téléversé !'); qc.invalidateQueries(['submission', id]) },
    onError: (e) => toast.error(e.response?.data?.error || 'Erreur lors du téléversement'),
  })

  if (isLoading) return <div className="flex justify-center py-20"><Spinner /></div>
  if (!submission) return <div className="text-center py-20 text-slate-400">Soumission introuvable.</div>

  const isMine = user?.id === submission.submitter
  const isDraft = submission.status === 'draft'
  const isEvaluated = submission.status === 'evaluated'

  return (
    <div className="max-w-5xl space-y-5">
      <PageHeader
        title={submission.tender_reference || `Soumission #${id}`}
        subtitle={submission.submitter_detail?.display_name}
        back={{ label: 'Soumissions', onClick: () => navigate('/app/submissions') }}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge status={submission.status} />
            {isMine && isDraft && (
              <Btn icon={Send} variant="success"
                loading={submitMut.isLoading}
                onClick={() => submitMut.mutate()}>
                Soumettre définitivement
              </Btn>
            )}
            {isMine && isDraft && (
              <Btn icon={Upload} variant="secondary"
                onClick={() => setUploadModal(true)}>
                Ajouter un document
              </Btn>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main */}
        <div className="lg:col-span-2 space-y-5">
          {/* Financial offer */}
          <FadeIn>
            <Card className="p-5">
              <h2 className="font-semibold text-slate-800 mb-4 text-sm uppercase tracking-wide">Offre financière</h2>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Prix HT', value: submission.price_ht ? `${Number(submission.price_ht).toLocaleString('fr-FR')} FCFA` : '—' },
                  { label: 'Prix TTC', value: submission.price_ttc ? `${Number(submission.price_ttc).toLocaleString('fr-FR')} FCFA` : '—' },
                  { label: "Délai d'exécution", value: submission.execution_delay ? `${submission.execution_delay} jours` : '—' },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs text-slate-400 mb-0.5">{label}</p>
                    <p className="text-sm font-bold text-slate-800">{value}</p>
                  </div>
                ))}
              </div>
            </Card>
          </FadeIn>

          {/* Documents */}
          <FadeIn delay={0.1}>
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-slate-800 text-sm uppercase tracking-wide">
                  Documents ({submission.documents?.length || 0})
                </h2>
                {isMine && isDraft && (
                  <Btn size="sm" icon={Upload} variant="secondary" onClick={() => setUploadModal(true)}>
                    Ajouter
                  </Btn>
                )}
              </div>

              {!submission.documents?.length ? (
                <div className="text-center py-8 text-slate-400">
                  <Upload size={24} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Aucun document téléversé.</p>
                </div>
              ) : (
                <StaggerList className="space-y-2">
                  {submission.documents.map(doc => (
                    <StaggerItem key={doc.id}>
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
                          <FileText size={16} className="text-slate-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate">
                            {DOC_TYPES.find(d => d.value === doc.doc_type)?.label || doc.doc_type}
                          </p>
                          <p className="text-xs text-slate-400">
                            {doc.original_name} — {(doc.file_size / 1024).toFixed(0)} Ko
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {doc.ocr_processed ? (
                            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                              <Cpu size={12} />OCR ✓
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400 flex items-center gap-1">
                              <Clock size={12} />En attente
                            </span>
                          )}
                          {doc.file_url && (
                            <a href={doc.file_url} target="_blank" rel="noreferrer"
                              className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition-colors">
                              <Eye size={14} />
                            </a>
                          )}
                        </div>
                      </div>
                    </StaggerItem>
                  ))}
                </StaggerList>
              )}
            </Card>
          </FadeIn>

          {/* Extracted data */}
          {submission.extracted_data?.length > 0 && (
            <FadeIn delay={0.15}>
              <Card className="p-5">
                <h2 className="font-semibold text-slate-800 mb-4 text-sm uppercase tracking-wide flex items-center gap-2">
                  <Cpu size={15} />Données extraites (OCR)
                </h2>
                <div className="space-y-2">
                  {submission.extracted_data.map(d => (
                    <div key={d.id} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50">
                      <div>
                        <p className="text-xs text-slate-400">{d.field_label}</p>
                        <p className="text-sm font-semibold text-slate-800">{d.cleaned_value || d.raw_value || '—'}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-xs text-slate-400">
                          Conf: {(d.confidence * 100).toFixed(0)}%
                        </div>
                        {d.manually_verified && (
                          <CheckCircle size={14} className="text-emerald-500" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </FadeIn>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <FadeIn>
            <Card className="p-5 space-y-4">
              {/* Score */}
              {submission.total_score != null && (
                <div>
                  <p className="text-xs text-slate-400 mb-2">Score final</p>
                  <div className="text-3xl font-bold font-display text-primary-700 mb-2">
                    {Number(submission.total_score).toFixed(2)}
                    <span className="text-lg text-slate-400">/100</span>
                  </div>
                  <ScoreBar score={submission.total_score} />
                  {submission.rank && (
                    <div className="mt-3 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3">
                      <Trophy size={18} className="text-amber-500" />
                      <div>
                        <p className="text-xs text-amber-600">Rang</p>
                        <p className="text-xl font-bold text-amber-700">#{submission.rank}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {submission.is_eliminated && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                  <p className="text-xs font-semibold text-red-700 mb-1 flex items-center gap-1">
                    <AlertCircle size={13} />Soumission éliminée
                  </p>
                  <p className="text-xs text-red-600">{submission.elimination_reason}</p>
                </div>
              )}

              <div className="space-y-3">
                {[
                  { label: 'Statut', value: <StatusBadge status={submission.status} /> },
                  { label: 'Soumissionnaire', value: submission.submitter_detail?.display_name },
                  { label: 'Soumis le', value: submission.submitted_at ? format(new Date(submission.submitted_at), 'd MMM yyyy HH:mm', { locale: fr }) : '—' },
                  { label: 'Documents', value: `${submission.documents?.length || 0} fichier(s)` },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-xs text-slate-400">{label}</p>
                    <div className="text-sm font-semibold text-slate-800 mt-0.5">{value}</div>
                  </div>
                ))}
              </div>
            </Card>
          </FadeIn>

          {/* Scores by criterion */}
          {submission.scores?.length > 0 && (
            <FadeIn delay={0.1}>
              <Card className="p-5">
                <h3 className="text-sm font-semibold text-slate-800 mb-3">Détail par critère</h3>
                <div className="space-y-3">
                  {submission.scores.map(s => (
                    <div key={s.id}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-slate-600 font-medium">{s.criterion_name}</span>
                        <span className="text-slate-400">{s.criterion_weight}%</span>
                      </div>
                      <ScoreBar score={s.normalized_score} size="sm" />
                    </div>
                  ))}
                </div>
              </Card>
            </FadeIn>
          )}
        </div>
      </div>

      {/* Upload modal */}
      <Modal open={uploadModal} onClose={() => setUploadModal(false)} title="Ajouter un document">
        <UploadZone onUpload={async (file, docType) => {
          await uploadMut.mutateAsync({ file, docType })
          setUploadModal(false)
        }} />
      </Modal>
    </div>
  )
}
