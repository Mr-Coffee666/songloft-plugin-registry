/// <reference types="@songloft/plugin-sdk" />

// ============================================================================
// TV API 类型定义
// ============================================================================

// MusicInfo 音乐信息 (swagger output)
export interface MusicInfo {
  id: string;
  name: string;
  singer: string;
  source: string;
  interval: string;
  img: string;
  albumId: string;
  albumName: string;
  songmid: string;
  hash: string;
  copyrightId: string;
  types: QualityInfo[];
  _types?: Record<string, QualityDetail>;
  meta?: MusicMeta;
  searchSource?: string;
}

// MusicMeta 音乐元数据
export interface MusicMeta {
  songId?: unknown;
  albumName: string;
  picUrl: string;
  qualitys: QualityInfo[];
  _qualitys?: Record<string, QualityDetail>;
}

// QualityInfo 音质信息
export interface QualityInfo {
  type: string;
  size: string;
}

// QualityDetail 音质详情
export interface QualityDetail {
  size: string;
}

// MusicUrlRequest 获取播放URL请求
export interface MusicUrlRequest {
  songInfo: {
    source: string;
    songmid: string;
  };
  quality: string;
}

// MusicUrlResponse 获取播放URL响应
export interface MusicUrlResponse {
  url: string;
  type: string;
  source: string;
}

// LyricInfo 歌词信息
export interface LyricInfo {
  lyric: string;
  tlyric: string;
  rlyric: string;
  lxlyric: string;
}

// CacheLyricRequest 缓存歌词请求
// lyric 是必填的主歌词;tlyric/rlyric/lxlyric 选填,会一并写入宿主歌词存储。
export interface CacheLyricRequest {
  source: string;
  songmid: string;
  songId?: string;
  lyric: string;
  tlyric?: string;
  rlyric?: string;
  lxlyric?: string;
}

// Playlist 歌单信息
export interface Playlist {
  id: string;
  name: string;
  source: string;
  sourceListId: string;
  locationUpdateTime: number;
  songs: MusicInfo[];
  picUrl: string;
  img: string;
  desc: string;
  songCount: number;
  total: string;
  time: string;
  createTime: number;
  creator: string;
  author: string;
  playCount: number;
  playCountStr?: string;
  shareCount: number;
  info?: PlaylistInfo;
  isDefault: boolean;
  isLove: boolean;
}

// PlaylistInfo 歌单信息详情
export interface PlaylistInfo {
  name: string;
  img: string;
  author: string;
  playCount: string;
  desc: string;
  time: string;
}

// MiPlaylist 用户歌单
export interface MiPlaylist {
  id: number;
  type: string;
  name: string;
  description: string;
  coverPath: string;
  coverUrl: string;
  labels: string[];
  songCount: number;
  createdAt: string;
  updatedAt: string;
}

// MiSong 用户歌曲(镜像主程序 Song struct)
// 2026 重构:cacheHash 字段已移除;新增 pluginEntryPath / sourceData。
// 客户端播放 URL 现在永远是 /api/v1/songs/{id}/play,由主程序在 song.url 字段中动态填充。
// 本地歌曲的封面 URL 也会统一为 /api/v1/songs/{id}/cover,网络歌曲保留原始 CoverURL。
export interface MiSong {
  id: number;
  type: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  filePath: string;
  url: string; // /api/v1/songs/{id}/play(主程序统一填,客户端直接喂给播放器)
  coverPath: string;
  coverUrl: string;
  lyric: string;
  lyricSource: string;
  fileSize: number;
  format: string;
  bitRate: number;
  sampleRate: number;
  isLive: boolean;
  pluginEntryPath: string; // 音源插件 entryPath(如 "lxmusic");纯外链/本地为空
  sourceData: string; // 音源元数据 JSON(opaque);纯外链/本地为空
  addedAt: string;
  updatedAt: string;
}

// MiPlaylistListResponse 用户歌单列表响应
export interface MiPlaylistListResponse {
  limit: number;
  offset: number;
  playlists: MiPlaylist[];
}

