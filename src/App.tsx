import { useState } from 'react'
import { RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { IntlProvider } from 'react-intl'
import { ConfigProvider } from 'antd'
import { router } from '@/routes'
import { messages, getLocale } from '@/i18n'
import { LocaleContext } from '@/i18n/LocaleContext'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
})

export default function App() {
  const [locale, setLocale] = useState(getLocale)

  function changeLocale(newLocale: string) {
    localStorage.setItem('locale', newLocale)
    setLocale(newLocale)
  }

  return (
    <LocaleContext value={{ locale, changeLocale }}>
      <IntlProvider locale={locale} messages={messages[locale]}>
        <QueryClientProvider client={queryClient}>
          <ConfigProvider
            theme={{
              token: {
                colorPrimary: '#1677ff',
              },
            }}
          >
            <RouterProvider router={router} />
          </ConfigProvider>
        </QueryClientProvider>
      </IntlProvider>
    </LocaleContext>
  )
}
