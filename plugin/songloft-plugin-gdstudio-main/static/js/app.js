let isSelectMode = false;
let selectedItems = new Map();
let currentListItems = [];

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
            : `<img src="${item.coverArt || 'https://via.placeholder.com/48?text=GD'}" style="width: 40px; height: 40px; border-radius: 8px; object-fit: cover;" onerror="this.src='https://via.placeholder.com/48?text=GD'">`;

        let trailingHtml = isSelectMode 
            ? '' 
            : `<div class="list-item-trailing"><button class="btn-icon" title="导入此曲" style="color:var(--md-primary);" onclick="event.stopPropagation(); importSingle('${item.id}')"><span class="material-symbols-outlined">add_circle</span></button></div>`;

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
});
