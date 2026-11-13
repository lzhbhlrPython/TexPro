import { createRoot } from 'react-dom/client';
import App from './App';
import recovery from './locales/bootstrap-en.json';
import { initializeLanguages } from './i18n';
import 'katex/dist/katex.min.css';
import './styles/app.css';
import './styles/workbench.css';
import './styles/schematic.css';
import './styles/pdf.css';

const root = document.getElementById('root');
document.documentElement.dataset.platform = window.texpro.platform;
if (!root) throw new Error('Missing #root');
void initializeLanguages().then(() => createRoot(root).render(<App />)).catch(error => {
  console.error('Language initialization failed', error);
  document.documentElement.lang = 'en';
  const text = document.createElement('p'), retry = document.createElement('button');
  text.textContent = recovery['bootstrap.language.failed'];
  retry.textContent = recovery['bootstrap.action.reload'];
  retry.addEventListener('click', () => window.location.reload());
  root.replaceChildren(text, retry);
});

import './styles/welcome.css';

import './styles/music.css';
import './styles/writing.css';
import './styles/artwork.css';
import './styles/extensions.css';
import './styles/workspaces.css';
