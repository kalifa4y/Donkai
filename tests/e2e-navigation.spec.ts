import { test, expect } from '@playwright/test'

test.describe('Donkai UI & Navigation E2E Audit', () => {
  test('HomePage renders hero, typography, and no emojis', async ({ page }) => {
    await page.goto('/')
    
    // Titre principal présent
    const heading = page.locator('h1')
    await expect(heading).toBeVisible()

    // Vérifier absence totale d'emojis dans le texte visible du body
    const bodyText = await page.innerText('body')
    const emojiRegex = /[\uD83C-\uDBFF\uDC00-\uDFFF]|[\u2600-\u27BF]/
    expect(emojiRegex.test(bodyText)).toBe(false)
  })

  test('Campaign routing /@username/:slug loads campaign page', async ({ page }) => {
    // Inject mock local campaign so the page renders data smoothly
    await page.addInitScript(() => {
      const mockCampaign = {
        id: 'camp_test_1',
        slug: 'eau-potable-gao',
        title: 'Accès à l’eau potable pour Gao',
        description: 'Financement d’un forage solaire et pompes d’accès à l’eau.',
        goal_amount: 2500000,
        collected_amount: 750000,
        contributions_count: 12,
        status: 'active',
        created_at: new Date().toISOString(),
        end_date: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
        beneficiary_type: 'self',
        profile: {
          id: 'prof_test_1',
          username: 'kalifa',
          display_name: 'Kalifa Touré',
          verification_status: 'verified',
        },
      }
      localStorage.setItem('donkai_local_campaigns', JSON.stringify([mockCampaign]))
    })

    await page.goto('/@kalifa/eau-potable-gao')
    await expect(page.locator('text=Accès à l’eau potable pour Gao')).toBeVisible({ timeout: 10000 })

    // Tester la carte de don : sélection d'un montant prédéfini (ex: 5 000 FCFA)
    const presetBtn = page.locator('button:has-text("5 000")')
    if (await presetBtn.isVisible()) {
      await presetBtn.click()
      // Vérifier que le décompte transparent des frais est affiché
      await expect(page.locator('text=Net reversé')).toBeVisible()
    }
  })
})
