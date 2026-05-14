import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, FileText, AlertTriangle, CheckCircle, Users } from 'lucide-react'

const Section = ({ title, icon: Icon, children }) => (
  <div className="mb-8">
    <div className="flex items-center gap-3 mb-4">
      <div className="w-9 h-9 rounded-xl bg-[#0f2444]/5 flex items-center justify-center shrink-0">
        <Icon size={18} className="text-[#0f2444]" />
      </div>
      <h2 className="font-display text-xl font-bold text-slate-900">{title}</h2>
    </div>
    <div className="text-slate-600 text-sm leading-relaxed space-y-2 pl-12">{children}</div>
  </div>
)

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-[#0f2444] text-white">
        <div className="max-w-3xl mx-auto px-6 py-12">
          <Link to="/" className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm mb-6 transition-colors">
            <ArrowLeft size={16} />Retour à l'accueil
          </Link>
          <div className="flex items-center gap-3 mb-4">
            <FileText size={28} className="text-emerald-400" />
            <h1 className="font-display text-3xl font-bold">Conditions Générales d'Utilisation</h1>
          </div>
          <p className="text-white/70 text-sm">Version 1.0 — Janvier 2026 — DAO Platform, IIT Grand-Bassam</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-12">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">

          <Section title="Présentation de la plateforme" icon={FileText}>
            <p>
              DAO Platform est une application web développée dans le cadre d'un mémoire de fin de cycle
              en Génie Logiciel à l'Institut Ivoirien de Technologie (IIT) de Grand-Bassam.
              Elle permet la gestion dématérialisée des appels d'offres publics : publication, soumission,
              évaluation algorithmique et attribution.
            </p>
          </Section>

          <Section title="Conditions d'accès" icon={Users}>
            <p>L'utilisation de la plateforme est réservée aux :</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong>Acheteurs publics</strong> : entités habilitées à lancer des marchés publics</li>
              <li><strong>Soumissionnaires</strong> : entreprises ou personnes morales légalement constituées</li>
              <li><strong>Évaluateurs</strong> : experts désignés par l'acheteur public</li>
              <li><strong>Auditeurs</strong> : personnes autorisées à consulter la piste d'audit</li>
            </ul>
            <p className="mt-3">
              Toute inscription implique la création d'un compte avec des informations exactes et vérifiables.
              La fourniture d'informations fausses entraîne la résiliation immédiate du compte.
            </p>
          </Section>

          <Section title="Obligations des utilisateurs" icon={CheckCircle}>
            <ul className="list-disc pl-5 space-y-1">
              <li>Fournir des informations exactes et à jour</li>
              <li>Ne pas tenter d'accéder aux données d'autres utilisateurs</li>
              <li>Ne pas soumettre de documents falsifiés ou frauduleux</li>
              <li>Respecter la confidentialité des offres jusqu'à la publication des résultats</li>
              <li>Signaler tout dysfonctionnement ou violation de sécurité</li>
              <li>Ne pas utiliser la plateforme à des fins autres que la soumission d'appels d'offres</li>
            </ul>
          </Section>

          <Section title="Responsabilités" icon={AlertTriangle}>
            <p><strong>La plateforme :</strong></p>
            <ul className="list-disc pl-5 space-y-1 mt-1">
              <li>Assure la disponibilité du service dans la mesure du possible</li>
              <li>Garantit l'objectivité de l'algorithme d'évaluation selon les critères définis</li>
              <li>Conserve la piste d'audit de manière sécurisée</li>
            </ul>
            <p className="mt-3"><strong>La plateforme n'est pas responsable de :</strong></p>
            <ul className="list-disc pl-5 space-y-1 mt-1">
              <li>L'exactitude des documents soumis par les soumissionnaires</li>
              <li>Les décisions finales d'attribution prises par l'acheteur public</li>
              <li>Les interruptions de service dues à des causes extérieures</li>
            </ul>
          </Section>

          <Section title="Propriété intellectuelle" icon={FileText}>
            <p>
              L'algorithme de scoring, le code source et le design de la plateforme sont la propriété
              intellectuelle de <strong>Kouame Aka Richard Emmanuel</strong>, étudiant à l'IIT Grand-Bassam,
              dans le cadre de son mémoire de fin de cycle sous la supervision de M. KOUAGNI Anangaman Sédrick Gaël.
            </p>
            <p className="mt-2">
              Les données soumises par les utilisateurs (offres, documents) restent la propriété de leurs auteurs.
            </p>
          </Section>

          <Section title="Modifications" icon={FileText}>
            <p>
              Ces CGU peuvent être modifiées à tout moment. Les utilisateurs seront notifiés par email
              en cas de modification substantielle. La poursuite de l'utilisation vaut acceptation des nouvelles conditions.
            </p>
          </Section>

          <Section title="Droit applicable" icon={FileText}>
            <p>
              Les présentes CGU sont soumises au droit ivoirien. Tout litige sera soumis
              aux juridictions compétentes d'Abidjan, Côte d'Ivoire.
            </p>
          </Section>

          <div className="border-t border-slate-100 pt-6 mt-6 flex items-center justify-between">
            <Link to="/privacy" className="text-sm text-[#0f2444] hover:underline">
              Politique de confidentialité →
            </Link>
            <Link to="/" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-700 transition-colors">
              <ArrowLeft size={14} />Retour à l'accueil
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
