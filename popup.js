// 全局变量
let currentTab;



// 加载用户设置
function loadSettings() {
    // 获取当前标签页URL，用于加载网站特定设置
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const currentTab = tabs[0];
        const url = currentTab?.url || '';
        const domain = new URL(url).hostname || '';
        
        chrome.storage.local.get(['darkMode', 'readerMode', 'fontSize', 'removeWatermark', 'cleanPage', 'forceCopy', 'videoEnhance', 'smoothScroll', 'enhancedDark', 'darkModeLevel', 'whitelist', 'siteSettings'], (result) => {
            // 设置深色模式开关
            if (result.siteSettings?.[domain]?.darkMode !== undefined) {
                document.getElementById('dark-mode').checked = result.siteSettings[domain].darkMode;
            } else if (result.darkMode !== undefined) {
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
            
            // 设置智能去水印开关
            if (result.removeWatermark !== undefined) {
                document.getElementById('remove-watermark').checked = result.removeWatermark;
            }
            
            // 设置网页净化开关
            if (result.cleanPage !== undefined) {
                document.getElementById('clean-page').checked = result.cleanPage;
            }
            
            // 设置强制复制开关
            if (result.forceCopy !== undefined) {
                document.getElementById('force-copy').checked = result.forceCopy;
            }
            
            // 设置视频增强开关
            if (result.videoEnhance !== undefined) {
                document.getElementById('video-enhance').checked = result.videoEnhance;
            }
            
            // 设置滚动平滑开关
            if (result.smoothScroll !== undefined) {
                document.getElementById('smooth-scroll').checked = result.smoothScroll;
            }
            
            // 设置深色模式增强开关
            if (result.enhancedDark !== undefined) {
                document.getElementById('enhanced-dark').checked = result.enhancedDark;
            }
            
            // 设置深色模式档位
            if (result.siteSettings?.[domain]?.darkModeLevel !== undefined) {
                document.getElementById('dark-mode-level').value = result.siteSettings[domain].darkModeLevel;
            } else if (result.darkModeLevel !== undefined) {
                document.getElementById('dark-mode-level').value = result.darkModeLevel;
            }
        });
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
    
    // 智能去水印开关
    document.getElementById('remove-watermark').addEventListener('change', (e) => {
        const enabled = e.target.checked;
        saveSetting('removeWatermark', enabled);
        toggleRemoveWatermark(enabled);
    });
    
    // 网页净化开关
    document.getElementById('clean-page').addEventListener('change', (e) => {
        const enabled = e.target.checked;
        saveSetting('cleanPage', enabled);
        toggleCleanPage(enabled);
    });
    
    // 强制复制开关
    document.getElementById('force-copy').addEventListener('change', (e) => {
        const enabled = e.target.checked;
        saveSetting('forceCopy', enabled);
        toggleForceCopy(enabled);
    });
    
    // 视频增强开关
    document.getElementById('video-enhance').addEventListener('change', (e) => {
        const enabled = e.target.checked;
        saveSetting('videoEnhance', enabled);
        toggleVideoEnhance(enabled);
    });
    
    // 滚动平滑开关
    document.getElementById('smooth-scroll').addEventListener('change', (e) => {
        const enabled = e.target.checked;
        saveSetting('smoothScroll', enabled);
        toggleSmoothScroll(enabled);
    });
    
    // 深色模式增强开关
    document.getElementById('enhanced-dark').addEventListener('change', (e) => {
        const enabled = e.target.checked;
        saveSetting('enhancedDark', enabled);
        
        // 当打开「深色模式增强」时，自动开启「深色模式」主开关
        if (enabled) {
            const darkModeSwitch = document.getElementById('dark-mode');
            if (!darkModeSwitch.checked) {
                darkModeSwitch.checked = true;
                saveSetting('darkMode', true);
                toggleDarkMode(true);
            }
        }
        
        toggleEnhancedDark(enabled);
    });
    
    // 深色模式档位选择
    document.getElementById('dark-mode-level').addEventListener('change', (e) => {
        const level = e.target.value;
        saveSiteSetting('darkModeLevel', level);
        updateDarkModeLevel(level);
    });
    
    // 添加到白名单按钮
    document.getElementById('add-whitelist').addEventListener('click', () => {
        addToWhitelist();
    });
    
    // 一键还原按钮
    document.getElementById('reset-styles').addEventListener('click', () => {
        resetStyles();
    });
}

// 保存设置到存储
function saveSetting(key, value) {
    chrome.storage.local.set({ [key]: value });
}

// 保存网站特定设置
function saveSiteSetting(key, value) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const currentTab = tabs[0];
        const url = currentTab?.url || '';
        const domain = new URL(url).hostname || '';
        
        if (domain) {
            chrome.storage.local.get('siteSettings', (result) => {
                const siteSettings = result.siteSettings || {};
                if (!siteSettings[domain]) {
                    siteSettings[domain] = {};
                }
                siteSettings[domain][key] = value;
                chrome.storage.local.set({ siteSettings });
            });
        }
    });
}

