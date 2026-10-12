import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider } from './state/session';
import { OverlayProvider } from './ui/overlays';
import { App } from './App';
import { store } from './lib/format';
import './styles/global.css';

const theme = store.get<string | null>('theme', null);
if (theme) document.documentElement.dataset.theme = theme;
const qc = new QueryClient({ defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } } });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <SessionProvider><OverlayProvider><App /></OverlayProvider></SessionProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
