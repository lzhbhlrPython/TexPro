import { useEffect } from 'react';
import { APP_NAME } from '@/config/constants';
import { Reveal } from '@/components/Reveal';
import { VisualDemo } from './VisualDemo';
import { Capabilities } from './Capabilities';
import { Comparison } from './Comparison';
import { DataFlow } from './DataFlow';
import { Download } from './Download';
import { Hero } from './Hero';
import { Migrate } from './Migrate';
import { Showcase } from './Showcase';
import { Themes } from './Themes';
import { Proof } from './Proof';
import { Details } from './Details';
import { Failure } from './Failure';
import { Limits } from './Limits';
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
        <VisualDemo />
      </Reveal>

      <Reveal>
        <Showcase />
      </Reveal>

      <Reveal>
        <Workflow />
      </Reveal>

      <Reveal>
        <Failure />
      </Reveal>

      <Reveal>
        <Details />
      </Reveal>

      <Reveal>
        <Comparison />
      </Reveal>

      <Reveal>
        <Limits />
      </Reveal>

      <Reveal>
        <DataFlow />
      </Reveal>

      <Reveal>
        <Themes />
      </Reveal>

      <Reveal>
        <Migrate />
      </Reveal>

      <Reveal>
        <Proof />
      </Reveal>

      <Reveal>
        <Download />
      </Reveal>
    </>
  );
}