// 添加网站到白名单
function addToWhitelist() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const currentTab = tabs[0];
        const url = currentTab?.url || '';
        const domain = new URL(url).hostname || '';
        
        if (domain) {
            chrome.storage.local.get('whitelist', (result) => {
                const whitelist = result.whitelist || [];
                if (!whitelist.includes(domain)) {
                    whitelist.push(domain);
                    chrome.storage.local.set({ whitelist });
                    alert(`已将 ${domain} 添加到白名单`);
                    // 关闭当前深色模式
                    document.getElementById('dark-mode').checked = false;
                    toggleDarkMode(false);
                } else {
                    alert(`${domain} 已在白名单中`);
                }
            });
        }
    });
}

// 一键还原样式
function resetStyles() {
    if (!currentTab) return;
    
    chrome.scripting.executeScript({
        target: { tabId: currentTab.id },
        func: () => {
            // 移除所有注入的样式
            const styles = document.querySelectorAll('[id^="simple-"]');
            styles.forEach(style => style.remove());
            
            // 重新加载页面以确保完全还原
            location.reload();
        }
    }, () => {
        // 页面重新加载后，检测网站原生主题并同步开关状态
        setTimeout(() => {
            detectNativeTheme();
        }, 1000); // 等待页面加载完成
    });
}

// 更新深色模式档位
function updateDarkModeLevel(level) {
    if (!currentTab) return;
    
    // 先检查深色模式是否开启
    chrome.storage.local.get('darkMode', (result) => {
        const darkModeEnabled = result.darkMode || false;
        if (darkModeEnabled) {
            toggleDarkMode(true);
        }
    });
}

