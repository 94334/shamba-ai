// src/InstallBanner.jsx
// Drop this anywhere in your App layout — it appears only when the browser
// offers the install prompt (Android Chrome), and disappears after install.

import { useState, useEffect } from 'react'

export default function InstallBanner({ lang = 'en' }) {
  const [show, setShow] = useState(false)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    // Show if install prompt is already waiting
    if (window.__pwaInstallPrompt) setShow(true)

    const onAvailable = () => setShow(true)
    const onInstalled = () => { setShow(false); setInstalled(true) }

    window.addEventListener('pwaInstallAvailable', onAvailable)
    window.addEventListener('pwaInstalled', onInstalled)
    return () => {
      window.removeEventListener('pwaInstallAvailable', onAvailable)
      window.removeEventListener('pwaInstalled', onInstalled)
    }
  }, [])

  const handleInstall = async () => {
    const prompt = window.__pwaInstallPrompt
    if (!prompt) return
    prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'accepted') {
      window.__pwaInstallPrompt = null
      setShow(false)
    }
  }

  if (!show || installed) return null

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '10px',
      padding: '10px 14px',
      background: '#EAF3DE',
      borderBottom: '0.5px solid #97C459',
    }}>
      <div style={{
        width: '36px', height: '36px', borderRadius: '8px',
        background: '#3B6D11', display: 'flex', alignItems: 'center',
        justifyContent: 'center', flexShrink: 0,
      }}>
        <i className="ti ti-plant-2" style={{ color: '#C0DD97', fontSize: '20px' }} aria-hidden="true" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: '13px', fontWeight: 500, color: '#27500A' }}>
          {lang === 'en' ? 'Install Shamba AI' : 'Sakinisha Shamba AI'}
        </p>
        <p style={{ margin: 0, fontSize: '11px', color: '#3B6D11' }}>
          {lang === 'en'
            ? 'Add to home screen for quick access'
            : 'Ongeza kwenye skrini ya nyumbani'}
        </p>
      </div>
      <button
        onClick={handleInstall}
        style={{
          padding: '6px 14px', borderRadius: '20px',
          background: '#3B6D11', color: '#EAF3DE',
          border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 500,
          flexShrink: 0,
        }}
      >
        {lang === 'en' ? 'Install' : 'Sakinisha'}
      </button>
      <button
        onClick={() => setShow(false)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3B6D11', fontSize: '20px', padding: '4px', flexShrink: 0 }}
        aria-label="Dismiss"
      >
        <i className="ti ti-x" aria-hidden="true" />
      </button>
    </div>
  )
}
