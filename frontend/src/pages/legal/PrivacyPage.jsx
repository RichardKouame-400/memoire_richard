import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Shield, Lock, Eye, FileText, Mail } from 'lucide-react'

const Section = ({ title, icon: Icon, children }) => (
  <div className="mb-8">
    <div className="flex items-center gap-3 mb-4">
      <div className="w-9 h-9 rounded-xl bg-[#0f2444]/5 flex items-center justify-center shrink-0">
        <Icon size={18} className="text-[#0f2444]" />
      </div>
      <h2 className="font-display text-xl font-bold text-slate-900">{title}</h2>
    </div>
    <div className="text-slate-600 text-sm leading-relaxed space-y-2 pl-12">
      {children}
    </div>
  </div>
)

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-[#0f2444] text-white">
        <div className="max-w-3xl mx-auto px-6 py-12">
          <Link to="/"
            className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm mb-6 transition-colors">
            <ArrowLeft size={16} />Retour à l'accueil
          </Link>
          <div className="flex items-center gap-3 mb-4">
            <Shield size={28} className="text-emerald-400" />
            <h1 className="font-display text-3xl font-bold">Politique de Confidentialité</h1>
          </div>
          <p className="text-white/70 text-sm">
            Dernière mise à jour : Janvier 2026 — DAO Platform, Institut Ivoirien de Technologie
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-12">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-8 text-sm text-blue-800">
            <strong>Résumé :</strong> La plateforme DAO collecte uniquement les données nécessaires au traitement
            des appels d'offres. Vos données ne sont jamais vendues ni partagées avec des tiers commerciaux.
            Conformité avec la Loi n°2013-450 du 19 juin 2013 sur la protection des données personnelles en Côte d'Ivoire.
          </div>

          <Section title="Données collectées" icon={FileText}>
            <p>Nous collectons les données suivantes lors de votre inscription et utilisation de la plateforme :</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong>Données d'identification :</strong> nom, prénom, adresse email, numéro de téléphone</li>
              <li><strong>Données d'entreprise (Soumissionnaires) :</strong> raison sociale, RCCM, NIF, adresse</li>
              <li><strong>Documents soumis :</strong> bilans financiers, attestations, offres techniques et financières</li>
              <li><strong>Données de connexion :</strong> adresse IP, horodatage des accès, agent utilisateur</li>
              <li><strong>Données de traçabilité :</strong> toutes les actions sur la plateforme (piste d'audit)</li>
            </ul>
          </Section>

          <Section title="Finalité du traitement" icon={Eye}>
            <p>Vos données sont utilisées exclusivement pour :</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>La gestion des appels d'offres et l'évaluation des soumissions</li>
              <li>L'authentification et la sécurité des accès</li>
              <li>La traçabilité réglementaire (piste d'audit obligatoire pour les marchés publics)</li>
              <li>L'envoi de notifications relatives aux marchés (attribution, résultats)</li>
              <li>L'amélioration du service (données anonymisées uniquement)</li>
            </ul>
          </Section>

          <Section title="Conservation des données" icon={Lock}>
            <p>
              Les données sont conservées pendant la durée de vie du contrat et <strong>7 ans après la clôture</strong> du dernier marché,
              conformément aux obligations légales relatives aux marchés publics en Côte d'Ivoire.
            </p>
            <p className="mt-2">
              Les tokens de réinitialisation de mot de passe expirent après <strong>2 heures</strong>.
              Les logs de connexion sont conservés <strong>90 jours</strong>.
            </p>
          </Section>

          <Section title="Sécurité" icon={Shield}>
            <ul className="list-disc pl-5 space-y-1">
              <li>Mots de passe hachés avec bcrypt (Django)</li>
              <li>Communications chiffrées HTTPS/TLS</li>
              <li>Authentification par JWT avec expiration (8h)</li>
              <li>Accès contrôlé par rôles (RBAC) : chaque utilisateur ne voit que ce qui le concerne</li>
              <li>Hébergement sur serveur sécurisé avec sauvegardes quotidiennes</li>
            </ul>
          </Section>

          <Section title="Vos droits" icon={FileText}>
            <p>Conformément à la Loi n°2013-450, vous disposez des droits suivants :</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong>Droit d'accès :</strong> consulter les données vous concernant (section "Mon profil")</li>
              <li><strong>Droit de rectification :</strong> corriger vos informations via votre profil</li>
              <li><strong>Droit à l'effacement :</strong> demander la suppression de votre compte (sous réserve des obligations légales)</li>
              <li><strong>Droit à la portabilité :</strong> exporter vos données sur demande</li>
            </ul>
            <p className="mt-3">
              Pour exercer ces droits, contactez : <strong>admin@dao-platform.ci</strong>
            </p>
          </Section>

          <Section title="Cookies" icon={Lock}>
            <p>
              La plateforme n'utilise pas de cookies de tracking ou publicitaires. Seuls des tokens JWT
              sont stockés en <strong>localStorage</strong> du navigateur pour maintenir votre session.
              Ces données sont supprimées lors de la déconnexion.
            </p>
          </Section>

          <Section title="Contact" icon={Mail}>
            <p>
              Pour toute question relative à la protection de vos données personnelles :
            </p>
            <p className="mt-2">
              <strong>DAO Platform — Institut Ivoirien de Technologie</strong><br />
              Zone Franche, Grand-Bassam, Côte d'Ivoire<br />
              Email : <a href="mailto:admin@dao-platform.ci" className="text-[#0f2444] hover:underline">admin@dao-platform.ci</a><br />
              Tél : +225 01 53 15 15 15
            </p>
          </Section>

          <div className="border-t border-slate-100 pt-6 mt-6 text-center">
            <Link to="/" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-700 transition-colors">
              <ArrowLeft size={14} />Retour à l'accueil
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
