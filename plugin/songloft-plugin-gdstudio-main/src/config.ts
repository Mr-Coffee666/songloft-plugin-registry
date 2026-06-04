// global songloft

export interface GDStudioConfig {
  source: string; // netease, kuwo, joox, etc.
  br: number; // 128, 192, 320, 740, 999
}

const CONFIG_KEY = 'gdstudio_config'

const DEFAULT_CONFIG: GDStudioConfig = {
  source: 'netease',
  br: 999
}

export async function getConfig(): Promise<GDStudioConfig> {
  try {
    const val = await globalThis.songloft?.storage?.get(CONFIG_KEY)
    if (val) {
      const parsed = { ...DEFAULT_CONFIG, ...JSON.parse(val) }
      const validSources = ['netease', 'kuwo', 'joox']
      if (!validSources.includes(parsed.source)) {
        parsed.source = 'netease'
      }
      return parsed
    }
  } catch (err) {
    console.error('Failed to get gdstudio config', String(err))
  }
  return DEFAULT_CONFIG
}

export async function saveConfig(config: GDStudioConfig): Promise<void> {
  if (globalThis.songloft?.storage) {
    await globalThis.songloft.storage.set(CONFIG_KEY, JSON.stringify(config))
  }
}
