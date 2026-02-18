import en from './en.json'
import cs from './cs.json'

export const messages: Record<string, Record<string, string>> = {
  en,
  cs,
}

export const defaultLocale = 'cs'

export function getLocale(): string {
  const stored = localStorage.getItem('locale')
  if (stored && stored in messages) return stored
  const browserLang = navigator.language.split('-')[0]
  return browserLang in messages ? browserLang : defaultLocale
}
