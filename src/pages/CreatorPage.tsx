import React from 'react'
import { CreatorProfilePage } from './CreatorProfilePage'

interface CreatorPageProps {
  username: string
  onNavigate: (path: string) => void
}

export const CreatorPage: React.FC<CreatorPageProps> = (props) => {
  return <CreatorProfilePage {...props} />
}

export default CreatorPage
