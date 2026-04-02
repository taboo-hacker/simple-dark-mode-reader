/**
 * AdGuard Dev Tool - Background Service Worker
 * Manifest V3 Compatible
 * 
 * @description 处理扩展的生命周期事件和跨页面通信
 * @author Solo Coder
 * @version 2.0.0
 */

// ============================================
// 全局状态
// ============================================

/** @type {boolean} 扩展是否已初始化 */
let isInitialized = false;

// ============================================
// 默认设置配置
// ============================================

const DEFAULT_SETTINGS = {
    // 深色模式
    darkMode: false,
    darkModeLevel: 'standard',
    enhancedDark: false,
    eyeCare: false,
    
    // 阅读净化
    readerMode: false,
    autoScroll: false,
    smoothScroll: false,
    forceCopy: false,
    fontSize: 16,
    lineHeight: 1.6,
    wordSpacing: 0,
    
    // 视频工具
    videoEnhance: false,
    videoSpeed: 1.0,
    skipAds: false,
    preventPause: false,
    
    // 隐私安全
    removeTracking: false,
    hideCookie: false,
    blockMediaPermission: false,
    antiFingerprint: false,
    
    // 实用工具
    cleanPage: false,
    blockPopups: false,
    blockRefresh: false,
    blockGif: false,
    autoRefresh: 0,
    userAgent: 'default',
    
    // 其他
    whitelist: [],
    siteSettings: {}
};

// ============================================
// 工具函数
// ============================================

/**
 * 检查扩展上下文是否有效
 * @returns {boolean} 上下文是否有效
 */
function checkContext() {
    try {
        return typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id !== undefined;
    } catch (e) {
        return false;
    }
}

/**
 * 安全地执行Chrome API调用
 * @param {Function} apiCall - API调用函数
 * @param {*} defaultValue - 失败时的默认值
 * @returns {Promise<*>} 执行结果
 */
async function safeApiCall(apiCall, defaultValue = null) {
    if (!checkContext()) return defaultValue;
    
    try {
        return await apiCall();
    } catch (error) {
        console.error('API调用失败:', error);
        return defaultValue;
    }
}

// ============================================
// 设置管理
// ============================================

/**
 * 初始化默认设置
 */
async function initializeSettings() {
    if (!checkContext()) return;
    
    try {
        const result = await chrome.storage.local.get(Object.keys(DEFAULT_SETTINGS));
        const settingsToSet = {};
        
        Object.keys(DEFAULT_SETTINGS).forEach(key => {
            if (result[key] === undefined) {
                settingsToSet[key] = DEFAULT_SETTINGS[key];
            }
        });
        
        if (Object.keys(settingsToSet).length > 0) {
            await chrome.storage.local.set(settingsToSet);
            console.log('AdGuard Dev Tool: 默认设置已初始化');
        }
        
        isInitialized = true;
    } catch (error) {
        console.error('AdGuard Dev Tool: 初始化设置失败', error);
    }
}

// ============================================
// 标签页管理
// ============================================

/**
 * 向标签页发送消息
 * @param {number} tabId - 标签页ID
 * @param {Object} message - 消息对象
 */
async function sendMessageToTab(tabId, message) {
    if (!checkContext() || !tabId) return;
    
    try {
        await chrome.tabs.sendMessage(tabId, message);
    } catch (error) {
        // 忽略常见错误（content script 未加载等）
        if (!error.message?.includes('Could not establish connection') &&
            !error.message?.includes('Receiving end does not exist')) {
            console.log('AdGuard Dev Tool: 发送消息失败', error.message);
        }
    }
}

/**
 * 重新应用所有标签页的设置
 */
async function reapplyAllTabsSettings() {
    if (!checkContext()) return;
    
    try {
        const tabs = await chrome.tabs.query({});
        
        for (const tab of tabs) {
            // 跳过特殊页面
            if (!tab.url || tab.url.startsWith('chrome://') || 
                tab.url.startsWith('chrome-extension://') ||
                tab.url.startsWith('edge://') ||
                tab.url.startsWith('about:') ||
                tab.url.startsWith('file://')) {
                continue;
            }
            
            await sendMessageToTab(tab.id, { action: 'reapplySettings' });
        }
    } catch (error) {
        console.error('AdGuard Dev Tool: 重新应用设置失败', error);
    }
}

// ============================================
// 事件监听器
// ============================================

// 扩展安装或更新
chrome.runtime.onInstalled.addListener((details) => {
    console.log('AdGuard Dev Tool: 扩展已安装/更新', details.reason);
    initializeSettings();
});

// Service Worker 启动
chrome.runtime.onStartup.addListener(() => {
    console.log('AdGuard Dev Tool: 浏览器启动');
    initializeSettings();
});

// 标签页更新
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    // 只在页面完全加载后执行
    if (changeInfo.status === 'complete' && tab.url) {
        // 跳过特殊页面
        if (tab.url.startsWith('chrome://') || 
            tab.url.startsWith('chrome-extension://') ||
            tab.url.startsWith('edge://') ||
            tab.url.startsWith('about:')) {
            return;
        }
        
        // 延迟发送消息，确保 content script 已加载
        setTimeout(() => {
            sendMessageToTab(tabId, { action: 'reapplySettings' });
        }, 100);
    }
});

// 标签页激活
chrome.tabs.onActivated.addListener((activeInfo) => {
    sendMessageToTab(activeInfo.tabId, { action: 'reapplySettings' });
});

// 监听消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // 使用异步处理
    (async () => {
        try {
            switch (request.action) {
                case 'getSettings':
                    const settings = await chrome.storage.local.get(null);
                    sendResponse({ success: true, data: settings });
                    break;
                    
                case 'setSetting':
                    if (request.key && request.value !== undefined) {
                        await chrome.storage.local.set({ [request.key]: request.value });
                        sendResponse({ success: true });
                    } else {
                        sendResponse({ success: false, error: 'Invalid parameters' });
                    }
                    break;
                    
                case 'getCurrentTab':
                    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
                    sendResponse({ success: true, data: tabs[0] || null });
                    break;
                    
                case 'checkAdGuard':
                    // AdGuard 集成未实现
                    sendResponse({ success: true, data: { installed: false, version: null } });
                    break;
                    
                case 'reapplyAllSettings':
                    await reapplyAllTabsSettings();
                    sendResponse({ success: true });
                    break;
                    
                default:
                    console.log('AdGuard Dev Tool: 未知消息', request.action);
                    sendResponse({ success: false, error: 'Unknown action' });
            }
        } catch (error) {
            console.error('AdGuard Dev Tool: 消息处理错误', error);
            sendResponse({ success: false, error: error.message });
        }
    })();
    
    // 保持消息通道开启
    return true;
});

// 监听存储变化
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace !== 'local') return;
    
    // 通知所有标签页设置已更改
    (async () => {
        try {
            const tabs = await chrome.tabs.query({});
            
            for (const tab of tabs) {
                // 跳过特殊页面
                if (!tab.url || tab.url.startsWith('chrome://') || 
                    tab.url.startsWith('chrome-extension://') ||
                    tab.url.startsWith('edge://') ||
                    tab.url.startsWith('about:')) {
                    continue;
                }
                
                await sendMessageToTab(tab.id, { 
                    action: 'settingsChanged', 
                    changes: changes 
                });
            }
        } catch (error) {
            console.error('AdGuard Dev Tool: 广播设置变化失败', error);
        }
    })();
});

// ============================================
// 初始化
// ============================================

console.log('AdGuard Dev Tool: Background service worker 已启动');
initializeSettings();
