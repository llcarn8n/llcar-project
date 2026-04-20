import { Component, type ReactNode } from 'react'

interface Props {
  fallback?: ReactNode
  label?: string
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary]', this.props.label ?? '', error, info)
  }

  handleReset = () => this.setState({ hasError: false, error: null })

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div
          style={{
            padding: '14px 16px',
            border: '1px solid rgba(224,107,107,0.35)',
            background: 'rgba(10,11,22,0.6)',
            borderRadius: 6,
            fontFamily: 'var(--f-body), sans-serif',
            fontSize: 12,
            color: 'rgba(239,242,247,0.85)',
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 6, color: '#E06B6B' }}>
            Не удалось отобразить блок
          </div>
          <div style={{ opacity: 0.75, marginBottom: 10 }}>
            {this.state.error?.message ?? 'Неизвестная ошибка'}
          </div>
          <button
            onClick={this.handleReset}
            style={{
              padding: '6px 12px',
              fontFamily: 'var(--f-display)',
              fontSize: 11,
              letterSpacing: '0.14em',
              color: 'var(--c-champagne)',
              background: 'rgba(230,212,168,0.08)',
              border: '1px solid rgba(230,212,168,0.35)',
              borderRadius: 4,
              cursor: 'pointer',
            }}
          >
            Повторить
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

export default ErrorBoundary
