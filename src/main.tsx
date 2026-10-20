import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { StoreProvider } from './lib/store'
import Lock from './components/Lock'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Lock>
      <StoreProvider>
        <App />
      </StoreProvider>
    </Lock>
  </StrictMode>,
)