// MiPlaylistSongsResponse 用户歌单歌曲响应
export interface MiPlaylistSongsResponse {
  limit: number;
  offset: number;
  songs: MiSong[];
  total: number;
}

// ImportSongsRequest 导入歌曲请求
export interface ImportSongsRequest {
  songs: ImportSongItem[];
  quality: string;
  playlist_id: number;
  new_playlist_name: string;
}

// ImportSongItem 导入歌曲项
export interface ImportSongItem {
  name: string;
  singer: string;
  album: string;
  source: string;
  musicId: string;
  img: string;
  songmid: string;
  strMediaMid?: string;
  albumMid?: string;
  albumId?: string;
  duration: number;
  types: QualityType[];
  hash: string;
  copyrightId: string;
}

// QualityType 音质信息
export interface QualityType {
  type: string;
  size: string;
}

// ImportResult 导入结果
export interface ImportResult {
  name: string;
  success: boolean;
  error?: string;
}

// ImportSongsResponse 导入歌曲响应
export interface ImportSongsResponse {
  total: number;
  success: number;
  failed: number;
  results: ImportResult[];
  playlist_id: number;
  playlist_name: string;
  warning?: string;
}

// TVConfig TV播放器配置
export interface TVConfig {
  quality_options: string[];
  default_quality: string;
  sources: string[];
  sources_name: Record<string, string>;
}

// musicsdk SearchItem (用于 mapMusicInfo)
// 与 node_modules/@mimusic/musicsdk/dist/types.d.ts 中的 SearchItem 一致
export interface SDKSearchItem {
  name: string;
  singer: string;
  album: string;
  albumId?: string;
  duration: number;
  source: string;
  musicId: string;
  img?: string;
  types?: SDKQualityInfo[];
  hash?: string;
  copyrightId?: string;
  strMediaMid?: string;
  albumMid?: string;
  songmid?: string;
}

export interface SDKQualityInfo {
  type: string;
  size?: string;
  hash?: string;
}

export interface SDKLyricResult {
  Lyric?: string;
  TLyric?: string;
  RLyric?: string;
  LxLyric?: string;
}

// ============================================================================
// 数据映射函数
// ============================================================================

// mapMusicInfo 将 musicsdk.SearchItem 映射为 MusicInfo
export function mapMusicInfo(item: SDKSearchItem): MusicInfo {
  return {
    id: coalesce(item.musicId, item.songmid),
    name: item.name,
    singer: item.singer,
    source: item.source,
    interval: formatDuration(item.duration),
    img: item.img || '',
    albumId: coalesce(item.albumId, ''),
    albumName: item.album || '',
    songmid: item.songmid || item.musicId,
    hash: item.hash || '',
    copyrightId: item.copyrightId || '',
    types: mapQualityInfo(item.types || []),
  };
}

// mapQualityInfo 将 []SDKQualityInfo 映射为 []QualityInfo
export function mapQualityInfo(types: SDKQualityInfo[]): QualityInfo[] {
  return types.map((t) => ({ type: t.type, size: t.size || '' }));
}

// mapLyricInfo 将 musicsdk.LyricResult 映射为 LyricInfo
export function mapLyricInfo(result?: SDKLyricResult): LyricInfo {
  if (!result) return { lyric: '', tlyric: '', rlyric: '', lxlyric: '' };
  return {
    lyric: result.Lyric || '',
    tlyric: result.TLyric || '',
    rlyric: result.RLyric || '',
    lxlyric: result.LxLyric || '',
  };
}

// coalesce 返回第一个非空字符串
export function coalesce(...vs: (string | undefined)[]): string {
  for (const v of vs) {
    if (v) return v;
  }
  return '';
}

// formatDuration 将秒数格式化为 mm:ss
export function formatDuration(seconds: number): string {
  if (seconds <= 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// parseQuality 解析 quality 参数，默认 320k
export function parseQuality(quality?: string): string {
  if (!quality) return '320k';
  return quality.toLowerCase();
}
