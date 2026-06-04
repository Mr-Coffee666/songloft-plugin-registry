import { createRouter, jsonResponse, createSearchHandler, createMusicUrlHandler } from '@songloft/plugin-sdk'
import type { HTTPRequest, SearchResultItem } from '@songloft/plugin-sdk'
import { getConfig, saveConfig, GDStudioConfig } from './config'
import { searchSongs, getSongUrl, getPicUrl } from './client'

function parseBody(req: HTTPRequest): any {
  if (!req.body) return {}
  try {
    const str = typeof req.body === 'string'
      ? req.body
      : String.fromCharCode.apply(null, Array.from(req.body as Uint8Array))
    return JSON.parse(str)
  } catch {
    return {}
  }
}

const router = createRouter()

// 获取配置
router.get('/config', async (req: HTTPRequest) => {
  const config = await getConfig()
  return jsonResponse(config)
})

// 保存配置
router.post('/config', async (req: HTTPRequest) => {
  const data = parseBody(req) as Partial<GDStudioConfig>
  const config = await getConfig()
  const newConfig = { ...config, ...data }
  await saveConfig(newConfig)
  return jsonResponse({ success: true, config: newConfig })
})

// 全局搜索
router.post('/api/search', createSearchHandler({
  search: async (keyword: string, page = 1, pageSize = 20) => {
    const config = await getConfig()
    const results: SearchResultItem[] = []
    
    try {
      const songs = await searchSongs(keyword, config, page, pageSize)
      for (const s of songs) {
        let cover_url: string | undefined
        if (s.pic_id) {
          try {
            cover_url = await getPicUrl(s.pic_id, { ...config, source: s.source || config.source })
          } catch (e) {
            console.error('Failed to get pic URL:', String(e))
          }
        }
        results.push({
          title: s.name,
          artist: Array.isArray(s.artist) ? s.artist.join(', ') : s.artist,
          album: s.album,
          cover_url,
          source_data: { 
            trackId: s.id,
            source: s.source || config.source
          }
        })
      }
    } catch (e) {
      console.error('GD Studio search error:', String(e))
    }
    
    return results
  }
}))

// 播放直链解析 (支持直接下载与流媒体播放)
router.post('/api/music/url', createMusicUrlHandler({
  resolveUrl: async (sourceData: Record<string, unknown>) => {
    const config = await getConfig()
    const trackId = sourceData.trackId as string
    const source = sourceData.source as string || config.source
    
    if (!trackId) throw new Error('Invalid source_data')
    
    // 使用搜索时匹配的 source 请求真实的 URL，并使用配置中的无损音质参数
    const tempConfig = { ...config, source }
    
    return getSongUrl(trackId, tempConfig)
  }
}))

// 新增前端 API - 扁平化搜索
router.get('/search', async (req: HTTPRequest) => {
  const config = await getConfig()
  let keyword = ''
  if (req.query) {
    const match = req.query.match(/(?:^|&)q=([^&]*)/)
    if (match) keyword = decodeURIComponent(match[1])
  }
  
  if (!keyword) return jsonResponse([])
  
  try {
    const songs = await searchSongs(keyword, config, 1, 50)
    const results = []
    for (const s of songs) {
      let coverArt: string | undefined
      if (s.pic_id) {
        try {
          coverArt = await getPicUrl(s.pic_id, { ...config, source: s.source || config.source })
        } catch (e) {
          console.error('Failed to get pic URL:', String(e))
        }
      }
      results.push({
        id: s.id,
        name: s.name,
        type: 'file',
        artist: Array.isArray(s.artist) ? s.artist.join(', ') : s.artist,
        album: s.album,
        duration: 0,
        size: 0,
        streamUrl: '', 
        coverArt,
        source: s.source || config.source
      })
    }
    return jsonResponse(results)
  } catch (e) {
    return jsonResponse({ error: String(e) }, 500)
  }
})

export default router
