import { createContext, useContext, useMemo } from 'react'

const AppContext = createContext({})

export function AppProvider({ children }) {
  const value = useMemo(() => ({}), [])
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useAppContext() {
  return useContext(AppContext)
}
