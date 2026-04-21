import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App'
import { parseAndStoreUTM } from './utils/analytics'
import { ErrorBoundary } from './components/shared/ErrorBoundary'
import { AppErrorFallback } from './components/shared/AppErrorFallback'
import { clearChunkRetryFlag } from './utils/lazyWithRetry'

parseAndStoreUTM()

// After successful boot, reset the chunk-retry guard so a later deploy can trigger one more retry.
window.addEventListener('load', () => {
  clearChunkRetryFlag()
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary label="root" fallback={<AppErrorFallback />}>
      <BrowserRouter basename="/v3">
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
)
