let isSelectMode = false;
let selectedItems = new Map();
let currentListItems = [];
let audioPlayer = null;
let currentPlayingId = null;
let currentPlayingItem = null;
let isSeeking = false;

// UI Helpers
function showSnackbar(message) {
    const snackbar = document.getElementById('snackbar');
    snackbar.textContent = message;
    snackbar.classList.add('show');
    setTimeout(() => {
        snackbar.classList.remove('show');
    }, 3000);
}

function showProgress(show, title = '正在处理', text = '请稍候...') {
    const dlg = document.getElementById('progressDialog');
    if (show) {
        document.getElementById('progressTitle').textContent = title;
        document.getElementById('progressText').textContent = text;
        dlg.classList.add('show');
    } else {
        dlg.classList.remove('show');
    }
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-item').forEach(el => el.classList.remove('active'));
    document.getElementById(`tab-${tabId}`).classList.add('active');
    document.querySelector(`.tab-item[data-tab="${tabId}"]`).classList.add('active');
}

function getAuthHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    try {
        const authData = localStorage.getItem('songloft-auth');
        if (authData) {
            const auth = JSON.parse(authData);
            if (auth.accessToken) {
                headers['Authorization'] = 'Bearer ' + auth.accessToken;
            }
        }
    } catch (e) {}
    return headers;
}

// Config Management
async function loadConfig() {
    try {
        const res = await fetch('./config', { headers: getAuthHeaders() });
        if (res.ok) {
            const config = await res.json();
            document.getElementById('configSource').value = config.source || 'netease';
            document.getElementById('configBr').value = config.br || '999';
        }
    } catch (e) {
        console.error('Failed to load config', e);
    }
}

async function saveConfig() {
    const source = document.getElementById('configSource').value;
    const br = document.getElementById('configBr').value;
    try {
        const res = await fetch('./config', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ source, br })
        });
        if (res.ok) {
            showSnackbar('配置保存成功');
        } else {
            showSnackbar('配置保存失败');
        }
    } catch (e) {
        showSnackbar('请求失败: ' + e);
    }
}

// Search and Render
async function doSearch() {
    const keyword = document.getElementById('searchInput').value.trim();
    if (!keyword) return;

    const container = document.getElementById('browserList');
    container.innerHTML = '<div class="empty-state">搜索中...</div>';
    document.getElementById('listCard').style.display = 'block';
    document.getElementById('toggleSelectModeBtn').style.display = 'none';

    try {
        const res = await fetch(`./search?q=${encodeURIComponent(keyword)}`, { headers: getAuthHeaders() });
        if (!res.ok) throw new Error(await res.text());
        const items = await res.json();
        renderItems(items);
    } catch (e) {
        container.innerHTML = `<div class="empty-state" style="color:var(--md-error)">搜索失败: ${e}</div>`;
    }
}

function renderItems(items) {
    currentListItems = items;
    const container = document.getElementById('browserList');
    document.getElementById('toggleSelectModeBtn').style.display = items.length > 0 ? 'flex' : 'none';
    
    if (items.length === 0) {
        container.innerHTML = '<div class="empty-state">无搜索结果</div>';
        return;
    }

    container.innerHTML = '';

    if (isSelectMode) {
        const selectAllDiv = document.createElement('div');
        selectAllDiv.className = 'list-item';
        selectAllDiv.style.cursor = 'pointer';
        const allSelected = items.every(item => selectedItems.has(item.id));
        selectAllDiv.innerHTML = `
            <input type="checkbox" class="md-checkbox" ${allSelected ? 'checked' : ''} style="pointer-events:none; width: 18px; height: 18px;">
            <div class="list-item-info">
                <span style="font-weight:500;font-size:14px;color:var(--md-primary)">全选本页歌曲</span>
            </div>
        `;
        selectAllDiv.onclick = () => {
            const willSelect = !allSelected;
            items.forEach(item => {
                if (willSelect) selectedItems.set(item.id, item);
                else selectedItems.delete(item.id);
            });
            renderItems(items);
            updateFAB();
        };
        container.appendChild(selectAllDiv);
    }

    items.forEach(item => {
        const el = document.createElement('div');
        el.className = 'list-item';
        el.style.cursor = 'pointer';
        
        const isSelected = selectedItems.has(item.id);
        
        let leadingHtml = isSelectMode 
            ? `<input type="checkbox" class="md-checkbox" ${isSelected ? 'checked' : ''} style="pointer-events:none; width: 18px; height: 18px;">`
            : `<img src="${item.coverArt || ''}" style="width: 40px; height: 40px; border-radius: 8px; object-fit: cover;" onerror="this.src=''">`;

        let trailingHtml = isSelectMode 
            ? '' 
            : `            <div class="list-item-trailing">
                <button class="btn-icon play-btn-play" data-song-id="${item.id}" title="在线播放" style="color:var(--md-success);" onclick="event.stopPropagation(); playMusic('${item.id}')"><span class="material-symbols-outlined">${currentPlayingId === item.id && audioPlayer && !audioPlayer.paused ? 'pause' : 'play_arrow'}</span></button>
                <button class="btn-icon" title="导入此曲" style="color:var(--md-primary);" onclick="event.stopPropagation(); importSingle('${item.id}')"><span class="material-symbols-outlined">add_circle</span></button>
              </div>`;

        el.innerHTML = `
            ${leadingHtml}
            <div class="list-item-info">
                <div class="list-item-title">${item.name}</div>
                <div class="list-item-subtitle">${item.artist} - ${item.album || '未知专辑'}</div>
            </div>
            ${trailingHtml}
        `;
        
        el.onclick = () => {
            if (isSelectMode) {
                if (isSelected) selectedItems.delete(item.id);
                else selectedItems.set(item.id, item);
                renderItems(items);
                updateFAB();
            }
        };
        
        container.appendChild(el);
    });
}

