/// <reference types="@songloft/plugin-sdk" />
import { parseQuery } from '@songloft/plugin-sdk';
import type { HTTPRequest, HTTPResponse, Router } from '@songloft/plugin-sdk';
import { jsonDataResponse, successResponse, errorResponse } from './response';
import type { Registry } from '@songloft/musicsdk/dist/index.js';

// GET /api/leaderboard/boards?source=kw
async function handleGetBoards(
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
    const provider = registry.getLeaderboardProvider(source);
    if (!provider) {
      return errorResponse(400, `不支持的平台: ${source}`);
    }
    const boards = provider.getBoards(source);
    return jsonDataResponse({ list: boards, source });
  } catch (err) {
    songloft.log.error(`获取排行榜分类失败 source=${source}: ${String(err)}`);
    return errorResponse(500, `获取排行榜分类失败: ${String(err)}`);
  }
}

// GET /api/leaderboard/list?source=kw&bangid=xxx&page=1&debug=1
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

  const bangid = query.bangid;
  if (!bangid) {
    return errorResponse(400, '缺少 bangid 参数');
  }

  try {
    const provider = registry.getLeaderboardProvider(source);
    if (!provider) {
      return errorResponse(400, `不支持的平台: ${source}`);
    }
    const page = Math.max(1, parseInt(query.page || '1', 10));
    const debug = query.debug === '1';
    const { list, total } = await provider.getList(source, bangid, page);

    const resp: Record<string, unknown> = { list, total, page };
    if (debug) {
      resp._debug = { source, bangid };
    }
    return jsonDataResponse(resp);
  } catch (err) {
    songloft.log.error(`获取排行榜列表失败 source=${source} bangid=${bangid}: ${String(err)}`);
    return errorResponse(500, `获取排行榜列表失败: ${String(err)}`);
  }
}

export function registerLeaderboardHandlers(router: Router, registry: Registry): void {
  router.get('/leaderboard/boards', (req, params) => handleGetBoards(req, params, registry));
  router.get('/leaderboard/list', (req, params) => handleGetList(req, params, registry));
}
