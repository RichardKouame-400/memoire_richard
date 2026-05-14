import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authApi } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchMe = useCallback(async () => {
    try {
      const { data } = await authApi.me()
      setUser(data)
    } catch {
      setUser(null)
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (token) {
      fetchMe()
    } else {
      setLoading(false)
    }
  }, [fetchMe])

  const login = async (username, password) => {
    const { data } = await authApi.login({ username, password })
    localStorage.setItem('access_token', data.access)
    localStorage.setItem('refresh_token', data.refresh)
    setUser(data.user)
    return data.user
  }

  const logout = () => {
    localStorage.clear()
    setUser(null)
  }

  const value = { user, loading, login, logout, fetchMe }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ACHETEUR: 'acheteur',
  EVALUATEUR: 'evaluateur',
  SOUMISSIONNAIRE: 'soumissionnaire',
  AUDITEUR: 'auditeur',
}

export const ROLE_LABELS = {
  super_admin: 'Super Administrateur',
  acheteur: 'Acheteur Public',
  evaluateur: 'Évaluateur',
  soumissionnaire: 'Soumissionnaire',
  auditeur: 'Auditeur',
}
