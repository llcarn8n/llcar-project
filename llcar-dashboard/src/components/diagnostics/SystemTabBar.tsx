interface SystemTabBarProps {
  active: string | null
  onChange: (system: string | null) => void
}

const TABS: { key: string | null; label: string }[] = [
  { key: 'suspension', label: 'Подвеска' },
  { key: 'engine', label: 'Двигатель' },
  { key: 'electrical', label: 'Электрика' },
  { key: 'audio', label: 'Аудио' },
  { key: null, label: 'Обзор' },
]

export function SystemTabBar({ active, onChange }: SystemTabBarProps) {
  return (
    <div className="system-tab-bar">
      {TABS.map(tab => (
        <button
          key={tab.key ?? 'overview'}
          className={`system-tab${active === tab.key ? ' active' : ''}`}
          onClick={() => onChange(tab.key)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
