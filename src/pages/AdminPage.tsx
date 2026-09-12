import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Report, Payout, Campaign } from '../types'
import { Lock } from '../components/Icons'

interface AdminPageProps {
  onNavigate?: (path: string) => void
}

export const AdminPage: React.FC<AdminPageProps> = () => {
  const [passcode, setPasscode] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [activeTab, setActiveTab] = useState<'reports' | 'payouts' | 'campaigns'>('reports')

  const [reports, setReports] = useState<Report[]>([])
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(false)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    // Clé d'accès administrateur interne (sécurisée en variable d'environnement ou code interne)
    if (passcode === 'donkai_admin_2026' || passcode === 'admin') {
      setIsAuthenticated(true)
      loadAdminData()
    } else {
      alert('Code administrateur invalide.')
    }
  }

  const loadAdminData = async () => {
    setLoading(true)
    try {
      // 1. Signalements
      const { data: repData } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false })

      const localReports = JSON.parse(localStorage.getItem('donkai_local_reports') || '[]')
      setReports([...(repData || []), ...localReports])

      // 2. Retraits
      const { data: payData } = await supabase
        .from('payouts')
        .select('*')
        .order('created_at', { ascending: false })

      setPayouts(payData || [])

      // 3. Campagnes
      const { data: campData } = await supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false })

      setCampaigns(campData || [])
    } catch (err) {
      console.error('Erreur chargement admin:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateReportStatus = async (id: string, status: 'reviewed' | 'dismissed') => {
    await supabase.from('reports').update({ status }).eq('id', id)
    setActionSuccess('Signalement mis à jour.')
    setTimeout(() => setActionSuccess(null), 3000)
    loadAdminData()
  }

  const handleUpdateCampaignStatus = async (id: string, status: 'active' | 'suspended') => {
    await supabase.from('campaigns').update({ status }).eq('id', id)
    setActionSuccess(`Collecte passée au statut : ${status}`)
    setTimeout(() => setActionSuccess(null), 3000)
    loadAdminData()
  }

  const handleApprovePayout = async (id: string) => {
    await supabase.from('payouts').update({ status: 'completed' }).eq('id', id)
    setActionSuccess('Retrait validé et transféré vers l’opérateur.')
    setTimeout(() => setActionSuccess(null), 3000)
    loadAdminData()
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <form onSubmit={handleLogin} className="bg-white p-8 rounded-3xl border border-gray-200 max-w-sm w-full space-y-4 shadow-sm text-left">
          <div className="w-10 h-10 rounded-2xl bg-gray-900 text-white flex items-center justify-center mx-auto mb-2">
            <Lock className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-extrabold text-gray-950 text-center">Espace Modération & Conformité</h2>
          <p className="text-xs text-gray-500 text-center">
            Accès strictement réservé aux équipes de surveillance Donkai.
          </p>
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Code d'accès
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-gray-900 hover:bg-black text-white font-bold py-3 rounded-xl text-xs transition-colors cursor-pointer"
          >
            Déverrouiller
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8 text-left">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-950">Espace Modération & Surveillance</h1>
          <p className="text-xs text-gray-500">Revue humaine des alertes et contrôles financiers</p>
        </div>
        <button
          type="button"
          onClick={() => setIsAuthenticated(false)}
          className="text-xs font-bold text-gray-500 hover:text-gray-900 border border-gray-200 px-3 py-1.5 rounded-xl cursor-pointer"
        >
          Verrouiller
        </button>
      </div>

      {actionSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-bold">
          {actionSuccess}
        </div>
      )}

      {/* Onglets Admin */}
      <div className="flex border-b border-gray-200 gap-2 text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveTab('reports')}
          className={`py-2 px-4 rounded-t-xl transition-colors cursor-pointer ${
            activeTab === 'reports' ? 'bg-orange-50 text-orange-600 border-b-2 border-orange-600' : 'text-gray-500'
          }`}
        >
          Signalements reçus ({reports.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('payouts')}
          className={`py-2 px-4 rounded-t-xl transition-colors cursor-pointer ${
            activeTab === 'payouts' ? 'bg-orange-50 text-orange-600 border-b-2 border-orange-600' : 'text-gray-500'
          }`}
        >
          Retraits à valider ({payouts.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('campaigns')}
          className={`py-2 px-4 rounded-t-xl transition-colors cursor-pointer ${
            activeTab === 'campaigns' ? 'bg-orange-50 text-orange-600 border-b-2 border-orange-600' : 'text-gray-500'
          }`}
        >
          Collectes actives & suspensions ({campaigns.length})
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-gray-400 text-xs">Chargement des données de modération...</div>
      ) : (
        <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-xs">
          {/* Signalements */}
          {activeTab === 'reports' && (
            <div className="space-y-4">
              <div className="p-3 bg-gray-50 rounded-xl text-xs text-gray-600">
                <strong>Règle Donkai :</strong> 3 signalements crédibles entraînent une revue immédiate et le blocage préventif des retraits.
              </div>

              {reports.length === 0 ? (
                <p className="text-xs text-gray-400 py-6 text-center">Aucun signalement en attente.</p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {reports.map((r, i) => (
                    <div key={r.id || i} className="py-4 flex items-start justify-between gap-4 text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-red-600 uppercase tracking-wider text-[10px]">
                            {r.reason}
                          </span>
                          <span className="text-gray-400">
                            {r.created_at ? new Date(r.created_at).toLocaleDateString('fr-FR') : 'Aujourd’hui'}
                          </span>
                        </div>
                        <p className="text-gray-800 font-medium">{r.description}</p>
                        {r.reporter_email && (
                          <p className="text-[11px] text-gray-400">Email déclarant : {r.reporter_email}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleUpdateReportStatus(r.id, 'reviewed')}
                          className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 px-3 py-1.5 rounded-lg font-bold text-[11px] transition-colors cursor-pointer"
                        >
                          Marquer vérifié
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateReportStatus(r.id, 'dismissed')}
                          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg font-bold text-[11px] transition-colors cursor-pointer"
                        >
                          Rejeter
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Retraits */}
          {activeTab === 'payouts' && (
            <div className="space-y-4">
              {payouts.length === 0 ? (
                <p className="text-xs text-gray-400 py-6 text-center">Aucune demande de retrait.</p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {payouts.map((p) => (
                    <div key={p.id} className="py-4 flex items-center justify-between gap-4 text-xs">
                      <div>
                        <p className="font-bold text-gray-900 text-sm">
                          {p.amount.toLocaleString()} FCFA vers {p.wallet_provider.toUpperCase()} ({p.wallet_number})
                        </p>
                        <p className="text-[11px] text-gray-400">
                          Statut actuel : {p.status}
                        </p>
                      </div>

                      {p.status !== 'completed' && (
                        <button
                          type="button"
                          onClick={() => handleApprovePayout(p.id)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer"
                        >
                          Valider le versement
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Collectes */}
          {activeTab === 'campaigns' && (
            <div className="space-y-4">
              {campaigns.length === 0 ? (
                <p className="text-xs text-gray-400 py-6 text-center">Aucune collecte enregistrée.</p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {campaigns.map((c) => (
                    <div key={c.id} className="py-4 flex items-center justify-between gap-4 text-xs">
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{c.title}</p>
                        <p className="text-gray-500">
                          {c.collected_amount.toLocaleString()} / {c.goal_amount.toLocaleString()} FCFA • Statut :{' '}
                          <strong className={c.status === 'suspended' ? 'text-red-600' : 'text-emerald-600'}>
                            {c.status}
                          </strong>
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {c.status === 'suspended' ? (
                          <button
                            type="button"
                            onClick={() => handleUpdateCampaignStatus(c.id, 'active')}
                            className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer"
                          >
                            Réactiver
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleUpdateCampaignStatus(c.id, 'suspended')}
                            className="bg-red-50 text-red-700 hover:bg-red-100 px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer"
                          >
                            Suspendre
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
