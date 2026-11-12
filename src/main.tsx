import { createRoot } from 'react-dom/client';
import App from './App';
import { initializeLanguages } from './i18n';
import 'katex/dist/katex.min.css';
import './styles/app.css';
import './styles/workbench.css';
import './styles/schematic.css';
import './styles/pdf.css';

const root = document.getElementById('root');
document.documentElement.dataset.platform = window.texpro.platform;
if (!root) throw new Error('Missing #root');
void initializeLanguages().finally(() => createRoot(root).render(<App />));

import './styles/welcome.css';

import './styles/music.css';
import './styles/writing.css';
import './styles/artwork.css';
import './styles/extensions.css';
import './styles/workspaces.css';
