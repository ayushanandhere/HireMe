// Polyfill for Node.js global objects needed by simple-peer
window.global = window;
window.process = { env: { DEBUG: undefined } };
// Don't use require for Buffer

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import 'bootstrap-icons/font/bootstrap-icons.css'
import './styles/global.css'
import './index.css'
import './styles/FixInputStyles.css'
import './styles/DashboardTheme.css'
import './styles/AuthTheme.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
