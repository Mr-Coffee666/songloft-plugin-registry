/// <reference types="@songloft/plugin-sdk" />
import { parseQuery } from '@songloft/plugin-sdk';
import type { HTTPRequest, HTTPResponse, Router } from '@songloft/plugin-sdk';
import { jsonDataResponse, successResponse, errorResponse } from './response';
import type { Registry } from '@songloft/musicsdk/dist/index.js';

// GET /api/songList/tags?source=kw
async function handleGetTags(
  req: HTTPRequest,
  _params: Record<string, string>,
  registry: Registry,
): Promise<HTTPResponse> {
  const query = parseQuery(req.query);
  const source = query.source;

  if (!source) {
    return errorResponse(400, '缺少 source 参数');
  }

  try {
    const provider = registry.getSongListProvider(source);
    if (!provider) {
      return errorResponse(400, `不支持的平台: ${source}`);
    }
    const result = await provider.getTags();
    return jsonDataResponse(result);
  } catch (err) {
    songloft.log.error(`获取歌单标签失败 source=${source}: ${String(err)}`);
    return errorResponse(500, `获取标签失败: ${String(err)}`);
  }
}

// GET /api/songList/list?source=kw&tagId=xxx&sortId=xxx&page=1
async function handleGetList(
  req: HTTPRequest,
  _params: Record<string, string>,
  registry: Registry,
): Promise<HTTPResponse> {
  const query = parseQuery(req.query);
  const source = query.source;

  if (!source) {
    return errorResponse(400, '缺少 source 参数');
  }

  try {
    const provider = registry.getSongListProvider(source);
    if (!provider) {
      return errorResponse(400, `不支持的平台: ${source}`);
    }

    let sortId = query.sortId || '';
    if (source === 'tx' && sortId) {
      if (sortId === 'hot') sortId = '5';
      else if (sortId === 'new') sortId = '2';
    }
    const tagId = query.tagId || '';
    const page = Math.max(1, parseInt(query.page || '1', 10));

    const result = await provider.getList(sortId, tagId, page);
    // TV 客户端期望 {list: [...]}，provider.getList 已返回 {list:[...]}
    return jsonDataResponse(result);
  } catch (err) {
    songloft.log.error(`获取歌单列表失败 source=${source}: ${String(err)}`);
    return errorResponse(500, `获取歌单列表失败: ${String(err)}`);
  }
}

// GET /api/songList/detail?source=kw&id=xxx&page=1
async function handleGetDetail(
  req: HTTPRequest,
  _params: Record<string, string>,
  registry: Registry,
): Promise<HTTPResponse> {
  const query = parseQuery(req.query);
  const source = query.source;

  if (!source) {
    return errorResponse(400, '缺少 source 参数');
  }

  const id = query.id;
  if (!id) {
    return errorResponse(400, '缺少 id 参数');
  }

  try {
    const provider = registry.getSongListProvider(source);
    if (!provider) {
      return errorResponse(400, `不支持的平台: ${source}`);
    }
    const page = Math.max(1, parseInt(query.page || '1', 10));
    const result = await provider.getListDetail(id, page);
    return jsonDataResponse(result);
  } catch (err) {
    songloft.log.error(`获取歌单详情失败 source=${source} id=${id}: ${String(err)}`);
    return errorResponse(500, `获取歌单详情失败: ${String(err)}`);
  }
}

// GET /api/songList/search?source=kw&text=xxx&page=1&limit=20
async function handleSearchSongList(
  req: HTTPRequest,
  _params: Record<string, string>,
  registry: Registry,
): Promise<HTTPResponse> {
  const query = parseQuery(req.query);
  const source = query.source;

  if (!source) {
    return errorResponse(400, '缺少 source 参数');
  }

  const text = query.text;
  if (!text) {
    return errorResponse(400, '缺少 text 参数');
  }

  try {
    const provider = registry.getSongListProvider(source);
    if (!provider) {
      return errorResponse(400, `不支持的平台: ${source}`);
    }
    const page = Math.max(1, parseInt(query.page || '1', 10));
    const limit = Math.max(1, parseInt(query.limit || '20', 10));
    const result = await provider.searchSongList(text, page, limit);
    return successResponse(result);
  } catch (err) {
    songloft.log.error(`搜索歌单失败 source=${source} text=${text}: ${String(err)}`);
    return errorResponse(500, `搜索歌单失败: ${String(err)}`);
  }
}

export function registerSonglistHandlers(router: Router, registry: Registry): void {
  router.get('/songList/tags', (req, params) => handleGetTags(req, params, registry));
  router.get('/songList/list', (req, params) => handleGetList(req, params, registry));
  router.get('/songList/detail', (req, params) => handleGetDetail(req, params, registry));
  router.get('/songList/search', (req, params) => handleSearchSongList(req, params, registry));
}
