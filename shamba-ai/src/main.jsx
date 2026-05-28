import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import App from './App.jsx'

// ── Service worker registration ──────────────────────────────────────────────
// autoUpdate is set in vite.config.js, but we still show a friendly refresh
// notice so the farmer knows a new version is ready.
const updateSW = registerSW({
  onNeedRefresh() {
    // Simple confirm — you can replace this with a custom toast component
    const ok = window.confirm(
      'A new version of Shamba AI is available.\nPress OK to update now.'
    )
    if (ok) updateSW(true)
  },
  onOfflineReady() {
    console.log('Shamba AI is ready to work offline.')
    // Weather and AI still need internet, but the shell loads without it.
  },
})

// ── Install prompt (Add to Home Screen) ──────────────────────────────────────
// Capture the browser's install prompt so we can trigger it from our own UI.
// The App component reads window.__pwaInstallPrompt to show a custom button.
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault()
  window.__pwaInstallPrompt = e
  // Dispatch a custom event so React components can react to it
  window.dispatchEvent(new Event('pwaInstallAvailable'))
})

window.addEventListener('appinstalled', () => {
  window.__pwaInstallPrompt = null
  window.dispatchEvent(new Event('pwaInstalled'))
})

// ── Render ───────────────────────────────────────────────────────────────────
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)
