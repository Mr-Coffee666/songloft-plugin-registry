import { jsonResponse } from '@songloft/plugin-sdk';
import type { HTTPResponse } from '@songloft/plugin-sdk';

/** 成功响应：HTTP 200，{code:0, msg:'success', data} */
export function successResponse(data: unknown = null): HTTPResponse {
  return jsonResponse({ code: 0, msg: 'success', data });
}

/** 错误响应：HTTP <statusCode>，{code: statusCode, msg, data: null} */
export function errorResponse(statusCode: number, msg: string): HTTPResponse {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: statusCode, msg, data: null }),
  };
}

/** JSON 响应（不带 envelope，直接返回数据） */
export function jsonDataResponse(data: unknown): HTTPResponse {
  return jsonResponse(data);
}
