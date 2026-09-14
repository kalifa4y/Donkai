import React, { useState } from 'react'
import type { AuditLog, Profile } from '../../types'
import { Search } from 'lucide-react'

interface AdminAuditLogsViewProps {
  auditLogs: AuditLog[]
  users: Profile[]
  onRefresh: () => void
}

export const AdminAuditLogsView: React.FC<AdminAuditLogsViewProps> = ({
  auditLogs,
  users,
}) => {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredLogs = auditLogs.filter((log) => {
    const user = users.find((u) => u.id === log.user_id)
    const matchesSearch =
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user && user.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.ip_address && log.ip_address.includes(searchTerm))
    return matchesSearch
  })

  return (
    <div className="space-y-6 text-left">
      <div>
        <h2 className="text-xl font-extrabold text-gray-950 dark:text-white font-heading">
          Journal d'Audit & Sécurité
        </h2>
        <p className="text-xs text-gray-500 dark:text-zinc-400">
          Traçabilité immuable des actions sensibles, approbations financières et modifications administratives.
        </p>
      </div>

      {/* Recherche */}
      <div className="relative">
        <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Rechercher par type d'action, utilisateur, adresse IP..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#12141f] border border-gray-200 dark:border-zinc-800 text-gray-900 dark:text-white rounded-2xl text-xs outline-none focus:ring-2 focus:ring-orange-500"
        />
      </div>

      {/* Tableau des logs */}
      <div className="bg-white dark:bg-[#12141f] border border-gray-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-xs">
        {filteredLogs.length === 0 ? (
          <div className="py-16 text-center text-xs text-gray-400 dark:text-zinc-500">
            Aucun log d'audit enregistré.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-100 dark:border-zinc-800/80 bg-gray-50/70 dark:bg-zinc-900/50 text-gray-500 dark:text-zinc-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4">Action</th>
                  <th className="py-3.5 px-4">Opérateur / Auteur</th>
                  <th className="py-3.5 px-4">Détails de l'opération</th>
                  <th className="py-3.5 px-4">Adresse IP</th>
                  <th className="py-3.5 px-4">Horodatage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/80">
                {filteredLogs.map((log) => {
                  const user = users.find((u) => u.id === log.user_id)

                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/30 transition-colors"
                    >
                      {/* Action */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 px-2 py-0.5 rounded-md text-[11px]">
                          {log.action}
                        </span>
                      </td>

                      {/* Opérateur */}
                      <td className="py-3.5 px-4">
                        {user ? (
                          <div className="space-y-0.5">
                            <p className="font-bold text-gray-950 dark:text-white">
                              {user.display_name}
                            </p>
                            <p className="text-[10px] text-gray-400 font-mono">@{user.username}</p>
                          </div>
                        ) : (
                          <span className="text-gray-400 font-mono">
                            {log.user_id ? `#${log.user_id.slice(0, 8)}` : 'Système'}
                          </span>
                        )}
                      </td>

                      {/* Détails JSON */}
                      <td className="py-3.5 px-4 max-w-xs font-mono text-[11px] text-gray-600 dark:text-zinc-400 truncate">
                        {log.details ? JSON.stringify(log.details) : '—'}
                      </td>

                      {/* IP */}
                      <td className="py-3.5 px-4 font-mono text-[11px] text-gray-500 dark:text-zinc-500">
                        {log.ip_address || 'Local'}
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-gray-400 dark:text-zinc-500 text-[11px] whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString('fr-FR')}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
