/// <reference types="@songloft/plugin-sdk" />
import { parseQuery } from '@songloft/plugin-sdk';
import type { HTTPRequest, HTTPResponse, Router } from '@songloft/plugin-sdk';
import { jsonDataResponse, errorResponse } from './response';
import type { CacheLyricRequest } from '../types';

/** 解析请求体（兼容 Uint8Array 和 string） */
function parseBody(req: HTTPRequest): Record<string, unknown> {
  if (!req.body) return {};
  try {
    const str =
      typeof req.body === 'string'
        ? req.body
        : String.fromCharCode.apply(null, Array.from(req.body as Uint8Array));
    return JSON.parse(str);
  } catch {
    return {};
  }
}

/** 调用宿主 API */
async function hostAPI<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const hostUrl = await songloft.plugin.getHostUrl();
  if (!hostUrl) throw new Error('Host URL not available');
  const token = await songloft.plugin.getToken();
  if (!token) throw new Error('Plugin token not available');
  const url = hostUrl + path;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
  };
  let bodyStr: string | undefined;
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    bodyStr = JSON.stringify(body);
  }
  const resp = await fetch(url, { method, headers, body: bodyStr });
  const text = await resp.text();
  if (!resp.ok) throw new Error(`Host API error ${resp.status} ${method} ${path}: ${text}`);
  return text ? JSON.parse(text) : (undefined as unknown as T);
}

interface LxLyricResponse {
  lyric: string;
  tlyric: string;
  rlyric: string;
  lxlyric: string;
}

// GET /api/lyric?source=kw&songmid=xxx
async function handleGetLyric(
  req: HTTPRequest,
  _params: Record<string, string>,
): Promise<HTTPResponse> {
  const query = parseQuery(req.query);
  const source = query['source'] || '';
  const songmid = query['songmid'] || '';

  if (!source || !songmid) {
    return errorResponse(400, 'source 和 songmid 不能为空');
  }

  songloft.log.info(`获取歌词 source=${source} songmid=${songmid}`);

  try {
    const lxResp = await hostAPI<LxLyricResponse>(
      'GET',
      `/api/v1/jsplugin/lxmusic/api/direct/lyric?source=${encodeURIComponent(source)}&songmid=${encodeURIComponent(songmid)}`,
    );
    return lyricResponse({
      lyric: lxResp.lyric || '',
      tlyric: lxResp.tlyric || '',
      rlyric: lxResp.rlyric || '',
      lxlyric: lxResp.lxlyric || '',
    });
  } catch (err) {
    songloft.log.error(`调用 lxmusic 获取歌词失败 source=${source} songmid=${songmid}: ${String(err)}`);
    return errorResponse(500, `获取歌词失败: ${String(err)}`);
  }
}

// GET /cache/lyric?source=kw&songmid=xxx&songId=xxx
async function handleGetCachedLyric(
  req: HTTPRequest,
  _params: Record<string, string>,
): Promise<HTTPResponse> {
  const query = parseQuery(req.query);
  const source = query['source'] || '';
  const songmid = query['songmid'] || '';
  const songId = query['songId'] || '';

  if (!source || !songmid) {
    return errorResponse(400, 'source 和 songmid 不能为空');
  }

  try {
    if (songId) {
      const song = await hostAPI<{ lyric?: string; lyric_source?: string }>(
        'GET',
        `/api/v1/songs/${encodeURIComponent(songId)}`,
      );
      if (song && song.lyric && song.lyric_source !== 'url') {
        return lyricResponse({ lyric: song.lyric, tlyric: '', rlyric: '', lxlyric: '' });
      }
    }
    return errorResponse(404, '歌词未缓存');
  } catch (err) {
    songloft.log.error(`获取缓存歌词失败 source=${source} songmid=${songmid}: ${String(err)}`);
    return errorResponse(500, `获取缓存歌词失败: ${String(err)}`);
  }
}

// POST /cache/lyric
async function handleCacheLyric(
  req: HTTPRequest,
  _params: Record<string, string>,
): Promise<HTTPResponse> {
  if (req.method !== 'POST') {
    return errorResponse(405, 'Method not allowed');
  }

  const cacheReq = parseBody(req) as unknown as CacheLyricRequest;
  if (!cacheReq.source || !cacheReq.songmid || !cacheReq.lyric) {
    return errorResponse(400, 'source, songmid, lyric 不能为空');
  }

  try {
    if (cacheReq.songId) {
      // 宿主 /songs/{id}/lyrics PUT 支持 lyric/tlyric/rlyric/lxlyric 四字段,
      // 把翻译/罗马音/逐字一并下沉到 DB(LyricPayload JSON),后续读取时不再丢字段。
      const bodyMap = {
        lyric_source: 'scraped',
        lyric: cacheReq.lyric,
        tlyric: cacheReq.tlyric || '',
        rlyric: cacheReq.rlyric || '',
        lxlyric: cacheReq.lxlyric || '',
      };
      await hostAPI(
        'PUT',
        `/api/v1/songs/${encodeURIComponent(cacheReq.songId)}/lyrics`,
        bodyMap,
      );
    }
    return jsonDataResponse({ success: true, message: '歌词缓存成功' });
  } catch (err) {
    songloft.log.error(`缓存歌词失败 source=${cacheReq.source} songmid=${cacheReq.songmid}: ${String(err)}`);
    return errorResponse(500, `缓存歌词失败: ${String(err)}`);
  }
}

function lyricResponse(info: { lyric: string; tlyric: string; rlyric: string; lxlyric: string }): HTTPResponse {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
    body: JSON.stringify(info),
  };
}

export function registerLyricHandlers(router: Router): void {
  router.get('/lyric', handleGetLyric);
  router.get('/cache/lyric', handleGetCachedLyric);
  router.post('/cache/lyric', handleCacheLyric);
}