// 切换深色模式
function toggleDarkMode(enabled) {
    if (!currentTab) return;
    
    // 获取当前网站域名，检查是否在白名单中
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const currentTab = tabs[0];
        const url = currentTab?.url || '';
        const domain = new URL(url).hostname || '';
        
        chrome.storage.local.get(['whitelist', 'darkModeLevel', 'siteSettings'], (result) => {
            const whitelist = result.whitelist || [];
            
            // 检查是否在白名单中
            if (whitelist.includes(domain)) {
                console.log('网站在白名单中，跳过深色模式');
                return;
            }
            
            // 获取深色模式档位
            let darkModeLevel = result.darkModeLevel || 'standard';
            if (result.siteSettings?.[domain]?.darkModeLevel) {
                darkModeLevel = result.siteSettings[domain].darkModeLevel;
            }
            
            // 保存网站特定的深色模式状态
            if (domain) {
                chrome.storage.local.get('siteSettings', (result) => {
                    const siteSettings = result.siteSettings || {};
                    if (!siteSettings[domain]) {
                        siteSettings[domain] = {};
                    }
                    siteSettings[domain].darkMode = enabled;
                    chrome.storage.local.set({ siteSettings });
                });
            }
            
            chrome.scripting.executeScript({
                target: { tabId: currentTab.id },
                func: (enabled, darkModeLevel) => {
                    if (enabled) {
                        // 强制网页变成深色
                        // 根据档位选择颜色方案
                        let colorScheme;
                        switch (darkModeLevel) {
                            case 'pure-black':
                                colorScheme = {
                                    background: '#000000',
                                    surface: '#121212',
                                    primary: '#2196F3',
                                    text: '#e0e0e0',
                                    textSecondary: '#9e9e9e',
                                    border: '#333333'
                                };
                                break;
                            case 'soft':
                                colorScheme = {
                                    background: '#2d2d2d',
                                    surface: '#3d3d3d',
                                    primary: '#64b5f6',
                                    text: '#f5f5f5',
                                    textSecondary: '#bdbdbd',
                                    border: '#4d4d4d'
                                };
                                break;
                            default: // standard
                                colorScheme = {
                                    background: '#1a1a1a',
                                    surface: '#2d2d2d',
                                    primary: '#2196F3',
                                    text: '#e0e0e0',
                                    textSecondary: '#9e9e9e',
                                    border: '#333333'
                                };
                        }
                        
                        // 添加深色模式样式
                        let style = document.getElementById('simple-dark-mode-style');
                        if (!style) {
                            style = document.createElement('style');
                            style.id = 'simple-dark-mode-style';
                            document.head.appendChild(style);
                        }
                        
                        // 智能元素级适配样式
                        style.textContent = `
                            /* 基础样式 */
                            :root {
                                --dark-bg: ${colorScheme.background} !important;
                                --dark-surface: ${colorScheme.surface} !important;
                                --dark-primary: ${colorScheme.primary} !important;
                                --dark-text: ${colorScheme.text} !important;
                                --dark-text-secondary: ${colorScheme.textSecondary} !important;
                                --dark-border: ${colorScheme.border} !important;
                            }
                            
                            /* 全局样式 */
                            html, body {
                                background-color: var(--dark-bg) !important;
                                color: var(--dark-text) !important;
                                transition: all 0.3s ease !important;
                            }
                            
                            /* 所有元素的基础适配 */
                            * {
                                color: var(--dark-text) !important;
                                border-color: var(--dark-border) !important;
                                transition: all 0.3s ease !important;
                            }
                            
                            /* 背景色适配 */
                            body, div, section, article, header, footer, nav, aside,
                            .container, .content, .wrapper, .page, .main,
                            .card, .panel, .box, .section,
                            .bg-white, .bg-light, .bg-gray-100, .bg-gray-200, .bg-gray-300,
                            .white, .light, .gray, .bg-default {
                                background-color: var(--dark-surface) !important;
                            }
                            
                            /* 文字颜色适配 */
                            h1, h2, h3, h4, h5, h6, p, span, div, li, a, label, button {
                                color: var(--dark-text) !important;
                            }
                            
                            /* 链接样式 */
                            a {
                                color: var(--dark-primary) !important;
                            }
                            
                            a:hover {
                                color: ${colorScheme.primary}cc !important;
                            }
                            
                            /* 输入框和表单元素 */
                            input, textarea, select, button, .button {
                                background-color: var(--dark-surface) !important;
                                color: var(--dark-text) !important;
                                border-color: var(--dark-border) !important;
                            }
                            
                            input:focus, textarea:focus, select:focus {
                                border-color: var(--dark-primary) !important;
                                outline-color: var(--dark-primary) !important;
                            }
                            
                            /* 按钮样式 */
                            button, .button {
                                background-color: var(--dark-surface) !important;
                                color: var(--dark-text) !important;
                                border: 1px solid var(--dark-border) !important;
                            }
                            
                            button:hover, .button:hover {
                                background-color: ${colorScheme.surface}cc !important;
                            }
                            
                            /* 导航栏和菜单 */
                            .navbar, .nav, .menu, .navigation {
                                background-color: var(--dark-surface) !important;
                                border-bottom: 1px solid var(--dark-border) !important;
                            }
                            
                            /* 卡片和面板 */
                            .card, .panel, .box {
                                background-color: var(--dark-surface) !important;
                                border: 1px solid var(--dark-border) !important;
                                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3) !important;
                            }
                            
                            /* 弹窗和遮罩 */
                            .modal, .popup, .overlay, .dialog {
                                background-color: var(--dark-surface) !important;
                                border: 1px solid var(--dark-border) !important;
                            }
                            
                            .modal-backdrop, .overlay {
                                background-color: rgba(0, 0, 0, 0.7) !important;
                            }
                            
                            /* 广告和推广区域 */
                            .ad, .ads, .advertisement, .promotion {
                                background-color: var(--dark-surface) !important;
                                border: 1px solid var(--dark-border) !important;
                            }
                            
                            /* 图片和视频容器 */
                            img, video, .image-container, .video-container {
                                background-color: transparent !important;
                            }
                            
                            /* 滚动条 */
                            ::-webkit-scrollbar {
                                width: 8px;
                                height: 8px;
                            }
                            
                            ::-webkit-scrollbar-track {
                                background: var(--dark-bg) !important;
                            }
                            
                            ::-webkit-scrollbar-thumb {
                                background: var(--dark-border) !important;
                                border-radius: 4px;
                            }
                            
                            ::-webkit-scrollbar-thumb:hover {
                                background: var(--dark-text-secondary) !important;
                            }
                            
                            /* 代码和预格式化文本 */
                            code, pre {
                                background-color: ${colorScheme.background} !important;
                                color: var(--dark-text) !important;
                                border: 1px solid var(--dark-border) !important;
                            }
                            
                            /* 表格 */
                            table {
                                border-color: var(--dark-border) !important;
                            }
                            
                            th, td {
                                background-color: var(--dark-surface) !important;
                                border-color: var(--dark-border) !important;
                            }
                            
                            /* 禁用状态 */
                            [disabled], .disabled {
                                background-color: ${colorScheme.background} !important;
                                color: var(--dark-text-secondary) !important;
                                border-color: var(--dark-border) !important;
                            }
                            
                            /* 加载动画 */
                            .loading, .spinner {
                                border-color: var(--dark-border) !important;
                                border-top-color: var(--dark-primary) !important;
                            }
                        `;
                        
                        // 添加平滑过渡效果
                        document.body.style.transition = 'all 0.3s ease';
                    } else {
                        // 强制网页变成浅色
                        let style = document.getElementById('simple-dark-mode-style');
                        if (!style) {
                            style = document.createElement('style');
                            style.id = 'simple-dark-mode-style';
                            document.head.appendChild(style);
                        }
                        
                        // 强制浅色模式样式
                        style.textContent = `
                            /* 基础样式 */
                            :root {
                                --light-bg: #ffffff !important;
                                --light-surface: #f5f5f5 !important;
                                --light-primary: #2196F3 !important;
                                --light-text: #333333 !important;
                                --light-text-secondary: #666666 !important;
                                --light-border: #e0e0e0 !important;
                            }
                            
                            /* 全局样式 */
                            html, body {
                                background-color: var(--light-bg) !important;
                                color: var(--light-text) !important;
                                transition: all 0.3s ease !important;
                            }
                            
                            /* 所有元素的基础适配 */
                            * {
                                color: var(--light-text) !important;
                                border-color: var(--light-border) !important;
                                transition: all 0.3s ease !important;
                            }
                            
                            /* 背景色适配 */
                            body, div, section, article, header, footer, nav, aside,
                            .container, .content, .wrapper, .page, .main,
                            .card, .panel, .box, .section,
                            .bg-white, .bg-light, .bg-gray-100, .bg-gray-200, .bg-gray-300,
                            .white, .light, .gray, .bg-default {
                                background-color: var(--light-surface) !important;
                            }
                            
                            /* 文字颜色适配 */
                            h1, h2, h3, h4, h5, h6, p, span, div, li, a, label, button {
                                color: var(--light-text) !important;
                            }
                            
                            /* 链接样式 */
                            a {
                                color: var(--light-primary) !important;
                            }
                            
                            /* 输入框和表单元素 */
                            input, textarea, select, button, .button {
                                background-color: var(--light-bg) !important;
                                color: var(--light-text) !important;
                                border-color: var(--light-border) !important;
                            }
                            
                            /* 按钮样式 */
                            button, .button {
                                background-color: var(--light-bg) !important;
                                color: var(--light-text) !important;
                                border: 1px solid var(--light-border) !important;
                            }
                            
                            /* 导航栏和菜单 */
                            .navbar, .nav, .menu, .navigation {
                                background-color: var(--light-bg) !important;
                                border-bottom: 1px solid var(--light-border) !important;
                            }
                            
                            /* 卡片和面板 */
                            .card, .panel, .box {
                                background-color: var(--light-bg) !important;
                                border: 1px solid var(--light-border) !important;
                                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
                            }
                            
                            /* 弹窗和遮罩 */
                            .modal, .popup, .overlay, .dialog {
                                background-color: var(--light-bg) !important;
                                border: 1px solid var(--light-border) !important;
                            }
                            
                            .modal-backdrop, .overlay {
                                background-color: rgba(0, 0, 0, 0.5) !important;
                            }
                            
                            /* 广告和推广区域 */
                            .ad, .ads, .advertisement, .promotion {
                                background-color: var(--light-surface) !important;
                                border: 1px solid var(--light-border) !important;
                            }
                        `;
                    }
                },
                args: [enabled, darkModeLevel]
            });
        });
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
    
    // 检测网站原生主题并同步开关状态
    detectNativeTheme();
}

