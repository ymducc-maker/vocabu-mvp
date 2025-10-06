import React from 'react';

type Props = { children: React.ReactNode };
type State = { hasError: boolean; message?: string };

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(err: Error): State {
    return { hasError: true, message: err?.message || 'Unknown error' };
  }

  componentDidCatch(error: any, info: any) {
    console.error('Vocabu app error:', error, info);
  }

  reset = () => {
    try {
      localStorage.removeItem('vocabu_mvp_state');
    } catch {}
    location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 16, maxWidth: 720 }}>
          <h2 style={{ margin: '8px 0' }}>Что-то пошло не так</h2>
          <p style={{ margin: '8px 0', color: '#555' }}>{this.state.message}</p>
          <button
            onClick={this.reset}
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid #ccc',
            }}
          >
            Сбросить и перезапустить
          </button>
        </div>
      );
    }
    return this.props.children as any;
  }
}
