import styles from './SearchBar.module.css'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <input
      className={styles.search}
      type="search"
      placeholder="カードを検索..."
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}