// 智能去水印
function toggleRemoveWatermark(enabled) {
    if (!currentTab) return;
    
    chrome.scripting.executeScript({
        target: { tabId: currentTab.id },
        func: (enabled) => {
            if (enabled) {
                // 添加去水印样式
                let style = document.getElementById('simple-remove-watermark-style');
                if (!style) {
                    style = document.createElement('style');
                    style.id = 'simple-remove-watermark-style';
                    document.head.appendChild(style);
                }
                style.textContent = `
                    /* 隐藏常见水印和版权标签 */
                    .watermark, .copyright, .copy-protected, .watermark-layer,
                    .video-watermark, .image-watermark, .content-watermark,
                    [class*="watermark"], [class*="copyright"] {
                        display: none !important;
                        opacity: 0 !important;
                        visibility: hidden !important;
                    }
                `;
            } else {
                // 移除去水印样式
                const style = document.getElementById('simple-remove-watermark-style');
                if (style) {
                    style.remove();
                }
            }
        },
        args: [enabled]
    });
}

// 网页净化
function toggleCleanPage(enabled) {
    if (!currentTab) return;
    
    chrome.scripting.executeScript({
        target: { tabId: currentTab.id },
        func: (enabled) => {
            if (enabled) {
                // 添加网页净化样式
                let style = document.getElementById('simple-clean-page-style');
                if (!style) {
                    style = document.createElement('style');
                    style.id = 'simple-clean-page-style';
                    document.head.appendChild(style);
                }
                style.textContent = `
                    /* 隐藏弹窗和遮罩 */
                    .popup, .modal, .overlay, .dialog, .lightbox,
                    .login-overlay, .paywall, .subscription-wall,
                    .cookie-banner, .consent-banner, .notification {
                        display: none !important;
                    }
                    
                    /* 移除推广内容 */
                    .promotion, .sponsored, .advertisement, .ad, .ads {
                        display: none !important;
                    }
                `;
                
                // 移除弹窗脚本
                const scripts = document.querySelectorAll('script');
                scripts.forEach(script => {
                    if (script.textContent.includes('popup') || script.textContent.includes('modal')) {
                        script.remove();
                    }
                });
            } else {
                // 移除网页净化样式
                const style = document.getElementById('simple-clean-page-style');
                if (style) {
                    style.remove();
                }
            }
        },
        args: [enabled]
    });
}

