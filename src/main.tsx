import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router'
import App from './App'
import { requestPersistentStorage } from './db/db'
import './index.css'

// iOS peut purger le stockage d'une PWA : on demande dès le lancement qu'il soit conservé.
void requestPersistentStorage()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
)
