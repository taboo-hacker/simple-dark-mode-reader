// 背景脚本 - 集成 AdGuard API

/**
 * 检测 AdGuard 是否安装并运行
 * @returns {Promise<boolean>} AdGuard 是否安装并运行
 */
async function isAdGuardInstalled() {
  try {
    // 检查 AdGuard 扩展是否安装
    const extensions = await chrome.management.getAll();
    const adguardExtension = extensions.find(ext => 
      ext.name.toLowerCase().includes('adguard') && 
      ext.enabled === true
    );
    return !!adguardExtension;
  } catch (error) {
    console.error('检测 AdGuard 安装状态失败:', error);
    return false;
  }
}

/**
 * 与 AdGuard 通信的基础函数
 * @param {string} action 操作类型
 * @param {any} data 发送的数据
 * @returns {Promise<any>} 响应数据
 */
async function sendMessageToAdGuard(action, data = {}) {
  try {
    // AdGuard 的扩展 ID（可能需要根据实际情况调整）
    const ADGUARD_EXTENSION_ID = 'adguardadblocker';
    
    const response = await chrome.runtime.sendMessage(ADGUARD_EXTENSION_ID, {
      type: action,
      ...data
    });
    return response;
  } catch (error) {
    console.error('与 AdGuard 通信失败:', error);
    return null;
  }
}

/**
 * 打开 AdGuard 助手
 * @param {number} tabId 标签页 ID
 * @returns {Promise<boolean>} 是否成功打开
 */
async function openAdGuardAssistant(tabId) {
  try {
    const response = await sendMessageToAdGuard('openAssistant', { tabId });
    return response?.success || false;
  } catch (error) {
    console.error('打开 AdGuard 助手失败:', error);
    return false;
  }
}

/**
 * 获取 AdGuard 过滤状态
 * @returns {Promise<object>} 过滤状态
 */
async function getAdGuardFilteringStatus() {
  try {
    const response = await sendMessageToAdGuard('getStatus');
    return response || { enabled: false };
  } catch (error) {
    console.error('获取 AdGuard 过滤状态失败:', error);
    return { enabled: false };
  }
}

/**
 * 监听 AdGuard 拦截事件
 */
function setupAdGuardEventListeners() {
  // 监听来自 AdGuard 的消息
  chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
    if (sender.id && sender.id.toLowerCase().includes('adguard')) {
      // 处理 AdGuard 发送的拦截事件
      if (message.type === 'adBlocked') {
        console.log('AdGuard 拦截了广告:', message.data);
        // 可以在这里处理拦截事件，例如更新统计信息等
      }
      
      // 处理 AdGuard 状态变化
      if (message.type === 'statusChanged') {
        console.log('AdGuard 状态变化:', message.data);
        // 可以在这里更新本地存储的 AdGuard 状态
        chrome.storage.local.set({ adguardStatus: message.data });
      }
    }
  });
}

/**
 * 初始化 AdGuard 集成
 */
async function initAdGuardIntegration() {
  // 检测 AdGuard 是否安装
  const installed = await isAdGuardInstalled();
  console.log('AdGuard 安装状态:', installed);
  
  // 保存 AdGuard 安装状态
  chrome.storage.local.set({ adguardInstalled: installed });
  
  if (installed) {
    // 获取初始过滤状态
    const status = await getAdGuardFilteringStatus();
    console.log('AdGuard 过滤状态:', status);
    chrome.storage.local.set({ adguardStatus: status });
  }
  
  // 设置事件监听器
  setupAdGuardEventListeners();
}

// 初始化 AdGuard 集成
initAdGuardIntegration();

// 监听来自 popup 的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'checkAdGuardStatus') {
    // 检查 AdGuard 状态
    isAdGuardInstalled().then(installed => {
      if (installed) {
        getAdGuardFilteringStatus().then(status => {
          sendResponse({ installed, status });
        });
      } else {
        sendResponse({ installed: false, status: null });
      }
    });
    return true; // 表示异步响应
  }
  
  if (message.type === 'openAdGuardAssistant') {
    // 打开 AdGuard 助手
    openAdGuardAssistant(message.tabId).then(success => {
      sendResponse({ success });
    });
    return true; // 表示异步响应
  }
});
