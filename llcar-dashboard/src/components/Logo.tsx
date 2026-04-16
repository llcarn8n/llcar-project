import './Logo.css'

type Size = 'sm' | 'md' | 'lg'

type Props = {
  size?: Size
  showWordmark?: boolean
  withOrbit?: boolean
  className?: string
}

export function Logo({ size = 'md', showWordmark = true, withOrbit = true, className = '' }: Props) {
  return (
    <span className={`llcar-logo-wrap ${size} ${className}`} aria-label="LLCAR">
      <span className="llcar-logo-core">
        {withOrbit && <span className="llcar-logo-orbit" aria-hidden="true" />}
        <span className="llcar-logo-sheen" aria-hidden="true" />
        <img
          className="llcar-logo-img"
          src={`${import.meta.env.BASE_URL}llcar-logo.png`}
          alt="LLCAR"
          draggable={false}
        />
      </span>
      {showWordmark && (
        <span className="llcar-logo-wordmark">
          LLCAR<em>E</em>
        </span>
      )}
    </span>
  )
}

export default Logo
