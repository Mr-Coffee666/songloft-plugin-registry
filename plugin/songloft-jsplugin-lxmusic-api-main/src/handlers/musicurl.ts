/// <reference types="@songloft/plugin-sdk" />
import type { HTTPRequest, HTTPResponse, Router } from '@songloft/plugin-sdk';
import { jsonDataResponse, errorResponse } from './response';
import { callHostAPI } from '../utils/http';
import type { MusicUrlRequest } from '../types';

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

// POST /api/url
async function handleGetUrl(
  req: HTTPRequest,
  _params: Record<string, string>,
): Promise<HTTPResponse> {
  if (req.method !== 'POST') {
    return errorResponse(405, 'Method not allowed');
  }

  const body = parseBody(req);
  const songInfo = body.songInfo as { source: string; songmid: string } | undefined;
  const source = songInfo?.source || '';
  const songmid = songInfo?.songmid || '';
  const quality = (body.quality as string) || '320k';

  if (!source || !songmid) {
    return errorResponse(400, 'songInfo.source 和 songInfo.songmid 不能为空');
  }

  songloft.log.info(`获取播放 URL source=${source} songmid=${songmid} quality=${quality}`);

  try {
    const lxResp = await callHostAPI<{ url?: string; type?: string; source?: string }>(
      'POST',
      '/api/v1/jsplugin/lxmusic/api/direct/music/url',
      { songInfo: { source, songmid }, quality },
    );

    if (!lxResp.url) {
      return errorResponse(502, '获取到的播放 URL 为空');
    }

    return jsonDataResponse({
      url: lxResp.url,
      type: lxResp.type,
      source: lxResp.source,
    });
  } catch (err) {
    songloft.log.error(`调用 lxmusic 获取播放 URL 失败 source=${source} songmid=${songmid}: ${String(err)}`);
    return errorResponse(502, `获取播放 URL 失败: ${String(err)}`);
  }
}

export function registerMusicUrlHandlers(router: Router): void {
  router.post('/url', handleGetUrl);
}