// 强制复制
function toggleForceCopy(enabled) {
    if (!currentTab) return;
    
    chrome.scripting.executeScript({
        target: { tabId: currentTab.id },
        func: (enabled) => {
            if (enabled) {
                // 移除复制限制
                document.addEventListener('copy', (e) => {
                    e.stopPropagation();
                }, true);
                
                document.addEventListener('cut', (e) => {
                    e.stopPropagation();
                }, true);
                
                document.addEventListener('paste', (e) => {
                    e.stopPropagation();
                }, true);
                
                // 移除右键限制
                document.addEventListener('contextmenu', (e) => {
                    e.stopPropagation();
                }, true);
                
                // 移除选择限制
                document.addEventListener('selectstart', (e) => {
                    e.stopPropagation();
                }, true);
                
                // 移除键盘事件限制
                document.addEventListener('keydown', (e) => {
                    if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'x' || e.key === 'v')) {
                        e.stopPropagation();
                    }
                }, true);
            }
        },
        args: [enabled]
    });
}

// 视频增强
function toggleVideoEnhance(enabled) {
    if (!currentTab) return;
    
    chrome.scripting.executeScript({
        target: { tabId: currentTab.id },
        func: (enabled) => {
            if (enabled) {
                // 为所有视频元素添加增强功能
                const videos = document.querySelectorAll('video');
                videos.forEach(video => {
                    // 启用画中画
                    if (video.requestPictureInPicture) {
                        video.controlsList.add('picture-in-picture');
                    }
                    
                    // 添加倍速控制
                    const speedControls = document.createElement('div');
                    speedControls.className = 'video-speed-controls';
                    speedControls.style.cssText = `
                        position: absolute;
                        top: 10px;
                        right: 10px;
                        background: rgba(0,0,0,0.7);
                        color: white;
                        padding: 5px 10px;
                        border-radius: 4px;
                        font-size: 12px;
                        z-index: 1000;
                    `;
                    
                    const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];
                    speeds.forEach(speed => {
                        const button = document.createElement('button');
                        button.textContent = speed + 'x';
                        button.style.cssText = `
                            background: transparent;
                            border: 1px solid white;
                            color: white;
                            padding: 2px 6px;
                            margin: 0 2px;
                            border-radius: 3px;
                            cursor: pointer;
                        `;
                        button.addEventListener('click', (e) => {
                            e.stopPropagation();
                            video.playbackRate = speed;
                        });
                        speedControls.appendChild(button);
                    });
                    
                    // 将控制添加到视频容器
                    const container = video.parentElement;
                    if (container) {
                        container.style.position = 'relative';
                        container.appendChild(speedControls);
                    }
                });
            }
        },
        args: [enabled]
    });
}

