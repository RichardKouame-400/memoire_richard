import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { tendersApi } from '../../api/client'
import { FadeIn, StaggerList, StaggerItem, Spinner } from '../../components/ui'
import {
  FileText, Search, Shield, Cpu, BarChart3, ArrowRight,
  Calendar, DollarSign, Building, Clock, CheckCircle, Users,
  Lock, ChevronRight
} from 'lucide-react'

const FEATURES = [
  { icon: Cpu, title: 'Évaluation automatique', desc: 'Algorithme de scoring pondéré basé sur le prix, le délai et la capacité financière.' },
  { icon: Shield, title: 'Piste d\'audit complète', desc: 'Chaque action est horodatée et traçable. Conformité totale avec les marchés publics.' },
  { icon: FileText, title: 'Extraction OCR', desc: 'Extraction automatique des données depuis les PDF : bilans, attestations, devis.' },
  { icon: BarChart3, title: 'Classement transparent', desc: 'Résultats publiés avec justification chiffrée. Plus de subjectivité.' },
]

const STATS = [
  { value: '100%', label: 'Objectivité algorithmique' },
  { value: '< 1h', label: 'Évaluation automatique' },
  { value: '0 biais', label: 'Critères figés à la publication' },
  { value: 'RGPD', label: 'Conformité données' },
]

function formatFCFA(n) {
  if (!n) return null
  const num = Number(n)
  if (num >= 1e9) return `${(num / 1e9).toFixed(1)} Mrd`
  if (num >= 1e6) return `${(num / 1e6).toFixed(0)} M FCFA`
  return `${num.toLocaleString('fr-FR')} FCFA`
}

