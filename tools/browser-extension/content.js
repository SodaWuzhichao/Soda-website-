// Content script - 监听网络请求，抓取直播间流地址
(function () {
  let detectedStreams = [];
  let lastAnchorName = '';
  let lastTitle = '';
  let lastPlatform = '';

  // 抖音：拦截 webcast API
  function interceptDouyin() {
    const origFetch = window.fetch;
    window.fetch = function (...args) {
      const url = typeof args[0] === 'string' ? args[0] : args[0]?.url;
      if (url && url.includes('/webcast/room/web/enter/')) {
        return origFetch.apply(this, args).then(async response => {
          const clone = response.clone();
          try {
            const text = await clone.text();
            if (text && text.length > 10) {
              parseDouyinResponse(text);
            }
          } catch (e) {}
          return response;
        });
      }
      return origFetch.apply(this, args);
    };
  }

  function parseDouyinResponse(text) {
    try {
      const json = JSON.parse(text);
      const room = json.data?.room;
      if (room) {
        lastAnchorName = room.anchor?.nickname || json.data?.anchor_name || '';
        lastTitle = room.title || '';
        const streams = [];
        // 提取流地址
        const streamData = room.stream_url;
        if (streamData) {
          const mainLand = streamData.mainland_stream || {};
          const flv = mainLand.flv || '';
          const m3u8 = mainLand.m3u8 || '';
          if (flv) streams.push({ url: flv, label: 'FLV 流' });
          if (m3u8) streams.push({ url: m3u8, label: 'M3U8 流' });
          // 也检查 sdk_params
          const sdk = streamData.sdk_params;
          if (sdk) {
            try {
              const sdkObj = JSON.parse(sdk);
              const urls = sdkObj?.stream_data?.result?.live_center_pull_url || {};
              if (urls.flv) streams.push({ url: urls.flv, label: 'FLV (SDK)' });
              if (urls.hls) streams.push({ url: urls.hls, label: 'M3U8 (SDK)' });
            } catch(e) {}
          }
        }
        if (streams.length > 0) {
          detectedStreams = streams;
          lastPlatform = '抖音';
          broadcastStreams();
        }
      }
    } catch (e) {}
  }

  // B站：拦截直播API
  function interceptBilibili() {
    const origFetch = window.fetch;
    window.fetch = function (...args) {
      const url = typeof args[0] === 'string' ? args[0] : args[0]?.url;
      if (url && url.includes('room/broadcast/info') || (url && url.includes('xlive/web-room/v2'))) {
        return origFetch.apply(this, args).then(async response => {
          const clone = response.clone();
          try {
            const json = await clone.json();
            parseBilibiliResponse(json);
          } catch (e) {}
          return response;
        });
      }
      // 也拦截 getStreamInfo
      if (url && url.includes('get_stream_info')) {
        return origFetch.apply(this, args).then(async response => {
          const clone = response.clone();
          try {
            const json = await clone.json();
            parseBilibiliStreamInfo(json);
          } catch (e) {}
          return response;
        });
      }
      return origFetch.apply(this, args);
    };
  }

  function parseBilibiliResponse(json) {
    try {
      const data = json?.data;
      if (!data) return;
      lastAnchorName = data?.anchor_info?.base_info?.uname || '';
      lastTitle = data?.room_info?.title || '';
      const streams = [];
      // 找流地址
      const urlList = data?.stream_list;
      if (urlList) {
        for (const sl of Object.values(urlList)) {
          const url = sl?.url || '';
          if (url) {
            const quality = sl?.qualities?.[0]?.quality || '默认';
            streams.push({ url, label: `${quality} (B站)` });
          }
        }
      }
      // 主地址
      const mainUrl = data?.stream_url_list?.[0]?.url || '';
      if (mainUrl && !streams.length) {
        streams.push({ url: mainUrl, label: 'B站流' });
      }
      if (streams.length > 0) {
        detectedStreams = streams;
        lastPlatform = 'B站';
        broadcastStreams();
      }
    } catch (e) {}
  }

  function parseBilibiliStreamInfo(json) {
    try {
      const d = json?.data;
      if (!d) return;
      lastAnchorName = d?.uname || lastAnchorName;
      const streams = [];
      if (d?.dolby_url) streams.push({ url: d.dolby_url, label: 'Dolby (B站)' });
      if (d?.hls_url) streams.push({ url: d.hls_url, label: 'HLS (B站)' });
      if (d?.dolby_url || d?.hls_url) {
        detectedStreams = streams;
        lastPlatform = 'B站';
        broadcastStreams();
      }
    } catch (e) {}
  }

  // 快手：通过 DOM 和 XHR 检测
  function interceptKuaishou() {
    // 监听 XHR
    const origOpen = XMLHttpRequest.prototype.open;
    const origSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.open = function (method, url, ...rest) {
      this._url = url;
      return origOpen.apply(this, [method, url, ...rest]);
    };
    XMLHttpRequest.prototype.send = function (...args) {
      const url = this._url || '';
      if (url.includes('live') && (url.includes('api') || url.includes('stream'))) {
        this.addEventListener('load', () => {
          try {
            const json = JSON.parse(this.responseText);
            parseKuaishouResponse(json);
          } catch (e) {}
        });
      }
      return origSend.apply(this, args);
    };

    // DOM 备用方案
    setInterval(() => {
      if (!detectedStreams.length) {
        const el = document.querySelector('[data-elem-id="player"]') ||
                   document.querySelector('.live-player') ||
                   document.querySelector('.ks-live-player');
        if (el) {
          const src = el.querySelector('source')?.src || '';
          if (src) {
            detectedStreams = [{ url: src, label: '快手流' }];
            lastPlatform = '快手';
            lastAnchorName = document.querySelector('.nickname')?.textContent || '';
            broadcastStreams();
          }
        }
      }
    }, 3000);
  }

  function parseKuaishouResponse(json) {
    try {
      const streamData = json?.data?.stream;
      if (streamData) {
        const streams = [];
        const urlList = streamData?.origin?.main || streamData?.origin || {};
        for (const [key, val] of Object.entries(urlList)) {
          if (typeof val === 'string' && (val.startsWith('http') || val.startsWith('//'))) {
            streams.push({ url: val.startsWith('//') ? 'https:' + val : val, label: `${key} (快手)` });
          }
        }
        if (streams.length > 0) {
          detectedStreams = streams;
          lastPlatform = '快手';
          broadcastStreams();
        }
      }
    } catch (e) {}
  }

  function broadcastStreams() {
    const data = {
      type: 'STREAMS_DETECTED',
      platform: lastPlatform,
      anchor_name: lastAnchorName,
      title: lastTitle,
      streams: detectedStreams,
      timestamp: Date.now()
    };
    // 通知 popup
    chrome.runtime.sendMessage(data);
    // 也通知所有 popup
    chrome.runtime.sendMessage({ type: 'STREAMS_DETECTED', ...data });
  }

  // 消息处理器
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === 'GET_STREAMS') {
      sendResponse({
        platform: lastPlatform,
        anchor_name: lastAnchorName,
        title: lastTitle,
        streams: detectedStreams,
        error: detectedStreams.length === 0 ? '未检测到直播流，请确认已在直播页面' : null
      });
    }
  });

  // 根据当前域名选择拦截策略
  const hostname = window.location.hostname;
  if (hostname.includes('douyin.com')) {
    interceptDouyin();
  } else if (hostname.includes('bilibili.com')) {
    interceptBilibili();
  } else if (hostname.includes('kuaishou.com')) {
    interceptKuaishou();
  }

  // 也尝试从 window 全局变量获取（某些页面会把流信息挂在 window 上）
  function tryGlobalVars() {
    if (detectedStreams.length) return;
    const win = window;
    // 抖音
    if (win.__ROOM_DATA__?.stream_url) {
      const su = win.__ROOM_DATA__.stream_url;
      const flv = su?.mainland_stream?.flv || '';
      const m3u8 = su?.mainland_stream?.m3u8 || '';
      if (flv || m3u8) {
        detectedStreams = [];
        if (flv) detectedStreams.push({ url: flv, label: 'FLV' });
        if (m3u8) detectedStreams.push({ url: m3u8, label: 'M3U8' });
        lastPlatform = '抖音';
        broadcastStreams();
      }
    }
    // B站
    if (win.__INIT_STATE__) {
      try {
        const s = typeof win.__INIT_STATE__ === 'string' ? JSON.parse(win.__INIT_STATE__) : win.__INIT_STATE__;
        const room = s?.room?.init?.roomInfo?.room;
        if (room?.live_status === 1) {
          // B站流地址在 streamList 中
          const streamList = s?.room?.init?.streamList?.result?.stream?.list || [];
          if (streamList.length > 0) {
            detectedStreams = streamList.map(s => ({
              url: s.url,
              label: `${s.qualityName || '默认'} (B站)`
            }));
            lastPlatform = 'B站';
            lastAnchorName = s?.room?.init?.roomInfo?.room?.anchor?.name || '';
            lastTitle = s?.room?.init::roomInfo?.room?.title || '';
            broadcastStreams();
          }
        }
      } catch (e) {}
    }
  }

  // DOMContentLoaded 后尝试全局变量
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(tryGlobalVars, 2000);
    // 延迟再试一次
    setTimeout(tryGlobalVars, 5000);
  });

  console.log('[SODA LiveGrabber] Content script loaded on', hostname);
})();
