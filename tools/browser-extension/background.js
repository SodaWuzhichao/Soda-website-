// Background service worker - 简单的消息转发
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  // 转发给所有 popup
  chrome.runtime.sendMessage(msg).catch(() => {});
});

// 安装时通知
chrome.runtime.onInstalled.addListener(() => {
  console.log('[SODA LiveGrabber] Installed');
});