// 滚动平滑
function toggleSmoothScroll(enabled) {
    if (!currentTab) return;
    
    chrome.scripting.executeScript({
        target: { tabId: currentTab.id },
        func: (enabled) => {
            if (enabled) {
                // 添加平滑滚动样式
                let style = document.getElementById('simple-smooth-scroll-style');
                if (!style) {
                    style = document.createElement('style');
                    style.id = 'simple-smooth-scroll-style';
                    document.head.appendChild(style);
                }
                style.textContent = `
                    /* 平滑滚动 */
                    html {
                        scroll-behavior: smooth !important;
                    }
                    
                    /* 自动阅读模式 */
                    .auto-scroll {
                        animation: autoScroll 60s linear infinite;
                    }
                    
                    @keyframes autoScroll {
                        from { transform: translateY(0); }
                        to { transform: translateY(-100%); }
                    }
                `;
            } else {
                // 移除平滑滚动样式
                const style = document.getElementById('simple-smooth-scroll-style');
                if (style) {
                    style.remove();
                }
            }
        },
        args: [enabled]
    });
}

// 夜间模式增强
function toggleEnhancedDark(enabled) {
    if (!currentTab) return;
    
    // 当开启深色模式增强时，确保深色模式也开启
    if (enabled) {
        const darkModeSwitch = document.getElementById('dark-mode');
        if (!darkModeSwitch.checked) {
            darkModeSwitch.checked = true;
            saveSetting('darkMode', true);
            toggleDarkMode(true);
        }
    }
    
    chrome.scripting.executeScript({
        target: { tabId: currentTab.id },
        func: (enabled) => {
            if (enabled) {
                // 智能识别网页主题色并生成深色模式
                const detectThemeColor = () => {
                    // 检测页面主要颜色
                    const elements = document.querySelectorAll('body, h1, h2, h3, p, a');
                    const colors = [];
                    
                    elements.forEach(element => {
                        const computedStyle = window.getComputedStyle(element);
                        const color = computedStyle.color;
                        colors.push(color);
                    });
                    
                    // 简单的颜色分析
                    return colors[0] || '#000000';
                };
                
                const themeColor = detectThemeColor();
                
                // 添加增强的深色模式样式
                let style = document.getElementById('simple-enhanced-dark-style');
                if (!style) {
                    style = document.createElement('style');
                    style.id = 'simple-enhanced-dark-style';
                    document.head.appendChild(style);
                }
                style.textContent = `
                    /* 增强的深色模式 */
                    body {
                        background-color: #121212 !important;
                        color: #e0e0e0 !important;
                    }
                    
                    /* 智能适配元素 */
                    * {
                        color: inherit !important;
                        border-color: rgba(255,255,255,0.1) !important;
                    }
                    
                    /* 链接和交互元素 */
                    a, button, input, select, textarea {
                        color: #90caf9 !important;
                        background-color: rgba(255,255,255,0.05) !important;
                    }
                    
                    /* 卡片和容器 */
                    .card, .container, .panel, .box {
                        background-color: #1e1e1e !important;
                        border-color: #333 !important;
                    }
                    
                    /* 滚动条 */
                    ::-webkit-scrollbar {
                        width: 8px;
                        height: 8px;
                    }
                    
                    ::-webkit-scrollbar-track {
                        background: #121212;
                    }
                    
                    ::-webkit-scrollbar-thumb {
                        background: #333;
                        border-radius: 4px;
                    }
                    
                    ::-webkit-scrollbar-thumb:hover {
                        background: #555;
                    }
                `;
            } else {
                // 移除增强的深色模式样式
                const style = document.getElementById('simple-enhanced-dark-style');
                if (style) {
                    style.remove();
                }
            }
        },
        args: [enabled]
    });
}

