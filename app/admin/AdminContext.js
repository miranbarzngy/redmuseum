import { createContext, useContext } from 'react'

export const AdminContext = createContext({ perms: null })
export const useAdminPerms = () => useContext(AdminContext)

export function can(perms, section, action = 'view') {
  if (!perms) return false // hide until loaded
  return !!perms[section]?.[action]
}
