import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import './index.css'
import App from './App'
import { bootstrapSidecarFromQuery } from './lib/report/sidecar'

// Persist any `?sidecar=…&token=…` into localStorage before the app reads it,
// so a shared link can point every visitor at the current tunnel.
bootstrapSidecarFromQuery()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
