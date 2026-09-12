import React, { useState, useEffect } from 'react'
import { AuthProvider } from './context/AuthContext'
import { I18nProvider } from './lib/i18n'
import { Navbar } from './components/Navbar'
import { Footer } from './components/Footer'
import { HomePage } from './pages/HomePage'
import { CampaignPage } from './pages/CampaignPage'
import { CreatorProfilePage } from './pages/CreatorProfilePage'
import { CreateCampaignPage } from './pages/CreateCampaignPage'
import { LoginPage } from './pages/LoginPage'
import { OnboardingPage } from './pages/OnboardingPage'
import { DashboardPage } from './pages/DashboardPage'
import { SettingsPage } from './pages/SettingsPage'
import { AdminPage } from './pages/AdminPage'

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

  // Analyse des routes avec slugs et username (indépendant du nom de domaine)
  // Format 1 : /@username/:slug (Collecte spécifique)
  const campaignMatch = currentPath.match(/^\/@([a-zA-Z0-9_]+)\/([a-zA-Z0-9_-]+)$/)

  // Format 2 : /@username (Profil organisateur)
  const profileMatch = currentPath.match(/^\/@([a-zA-Z0-9_]+)$/)

  const renderRoute = () => {
    // 1. Page de collecte dédiée : /@username/:slug
    if (campaignMatch) {
      return (
        <CampaignPage
          username={campaignMatch[1]}
          slug={campaignMatch[2]}
          onNavigate={navigate}
        />
      )
    }

    // 2. Page de profil public : /@username
    if (profileMatch) {
      return (
        <CreatorProfilePage
          username={profileMatch[1]}
          onNavigate={navigate}
        />
      )
    }

    // 3. Routes applicatives standards
    if (currentPath === '/create') {
      return <CreateCampaignPage onNavigate={navigate} />
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
    if (currentPath === '/admin') {
      return <AdminPage onNavigate={navigate} />
    }

    // Par défaut : Landing Page
    return <HomePage onNavigate={navigate} />
  }

  return (
    <I18nProvider>
      <AuthProvider>
        <div className="min-h-screen flex flex-col bg-[#faf9f6]">
          <Navbar onNavigate={navigate} />
          <main className="flex-1">{renderRoute()}</main>
          <Footer onNavigate={navigate} />
        </div>
      </AuthProvider>
    </I18nProvider>
  )
}

export default App