function toggleSelectMode() {
    isSelectMode = !isSelectMode;
    selectedItems.clear();
    const btn = document.getElementById('toggleSelectModeBtn');
    if (isSelectMode) {
        btn.innerHTML = '<span class="material-symbols-outlined">close</span> 取消选择';
        btn.style.color = 'var(--md-error)';
    } else {
        btn.innerHTML = '<span class="material-symbols-outlined">checklist</span> 多选';
        btn.style.color = 'var(--md-primary)';
    }
    updateFAB();
    renderItems(currentListItems);
}

function updateFAB() {
    const fab = document.getElementById('fabContainer');
    if (isSelectMode && selectedItems.size > 0) {
        fab.classList.add('show');
        document.getElementById('fabSelectionCount').textContent = `已选 ${selectedItems.size} 首`;
    } else {
        fab.classList.remove('show');
    }
}

// Playback Logic
window.playMusic = async function(id) {
    const item = currentListItems.find(i => i.id === id);
    if (!item) return;

    // If same song is already playing, toggle play/pause
    if (currentPlayingId === id && audioPlayer && !audioPlayer.paused) {
        audioPlayer.pause();
        updatePlayButtonStates(id, false);
        updatePlayerPlayBtn(false);
        return;
    }

    if (currentPlayingId === id && audioPlayer && audioPlayer.paused) {
        audioPlayer.play();
        updatePlayButtonStates(id, true);
        updatePlayerPlayBtn(true);
        return;
    }

    showProgress(true, '加载中', '正在获取音乐链接...');
    try {
        const res = await fetch('./api/music/url', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ source_data: { trackId: item.id, source: item.source } })
        });
        if (!res.ok) {
            const errBody = await res.text();
            let errMsg = errBody;
            try { const j = JSON.parse(errBody); if (j.error) errMsg = j.error; } catch {}
            throw new Error(errMsg);
        }
        const data = await res.json();
        if (!data.url) throw new Error('无法获取播放链接');

        showProgress(false);

        if (!audioPlayer) {
            audioPlayer = new Audio();
            audioPlayer.addEventListener('ended', () => {
                updatePlayButtonStates(currentPlayingId, false);
                updatePlayerBar(null);
                updateProgressBar(0, 0);
                currentPlayingId = null;
                currentPlayingItem = null;
                updatePlayerPlayBtn(false);
            });
            audioPlayer.addEventListener('pause', () => {
                if (currentPlayingId) {
                    updatePlayButtonStates(currentPlayingId, false);
                    updatePlayerPlayBtn(false);
                }
            });
            audioPlayer.addEventListener('play', () => {
                if (currentPlayingId) {
                    updatePlayButtonStates(currentPlayingId, true);
                    updatePlayerPlayBtn(true);
                }
            });
            audioPlayer.addEventListener('timeupdate', () => {
                if (!isSeeking && audioPlayer && audioPlayer.duration) {
                    updateProgressBar(audioPlayer.currentTime, audioPlayer.duration);
                }
            });
            audioPlayer.addEventListener('loadedmetadata', () => {
                if (audioPlayer && audioPlayer.duration) {
                    updateProgressBar(0, audioPlayer.duration);
                }
            });
        }

        // Stop previous playback
        audioPlayer.pause();
        audioPlayer.src = data.url;
        currentPlayingId = id;
        currentPlayingItem = item;
        audioPlayer.play().catch(() => {
            // autoplay may be blocked; user must interact first
        });
        updatePlayButtonStates(id, true);
        updatePlayerBar(item);
        updatePlayerPlayBtn(true);
        showSnackbar(`正在播放: ${item.name}`);
    } catch (e) {
        showProgress(false);
        showSnackbar('播放失败: ' + e.message);
    }
}

function updatePlayButtonStates(activeId, isPlaying) {
    document.querySelectorAll('.play-btn-play').forEach(btn => {
        const btnId = btn.dataset.songId;
        if (btnId === activeId) {
            btn.innerHTML = isPlaying
                ? '<span class="material-symbols-outlined">pause</span>'
                : '<span class="material-symbols-outlined">play_arrow</span>';
        } else {
            btn.innerHTML = '<span class="material-symbols-outlined">play_arrow</span>';
        }
    });
}