export default function LandingPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['public-tenders', search],
    queryFn: () => tendersApi.list({ status: 'published', search: search || undefined, page_size: 6 }).then(r => r.data),
  })

  const tenders = data?.results || []

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#0f2444] flex items-center justify-center text-white font-bold text-sm">
              DAO
            </div>
            <span className="font-display font-bold text-slate-900 text-lg">DAO Platform</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login"
              className="text-sm font-semibold text-slate-600 hover:text-slate-900 px-4 py-2 rounded-lg hover:bg-slate-50 transition-all">
              Se connecter
            </Link>
            <Link to="/register"
              className="text-sm font-semibold bg-[#0f2444] text-white px-5 py-2 rounded-xl hover:bg-[#1a3a6b] transition-all shadow-sm">
              Créer un compte
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-28 pb-20 px-6 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold px-4 py-2 rounded-full mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Institut Ivoirien de Technologie — Grand-Bassam
            </div>
            <h1 className="font-display text-4xl sm:text-5xl font-bold text-slate-900 leading-tight mb-5">
              Plateforme Numérique<br />
              <span className="text-[#0f2444]">d'Évaluation des Appels d'Offres</span>
            </h1>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto mb-8 leading-relaxed">
              Automatisez, sécurisez et tracez l'intégralité du processus de passation des marchés publics.
              Algorithme de scoring objectif, extraction OCR, piste d'audit complète.
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <motion.button whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/register')}
                className="bg-[#0f2444] text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-[#1a3a6b] transition-all shadow-md hover:shadow-lg flex items-center gap-2">
                Commencer gratuitement <ArrowRight size={18} />
              </motion.button>
              <motion.button whileTap={{ scale: 0.97 }}
                onClick={() => document.getElementById('tenders-section').scrollIntoView({ behavior: 'smooth' })}
                className="text-slate-700 font-semibold px-8 py-3.5 rounded-xl border border-slate-200 hover:border-[#0f2444] hover:text-[#0f2444] transition-all">
                Voir les AO ouverts
              </motion.button>
            </div>
          </motion.div>
        </div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="max-w-3xl mx-auto mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {STATS.map(({ value, label }) => (
            <div key={label} className="text-center p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
              <div className="font-display text-2xl font-bold text-[#0f2444]">{value}</div>
              <div className="text-xs text-slate-500 mt-0.5">{label}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 bg-[#0f2444]">
        <div className="max-w-5xl mx-auto">
          <FadeIn>
            <h2 className="font-display text-3xl font-bold text-white text-center mb-3">
              Pourquoi DAO Platform ?
            </h2>
            <p className="text-slate-400 text-center mb-12 max-w-2xl mx-auto">
              Conçue pour répondre aux besoins spécifiques des marchés publics ivoiriens,
              la plateforme élimine les biais humains et accélère le processus d'attribution.
            </p>
          </FadeIn>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {FEATURES.map(({ icon: Icon, title, desc }, i) => (
              <FadeIn key={title} delay={i * 0.1}>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/8 transition-all">
                  <div className="w-11 h-11 rounded-xl bg-emerald-500/20 flex items-center justify-center mb-4">
                    <Icon size={22} className="text-emerald-400" />
                  </div>
                  <h3 className="font-semibold text-white text-base mb-2">{title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <FadeIn>
            <h2 className="font-display text-3xl font-bold text-slate-900 text-center mb-3">
              Comment ça marche ?
            </h2>
            <p className="text-slate-500 text-center mb-12">4 étapes pour attribuer un marché de façon transparente</p>
          </FadeIn>
          <div className="relative">
            <div className="absolute left-7 top-8 bottom-8 w-0.5 bg-slate-200 hidden sm:block" />
            <StaggerList className="space-y-6">
              {[
                { n: 1, title: "Publication de l'AO", desc: "L'acheteur public crée l'appel d'offres, définit les critères de notation avec leurs poids (prix, délai, expérience...) et publie.", color: 'bg-blue-500', role: 'Acheteur' },
                { n: 2, title: "Soumission des offres", desc: "Les fournisseurs déposent leurs dossiers en ligne : offre financière, documents administratifs, références. L'OCR extrait automatiquement les données.", color: 'bg-purple-500', role: 'Soumissionnaire' },
                { n: 3, title: "Évaluation automatique & manuelle", desc: "L'algorithme calcule les scores auto (prix, délai, capacité financière). Les évaluateurs notent les critères qualitatifs.", color: 'bg-amber-500', role: 'Évaluateur' },
                { n: 4, title: "Attribution & rapport", desc: "Le classement final est publié. L'acheteur valide le lauréat. Un PV PDF est généré automatiquement avec la piste d'audit complète.", color: 'bg-emerald-500', role: 'Acheteur' },
              ].map(({ n, title, desc, color, role }) => (
                <StaggerItem key={n}>
                  <div className="flex items-start gap-5">
                    <div className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center text-white font-bold text-xl shrink-0 shadow-lg relative z-10`}>
                      {n}
                    </div>
                    <div className="bg-white rounded-2xl border border-slate-100 p-5 flex-1 shadow-sm">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-slate-900">{title}</h3>
                        <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{role}</span>
                      </div>
                      <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </StaggerList>
          </div>
        </div>
      </section>

      {/* Open tenders */}
      <section id="tenders-section" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <FadeIn>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-display text-3xl font-bold text-slate-900">Appels d'offres ouverts</h2>
                <p className="text-slate-500 text-sm mt-1">Consultez librement les marchés en cours. Créez un compte pour soumettre.</p>
              </div>
              <Link to="/login"
                className="hidden sm:flex items-center gap-2 text-sm font-semibold text-[#0f2444] hover:underline">
                Voir tout <ArrowRight size={14} />
              </Link>
            </div>

            {/* Search */}
            <div className="relative mb-6">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f2444]/20 focus:border-[#0f2444]"
                placeholder="Rechercher un appel d'offres..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </FadeIn>

          {isLoading ? (
            <div className="flex justify-center py-16"><Spinner /></div>
          ) : tenders.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <FileText size={36} className="mx-auto mb-3 opacity-40" />
              <p className="text-sm">Aucun appel d'offres ouvert actuellement.</p>
            </div>
          ) : (
            <StaggerList className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {tenders.map(t => (
                <StaggerItem key={t.id}>
                  <div className="bg-white border border-slate-100 rounded-2xl p-5 hover:shadow-md transition-all hover:border-slate-200">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <span className="text-xs font-mono text-slate-400 bg-slate-50 px-2 py-0.5 rounded">{t.reference}</span>
                      {t.days_remaining > 0 && (
                        <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                          <Clock size={11} />J-{t.days_remaining}
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-slate-900 mb-2 leading-snug line-clamp-2">{t.title}</h3>
                    <div className="flex flex-wrap gap-3 text-xs text-slate-400 mb-4">
                      {t.organization_name && (
                        <span className="flex items-center gap-1"><Building size={11} />{t.organization_name}</span>
                      )}
                      {t.budget_public && t.budget_estimated && (
                        <span className="flex items-center gap-1 font-semibold text-slate-600">
                          <DollarSign size={11} />{formatFCFA(t.budget_estimated)}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar size={11} />
                        {new Date(t.deadline).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    <Link to="/register"
                      className="w-full flex items-center justify-center gap-2 bg-[#0f2444] text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-[#1a3a6b] transition-all">
                      Soumettre une offre <ArrowRight size={14} />
                    </Link>
                  </div>
                </StaggerItem>
              ))}
            </StaggerList>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-gradient-to-br from-[#0f2444] to-[#1a3a6b]">
        <div className="max-w-2xl mx-auto text-center">
          <FadeIn>
            <h2 className="font-display text-3xl font-bold text-white mb-4">
              Prêt à moderniser vos marchés publics ?
            </h2>
            <p className="text-slate-300 mb-8">
              Rejoignez la plateforme et bénéficiez d'un processus d'évaluation 100% transparent, traçable et conforme.
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Link to="/register"
                className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-8 py-3.5 rounded-xl transition-all shadow-lg">
                Créer un compte gratuit
              </Link>
              <Link to="/login"
                className="bg-white/10 hover:bg-white/20 text-white font-semibold px-8 py-3.5 rounded-xl border border-white/20 transition-all">
                Se connecter
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 py-10 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white font-bold text-xs">DAO</div>
            <div>
              <div className="text-white font-semibold text-sm">DAO Platform</div>
              <div className="text-slate-500 text-xs">Institut Ivoirien de Technologie</div>
            </div>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <Link to="/privacy" className="text-slate-400 hover:text-white transition-colors">Confidentialité</Link>
            <Link to="/terms" className="text-slate-400 hover:text-white transition-colors">CGU</Link>
            <Link to="/login" className="text-slate-400 hover:text-white transition-colors">Connexion</Link>
          </div>
          <p className="text-slate-500 text-xs">© 2025–2026 IIT Grand-Bassam. Mémoire fin de cycle GL.</p>
        </div>
      </footer>
    </div>
  )
}
