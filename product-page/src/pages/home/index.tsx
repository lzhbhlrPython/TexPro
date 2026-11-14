import { BuildChannels } from './BuildChannels';
import { useEffect } from 'react';
import { useMessages } from '@/i18n';
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
  const msg = useMessages();
  useEffect(() => {
    document.title = msg('site.page.home.title');
  }, [msg]);

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

      <BuildChannels />

      <Reveal>
        <Download />
      </Reveal>
    </>
  );
}
