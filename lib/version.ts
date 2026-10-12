// Aviso de actualización. La app no está en ninguna tienda (se instala desde el
// APK), así que pregunta al backend cuál es la última versión publicada.

import { useEffect, useState } from 'react'
import { App as CapApp } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { API_V1, fetchWithTimeout } from './http'

export interface VersionInfo {
  latest_version_code: number
  latest_version_name: string
  min_version_code: number
  download_url: string
  /** Dirección corta para teclear en Downloader (p. ej. zicotv.cc/tv). */
  download_short: string
}

export type UpdateState = { kind: 'none' } | { kind: 'optional' | 'required'; info: VersionInfo; current: string }

export async function checkForUpdate(): Promise<UpdateState> {
  if (!Capacitor.isNativePlatform()) return { kind: 'none' }
  try {
    const [appInfo, res] = await Promise.all([
      CapApp.getInfo(),
      fetchWithTimeout(`${API_V1}/app/version?platform=tv`),
    ])
    if (!res.ok) return { kind: 'none' }
    const info: VersionInfo = await res.json()
    const current = parseInt(appInfo.build, 10) || 0
    if (info.min_version_code > 0 && current < info.min_version_code) return { kind: 'required', info, current: appInfo.version }
    if (info.latest_version_code > current) return { kind: 'optional', info, current: appInfo.version }
  } catch {
    /* sin conexión: no molestamos */
  }
  return { kind: 'none' }
}

/** versionName de android/app/build.gradle (respaldo fuera del APK). Mantener en sync. */
export const APP_VERSION = '1.2.2'

/** Versión visible de la app ("v1.2.0"): la del APK instalado si es nativo. */
export function useAppVersion(): string {
  const [version, setVersion] = useState(APP_VERSION)
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return
    CapApp.getInfo()
      .then((info) => setVersion(info.version))
      .catch(() => undefined)
  }, [])
  return `v${version}`
}
