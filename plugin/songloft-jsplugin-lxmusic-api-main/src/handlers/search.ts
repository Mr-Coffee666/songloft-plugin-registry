/// <reference types="@songloft/plugin-sdk" />
import { parseQuery } from '@songloft/plugin-sdk';
import type { HTTPRequest, HTTPResponse, Router } from '@songloft/plugin-sdk';
import { jsonDataResponse, successResponse, errorResponse } from './response';
import type { Registry } from '@songloft/musicsdk/dist/index.js';
import type { TVConfig } from '../types';
import { mapMusicInfo } from '../types';

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

// GET /api/config
function handleGetConfig(_req: HTTPRequest): HTTPResponse {
  const config: TVConfig = {
    quality_options: ['flac', '320k', '128k'],
    default_quality: '320k',
    sources: ['kw', 'kg', 'tx', 'wy', 'mg'],
    sources_name: {
      kw: '酷我音乐',
      kg: '酷狗音乐',
      tx: 'QQ音乐',
      wy: '网易云音乐',
      mg: '咪咕音乐',
    },
  };
  return jsonDataResponse(config);
}

// GET /api/search?name=xxx&source=kw&page=1&limit=20
async function handleSearch(
  req: HTTPRequest,
  _params: Record<string, string>,
  registry: Registry,
): Promise<HTTPResponse> {
  const query = parseQuery(req.query);
  const name = query.name;
  if (!name) {
    return errorResponse(400, '缺少 name 参数');
  }

  const source = query.source || '';
  const page = Math.max(1, parseInt(query.page || '1', 10));
  const limit = Math.max(1, parseInt(query.limit || '20', 10));

  if (source) {
    return searchSinglePlatform(registry, source, name, page, limit);
  }

  return jsonDataResponse([]);
}

async function searchSinglePlatform(
  registry: Registry,
  sourceID: string,
  keyword: string,
  page: number,
  limit: number,
): Promise<HTTPResponse> {
  try {
    const searcher = registry.get(sourceID);
    if (!searcher) {
      return errorResponse(400, `不支持的平台: ${sourceID}`);
    }
    const result = await searcher.search(keyword, page, limit);
    const musicList = (result.list || []).map(mapMusicInfo);
    return jsonDataResponse(musicList);
  } catch (err) {
    songloft.log.error(`搜索失败 source=${sourceID} keyword=${keyword}: ${String(err)}`);
    return errorResponse(500, `搜索失败: ${String(err)}`);
  }
}

// GET /api/hotSearch?source=kw
async function handleHotSearch(
  req: HTTPRequest,
  _params: Record<string, string>,
  registry: Registry,
): Promise<HTTPResponse> {
  const query = parseQuery(req.query);
  const source = query.source || '';

  if (!source) {
    return jsonDataResponse([]);
  }

  try {
    const fetcher = registry.getHotSearchFetcher(source);
    if (!fetcher) {
      return errorResponse(400, `不支持的平台: ${source}`);
    }
    const result = await fetcher.getHotSearch(source);
    return jsonDataResponse(result);
  } catch (err) {
    songloft.log.error(`获取热搜失败 source=${source}: ${String(err)}`);
    return errorResponse(500, '获取热搜失败');
  }
}

// GET /api/tipSearch?name=xxx&source=kw
async function handleTipSearch(
  req: HTTPRequest,
  _params: Record<string, string>,
  registry: Registry,
): Promise<HTTPResponse> {
  const query = parseQuery(req.query);
  const name = query.name;
  if (!name) {
    return errorResponse(400, '缺少 name 参数');
  }

  const source = query.source || '';
  if (!source) {
    return jsonDataResponse([]);
  }

  try {
    const provider = registry.getTipSearchProvider(source);
    if (!provider) {
      return errorResponse(400, `不支持的平台: ${source}`);
    }
    const result = await provider.getTips(source, name);
    return jsonDataResponse(result);
  } catch (err) {
    songloft.log.error(`获取搜索提示失败 source=${source} keyword=${name}: ${String(err)}`);
    return errorResponse(500, '获取搜索提示失败');
  }
}

export function registerSearchHandlers(router: Router, registry: Registry): void {
  router.get('/config', (req) => handleGetConfig(req));
  router.get('/search', (req, params) => handleSearch(req, params, registry));
  router.get('/hotSearch', (req, params) => handleHotSearch(req, params, registry));
  router.get('/tipSearch', (req, params) => handleTipSearch(req, params, registry));
}