// 检测网站原生主题并同步开关状态
function detectNativeTheme() {
    if (!currentTab) return;
    
    chrome.scripting.executeScript({
        target: { tabId: currentTab.id },
        func: () => {
            // 检测系统主题设置
            const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
            
            // 检测网页是否有原生深色模式
            const hasNativeDark = document.documentElement.classList.contains('dark') || 
                               document.body.classList.contains('dark') ||
                               getComputedStyle(document.body).backgroundColor.toLowerCase().includes('rgb(18, 18, 18)') ||
                               getComputedStyle(document.body).backgroundColor.toLowerCase().includes('rgb(26, 26, 26)');
            
            return { prefersDark, hasNativeDark };
        }
    }, (results) => {
        if (results && results[0] && results[0].result) {
            const { prefersDark, hasNativeDark } = results[0].result;
            const isDark = prefersDark || hasNativeDark;
            
            // 同步开关状态
            document.getElementById('dark-mode').checked = isDark;
            
            // 保存网站特定的主题状态
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                const currentTab = tabs[0];
                const url = currentTab?.url || '';
                const domain = new URL(url).hostname || '';
                
                if (domain) {
                    chrome.storage.local.get('siteSettings', (result) => {
                        const siteSettings = result.siteSettings || {};
                        if (!siteSettings[domain]) {
                            siteSettings[domain] = {};
                        }
                        siteSettings[domain].darkMode = isDark;
                        chrome.storage.local.set({ siteSettings });
                    });
                }
            });
        }
    });
}

// 调用初始化函数
init();