import { useEffect } from 'react';
import { APP_NAME } from '@/config/constants';
import { Reveal } from '@/components/Reveal';
import { Capabilities } from './Capabilities';
import { Comparison } from './Comparison';
import { Download } from './Download';
import { Hero } from './Hero';
import { Showcase } from './Showcase';
import { Themes } from './Themes';
import { Workflow } from './Workflow';

export default function HomePage() {
  useEffect(() => {
    document.title = `${APP_NAME} · 本地优先的 LaTeX 工作台`;
  }, []);

  return (
    <>
      <Hero />

      <Reveal>
        <Capabilities />
      </Reveal>

      <Reveal>
        <Showcase />
      </Reveal>

      <Reveal>
        <Workflow />
      </Reveal>

      <Reveal>
        <Comparison />
      </Reveal>

      <Reveal>
        <Themes />
      </Reveal>

      <Reveal>
        <Download />
      </Reveal>
    </>
  );
}
