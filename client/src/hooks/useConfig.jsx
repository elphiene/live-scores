import { createContext, useContext } from 'react'

// Makes the active edition's config (kind, capabilities, terminology)
// available to deeply-nested components without prop-drilling. Ported from
// bracket's useConfig.jsx — mirrors TimezoneProvider/SpoilerProvider.
const ConfigContext = createContext({})

export function ConfigProvider({ config, children }) {
  return <ConfigContext.Provider value={config}>{children}</ConfigContext.Provider>
}

export function useConfig() {
  return useContext(ConfigContext)
}
