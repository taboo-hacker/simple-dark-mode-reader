// Background service worker for Simple Dark Mode & Reader
// 后台服务脚本，用于处理扩展的生命周期事件和跨页面通信

// 扩展安装或更新时初始化
chrome.runtime.onInstalled.addListener((details) => {
    console.log('Simple Dark Mode & Reader: 扩展已安装/更新', details.reason);
    
    // 初始化默认设置
    const defaultSettings = {
        darkMode: false,
        readerMode: false,
        fontSize: 16,
        lineHeight: 1.6,
        wordSpacing: 0,
        forceCopy: false,
        videoEnhance: false,
        smoothScroll: false,
        enhancedDark: false,
        darkModeLevel: 'standard',
        removeTracking: false,
        hideCookie: false,
        blockMediaPermission: false,
        antiFingerprint: false,
        eyeCare: false,
        autoScroll: false,
        videoSpeed: 1.0,
        skipAds: false,
        preventPause: false,
        blockPopups: false,
        blockRefresh: false,
        blockGif: false,
        cleanPage: false,
        userAgent: 'default',
        whitelist: [],
        siteSettings: {}
    };
    
    chrome.storage.local.get(Object.keys(defaultSettings), (result) => {
        const settingsToSet = {};
        
        Object.keys(defaultSettings).forEach(key => {
            if (result[key] === undefined) {
                settingsToSet[key] = defaultSettings[key];
            }
        });
        
        if (Object.keys(settingsToSet).length > 0) {
            chrome.storage.local.set(settingsToSet, () => {
                console.log('Simple Dark Mode & Reader: 默认设置已初始化');
            });
        }
    });
});

// 监听标签页更新事件
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    // 只在页面完全加载后执行
    if (changeInfo.status === 'complete' && tab.url && !tab.url.startsWith('chrome://')) {
        console.log('Simple Dark Mode & Reader: 页面加载完成', tab.url);
        
        // 向 content script 发送消息，重新应用设置
        chrome.tabs.sendMessage(tabId, { action: 'reapplySettings' }, (response) => {
            if (chrome.runtime.lastError) {
                // content script 可能还没有加载，忽略错误
                console.log('Simple Dark Mode & Reader: content script 尚未加载');
            } else {
                console.log('Simple Dark Mode & Reader: 设置已重新应用');
            }
        });
    }
});

// 监听标签页激活事件
chrome.tabs.onActivated.addListener((activeInfo) => {
    console.log('Simple Dark Mode & Reader: 标签页激活', activeInfo.tabId);
    
    // 向 content script 发送消息，重新应用设置
    chrome.tabs.sendMessage(activeInfo.tabId, { action: 'reapplySettings' }, (response) => {
        if (chrome.runtime.lastError) {
            // content script 可能还没有加载，忽略错误
            console.log('Simple Dark Mode & Reader: content script 尚未加载');
        } else {
            console.log('Simple Dark Mode & Reader: 设置已重新应用');
        }
    });
});

// 监听来自 content script 或 popup 的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch(request.action) {
        case 'getSettings':
            // 获取所有设置
            chrome.storage.local.get(null, (result) => {
                sendResponse(result);
            });
            return true; // 保持消息通道开启
            
        case 'setSetting':
            // 设置单个选项
            if (request.key && request.value !== undefined) {
                chrome.storage.local.set({ [request.key]: request.value }, () => {
                    sendResponse({ success: true });
                });
            }
            return true;
            
        case 'getCurrentTab':
            // 获取当前标签页信息
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                sendResponse(tabs[0] || null);
            });
            return true;
            
        case 'executeScript':
            // 在指定标签页执行脚本
            if (request.tabId && request.func) {
                chrome.scripting.executeScript({
                    target: { tabId: request.tabId },
                    func: new Function(request.func),
                    args: request.args || []
                }, (results) => {
                    sendResponse(results);
                });
            }
            return true;
            
        case 'checkAdGuard':
            // 检查 AdGuard 是否安装（模拟）
            sendResponse({ installed: false, version: null });
            return true;
            
        default:
            console.log('Simple Dark Mode & Reader: 未知消息', request);
    }
});

// 监听存储变化
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local') {
        console.log('Simple Dark Mode & Reader: 设置已更改', changes);
        
        // 通知所有标签页更新设置
        chrome.tabs.query({}, (tabs) => {
            tabs.forEach(tab => {
                if (tab.url && !tab.url.startsWith('chrome://')) {
                    chrome.tabs.sendMessage(tab.id, { 
                        action: 'settingsChanged', 
                        changes: changes 
                    }, () => {
                        // 忽略错误（某些页面可能没有 content script）
                        if (chrome.runtime.lastError) {
                            // 静默处理
                        }
                    });
                }
            });
        });
    }
});

// 监听快捷键（如果配置了）
chrome.commands.onCommand.addListener((command) => {
    console.log('Simple Dark Mode & Reader: 快捷键触发', command);
    
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
            switch(command) {
                case 'toggle-dark-mode':
                    chrome.storage.local.get('darkMode', (result) => {
                        const newValue = !result.darkMode;
                        chrome.storage.local.set({ darkMode: newValue });
                    });
                    break;
                    
                case 'toggle-reader-mode':
                    chrome.storage.local.get('readerMode', (result) => {
                        const newValue = !result.readerMode;
                        chrome.storage.local.set({ readerMode: newValue });
                    });
                    break;
            }
        }
    });
});

console.log('Simple Dark Mode & Reader: Background service worker 已启动');
