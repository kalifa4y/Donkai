import { test, expect } from '@playwright/test'
import { calculateDonationFee, canUpdateWalletNumber } from '../src/types/index'

test.describe('Donkai Business Rules Audit', () => {
  test('Financial Fee: 5% strict calculation (no fixed fee)', () => {
    // 1000 FCFA -> 50 fee -> 950 net
    const res1 = calculateDonationFee(1000)
    expect(res1.fee).toBe(50)
    expect(res1.netAmount).toBe(950)

    // 5000 FCFA -> 250 fee -> 4750 net
    const res2 = calculateDonationFee(5000)
    expect(res2.fee).toBe(250)
    expect(res2.netAmount).toBe(4750)

    // 10000 FCFA -> 500 fee -> 9500 net
    const res3 = calculateDonationFee(10000)
    expect(res3.fee).toBe(500)
    expect(res3.netAmount).toBe(9500)

    // Under 100 FCFA -> 0 fee, 0 net (invalid)
    const resZero = calculateDonationFee(50)
    expect(resZero.fee).toBe(0)
    expect(resZero.netAmount).toBe(0)
  })

  test('Anti-Fraud Lock: 30-day payout number modification lock', () => {
    // Never updated before -> allowed
    const resNull = canUpdateWalletNumber(null)
    expect(resNull.allowed).toBe(true)
    expect(resNull.daysRemaining).toBe(0)

    // Updated 5 days ago -> locked, 25 days remaining
    const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    const resRecent = canUpdateWalletNumber(fiveDaysAgo)
    expect(resRecent.allowed).toBe(false)
    expect(resRecent.daysRemaining).toBeGreaterThanOrEqual(24)
    expect(resRecent.daysRemaining).toBeLessThanOrEqual(26)

    // Updated 31 days ago -> allowed
    const thirtyOneDaysAgo = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString()
    const resOld = canUpdateWalletNumber(thirtyOneDaysAgo)
    expect(resOld.allowed).toBe(true)
    expect(resOld.daysRemaining).toBe(0)
  })
})
