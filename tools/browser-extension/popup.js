// Popup 逻辑
let currentFlvUrl = '';
let currentM3u8Url = '';
let hlsInstance = null;
let flvPlayer = null;

async function sendMessageToContent(msg) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return null;
  try {
    return await chrome.tabs.sendMessage(tab.id, msg);
  } catch (e) {
    return null;
  }
}

function updateStatus(ok, text) {
  const dot = document.getElementById('statusDot');
  const statusText = document.getElementById('statusText');
  dot.className = ok ? 'dot ok' : 'dot err';
  statusText.textContent = text;
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2000);
}

function copyText(text, btn) {
  navigator.clipboard.writeText(text).then(() => {
    btn.textContent = '已复制';
    btn.classList.add('copied');
    showToast('已复制到剪贴板');
    setTimeout(() => { btn.textContent = '复制'; btn.classList.remove('copied'); }, 1500);
  });
}

function destroyPlayers() {
  if (hlsInstance) { hlsInstance.destroy(); hlsInstance = null; }
  if (flvPlayer) { flvPlayer.unload(); flvPlayer = null; }
}

function playVideo(url, type) {
  destroyPlayers();
  let playerWrap = document.getElementById('playerWrap');
  if (!playerWrap) {
    playerWrap = document.createElement('div');
    playerWrap.className = 'player-wrap active';
    playerWrap.id = 'playerWrap';
    document.getElementById('contentArea').appendChild(playerWrap);
  }
  playerWrap.innerHTML = `<video id="playerVideo" controls style="width:100%;height:100%;object-fit:contain;background:#000;"></video>`;
  const video = document.getElementById('playerVideo');

  if (type === 'm3u8' || url.includes('.m3u8')) {
    if (typeof Hls !== 'undefined' && Hls.isSupported()) {
      hlsInstance = new Hls({ liveSyncDuration: 3 });
      hlsInstance.loadSource(url);
      hlsInstance.attachMedia(video);
      hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => video.play());
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url;
      video.play();
    }
  } else {
    if (typeof flvjs !== 'undefined' && flvjs.isSupported()) {
      flvPlayer = flvjs.createPlayer({ type: 'flv', url, isLive: true });
      flvPlayer.attachMediaElement(video);
      flvPlayer.load();
      flvPlayer.play();
    }
  }
}

function renderResult(data) {
  const area = document.getElementById('contentArea');

  if (!data?.streams?.length) {
    updateStatus(false, data?.error || '未检测到直播流');
    area.innerHTML = `
      <div class="empty-state">
        <div class="icon">🔇</div>
        <div>${data?.error || '当前页面未检测到直播流'}</div>
        <div style="font-size:0.75rem;margin-top:8px;color:var(--muted);">请确认已在抖音/B站/快手直播页面</div>
      </div>`;
    document.getElementById('hintBox').style.display = 'block';
    return;
  }

  updateStatus(true, data.platform ? `${data.platform} 直播间` : '直播中');
  document.getElementById('hintBox').style.display = 'none';

  let html = '';
  if (data.anchor_name) {
    html += `<div class="anchor-name">${escHtml(data.anchor_name)}</div>`;
  }
  if (data.title) {
    html += `<div class="room-title">${escHtml(data.title)}</div>`;
  }

  for (const stream of data.streams) {
    const url = stream.url;
    const type = url.includes('.m3u8') ? 'm3u8' : 'flv';
    const label = stream.label || (type === 'm3u8' ? 'M3U8' : 'FLV');
    html += `
      <div class="stream-item">
        <div class="stream-label">${label}</div>
        <div class="stream-url">${escHtml(url)}</div>
        <div class="stream-actions">
          <button class="btn btn-gold" onclick="playVideo('${escAttr(url)}','${type}')">▶ 播放</button>
          <button class="btn btn-copy" onclick="copyText('${escAttr(url)}', this)">复制</button>
        </div>
      </div>`;
    if (type === 'm3u8') currentM3u8Url = url;
    else currentFlvUrl = url;
  }

  area.innerHTML = html;
}

function escHtml(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function escAttr(s) { return String(s||'').replace(/\\/g,'\\\\').replace(/'/g,"\\'"); }

// 初始化：向 content script 请求数据
(async () => {
  const data = await sendMessageToContent({ type: 'GET_STREAMS' });
  if (data) {
    renderResult(data);
  } else {
    updateStatus(false, '无法连接到页面脚本');
    document.getElementById('contentArea').innerHTML = `
      <div class="empty-state">
        <div class="icon">⚠️</div>
        <div>无法连接到页面脚本</div>
        <div style="font-size:0.75rem;margin-top:8px;color:var(--muted);">请刷新页面后重试</div>
      </div>`;
  }
})();
