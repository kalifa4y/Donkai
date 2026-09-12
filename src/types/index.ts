export type WalletProvider = 'orange' | 'wave' | 'moov' | 'mtn'

export type DonationStatus = 'pending' | 'paid' | 'failed' | 'cancelled'

export type PayoutStatus = 'pending' | 'completed' | 'failed'

export interface Creator {
  id: string
  username: string
  display_name: string
  bio: string | null
  avatar_url: string | null
  wallet_provider: WalletProvider
  wallet_number: string
  created_at: string
  updated_at: string
}

export interface Donation {
  id: string
  creator_id: string
  amount: number
  fee: number
  net_amount: number
  currency: string
  donor_name: string | null
  donor_email: string | null
  message: string | null
  status: DonationStatus
  saspay_session_id?: string | null
  saspay_transaction_id?: string | null
  created_at: string
}

export interface Payout {
  id: string
  creator_id: string
  amount: number
  wallet_provider: WalletProvider
  wallet_number: string
  status: PayoutStatus
  saspay_payout_id?: string | null
  created_at: string
}
