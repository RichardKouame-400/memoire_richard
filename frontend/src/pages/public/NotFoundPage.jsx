import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../../hooks/useAuth'
import { Home, ArrowLeft, Search } from 'lucide-react'

export default function NotFoundPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md"
      >
        {/* 404 visual */}
        <div className="relative mb-8">
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            <div className="text-[120px] font-display font-bold text-slate-100 leading-none select-none">
              404
            </div>
          </motion.div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 rounded-3xl bg-[#0f2444] flex items-center justify-center shadow-2xl">
              <Search size={32} className="text-white" />
            </div>
          </div>
        </div>

        <h1 className="font-display text-2xl font-bold text-slate-900 mb-3">
          Page introuvable
        </h1>
        <p className="text-slate-500 text-sm leading-relaxed mb-8">
          La page que vous cherchez n'existe pas ou a été déplacée.
          Vérifiez l'URL ou retournez à l'accueil.
        </p>

        <div className="flex items-center justify-center gap-3 flex-wrap">
          <motion.button whileTap={{ scale: 0.97 }}
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 px-5 py-2.5 rounded-xl hover:border-[#0f2444] hover:text-[#0f2444] transition-all">
            <ArrowLeft size={16} />Page précédente
          </motion.button>

          <Link to={user ? '/dashboard' : '/'}>
            <motion.div whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 text-sm font-semibold text-white bg-[#0f2444] px-5 py-2.5 rounded-xl hover:bg-[#1a3a6b] transition-all">
              <Home size={16} />
              {user ? 'Tableau de bord' : 'Accueil'}
            </motion.div>
          </Link>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-200">
          <p className="text-xs text-slate-400">DAO Platform — Institut Ivoirien de Technologie</p>
        </div>
      </motion.div>
    </div>
  )
}
