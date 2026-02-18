import { createContext, useContext } from 'react'

interface LocaleContextValue {
  locale: string
  changeLocale: (locale: string) => void
}

export const LocaleContext = createContext<LocaleContextValue>({
  locale: 'en',
  changeLocale: () => {},
})

export function useLocale() {
  return useContext(LocaleContext)
}