function updatePlayerBar(item) {
    const bar = document.getElementById('playerBar');
    const title = document.getElementById('playerBarTitle');
    const artist = document.getElementById('playerBarArtist');
    const cover = document.getElementById('playerBarCover');
    if (item) {
        title.textContent = item.name;
        artist.textContent = item.artist + (item.album ? ' - ' + item.album : '');
        cover.src = item.coverArt || '';
        cover.style.display = item.coverArt ? '' : 'none';
        bar.classList.add('show');
    } else {
        bar.classList.remove('show');
    }
}

function updatePlayerPlayBtn(isPlaying) {
    const btn = document.getElementById('playerPlayBtn').querySelector('.material-symbols-outlined');
    if (btn) {
        btn.textContent = isPlaying ? 'pause' : 'play_arrow';
    }
}

window.stopPlayback = function() {
    if (!audioPlayer) return;
    audioPlayer.pause();
    audioPlayer.src = '';
    if (currentPlayingId) {
        updatePlayButtonStates(currentPlayingId, false);
    }
    currentPlayingId = null;
    currentPlayingItem = null;
    updatePlayerBar(null);
    updateProgressBar(0, 0);
    updatePlayerPlayBtn(false);
}

function seekTo(percentage) {
    if (!audioPlayer || !audioPlayer.duration) return;
    audioPlayer.currentTime = (percentage / 100) * audioPlayer.duration;
}

function updateProgressBar(currentTime, duration) {
    const fill = document.getElementById('playerProgressFill');
    const thumb = document.getElementById('playerProgressThumb');
    const currentEl = document.getElementById('playerCurrentTime');
    const durationEl = document.getElementById('playerDuration');
    const pct = duration > 0 ? (currentTime / duration) * 100 : 0;
    fill.style.width = pct + '%';
    if (thumb) thumb.style.left = pct + '%';
    currentEl.textContent = formatTime(currentTime);
    durationEl.textContent = formatTime(duration);
}

function formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return m + ':' + (s < 10 ? '0' : '') + s;
}

// Core Import Logic
async function submitImport(itemsToImport) {
    const reqs = itemsToImport.map(item => ({
        title: item.name,
        artist: item.artist || 'Unknown',
        album: item.album || '',
        cover_url: item.coverArt || '',
        duration: 0,
        plugin_entry_path: 'gdstudio',
        source_data: JSON.stringify({ trackId: item.id, source: item.source }),
        dedup_key: `gdstudio_${item.source}_${item.id}`
    }));
    
    try {
        const coreApiUrl = window.location.origin + '/api/v1/songs/remote';
        const res = await fetch(coreApiUrl, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(reqs)
        });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        return data.songs || [];
    } catch (e) {
        console.error('Import failed', e);
        throw e;
    }
}

window.importSingle = async function(id) {
    const item = currentListItems.find(i => i.id === id);
    if (!item) return;
    showProgress(true, '导入中', '正在将歌曲存入曲库...');
    try {
        await submitImport([item]);
        showProgress(false);
        showSnackbar('单曲导入成功！');
    } catch (e) {
        showProgress(false);
        showSnackbar('导入失败: ' + e.message);
    }
};

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.tab-item').forEach(btn => {
        btn.onclick = () => switchTab(btn.dataset.tab);
    });
    
    document.getElementById('saveConfigBtn').onclick = saveConfig;
    
    document.getElementById('searchBtn').onclick = doSearch;
    document.getElementById('searchInput').onkeydown = (e) => {
        if (e.key === 'Enter') doSearch();
    };
    
    document.getElementById('toggleSelectModeBtn').onclick = toggleSelectMode;
    document.getElementById('fabCancelBtn').onclick = toggleSelectMode;
    
    document.getElementById('fabImportBtn').onclick = async () => {
        if (selectedItems.size === 0) return;
        showProgress(true, '批量导入', `正在导入 ${selectedItems.size} 首歌曲...`);
        try {
            await submitImport(Array.from(selectedItems.values()));
            showProgress(false);
            showSnackbar(`成功导入 ${selectedItems.size} 首歌曲`);
            toggleSelectMode(); // exit select mode
        } catch (e) {
            showProgress(false);
            showSnackbar('导入失败: ' + e.message);
        }
    };

    loadConfig();

    // Player bar controls
    document.getElementById('playerStopBtn').onclick = stopPlayback;
    document.getElementById('playerPlayBtn').onclick = () => {
        if (currentPlayingId) {
            playMusic(currentPlayingId);
        }
    };

    // Progress bar seeking
    const track = document.getElementById('playerProgressTrack');
    let seeking = false;
    track.addEventListener('mousedown', (e) => {
        if (!audioPlayer || !audioPlayer.duration) return;
        seeking = true;
        isSeeking = true;
        const rect = track.getBoundingClientRect();
        const pct = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
        seekTo(pct);
    });
    document.addEventListener('mousemove', (e) => {
        if (!seeking) return;
        const rect = track.getBoundingClientRect();
        const pct = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
        seekTo(pct);
    });
    document.addEventListener('mouseup', () => {
        if (seeking) {
            seeking = false;
            isSeeking = false;
        }
    });
});
