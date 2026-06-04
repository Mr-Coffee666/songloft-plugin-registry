/// <reference types="@songloft/plugin-sdk" />
import { createRouter } from '@songloft/plugin-sdk';
import type { HTTPRequest, HTTPResponse } from '@songloft/plugin-sdk';

import {
  Registry,
  KgSearcher,
  KwSearcher,
  TxSearcher,
  WySearcher,
  MgSearcher,
  KgHotSearchFetcher,
  KwHotSearchFetcher,
  TxHotSearchFetcher,
  WyHotSearchFetcher,
  MgHotSearchFetcher,
  KgTipSearchProvider,
  KwTipSearchProvider,
  TxTipSearchProvider,
  WyTipSearchProvider,
  MgTipSearchProvider,
  KgSongListProvider,
  KwSongListProvider,
  TxSongListProvider,
  WySongListProvider,
  MgSongListProvider,
  KgLeaderboardProvider,
  KwLeaderboardProvider,
  TxLeaderboardProvider,
  WyLeaderboardProvider,
  MgLeaderboardProvider,
} from '@songloft/musicsdk/dist/index.js';

import {
  registerSearchHandlers,
  registerMusicUrlHandlers,
  registerLyricHandlers,
  registerSonglistHandlers,
  registerLeaderboardHandlers,
  registerImportHandlers,
  registerCommentHandlers,
} from './handlers';

const router = createRouter();
let registry: Registry;

async function onInit(): Promise<void> {
  songloft.log.info('洛雪音乐API插件初始化...');

  registry = new Registry();

  registry.register(new KgSearcher());
  registry.register(new KwSearcher());
  registry.register(new TxSearcher());
  registry.register(new WySearcher());
  registry.register(new MgSearcher());
  songloft.log.info('已注册内置平台搜索器');

  registry.registerSongListProvider(new KgSongListProvider());
  registry.registerSongListProvider(new KwSongListProvider());
  registry.registerSongListProvider(new TxSongListProvider());
  registry.registerSongListProvider(new WySongListProvider());
  registry.registerSongListProvider(new MgSongListProvider());
  songloft.log.info('已注册内置平台歌单提供者');

  registry.registerLeaderboardProvider(new KgLeaderboardProvider());
  registry.registerLeaderboardProvider(new KwLeaderboardProvider());
  registry.registerLeaderboardProvider(new TxLeaderboardProvider());
  registry.registerLeaderboardProvider(new WyLeaderboardProvider());
  registry.registerLeaderboardProvider(new MgLeaderboardProvider());
  songloft.log.info('已注册内置平台排行榜提供者');

  registry.registerHotSearchFetcher(new KgHotSearchFetcher());
  registry.registerHotSearchFetcher(new KwHotSearchFetcher());
  registry.registerHotSearchFetcher(new TxHotSearchFetcher());
  registry.registerHotSearchFetcher(new WyHotSearchFetcher());
  registry.registerHotSearchFetcher(new MgHotSearchFetcher());
  songloft.log.info('已注册内置平台热搜获取器');

  registry.registerTipSearchProvider(new KgTipSearchProvider());
  registry.registerTipSearchProvider(new KwTipSearchProvider());
  registry.registerTipSearchProvider(new TxTipSearchProvider());
  registry.registerTipSearchProvider(new WyTipSearchProvider());
  registry.registerTipSearchProvider(new MgTipSearchProvider());
  songloft.log.info('已注册内置平台搜索联想提供者');

  registerSearchHandlers(router, registry);
  registerMusicUrlHandlers(router);
  registerLyricHandlers(router);
  registerSonglistHandlers(router, registry);
  registerLeaderboardHandlers(router, registry);
  registerImportHandlers(router);
  registerCommentHandlers(router);

  songloft.log.info('洛雪音乐API插件初始化完成');
}

async function onDeinit(): Promise<void> {
  songloft.log.info('洛雪音乐API插件停止...');
  songloft.log.info('洛雪音乐API插件已停止');
}

async function onHTTPRequest(req: HTTPRequest): Promise<HTTPResponse> {
  return await router.handle(req);
}

globalThis.onInit = onInit;
globalThis.onDeinit = onDeinit;
globalThis.onHTTPRequest = onHTTPRequest;
