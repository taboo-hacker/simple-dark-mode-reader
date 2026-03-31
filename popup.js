// 全局变量
let currentTab;



// 加载用户设置
function loadSettings() {
    chrome.storage.local.get(['darkMode', 'readerMode', 'fontSize'], (result) => {
        // 设置深色模式开关
        if (result.darkMode !== undefined) {
            document.getElementById('dark-mode').checked = result.darkMode;
        }
        
        // 设置阅读模式开关
        if (result.readerMode !== undefined) {
            document.getElementById('reader-mode').checked = result.readerMode;
        }
        
        // 设置字体大小滑块
        if (result.fontSize !== undefined) {
            document.getElementById('font-size').value = result.fontSize;
            document.getElementById('font-size-value').textContent = result.fontSize;
        }
    });
}

// 绑定事件监听器
function bindEventListeners() {
    // 深色模式开关
    document.getElementById('dark-mode').addEventListener('change', (e) => {
        const enabled = e.target.checked;
        saveSetting('darkMode', enabled);
        toggleDarkMode(enabled);
    });
    
    // 阅读模式开关
    document.getElementById('reader-mode').addEventListener('change', (e) => {
        const enabled = e.target.checked;
        saveSetting('readerMode', enabled);
        toggleReaderMode(enabled);
    });
    
    // 字体大小滑块
    document.getElementById('font-size').addEventListener('input', (e) => {
        const fontSize = e.target.value;
        document.getElementById('font-size-value').textContent = fontSize;
        saveSetting('fontSize', fontSize);
        setFontSize(fontSize);
    });
}

// 保存设置到存储
function saveSetting(key, value) {
    chrome.storage.local.set({ [key]: value });
}

// 切换深色模式
function toggleDarkMode(enabled) {
    if (!currentTab) return;
    
    chrome.scripting.executeScript({
        target: { tabId: currentTab.id },
        func: (enabled) => {
            if (enabled) {
                // 添加深色模式样式
                let style = document.getElementById('simple-dark-mode-style');
                if (!style) {
                    style = document.createElement('style');
                    style.id = 'simple-dark-mode-style';
                    document.head.appendChild(style);
                }
                style.textContent = `
                    body {
                        background-color: #121212 !important;
                        color: #e0e0e0 !important;
                    }
                    
                    /* 通用元素 */
                    div, span, p, h1, h2, h3, h4, h5, h6, 
                    ul, ol, li, a, button, input, textarea, select {
                        color: #e0e0e0 !important;
                    }
                    
                    /* 链接 */
                    a {
                        color: #90caf9 !important;
                    }
                    
                    /* 背景色 */
                    .bg-white, .bg-light, .bg-gray-100, .bg-gray-200 {
                        background-color: #1e1e1e !important;
                    }
                    
                    /* 卡片和容器 */
                    .card, .container, .panel, .box {
                        background-color: #1e1e1e !important;
                        border-color: #333 !important;
                    }
                    
                    /* 输入框 */
                    input, textarea, select {
                        background-color: #2d2d2d !important;
                        border-color: #444 !important;
                    }
                    
                    /* 按钮 */
                    button {
                        background-color: #333 !important;
                        border-color: #555 !important;
                    }
                `;
            } else {
                // 移除深色模式样式
                const style = document.getElementById('simple-dark-mode-style');
                if (style) {
                    style.remove();
                }
            }
        },
        args: [enabled]
    });
}

// 切换阅读模式
function toggleReaderMode(enabled) {
    if (!currentTab) return;
    
    chrome.scripting.executeScript({
        target: { tabId: currentTab.id },
        func: (enabled) => {
            if (enabled) {
                // 添加阅读模式样式
                let style = document.getElementById('simple-reader-mode-style');
                if (!style) {
                    style = document.createElement('style');
                    style.id = 'simple-reader-mode-style';
                    document.head.appendChild(style);
                }
                style.textContent = `
                    /* 隐藏广告和干扰元素 */
                    .ad, .ads, .advertisement, .banner, .sidebar, 
                    .widget, .footer, .header, .nav, .menu, 
                    .social, .share, .comment, .related, 
                    .promotion, .popup, .modal {
                        display: none !important;
                    }
                    
                    /* 优化阅读区域 */
                    body {
                        max-width: 800px !important;
                        margin: 0 auto !important;
                        padding: 20px !important;
                    }
                    
                    /* 优化文章内容 */
                    article, .article, .content, .main-content {
                        max-width: 100% !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                `;
            } else {
                // 移除阅读模式样式
                const style = document.getElementById('simple-reader-mode-style');
                if (style) {
                    style.remove();
                }
            }
        },
        args: [enabled]
    });
}

// 设置字体大小
function setFontSize(size) {
    if (!currentTab) return;
    
    chrome.scripting.executeScript({
        target: { tabId: currentTab.id },
        func: (size) => {
            // 添加字体大小样式
            let style = document.getElementById('simple-font-size-style');
            if (!style) {
                style = document.createElement('style');
                style.id = 'simple-font-size-style';
                document.head.appendChild(style);
            }
            style.textContent = `
                body {
                    font-size: ${size}px !important;
                }
                
                p {
                    font-size: 1em !important;
                    line-height: 1.6 !important;
                }
                
                h1 {
                    font-size: 2em !important;
                }
                
                h2 {
                    font-size: 1.8em !important;
                }
                
                h3 {
                    font-size: 1.6em !important;
                }
                
                h4 {
                    font-size: 1.4em !important;
                }
                
                h5 {
                    font-size: 1.2em !important;
                }
                
                h6 {
                    font-size: 1em !important;
                }
            `;
        },
        args: [size]
    });
}

// 检查 AdGuard 状态
function checkAdGuardStatus() {
    chrome.runtime.sendMessage({ type: 'checkAdGuardStatus' }, (response) => {
        const statusElement = document.getElementById('adguard-status');
        const assistantButton = document.getElementById('open-adguard-assistant');
        
        if (response.installed) {
            statusElement.textContent = `AdGuard 已安装 ${response.status.enabled ? '(已启用)' : '(已禁用)'}`;
            statusElement.className = 'status-message adguard-status-installed';
            assistantButton.disabled = !response.status.enabled;
        } else {
            statusElement.textContent = 'AdGuard 未安装';
            statusElement.className = 'status-message adguard-status-not-installed';
            assistantButton.disabled = true;
        }
    });
}

// 打开 AdGuard 助手
function openAdGuardAssistant() {
    if (!currentTab) return;
    
    chrome.runtime.sendMessage({ 
        type: 'openAdGuardAssistant', 
        tabId: currentTab.id 
    }, (response) => {
        if (response && response.success) {
            console.log('AdGuard 助手已打开');
        } else {
            console.error('打开 AdGuard 助手失败');
        }
    });
}

// 绑定 AdGuard 相关事件监听器
function bindAdGuardEventListeners() {
    // 打开 AdGuard 助手按钮
    document.getElementById('open-adguard-assistant').addEventListener('click', openAdGuardAssistant);
}

// 初始化
async function init() {
    // 获取当前标签页
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    currentTab = tabs[0];
    
    // 加载用户设置
    loadSettings();
    
    // 绑定事件监听器
    bindEventListeners();
    
    // 绑定 AdGuard 事件监听器
    bindAdGuardEventListeners();
    
    // 检查 AdGuard 状态
    checkAdGuardStatus();
}

// 调用初始化函数
init();