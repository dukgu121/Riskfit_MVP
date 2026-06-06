import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'

import './index.css'
import { AuthProvider } from './lib/firebase/AuthProvider'
import { RiskfitCloudSync } from './lib/firebase/RiskfitCloudSync'
import { router } from './router'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <RiskfitCloudSync>
        <RouterProvider router={router} />
      </RiskfitCloudSync>
    </AuthProvider>
  </StrictMode>,
)
