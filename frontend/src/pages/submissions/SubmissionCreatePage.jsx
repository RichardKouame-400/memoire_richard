import { useNavigate } from 'react-router-dom'
import { FadeIn, Card, Btn } from '../../components/ui'
import { Send, ArrowRight } from 'lucide-react'

export default function SubmissionCreatePage() {
  const navigate = useNavigate()
  return (
    <FadeIn className="max-w-lg mx-auto mt-16">
      <Card className="p-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-4">
          <Send size={28} className="text-primary-600" />
        </div>
        <h2 className="font-display text-xl font-bold text-slate-800 mb-2">Soumettre une offre</h2>
        <p className="text-slate-500 text-sm mb-6">
          Pour soumettre une offre, consultez la liste des appels d'offres ouverts et cliquez sur "Soumettre une offre" depuis le détail d'un AO.
        </p>
        <Btn icon={ArrowRight} onClick={() => navigate('/app/tenders')}>
          Voir les appels d'offres
        </Btn>
      </Card>
    </FadeIn>
  )
}
