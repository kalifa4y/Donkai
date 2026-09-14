import React, { useState, useEffect, Suspense, lazy } from 'react'
import { AuthProvider } from './context/AuthContext'
import { I18nProvider } from './lib/i18n'
import { Navbar } from './components/Navbar'
import { Footer } from './components/Footer'

const HomePage = lazy(() => import('./pages/HomePage').then((m) => ({ default: m.HomePage })))
const ExplorePage = lazy(() => import('./pages/ExplorePage').then((m) => ({ default: m.ExplorePage })))
const CampaignPage = lazy(() => import('./pages/CampaignPage').then((m) => ({ default: m.CampaignPage })))
const CreatorProfilePage = lazy(() => import('./pages/CreatorProfilePage').then((m) => ({ default: m.CreatorProfilePage })))
const CreateCampaignPage = lazy(() => import('./pages/CreateCampaignPage').then((m) => ({ default: m.CreateCampaignPage })))
const LoginPage = lazy(() => import('./pages/LoginPage').then((m) => ({ default: m.LoginPage })))
const OnboardingPage = lazy(() => import('./pages/OnboardingPage').then((m) => ({ default: m.OnboardingPage })))
const DashboardPage = lazy(() => import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage })))
const SettingsPage = lazy(() => import('./pages/SettingsPage').then((m) => ({ default: m.SettingsPage })))
const AdminPage = lazy(() => import('./pages/AdminPage').then((m) => ({ default: m.AdminPage })))
const LiveStreamView = lazy(() => import('./pages/LiveStreamView').then((m) => ({ default: m.LiveStreamView })))

export const App: React.FC = () => {
  const [currentPath, setCurrentPath] = useState(window.location.pathname)

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname)
    }

    window.addEventListener('popstate', handlePopState)

    // Écoute dynamique et automatique des préférences de thème du système d'exploitation
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleThemeChange = (e: MediaQueryListEvent | MediaQueryList) => {
      if (e.matches) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }

    // Synchronisation immédiate
    handleThemeChange(mediaQuery)

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleThemeChange)
    } else {
      mediaQuery.addListener(handleThemeChange)
    }

    return () => {
      window.removeEventListener('popstate', handlePopState)
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleThemeChange)
      } else {
        mediaQuery.removeListener(handleThemeChange)
      }
    }
  }, [])

  const navigate = (path: string) => {
    window.history.pushState({}, '', path)
    setCurrentPath(path)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Analyse des routes avec slugs et username (indépendant du nom de domaine)
  // Format 0 : /@username/:slug/live (Mode Live Plein Écran TikTok/Stream)
  const liveMatch = currentPath.match(/^\/@([a-zA-Z0-9_]+)\/([a-zA-Z0-9_-]+)\/live$/)

  // Format 1 : /@username/:slug (Collecte spécifique)
  const campaignMatch = currentPath.match(/^\/@([a-zA-Z0-9_]+)\/([a-zA-Z0-9_-]+)$/)

  // Format 2 : /@username (Profil organisateur)
  const profileMatch = currentPath.match(/^\/@([a-zA-Z0-9_]+)$/)

  // Si on est en Mode Live Plein Écran, affichage studio immersif sans navbar ni footer
  if (liveMatch) {
    return (
      <I18nProvider>
        <AuthProvider>
          <Suspense
            fallback={
              <div className="min-h-screen bg-[#07080e] flex items-center justify-center text-white">
                <div className="w-8 h-8 border-2 border-orange-600 border-t-transparent rounded-full animate-spin" />
              </div>
            }
          >
            <LiveStreamView
              username={liveMatch[1]}
              slug={liveMatch[2]}
              onNavigate={navigate}
            />
          </Suspense>
        </AuthProvider>
      </I18nProvider>
    )
  }

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
    if (currentPath === '/explore') {
      return <ExplorePage onNavigate={navigate} />
    }
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
        <div className="min-h-screen flex flex-col bg-[#faf9f6] dark:bg-[#0c0d12] text-gray-900 dark:text-zinc-100 transition-colors duration-200">
          <Navbar onNavigate={navigate} currentPath={currentPath} />
          <main className="flex-1">
            <Suspense
              fallback={
                <div className="min-h-[50vh] flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-orange-600 border-t-transparent rounded-full animate-spin" />
                </div>
              }
            >
              {renderRoute()}
            </Suspense>
          </main>
          <Footer onNavigate={navigate} />
        </div>
      </AuthProvider>
    </I18nProvider>
  )
}


export default App
