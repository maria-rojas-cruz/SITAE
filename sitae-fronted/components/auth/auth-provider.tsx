// components/auth-provider.tsx
'use client'

import { SessionProvider, useSession } from 'next-auth/react'
import { SWRConfig } from 'swr'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

// Fetcher que incluye manejo de errores de auth
const fetcher = async (url: string) => {
  const res = await fetch(url, { 
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' }
  })
  
  if (res.status === 401) {
    // Si hay error de auth, redirigir a login
    window.location.href = '/login'
    throw new Error('No autorizado')
  }
  
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`)
  }
  
  return res.json()
}

// Componente interno que usa la sesión
function AuthContent({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    // Si no hay sesión y ya terminó de cargar, redirigir
    if (status !== 'loading' && !session) {
      router.push('/login')
    }
  }, [session, status, router])

  // Mostrar loading mientras carga la sesión
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Cargando...</div>
      </div>
    )
  }

  // Si no hay sesión, no mostrar nada (se está redirigiendo)
  if (!session) {
    return null
  }

  return <>{children}</>
}

// Provider principal
export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SWRConfig value={{ 
        fetcher, 
        shouldRetryOnError: false, 
        revalidateOnFocus: false 
      }}>
        <AuthContent>{children}</AuthContent>
      </SWRConfig>
    </SessionProvider>
  )
}