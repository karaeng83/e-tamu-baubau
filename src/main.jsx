import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import BaubauVisitorApp from './BaubauVisitorApp.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BaubauVisitorApp />
  </StrictMode>,
)
