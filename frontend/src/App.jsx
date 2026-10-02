import { useState, useEffect } from 'react'
import LandingPage from './pages/LandingPage'
import ChatPage from './pages/ChatPage'
import PRReviewsPage from './pages/PRReviewsPage'
import BugTriagePage from './pages/BugTriagePage'
import TeamAnalyticsPage from './pages/TeamAnalyticsPage'
import LoginPage from './pages/LoginPage'
import Navbar from './components/Navbar'
import AntigravityCursor from './components/AntigravityCursor'
import GuideModal from './components/GuideModal'
import './markdown.css'

function App() {
  const [username, setUsername] = useState(null)
  const [userRole, setUserRole] = useState(() => localStorage.getItem('devsphere_role') || 'team_lead')
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [currentView, setCurrentView] = useState('landing') // 'landing' | 'login' | 'app'
  const [activeTab, setActiveTab] = useState('chat') // 'chat' | 'reviews' | 'bugs' | 'analytics'
  const [isGuideOpen, setIsGuideOpen] = useState(false)

  useEffect(() => {
    const existingToken = localStorage.getItem('devsphere_token')
    if (existingToken) {
      setUsername('You')
    }
    setCheckingAuth(false)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('devsphere_token')
    setUsername(null)
    setCurrentView('landing')
  }

  const handleSwitchRole = (newRole) => {
    setUserRole(newRole)
    localStorage.setItem('devsphere_role', newRole)
  }

  const handleLaunchApp = () => {
    if (username) {
      setCurrentView('app')
    } else {
      setCurrentView('login')
    }
  }

  const handleLoginSuccess = (name) => {
    setUsername(name)
    setCurrentView('app')
  }

  if (checkingAuth) {
    return (
      <div className="h-screen w-full bg-[#05070f] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-emerald-400 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-[#05070f] text-slate-100 flex flex-col relative select-text">
      {/* Google Antigravity Interactive Custom Cursor */}
      <AntigravityCursor />

      {/* Interactive Project Guide Modal */}
      <GuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        onLaunchApp={() => {
          setIsGuideOpen(false)
          handleLaunchApp()
        }}
      />

      {/* Landing Marketing Homepage */}
      {currentView === 'landing' && (
        <LandingPage
          onLaunchApp={handleLaunchApp}
          onOpenGuide={() => setIsGuideOpen(true)}
        />
      )}

      {/* Login / Auth Portal */}
      {currentView === 'login' && (
        <LoginPage
          onLoginSuccess={handleLoginSuccess}
          onBackHome={() => setCurrentView('landing')}
        />
      )}

      {/* Main Working App Workspace */}
      {currentView === 'app' && (
        <div className="flex flex-col h-screen w-full overflow-hidden">
          <Navbar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            username={username}
            userRole={userRole}
            onSwitchRole={handleSwitchRole}
            onLogout={handleLogout}
            onGoHome={() => setCurrentView('landing')}
            onOpenGuide={() => setIsGuideOpen(true)}
          />

          <main className="flex-1 min-h-0 flex flex-col overflow-hidden relative">
            {activeTab === 'chat' && (
              <ChatPage username={username} onLogout={handleLogout} hideOwnLogout />
            )}
            {activeTab === 'reviews' && <PRReviewsPage />}
            {activeTab === 'bugs' && <BugTriagePage />}
            {activeTab === 'analytics' && (
              <TeamAnalyticsPage
                userRole={userRole}
                onSwitchRole={handleSwitchRole}
              />
            )}
          </main>
        </div>
      )}
    </div>
  )
}

export default App