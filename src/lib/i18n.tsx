import React, { createContext, useContext, useState } from 'react'

export type Language = 'fr' | 'en'

interface Translations {
  [key: string]: {
    fr: string
    en: string
  }
}

export const translations: Translations = {
  // Navigation & General
  'nav.home': { fr: 'Accueil', en: 'Home' },
  'nav.explore': { fr: 'Explorer', en: 'Explore' },
  'nav.dashboard': { fr: 'Tableau de bord', en: 'Dashboard' },
  'nav.login': { fr: 'Connexion', en: 'Sign in' },
  'nav.create': { fr: 'Créer une collecte', en: 'Start a campaign' },
  'nav.logout': { fr: 'Déconnexion', en: 'Sign out' },
  'nav.admin': { fr: 'Administration', en: 'Administration' },

  // Hero Section
  'hero.badge': { fr: 'Soutien communautaire & Mobile Money en Afrique', en: 'Community Support & Mobile Money in Africa' },
  'hero.title_1': { fr: 'Créez votre collecte.', en: 'Start your campaign.' },
  'hero.title_2': { fr: 'Partagez-la.', en: 'Share it.' },
  'hero.title_3': { fr: 'Recevez le soutien de votre communauté.', en: 'Receive support from your community.' },
  'hero.subtitle': {
    fr: 'DONKAI permet aux créateurs, artistes, associations et porteurs de projet de financer leurs objectifs grâce aux contributions directes par Orange Money, Wave et Moov Money.',
    en: 'DONKAI enables creators, artists, non-profits, and project leaders to fund their goals through direct contributions via Orange Money, Wave, and Moov Money.',
  },
  'hero.cta_primary': { fr: 'Créer une collecte', en: 'Start a campaign' },
  'hero.cta_secondary': { fr: 'Comment ça marche', en: 'How it works' },

  // How it works
  'how.title': { fr: 'Comment ça marche', en: 'How it works' },
  'how.subtitle': { fr: 'Trois étapes simples pour donner vie à vos projets.', en: 'Three simple steps to bring your projects to life.' },
  'how.step1_title': { fr: '1. Créez', en: '1. Create' },
  'how.step1_desc': { fr: 'Définissez votre objectif, votre description et votre date limite en quelques clics.', en: 'Set your goal, description, and timeline in just a few clicks.' },
  'how.step2_title': { fr: '2. Partagez', en: '2. Share' },
  'how.step2_desc': { fr: 'Diffusez votre lien unique sur TikTok, WhatsApp, Instagram, Facebook et X.', en: 'Share your unique link on TikTok, WhatsApp, Instagram, Facebook, and X.' },
  'how.step3_title': { fr: '3. Recevez', en: '3. Receive' },
  'how.step3_desc': { fr: 'Votre communauté contribue avec son moyen de paiement préféré sans créer de compte.', en: 'Your community contributes instantly using their preferred payment method.' },

  // For whom
  'audience.title': { fr: 'Pour qui ?', en: 'Who is it for?' },
  'audience.subtitle': { fr: 'Une plateforme conçue pour tous les porteurs d initiatives positives.', en: 'A platform built for all positive initiatives and leaders.' },
  'audience.creators': { fr: 'Créateurs & Streamers', en: 'Creators & Streamers' },
  'audience.creators_desc': { fr: 'Financer vos productions, vidéos, directs et projets digitaux avec vos abonnés.', en: 'Fund your productions, livestreams, and creative projects with your followers.' },
  'audience.artists': { fr: 'Artistes & Musiciens', en: 'Artists & Musicians' },
  'audience.artists_desc': { fr: 'Produire vos clips, albums, tournées et masterclasses en toute indépendance.', en: 'Produce your music videos, albums, and tours with creative independence.' },
  'audience.associations': { fr: 'Associations & ONG', en: 'Associations & Non-profits' },
  'audience.associations_desc': { fr: 'Mobiliser rapidement des fonds pour des actions solidaires, éducatives et médicales.', en: 'Mobilize funds quickly for social, educational, and medical initiatives.' },
  'audience.projects': { fr: 'Projets communautaires', en: 'Community Projects' },
  'audience.projects_desc': { fr: 'Rénovations d infrastructures locales, bibliothèques, forages d eau et événements.', en: 'Local infrastructure, neighborhood libraries, clean water wells, and events.' },

  // Payments
  'payment.title': { fr: 'Moyens de paiement locaux réels', en: 'Real local payment methods' },
  'payment.subtitle': { fr: 'Paiements natifs, instantanés et sécurisés.', en: 'Native, instant, and secure payments.' },

  // Security & Trust
  'security.title': { fr: 'Confiance & Sécurité', en: 'Trust & Security' },
  'security.point1': { fr: 'Des mécanismes de vérification pour renforcer la confiance.', en: 'Verification mechanisms to strengthen community trust.' },
  'security.point2': { fr: 'Des contrôles de sécurité pour protéger les collectes et les bénéficiaires.', en: 'Strict security controls to safeguard campaigns and beneficiaries.' },
  'security.point3': { fr: 'Protection renforcée du numéro de versement avec délai de verrouillage.', en: 'Reinforced payout number protection with a security lockout period.' },

  // Product Showcase
  'showcase.title': { fr: 'Découvrez l’interface DONKAI', en: 'Explore the DONKAI interface' },
  'showcase.subtitle': { fr: 'Une expérience pensée pour le mobile, ultra-rapide et sans friction.', en: 'A mobile-first experience built for speed and zero friction.' },
  'showcase.tab_campaign': { fr: 'Page de collecte', en: 'Campaign page' },
  'showcase.tab_dashboard': { fr: 'Tableau de bord', en: 'Creator dashboard' },
  'showcase.tab_profile': { fr: 'Profil créateur', en: 'Public profile' },

  // FAQ
  'faq.title': { fr: 'Questions fréquentes', en: 'Frequently asked questions' },
  'faq.subtitle': { fr: 'Tout ce que vous devez savoir pour lancer ou soutenir une collecte.', en: 'Everything you need to know about starting or supporting a campaign.' },

  // Final CTA
  'cta_final.title': { fr: 'Prêt à lancer votre collecte ?', en: 'Ready to launch your campaign?' },
  'cta_final.desc': { fr: 'Votre communauté veut vous soutenir. Donnez-lui simplement un moyen fiable de le faire.', en: 'Your community wants to support you. Simply give them a reliable way to do so.' },
  'cta_final.button': { fr: 'Créer ma collecte maintenant', en: 'Create my campaign now' },

  // Donation form
  'donate.title': { fr: 'Soutenir cette collecte', en: 'Support this campaign' },
  'donate.amount_label': { fr: 'Montant de votre contribution (FCFA)', en: 'Contribution amount (FCFA)' },
  'donate.name_label': { fr: 'Votre nom ou prénom (optionnel)', en: 'Your name (optional)' },
  'donate.anonymous': { fr: 'Contribuer de manière anonyme', en: 'Contribute anonymously' },
  'donate.email_label': { fr: 'Votre email (pour le reçu de paiement)', en: 'Your email (for the payment receipt)' },
  'donate.message_label': { fr: 'Message d encouragement (optionnel)', en: 'Word of encouragement (optional)' },
  'donate.button': { fr: 'Contribuer avec Mobile Money', en: 'Contribute with Mobile Money' },
  'donate.processing': { fr: 'Traitement sécurisé en cours...', en: 'Secure processing...' },
  'donate.no_account_needed': { fr: 'Aucun compte requis pour soutenir cette collecte.', en: 'No account required to support this campaign.' },
  'donate.success_title': { fr: 'Merci pour votre soutien !', en: 'Thank you for your support!' },
  'donate.success_desc': { fr: 'Votre contribution a bien été enregistrée et transmise au bénéficiaire.', en: 'Your contribution has been successfully registered and forwarded.' },
  'donate.share': { fr: 'Partager la collecte', en: 'Share campaign' },
  'donate.copy_link': { fr: 'Copier le lien', en: 'Copy link' },
  'donate.link_copied': { fr: 'Lien copié !', en: 'Link copied!' },

  // Campaign details
  'campaign.goal': { fr: 'Objectif', en: 'Goal' },
  'campaign.collected': { fr: 'collectés', en: 'raised' },
  'campaign.supporters': { fr: 'soutiens', en: 'supporters' },
  'campaign.days_left': { fr: 'jours restants', en: 'days left' },
  'campaign.verified_badge': { fr: 'Identité vérifiée', en: 'Verified identity' },
  'campaign.report': { fr: 'Signaler cette collecte', en: 'Report this campaign' },

  // Dashboard
  'dashboard.overview': { fr: 'Vue d ensemble', en: 'Overview' },
  'dashboard.total_raised': { fr: 'Total collecté', en: 'Total raised' },
  'dashboard.available_balance': { fr: 'Solde disponible', en: 'Available balance' },
  'dashboard.withdrawn': { fr: 'Montant retiré', en: 'Withdrawn amount' },
  'dashboard.supporters_count': { fr: 'Nombre de soutiens', en: 'Supporters count' },
  'dashboard.average_donation': { fr: 'Moyenne des contributions', en: 'Average contribution' },
  'dashboard.my_campaigns': { fr: 'Mes collectes', en: 'My campaigns' },
  'dashboard.request_payout': { fr: 'Demander un retrait', en: 'Request payout' },
  'dashboard.fees_info': { fr: 'Frais : 5 % + 100 FCFA par contribution, déduits du montant reçu. Aucun frais au retrait.', en: 'Fees: 5% + 100 FCFA per contribution, deducted from received amount. Zero fee on withdrawal.' },
  'dashboard.payout_lock_warning': { fr: 'Les informations de réception ont récemment été modifiées. Certaines opérations peuvent être temporairement limitées pour protéger cette collecte.', en: 'Payout information was recently updated. Certain operations may be temporarily restricted to protect this campaign.' },
}

interface I18nContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const I18nContext = createContext<I18nContextType>({
  language: 'fr',
  setLanguage: () => {},
  t: (key: string) => key,
})

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('donkai_lang')
    if (saved === 'fr' || saved === 'en') return saved
    return 'fr'
  })

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem('donkai_lang', lang)
  }

  const t = (key: string): string => {
    const item = translations[key]
    if (!item) return key
    return item[language] || item.fr || key
  }

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export const useI18n = () => useContext(I18nContext)
