import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import Hub from './components/Hub.jsx'
import { TimezoneProvider } from './hooks/useTimezone'
import { SpoilerProvider } from './hooks/useSpoiler'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      {/* Global remembered preferences wrap both routes so the hub and an
          edition page share one timezone + spoiler-settings choice. */}
      <TimezoneProvider>
        <SpoilerProvider>
          <Routes>
            <Route path="/" element={<Hub />} />
            <Route path="/:slug" element={<App />} />
          </Routes>
        </SpoilerProvider>
      </TimezoneProvider>
    </BrowserRouter>
  </StrictMode>,
)
