export type WalletProvider = 'orange' | 'wave' | 'moov' | 'mtn'

export type VerificationStatus =
  | 'unverified'
  | 'pending'
  | 'verified'
  | 'monitoring'
  | 'restricted'
  | 'suspended'

export type CampaignStatus =
  | 'draft'
  | 'active'
  | 'completed'
  | 'expired'
  | 'suspended'
  | 'archived'

export type DonationStatus =
  | 'pending'
  | 'processing'
  | 'paid'
  | 'failed'
  | 'cancelled'
  | 'refunded'

export type PayoutStatus =
  | 'requested'
  | 'under_review'
  | 'approved'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'rejected'

export type ReportReason =
  | 'fraud'
  | 'impersonation'
  | 'misleading'
  | 'illegal_content'
  | 'other'

export type ReportStatus =
  | 'pending'
  | 'reviewed'
  | 'dismissed'
  | 'action_taken'

export interface Profile {
  id: string
  clerk_user_id: string
  username: string
  display_name: string
  email: string | null
  bio: string | null
  avatar_url: string | null
  verification_status: VerificationStatus
  wallet_provider: WalletProvider | null
  wallet_number: string | null
  wallet_last_updated_at: string | null
  is_admin: boolean
  created_at: string
  updated_at: string
}

// Alias pour compatibilité avec l'ancien code si nécessaire
export type Creator = Profile

export interface Campaign {
  id: string
  user_id: string
  title: string
  slug: string
  description: string
  cover_image_url: string | null
  goal_amount: number
  collected_amount: number
  contributions_count: number
  currency: string
  status: CampaignStatus
  start_date: string
  end_date: string | null
  beneficiary_type: 'self' | 'other'
  beneficiary_name: string | null
  beneficiary_email: string | null
  beneficiary_phone: string | null
  beneficiary_claimed: boolean
  beneficiary_user_id: string | null
  created_at: string
  updated_at: string
  // Relations jointes optionnelles
  profile?: Profile
}

export interface Donation {
  id: string
  campaign_id: string
  amount: number
  fee: number
  net_amount: number
  currency: string
  donor_name: string | null
  donor_email: string | null
  is_anonymous: boolean
  message: string | null
  payment_method?: WalletProvider | 'card' | null
  status: DonationStatus
  idempotency_key?: string | null
  payment_session_id?: string | null
  payment_transaction_id?: string | null
  created_at: string
  paid_at?: string | null
  campaign?: Campaign
}

export interface Payout {
  id: string
  user_id: string
  campaign_id?: string | null
  amount: number
  wallet_provider: WalletProvider
  wallet_number: string
  status: PayoutStatus
  review_notes?: string | null
  rejection_reason?: string | null
  processed_at?: string | null
  created_at: string
}

export interface Report {
  id: string
  campaign_id?: string | null
  target_user_id?: string | null
  reporter_email?: string | null
  reason: ReportReason
  description: string
  evidence_url?: string | null
  status: ReportStatus
  created_at: string
}

export interface AuditLog {
  id: string
  user_id?: string | null
  action: string
  details?: Record<string, unknown> | null
  ip_address?: string | null
  created_at: string
}

/**
 * Règle financière stricte validée :
 * 5% + 100 FCFA par contribution, déduits du montant reçu par le bénéficiaire.
 */
export function calculateDonationFee(grossAmount: number): { fee: number; netAmount: number } {
  if (!grossAmount || grossAmount < 100) {
    return { fee: 0, netAmount: 0 }
  }
  const variableFee = Math.round(grossAmount * 0.05)
  const fixedFee = 100
  const totalFee = variableFee + fixedFee
  const net = Math.max(0, grossAmount - totalFee)
  return { fee: totalFee, netAmount: net }
}

/**
 * Vérification du délai de 30 jours pour la modification du numéro Mobile Money
 */
export function canUpdateWalletNumber(lastUpdatedAt: string | null): { allowed: boolean; daysRemaining: number } {
  if (!lastUpdatedAt) {
    return { allowed: true, daysRemaining: 0 }
  }
  const lastDate = new Date(lastUpdatedAt).getTime()
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000
  const unlockDate = lastDate + thirtyDaysMs
  const now = Date.now()

  if (now >= unlockDate) {
    return { allowed: true, daysRemaining: 0 }
  }

  const diffMs = unlockDate - now
  const daysRemaining = Math.ceil(diffMs / (24 * 60 * 60 * 1000))
  return { allowed: false, daysRemaining }
}
