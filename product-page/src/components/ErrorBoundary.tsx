import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button, Result } from 'antd';
import { useMessages } from '@/i18n';
import { APP_NAME } from '@/config/constants';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[${APP_NAME}] 页面渲染异常`, error, info);
  }

  render() {
    if (this.state.error) {
      return <ErrorContent error={this.state.error} />;
    }
    return this.props.children;
  }
}

function ErrorContent({ error }: { error: Error }) {
  const msg = useMessages();
  return <Result status="500" title={msg('site.error.title')}
    subTitle={error.message || msg('site.error.description')}
    extra={<Button type="primary" onClick={() => window.location.reload()}>{msg('site.error.reload')}</Button>} />;
}
