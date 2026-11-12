import { useCallback } from 'react'
import { translate, type MessageKey } from '../i18n'
import { usePlanner } from '../store'

export function useT() {
  const lang = usePlanner((state) => state.settings.lang)
  const t = useCallback(
    (key: MessageKey, vars?: Record<string, string | number>) => translate(lang, key, vars),
    [lang],
  )
  return { t, lang }
}
