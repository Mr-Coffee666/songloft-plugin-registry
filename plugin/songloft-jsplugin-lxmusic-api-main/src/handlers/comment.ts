/// <reference types="@songloft/plugin-sdk" />
import type { HTTPRequest, HTTPResponse, Router } from '@songloft/plugin-sdk';
import { jsonDataResponse } from './response';

// GET /api/comment (stub - 返回空列表)
function handleGetComment(
  _req: HTTPRequest,
  _params: Record<string, string>,
): HTTPResponse {
  return jsonDataResponse({ list: [], total: 0 });
}

export function registerCommentHandlers(router: Router): void {
  router.get('/comment', handleGetComment);
}
