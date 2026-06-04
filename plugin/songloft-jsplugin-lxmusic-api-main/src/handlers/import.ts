/// <reference types="@songloft/plugin-sdk" />
import type { HTTPRequest, HTTPResponse, Router } from '@songloft/plugin-sdk';
import { errorResponse } from './response';
import type { ImportSongsRequest } from '../types';

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
async function hostAPI(
  method: string,
  path: string,
  body?: unknown,
): Promise<unknown> {
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
  return text ? JSON.parse(text) : undefined;
}

// POST /api/songs/import
async function handleImportSongs(
  req: HTTPRequest,
  _params: Record<string, string>,
): Promise<HTTPResponse> {
  if (req.method !== 'POST') {
    return errorResponse(405, 'Method not allowed');
  }

  const request = parseBody(req) as unknown as ImportSongsRequest;
  if (!request.songs || request.songs.length === 0) {
    return errorResponse(400, '请选择至少一首歌曲');
  }

  songloft.log.info(`批量导入歌曲 count=${request.songs.length} quality=${request.quality} playlist_id=${request.playlist_id}`);

  try {
    const resp = await hostAPI(
      'POST',
      '/api/v1/jsplugin/lxmusic/api/songs/import',
      request,
    );
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: typeof resp === 'string' ? resp : JSON.stringify(resp),
    };
  } catch (err) {
    songloft.log.error(`调用 lxmusic 导入歌曲失败: ${String(err)}`);
    return errorResponse(502, `导入歌曲失败: ${String(err)}`);
  }
}

export function registerImportHandlers(router: Router): void {
  router.post('/songs/import', handleImportSongs);
}
