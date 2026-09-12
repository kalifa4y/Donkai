import React, { useState, useEffect } from 'react'
import { AuthProvider } from './context/AuthContext'
import { Navbar } from './components/Navbar'
import { Footer } from './components/Footer'
import { HomePage } from './pages/HomePage'
import { CreatorPage } from './pages/CreatorPage'
import { LoginPage } from './pages/LoginPage'
import { OnboardingPage } from './pages/OnboardingPage'
import { DashboardPage } from './pages/DashboardPage'
import { SettingsPage } from './pages/SettingsPage'

export const App: React.FC = () => {
  const [currentPath, setCurrentPath] = useState(window.location.pathname)

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname)
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const navigate = (path: string) => {
    window.history.pushState({}, '', path)
    setCurrentPath(path)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const getUsername = (p: string) => {
    const match = p.match(/^\/@([a-zA-Z0-9_]+)$/)
    return match ? match[1] : null
  }

  const username = getUsername(currentPath)

  const renderRoute = () => {
    if (currentPath === '/') {
      return <HomePage onNavigate={navigate} />
    }
    if (currentPath === '/login') {
      return <LoginPage onNavigate={navigate} />
    }
    if (currentPath === '/onboarding') {
      return <OnboardingPage onNavigate={navigate} />
    }
    if (currentPath === '/dashboard') {
      return <DashboardPage onNavigate={navigate} />
    }
    if (currentPath === '/settings') {
      return <SettingsPage onNavigate={navigate} />
    }
    if (username) {
      return <CreatorPage username={username} onNavigate={navigate} />
    }
    return <HomePage onNavigate={navigate} />
  }

  return (
    <AuthProvider>
      <div className="min-h-screen flex flex-col bg-[#faf8f5]">
        <Navbar onNavigate={navigate} />
        <main className="flex-1">{renderRoute()}</main>
        <Footer />
      </div>
    </AuthProvider>
  )
}
export default App
