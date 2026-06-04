import { GDStudioConfig } from './config'

const API_BASE = 'https://music-api.gdstudio.xyz/api.php'

const DEFAULT_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
  'Connection': 'keep-alive'
}

function buildUrl(params: Record<string, string | number>): string {
  const qs: string[] = []
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) {
      qs.push(`${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    }
  }
  return `${API_BASE}?${qs.join('&')}`
}

export async function searchSongs(keyword: string, config: GDStudioConfig, page: number = 1, pageSize: number = 20): Promise<any[]> {
  const url = buildUrl({
    types: 'search',
    source: config.source,
    name: keyword,
    count: pageSize,
    pages: page
  })
  const res = await fetch(url, { headers: DEFAULT_HEADERS })
  if (!res.ok) throw new Error(`HTTP Error: ${res.status}`)
  
  const data = await res.json()
  // The API likely returns an array of tracks
  return Array.isArray(data) ? data : (data.list || data.data || [])
}

export async function getSongUrl(id: string, config: GDStudioConfig): Promise<string> {
  const url = buildUrl({
    types: 'url',
    source: config.source,
    id: id,
    br: config.br
  })
  const res = await fetch(url, { headers: DEFAULT_HEADERS })
  if (!res.ok) throw new Error(`HTTP Error: ${res.status}`)
  
  const data = await res.json()
  if (data && data.url) {
    return data.url
  }
  throw new Error('URL not found in response')
}

export async function getPicUrl(id: string, config: GDStudioConfig, size: number = 500): Promise<string> {
  const url = buildUrl({
    types: 'pic',
    source: config.source,
    id: id,
    size: size
  })
  const res = await fetch(url, { headers: DEFAULT_HEADERS })
  if (!res.ok) throw new Error(`HTTP Error: ${res.status}`)
  
  const data = await res.json()
  if (data && data.url) {
    return data.url
  }
  throw new Error('Picture URL not found in response')
}

export async function getLyric(id: string, config: GDStudioConfig): Promise<any> {
  const url = buildUrl({
    types: 'lyric',
    source: config.source,
    id: id
  })
  const res = await fetch(url, { headers: DEFAULT_HEADERS })
  if (!res.ok) throw new Error(`HTTP Error: ${res.status}`)
  return res.json()
}
