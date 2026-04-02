// Content script for Simple Dark Mode & Reader
// This script runs in the context of web pages

(function() {
    'use strict';
    
    // 上下文有效性校验 - 最顶部就判断，失效直接终止所有代码执行
    let isContextValid = true;
    try {
        chrome.runtime.id;
    } catch (e) {
        isContextValid = false;
    }
    
    if (!isContextValid) {
        console.log('Simple Dark Mode & Reader: 扩展上下文已失效，终止代码执行');
        return;
    }
    
    // 防止重复注入
    if (window.simpleDarkModeReaderInjected) {
        console.log('Simple Dark Mode & Reader: 脚本已注入，跳过执行');
        return;
    }
    window.simpleDarkModeReaderInjected = true;
    
    // 存储已应用的样式ID，避免重复注入
    const appliedStyles = new Set();
    
    // 存储当前设置，用于快速访问
    let currentSettings = {};
    
    // 防抖动计时器
    let debounceTimer = null;
    
    // 初始化标记
    let initialized = false;
    
    // 资源引用，用于清理
    let intervals = [];
    let observers = [];
    
    /**
     * 检查上下文是否有效
     * @returns {boolean} 上下文是否有效
     */
    function checkContextValid() {
        try {
            chrome.runtime.id;
            return true;
        } catch (e) {
            return false;
        }
    }
    
    /**
     * 安全地调用 chrome.storage.local.get
     * @param {string[]} keys 要获取的键
     * @param {function} callback 回调函数
     */
    function safeStorageGet(keys, callback) {
        try {
            if (!checkContextValid()) {
                console.log('Simple Dark Mode & Reader: 上下文已失效，跳过存储读取');
                callback({});
                return;
            }
            
            if (!chrome.storage || !chrome.storage.local) {
                console.log('Simple Dark Mode & Reader: chrome.storage 不可用，跳过存储读取');
                callback({});
                return;
            }
            
            chrome.storage.local.get(keys, (result) => {
                try {
                    if (chrome.runtime.lastError) {
                        console.error('Simple Dark Mode & Reader: 存储读取错误', chrome.runtime.lastError);
                        callback({});
                        return;
                    }
                    callback(result);
                } catch (error) {
                    console.error('Simple Dark Mode & Reader: 存储回调错误', error);
                    callback({});
                }
            });
        } catch (error) {
            console.error('Simple Dark Mode & Reader: 存储调用错误', error);
            callback({});
        }
    }
    
    /**
     * 安全地调用 chrome.storage.local.set
     * @param {Object} data 要保存的数据
     * @param {function} callback 回调函数
     */
    function safeStorageSet(data, callback) {
        try {
            if (!checkContextValid()) {
                console.log('Simple Dark Mode & Reader: 上下文已失效，跳过存储保存');
                if (callback) callback();
                return;
            }
            
            if (!chrome.storage || !chrome.storage.local) {
                console.log('Simple Dark Mode & Reader: chrome.storage 不可用，跳过存储保存');
                if (callback) callback();
                return;
            }
            
            chrome.storage.local.set(data, () => {
                try {
                    if (chrome.runtime.lastError) {
                        console.error('Simple Dark Mode & Reader: 存储保存错误', chrome.runtime.lastError);
                    }
                    if (callback) callback();
                } catch (error) {
                    console.error('Simple Dark Mode & Reader: 存储保存回调错误', error);
                    if (callback) callback();
                }
            });
        } catch (error) {
            console.error('Simple Dark Mode & Reader: 存储保存调用错误', error);
            if (callback) callback();
        }
    }
    
    /**
     * 初始化函数 - 页面加载后自动恢复所有功能
     */
    function initialize() {
        try {
            if (!checkContextValid()) {
                console.log('Simple Dark Mode & Reader: 上下文已失效，跳过初始化');
                return;
            }
            
            console.log('Simple Dark Mode & Reader: 开始初始化功能');
            
            const allSettings = [
                'darkMode', 'readerMode', 'fontSize', 'lineHeight', 'wordSpacing',
                'forceCopy', 'videoEnhance', 'smoothScroll', 'enhancedDark', 'darkModeLevel',
                'removeTracking', 'hideCookie', 'blockMediaPermission', 'antiFingerprint',
                'eyeCare', 'autoScroll', 'videoSpeed', 'skipAds', 'preventPause',
                'blockPopups', 'blockRefresh', 'blockGif', 'cleanPage', 'userAgent',
                'whitelist', 'siteSettings', 'allFeatures'
            ];
            
            safeStorageGet(allSettings, (result) => {
                try {
                    console.log('Simple Dark Mode & Reader: 恢复功能状态', result);
                    currentSettings = result;
                    
                    const domain = getCurrentDomain();
                    if (result.whitelist && result.whitelist.includes(domain)) {
                        console.log('Simple Dark Mode & Reader: 网站在白名单中，跳过功能应用');
                        initialized = true;
                        return;
                    }
                    
                    const siteSettings = result.siteSettings?.[domain] || {};
                    const effectiveSettings = {
                        ...result,
                        ...siteSettings
                    };
                    
                    applyAllSettings(effectiveSettings);
                    initialized = true;
                    
                    updateSidebarState();
                    checkDarkModeStatus();
                } catch (error) {
                    console.error('Simple Dark Mode & Reader: 初始化回调错误', error);
                    initialized = true;
                }
            });
        } catch (error) {
            console.error('Simple Dark Mode & Reader: 初始化错误', error);
            initialized = true;
        }
    }
    
    /**
     * 获取当前域名
     * @returns {string} 当前网站的域名
     */
    function getCurrentDomain() {
        try {
            return new URL(window.location.href).hostname;
        } catch (e) {
            console.error('Simple Dark Mode & Reader: 获取域名失败', e);
            return '';
        }
    }
    
    /**
     * 应用所有设置
     * @param {Object} settings 配置对象
     */
    function applyAllSettings(settings) {
        try {
            console.log('Simple Dark Mode & Reader: 应用所有设置', settings);
            
            const enableAll = settings.allFeatures || false;
            
            try {
                if (enableAll || settings.darkMode) {
                    applyDarkMode(settings.darkModeLevel || 'standard');
                } else {
                    removeStyle('simple-dark-mode');
                }
            } catch (e) {
                console.error('Simple Dark Mode & Reader: 深色模式错误', e);
            }
            
            try {
                if (enableAll || settings.cleanPage) {
                    applyCleanPage();
                } else {
                    removeStyle('simple-clean-page');
                }
            } catch (e) {
                console.error('Simple Dark Mode & Reader: 页面净化错误', e);
            }
            
            try {
                if (enableAll || settings.forceCopy) {
                    applyForceCopy();
                } else {
                    removeStyle('simple-force-copy');
                }
            } catch (e) {
                console.error('Simple Dark Mode & Reader: 解除复制错误', e);
            }
            
            try {
                if (enableAll || settings.eyeCare) {
                    applyEyeCare();
                } else {
                    removeStyle('simple-eye-care');
                }
            } catch (e) {
                console.error('Simple Dark Mode & Reader: 护眼模式错误', e);
            }
            
            try {
                if (enableAll || settings.smoothScroll) {
                    applySmoothScroll();
                } else {
                    if (document.documentElement) {
                        document.documentElement.style.scrollBehavior = 'auto';
                    }
                }
            } catch (e) {
                console.error('Simple Dark Mode & Reader: 平滑滚动错误', e);
            }
            
            try {
                if (enableAll || settings.videoEnhance) {
                    applyVideoEnhance();
                }
            } catch (e) {
                console.error('Simple Dark Mode & Reader: 视频增强错误', e);
            }
            
            try {
                if (enableAll || settings.enhancedDark) {
                    applyEnhancedDark();
                } else {
                    removeStyle('simple-enhanced-dark');
                }
            } catch (e) {
                console.error('Simple Dark Mode & Reader: 深色增强错误', e);
            }
            
            try {
                if (enableAll || settings.readerMode) {
                    applyReaderMode();
                } else {
                    removeStyle('simple-reader-mode');
                }
            } catch (e) {
                console.error('Simple Dark Mode & Reader: 阅读模式错误', e);
            }
            
            try {
                if (settings.fontSize || settings.lineHeight || settings.wordSpacing) {
                    applyTextStyle(settings.fontSize, settings.lineHeight, settings.wordSpacing);
                } else {
                    removeStyle('simple-text-style');
                }
            } catch (e) {
                console.error('Simple Dark Mode & Reader: 文本样式错误', e);
            }
            
            try {
                if (enableAll || settings.autoScroll) {
                    applyAutoScroll();
                } else if (window.simpleAutoScrollInterval) {
                    clearInterval(window.simpleAutoScrollInterval);
                    window.simpleAutoScrollInterval = null;
                }
            } catch (e) {
                console.error('Simple Dark Mode & Reader: 自动滚屏错误', e);
            }
            
            try {
                if (settings.videoSpeed && settings.videoSpeed !== 1.0) {
                    applyVideoSpeed(settings.videoSpeed);
                }
            } catch (e) {
                console.error('Simple Dark Mode & Reader: 视频倍速错误', e);
            }
            
            try {
                if (enableAll || settings.skipAds) {
                    applySkipAds();
                }
            } catch (e) {
                console.error('Simple Dark Mode & Reader: 跳过广告错误', e);
            }
            
            try {
                if (enableAll || settings.preventPause) {
                    applyPreventPause();
                }
            } catch (e) {
                console.error('Simple Dark Mode & Reader: 禁止暂停错误', e);
            }
            
            try {
                if (enableAll || settings.removeTracking) {
                    removeTrackingParams();
                }
            } catch (e) {
                console.error('Simple Dark Mode & Reader: 清除跟踪参数错误', e);
            }
            
            try {
                if (enableAll || settings.hideCookie) {
                    applyHideCookie();
                } else {
                    removeStyle('simple-hide-cookie');
                }
            } catch (e) {
                console.error('Simple Dark Mode & Reader: 隐藏Cookie错误', e);
            }
            
            try {
                if (enableAll || settings.blockMediaPermission) {
                    applyBlockMediaPermission();
                }
            } catch (e) {
                console.error('Simple Dark Mode & Reader: 禁止媒体权限错误', e);
            }
            
            try {
                if (enableAll || settings.antiFingerprint) {
                    applyAntiFingerprint();
                }
            } catch (e) {
                console.error('Simple Dark Mode & Reader: 防指纹追踪错误', e);
            }
            
            try {
                if (enableAll || settings.blockPopups) {
                    applyBlockPopups();
                }
            } catch (e) {
                console.error('Simple Dark Mode & Reader: 屏蔽弹窗错误', e);
            }
            
            try {
                if (enableAll || settings.blockRefresh) {
                    applyBlockRefresh();
                }
            } catch (e) {
                console.error('Simple Dark Mode & Reader: 禁止刷新错误', e);
            }
            
            try {
                if (enableAll || settings.blockGif) {
                    applyBlockGif();
                } else {
                    removeStyle('simple-block-gif');
                }
            } catch (e) {
                console.error('Simple Dark Mode & Reader: 关闭GIF错误', e);
            }
            
            try {
                if (settings.userAgent && settings.userAgent !== 'default') {
                    applyUserAgent(settings.userAgent);
                }
            } catch (e) {
                console.error('Simple Dark Mode & Reader: 切换UA错误', e);
            }
            
            console.log('Simple Dark Mode & Reader: 所有设置已应用');
        } catch (error) {
            console.error('Simple Dark Mode & Reader: 应用设置时出错', error);
        }
    }
    
    /**
     * 注入或更新样式
     * @param {string} id 样式ID
     * @param {string} css CSS内容
     */
    function injectStyle(id, css) {
        try {
            if (!document || !document.head) {
                setTimeout(() => injectStyle(id, css), 100);
                return;
            }
            
            if (appliedStyles.has(id)) {
                const existing = document.getElementById(id);
                if (existing) {
                    existing.textContent = css;
                    return;
                }
            }
            
            const style = document.createElement('style');
            style.id = id;
            style.textContent = css;
            document.head.appendChild(style);
            appliedStyles.add(id);
        } catch (error) {
            console.error('Simple Dark Mode & Reader: 注入样式时出错', error);
        }
    }
    
    /**
     * 移除样式
     * @param {string} id 样式ID
     */
    function removeStyle(id) {
        try {
            if (!document) return;
            const style = document.getElementById(id);
            if (style) {
                style.remove();
                appliedStyles.delete(id);
            }
        } catch (error) {
            console.error('Simple Dark Mode & Reader: 移除样式时出错', error);
        }
    }
    
    /**
     * 应用深色模式
     * @param {string} level 深色模式级别
     */
    function applyDarkMode(level = 'standard') {
        try {
            let colors;
            switch (level) {
                case 'pure-black':
                    colors = { bg: '#000000', surface: '#121212', text: '#e0e0e0', border: '#333' };
                    break;
                case 'soft':
                    colors = { bg: '#2d2d2d', surface: '#3d3d3d', text: '#f5f5f5', border: '#4d4d4d' };
                    break;
                default:
                    colors = { bg: '#1a1a1a', surface: '#2d2d2d', text: '#e0e0e0', border: '#333' };
            }
            
            const css = `
                html, body { 
                    background: ${colors.bg} !important; 
                    color: ${colors.text} !important; 
                }
                * { 
                    background-color: ${colors.surface} !important; 
                    color: ${colors.text} !important; 
                    border-color: ${colors.border} !important; 
                }
                a { color: #90caf9 !important; }
                a:hover { color: #64b5f6 !important; }
                img, video, iframe { 
                    background: transparent !important; 
                    opacity: 0.9 !important;
                }
                input, textarea, select, button {
                    background-color: ${colors.surface} !important;
                    color: ${colors.text} !important;
                    border: 1px solid ${colors.border} !important;
                }
            `;
            
            injectStyle('simple-dark-mode', css);
        } catch (error) {
            console.error('Simple Dark Mode & Reader: 应用深色模式错误', error);
        }
    }
    
    /**
     * 应用深色增强
     */
    function applyEnhancedDark() {
        try {
            const css = `
                body { 
                    filter: brightness(0.9) contrast(1.1) !important; 
                }
                img, video { 
                    filter: brightness(0.85) !important; 
                }
            `;
            injectStyle('simple-enhanced-dark', css);
        } catch (error) {
            console.error('Simple Dark Mode & Reader: 应用深色增强错误', error);
        }
    }
    
    /**
     * 应用护眼模式
     */
    function applyEyeCare() {
        try {
            const css = `
                html, body { 
                    background: #f5f0e1 !important; 
                }
                * { 
                    background-color: #f5f0e1 !important; 
                    color: #5c4b37 !important; 
                }
                a { color: #8b6914 !important; }
                a:hover { color: #6b4e0a !important; }
                img, video { background: transparent !important; }
            `;
            injectStyle('simple-eye-care', css);
        } catch (error) {
            console.error('Simple Dark Mode & Reader: 应用护眼模式错误', error);
        }
    }
    
    /**
     * 应用阅读模式
     */
    function applyReaderMode() {
        try {
            const css = `
                .ad, .ads, .advertisement, .banner, 
                .sidebar, .widget, .social, .share, 
                .comment, .related, .promotion, 
                .popup, .modal, .overlay, .dialog,
                .cookie-banner, .consent-banner, .gdpr-banner,
                .newsletter, .subscribe, .mailchimp,
                .float-btn, .floating-button, .back-to-top {
                    display: none !important;
                    visibility: hidden !important;
                    opacity: 0 !important;
                }
                .content, article, .article, .post, 
                .entry-content, .main-content, main {
                    max-width: 800px !important;
                    margin: 0 auto !important;
                    padding: 20px !important;
                }
            `;
            injectStyle('simple-reader-mode', css);
        } catch (error) {
            console.error('Simple Dark Mode & Reader: 应用阅读模式错误', error);
        }
    }
    
    /**
     * 应用文本样式
     * @param {number} fontSize 字体大小
     * @param {number} lineHeight 行高
     * @param {number} wordSpacing 字间距
     */
    function applyTextStyle(fontSize, lineHeight, wordSpacing) {
        try {
            const fs = fontSize || 16;
            const lh = lineHeight || 1.6;
            const ws = wordSpacing || 0;
            
            const css = `
                body { 
                    font-size: ${fs}px !important; 
                    line-height: ${lh} !important; 
                    word-spacing: ${ws}px !important;
                }
                p, div, span, li, td, th {
                    font-size: ${fs}px !important;
                    line-height: ${lh} !important;
                }
                h1 { font-size: ${fs * 2}px !important; }
                h2 { font-size: ${fs * 1.5}px !important; }
                h3 { font-size: ${fs * 1.2}px !important; }
            `;
            injectStyle('simple-text-style', css);
        } catch (error) {
            console.error('Simple Dark Mode & Reader: 应用文本样式错误', error);
        }
    }
    
    /**
     * 应用强制复制
     */
    function applyForceCopy() {
        try {
            ['copy', 'cut', 'paste', 'contextmenu', 'selectstart', 'dragstart'].forEach(event => {
                document.addEventListener(event, e => {
                    e.stopPropagation();
                }, true);
            });
            
            const css = `
                * { 
                    user-select: text !important; 
                    -webkit-user-select: text !important;
                    -moz-user-select: text !important;
                    -ms-user-select: text !important;
                }
            `;
            injectStyle('simple-force-copy', css);
        } catch (error) {
            console.error('Simple Dark Mode & Reader: 应用强制复制错误', error);
        }
    }
    
    /**
     * 应用平滑滚动
     */
    function applySmoothScroll() {
        try {
            if (document.documentElement) {
                document.documentElement.style.scrollBehavior = 'smooth';
            }
        } catch (error) {
            console.error('Simple Dark Mode & Reader: 应用平滑滚动错误', error);
        }
    }
    
    /**
     * 应用自动滚屏
     */
    function applyAutoScroll() {
        try {
            if (window.simpleAutoScrollInterval) {
                clearInterval(window.simpleAutoScrollInterval);
            }
            window.simpleAutoScrollInterval = setInterval(() => {
                window.scrollBy(0, 1);
            }, 50);
            intervals.push(window.simpleAutoScrollInterval);
        } catch (error) {
            console.error('Simple Dark Mode & Reader: 应用自动滚屏错误', error);
        }
    }
    
    /**
     * 应用视频增强
     */
    function applyVideoEnhance() {
        try {
            const videos = document.querySelectorAll('video');
            videos.forEach(video => {
                video.controls = true;
                video.setAttribute('controlsList', 'nodownload');
            });
            
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    mutation.addedNodes.forEach((node) => {
                        if (node.tagName === 'VIDEO') {
                            node.controls = true;
                            node.setAttribute('controlsList', 'nodownload');
                        }
                    });
                });
            });
            observer.observe(document.body, { childList: true, subtree: true });
            observers.push(observer);
        } catch (error) {
            console.error('Simple Dark Mode & Reader: 应用视频增强错误', error);
        }
    }
    
    /**
     * 应用视频倍速
     * @param {number} speed 播放速度
     */
    function applyVideoSpeed(speed) {
        try {
            document.querySelectorAll('video').forEach(v => {
                v.playbackRate = speed;
            });
            
            const observer = new MutationObserver(() => {
                document.querySelectorAll('video').forEach(v => {
                    if (v.playbackRate !== speed) {
                        v.playbackRate = speed;
                    }
                });
            });
            observer.observe(document.body, { childList: true, subtree: true });
            observers.push(observer);
        } catch (error) {
            console.error('Simple Dark Mode & Reader: 应用视频倍速错误', error);
        }
    }
    
    /**
     * 应用跳过广告
     */
    function applySkipAds() {
        try {
            const skipAds = () => {
                document.querySelectorAll('.ad, .ads, .advertisement, [class*="ad-"], [id*="ad-"]').forEach(el => el.remove());
                document.querySelectorAll('video').forEach(v => {
                    if (v.currentTime < 5 && v.duration > 10) {
                        v.currentTime = 5;
                    }
                });
            };
            
            skipAds();
            const interval = setInterval(skipAds, 3000);
            intervals.push(interval);
        } catch (error) {
            console.error('Simple Dark Mode & Reader: 应用跳过广告错误', error);
        }
    }
    
    /**
     * 应用禁止自动暂停
     */
    function applyPreventPause() {
        try {
            document.querySelectorAll('video').forEach(video => {
                video.addEventListener('pause', () => {
                    if (!video.ended) {
                        video.play();
                    }
                }, true);
            });
        } catch (error) {
            console.error('Simple Dark Mode & Reader: 应用禁止自动暂停错误', error);
        }
    }
    
    /**
     * 清除跟踪参数
     */
    function removeTrackingParams() {
        try {
            const url = new URL(window.location.href);
            const trackingParams = [
                'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
                'fbclid', 'gclid', 'msclkid', 'mc_eid', 'utm_id'
            ];
            
            let changed = false;
            trackingParams.forEach(param => {
                if (url.searchParams.has(param)) {
                    url.searchParams.delete(param);
                    changed = true;
                }
            });
            
            if (changed) {
                window.history.replaceState({}, '', url);
            }
        } catch (error) {
            console.error('Simple Dark Mode & Reader: 清除跟踪参数错误', error);
        }
    }
    
    /**
     * 应用隐藏Cookie提示
     */
    function applyHideCookie() {
        try {
            const css = `
                .cookie-banner, .cookie-consent, .cookie-notice, 
                .consent-banner, .gdpr-banner, .privacy-banner,
                .cookie-popup, .cookie-dialog, .cookie-overlay {
                    display: none !important;
                    visibility: hidden !important;
                    opacity: 0 !important;
                }
            `;
            injectStyle('simple-hide-cookie', css);
        } catch (error) {
            console.error('Simple Dark Mode & Reader: 应用隐藏Cookie错误', error);
        }
    }
    
    /**
     * 应用禁止媒体权限
     */
    function applyBlockMediaPermission() {
        try {
            if (navigator.mediaDevices) {
                navigator.mediaDevices.getUserMedia = () => {
                    return Promise.reject(new Error('Media permission blocked'));
                };
                navigator.mediaDevices.enumerateDevices = () => {
                    return Promise.resolve([]);
                };
            }
        } catch (error) {
            console.error('Simple Dark Mode & Reader: 应用禁止媒体权限错误', error);
        }
    }
    
    /**
     * 应用防指纹追踪
     */
    function applyAntiFingerprint() {
        try {
            if (!Object.getOwnPropertyDescriptor(navigator, 'webdriver')) {
                Object.defineProperty(navigator, 'webdriver', {
                    get: () => false,
                    configurable: true
                });
            }
            
            if (!Object.getOwnPropertyDescriptor(navigator, 'plugins')) {
                Object.defineProperty(navigator, 'plugins', {
                    get: () => [1, 2, 3, 4, 5],
                    configurable: true
                });
            }
            
            if (!Object.getOwnPropertyDescriptor(navigator, 'languages')) {
                Object.defineProperty(navigator, 'languages', {
                    get: () => ['zh-CN', 'zh', 'en'],
                    configurable: true
                });
            }
        } catch (error) {
            console.error('Simple Dark Mode & Reader: 应用防指纹追踪错误', error);
        }
    }
    
    /**
     * 应用页面净化
     */
    function applyCleanPage() {
        try {
            const css = `
                .ad, .ads, .advertisement, .promotion,
                .popup, .modal, .overlay, .dialog, .lightbox,
                .sidebar, .widget, .qr-code, .qrcode,
                .floating-button, .float-btn, .back-to-top,
                .share-buttons, .social-share, .wechat-qrcode {
                    display: none !important;
                    visibility: hidden !important;
                    opacity: 0 !important;
                }
            `;
            injectStyle('simple-clean-page', css);
        } catch (error) {
            console.error('Simple Dark Mode & Reader: 应用页面净化错误', error);
        }
    }
    
    /**
     * 应用屏蔽弹窗
     */
    function applyBlockPopups() {
        try {
            window.open = () => null;
            window.alert = () => null;
            window.confirm = () => true;
            window.prompt = () => null;
        } catch (error) {
            console.error('Simple Dark Mode & Reader: 应用屏蔽弹窗错误', error);
        }
    }
    
    /**
     * 应用禁止自动刷新
     */
    function applyBlockRefresh() {
        try {
            const meta = document.querySelector('meta[http-equiv="refresh"]');
            if (meta) meta.remove();
            
            Object.defineProperty(window.location, 'reload', {
                value: () => {}
            });
            
            const originalSetInterval = window.setInterval;
            window.setInterval = function(fn, delay) {
                if (delay < 5000 && typeof fn === 'string' && fn.includes('location')) {
                    return null;
                }
                return originalSetInterval.apply(this, arguments);
            };
        } catch (error) {
            console.error('Simple Dark Mode & Reader: 应用禁止自动刷新错误', error);
        }
    }
    
    /**
     * 应用关闭GIF动画
     */
    function applyBlockGif() {
        try {
            const css = `
                img[src*=".gif"], img[src*=".GIF"] {
                    display: none !important;
                    visibility: hidden !important;
                }
            `;
            injectStyle('simple-block-gif', css);
            
            document.querySelectorAll('img[src*=".gif"]').forEach(img => {
                try {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);
                    img.src = canvas.toDataURL('image/png');
                } catch (e) {
                    // 忽略单个图片处理错误
                }
            });
        } catch (error) {
            console.error('Simple Dark Mode & Reader: 应用关闭GIF动画错误', error);
        }
    }
    
    /**
     * 应用切换UA
     * @param {string} type UA类型
     */
    function applyUserAgent(type) {
        try {
            const uas = {
                mobile: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15A372 Safari/604.1',
                desktop: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            };
            
            if (uas[type]) {
                Object.defineProperty(navigator, 'userAgent', {
                    get: () => uas[type],
                    configurable: true
                });
                Object.defineProperty(navigator, 'platform', {
                    get: () => type === 'mobile' ? 'iPhone' : 'Win32',
                    configurable: true
                });
            }
        } catch (error) {
            console.error('Simple Dark Mode & Reader: 应用切换UA错误', error);
        }
    }
    
    /**
     * 防抖动初始化
     */
    function debouncedInitialize() {
        try {
            if (debounceTimer) {
                clearTimeout(debounceTimer);
            }
            debounceTimer = setTimeout(() => {
                initialized = false;
                initialize();
            }, 200);
        } catch (error) {
            console.error('Simple Dark Mode & Reader: 防抖动初始化错误', error);
        }
    }
    
    // 立即执行初始化
    console.log('Simple Dark Mode & Reader: 开始初始化');
    initialize();
    
    // 页面加载完成后再次初始化
    window.addEventListener('load', () => {
        console.log('Simple Dark Mode & Reader: 页面完全加载，重新应用设置');
        initialized = false;
        initialize();
    });
    
    // 监听页面变化（SPA应用）
    let lastUrl = location.href;
    let lastBodyHash = '';
    
    function getBodyHash() {
        return document.body ? document.body.innerHTML.substring(0, 1000) : '';
    }
    
    const pageObserver = new MutationObserver(() => {
        try {
            const url = location.href;
            if (url !== lastUrl) {
                lastUrl = url;
                console.log('Simple Dark Mode & Reader: 页面URL变化，重新应用设置');
                debouncedInitialize();
                return;
            }
            
            const currentBodyHash = getBodyHash();
            if (currentBodyHash !== lastBodyHash && currentBodyHash.length > 0) {
                lastBodyHash = currentBodyHash;
                console.log('Simple Dark Mode & Reader: 页面内容变化，重新应用设置');
                debouncedInitialize();
            }
        } catch (error) {
            console.error('Simple Dark Mode & Reader: 监听页面变化时出错', error);
        }
    });
    
    pageObserver.observe(document, {
        subtree: true, 
        childList: true,
        characterData: true
    });
    observers.push(pageObserver);
    
    // 监听存储变化
    try {
        if (checkContextValid()) {
            chrome.storage.onChanged.addListener((changes, namespace) => {
                try {
                    if (!checkContextValid()) return;
                    if (namespace === 'local') {
                        console.log('Simple Dark Mode & Reader: 设置已更改，重新应用', changes);
                        initialized = false;
                        initialize();
                    }
                } catch (error) {
                    console.error('Simple Dark Mode & Reader: 存储变化监听错误', error);
                }
            });
        }
    } catch (error) {
        console.error('Simple Dark Mode & Reader: 添加存储监听错误', error);
    }
    
    // 监听历史记录变化
    window.addEventListener('popstate', () => {
        console.log('Simple Dark Mode & Reader: 历史记录变化，重新应用设置');
        debouncedInitialize();
    });
    
    // 监听页面卸载事件，清理资源
    window.addEventListener('beforeunload', () => {
        console.log('Simple Dark Mode & Reader: 页面即将卸载，清理资源');
        cleanupResources();
    });
    
    /**
     * 清理所有资源
     */
    function cleanupResources() {
        try {
            // 清理所有定时器
            intervals.forEach(interval => {
                try {
                    clearInterval(interval);
                } catch (e) {}
            });
            intervals = [];
            
            // 清理所有观察器
            observers.forEach(observer => {
                try {
                    observer.disconnect();
                } catch (e) {}
            });
            observers = [];
            
            // 清理防抖动定时器
            if (debounceTimer) {
                try {
                    clearTimeout(debounceTimer);
                    debounceTimer = null;
                } catch (e) {}
            }
            
            // 清理自动滚屏定时器
            if (window.simpleAutoScrollInterval) {
                try {
                    clearInterval(window.simpleAutoScrollInterval);
                    window.simpleAutoScrollInterval = null;
                } catch (e) {}
            }
            
            console.log('Simple Dark Mode & Reader: 资源清理完成');
        } catch (error) {
            console.error('Simple Dark Mode & Reader: 清理资源错误', error);
        }
    }
    
    // 定期检查并重新应用设置
    const checkInterval = setInterval(() => {
        try {
            if (!checkContextValid()) {
                clearInterval(checkInterval);
                return;
            }
            
            if (initialized) {
                const domain = getCurrentDomain();
                if (currentSettings.whitelist && currentSettings.whitelist.includes(domain)) {
                    return;
                }
                const siteSettings = currentSettings.siteSettings?.[domain] || {};
                const effectiveSettings = {
                    ...currentSettings,
                    ...siteSettings
                };
                applyAllSettings(effectiveSettings);
            }
        } catch (error) {
            console.error('Simple Dark Mode & Reader: 定期检查错误', error);
        }
    }, 5000);
    intervals.push(checkInterval);
    
    // 监听来自 popup 或 background 的消息
    try {
        if (checkContextValid()) {
            chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
                try {
                    if (!checkContextValid()) {
                        sendResponse({ error: 'Context invalidated' });
                        return true;
                    }
                    
                    switch (request.action) {
                        case 'reapplySettings':
                            console.log('Simple Dark Mode & Reader: 收到重新应用设置请求');
                            initialized = false;
                            initialize();
                            sendResponse({ success: true });
                            break;
                            
                        case 'detectNativeTheme':
                            console.log('Simple Dark Mode & Reader: 检测原生主题');
                            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                            const hasNativeDark = document.documentElement.classList.contains('dark') || 
                                                document.body.classList.contains('dark');
                            sendResponse({ prefersDark, hasNativeDark });
                            break;
                            
                        case 'exportPDF':
                            console.log('Simple Dark Mode & Reader: 导出PDF');
                            try {
                                window.print();
                                sendResponse({ success: true });
                            } catch (e) {
                                sendResponse({ success: false, error: e.message });
                            }
                            break;
                            
                        case 'settingsChanged':
                            console.log('Simple Dark Mode & Reader: 设置已更改', request.changes);
                            initialized = false;
                            initialize();
                            sendResponse({ success: true });
                            break;
                            
                        default:
                            console.log('Simple Dark Mode & Reader: 未知消息', request);
                            sendResponse({ error: 'Unknown action' });
                    }
                } catch (error) {
                    console.error('Simple Dark Mode & Reader: 消息处理错误', error);
                    sendResponse({ error: error.message });
                }
                return true;
            });
        }
    } catch (error) {
        console.error('Simple Dark Mode & Reader: 添加消息监听错误', error);
    }
    
    console.log('Simple Dark Mode & Reader: Content script 已加载，准备恢复功能状态');
    
    // ==================== 侧边栏功能 ====================
    
    /**
     * 创建右侧悬浮侧边栏
     */
    function createSidebar() {
        try {
            if (!checkContextValid()) return;
            if (document.getElementById('simple-dark-mode-sidebar')) return;
            
            const sidebar = document.createElement('div');
            sidebar.id = 'simple-dark-mode-sidebar';
            sidebar.className = 'simple-sidebar';
            
            sidebar.innerHTML = `
                <div class="simple-sidebar-toggle">
                    <span class="simple-sidebar-icon">⚙️</span>
                </div>
                <div class="simple-sidebar-content">
                    <h3 class="simple-sidebar-title">AdGuard Dev Tool</h3>
                    
                    <div class="simple-sidebar-section">
                        <h4 class="simple-section-title">深色模式</h4>
                        <div class="simple-section-content">
                            <div class="simple-toggle-item">
                                <label>深色模式</label>
                                <label class="simple-toggle">
                                    <input type="checkbox" id="darkMode-toggle">
                                    <span class="simple-toggle-slider"></span>
                                </label>
                            </div>
                            <div class="simple-toggle-item">
                                <label>深色增强</label>
                                <label class="simple-toggle">
                                    <input type="checkbox" id="enhancedDark-toggle">
                                    <span class="simple-toggle-slider"></span>
                                </label>
                            </div>
                            <div class="simple-toggle-item">
                                <label>护眼模式</label>
                                <label class="simple-toggle">
                                    <input type="checkbox" id="eyeCare-toggle">
                                    <span class="simple-toggle-slider"></span>
                                </label>
                            </div>
                        </div>
                    </div>
                    
                    <div class="simple-sidebar-section">
                        <h4 class="simple-section-title">阅读净化</h4>
                        <div class="simple-section-content">
                            <div class="simple-toggle-item">
                                <label>阅读模式</label>
                                <label class="simple-toggle">
                                    <input type="checkbox" id="readerMode-toggle">
                                    <span class="simple-toggle-slider"></span>
                                </label>
                            </div>
                            <div class="simple-toggle-item">
                                <label>页面净化</label>
                                <label class="simple-toggle">
                                    <input type="checkbox" id="cleanPage-toggle">
                                    <span class="simple-toggle-slider"></span>
                                </label>
                            </div>
                            <div class="simple-toggle-item">
                                <label>解除复制</label>
                                <label class="simple-toggle">
                                    <input type="checkbox" id="forceCopy-toggle">
                                    <span class="simple-toggle-slider"></span>
                                </label>
                            </div>
                        </div>
                    </div>
                    
                    <div class="simple-sidebar-section">
                        <h4 class="simple-section-title">视频工具</h4>
                        <div class="simple-section-content">
                            <div class="simple-toggle-item">
                                <label>视频增强</label>
                                <label class="simple-toggle">
                                    <input type="checkbox" id="videoEnhance-toggle">
                                    <span class="simple-toggle-slider"></span>
                                </label>
                            </div>
                            <div class="simple-toggle-item">
                                <label>禁止自动暂停</label>
                                <label class="simple-toggle">
                                    <input type="checkbox" id="preventPause-toggle">
                                    <span class="simple-toggle-slider"></span>
                                </label>
                            </div>
                            <div class="simple-toggle-item">
                                <label>跳过广告</label>
                                <label class="simple-toggle">
                                    <input type="checkbox" id="skipAds-toggle">
                                    <span class="simple-toggle-slider"></span>
                                </label>
                            </div>
                        </div>
                    </div>
                    
                    <div class="simple-sidebar-section">
                        <h4 class="simple-section-title">隐私安全</h4>
                        <div class="simple-section-content">
                            <div class="simple-toggle-item">
                                <label>清除跟踪参数</label>
                                <label class="simple-toggle">
                                    <input type="checkbox" id="removeTracking-toggle">
                                    <span class="simple-toggle-slider"></span>
                                </label>
                            </div>
                            <div class="simple-toggle-item">
                                <label>隐藏Cookie提示</label>
                                <label class="simple-toggle">
                                    <input type="checkbox" id="hideCookie-toggle">
                                    <span class="simple-toggle-slider"></span>
                                </label>
                            </div>
                            <div class="simple-toggle-item">
                                <label>防指纹追踪</label>
                                <label class="simple-toggle">
                                    <input type="checkbox" id="antiFingerprint-toggle">
                                    <span class="simple-toggle-slider"></span>
                                </label>
                            </div>
                            <div class="simple-toggle-item">
                                <label>禁止媒体权限</label>
                                <label class="simple-toggle">
                                    <input type="checkbox" id="blockMediaPermission-toggle">
                                    <span class="simple-toggle-slider"></span>
                                </label>
                            </div>
                        </div>
                    </div>
                    
                    <div class="simple-sidebar-section">
                        <h4 class="simple-section-title">实用工具</h4>
                        <div class="simple-section-content">
                            <div class="simple-toggle-item">
                                <label>平滑滚动</label>
                                <label class="simple-toggle">
                                    <input type="checkbox" id="smoothScroll-toggle">
                                    <span class="simple-toggle-slider"></span>
                                </label>
                            </div>
                            <div class="simple-toggle-item">
                                <label>自动滚屏</label>
                                <label class="simple-toggle">
                                    <input type="checkbox" id="autoScroll-toggle">
                                    <span class="simple-toggle-slider"></span>
                                </label>
                            </div>
                            <div class="simple-toggle-item">
                                <label>屏蔽弹窗</label>
                                <label class="simple-toggle">
                                    <input type="checkbox" id="blockPopups-toggle">
                                    <span class="simple-toggle-slider"></span>
                                </label>
                            </div>
                            <div class="simple-toggle-item">
                                <label>禁止自动刷新</label>
                                <label class="simple-toggle">
                                    <input type="checkbox" id="blockRefresh-toggle">
                                    <span class="simple-toggle-slider"></span>
                                </label>
                            </div>
                            <div class="simple-toggle-item">
                                <label>关闭GIF动画</label>
                                <label class="simple-toggle">
                                    <input type="checkbox" id="blockGif-toggle">
                                    <span class="simple-toggle-slider"></span>
                                </label>
                            </div>
                        </div>
                    </div>
                    
                    <div class="simple-sidebar-section">
                        <h4 class="simple-section-title">AdGuard 集成</h4>
                        <div class="simple-section-content">
                            <div class="simple-disabled-item">
                                <label>AdGuard 集成</label>
                                <span class="simple-disabled-label">未实现</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            const sidebarCss = `
                .simple-sidebar {
                    position: fixed;
                    right: 0;
                    top: 50%;
                    transform: translateY(-50%) translateX(100%);
                    z-index: 999999;
                    font-family: Arial, sans-serif;
                    transition: all 0.3s ease;
                    overflow: hidden;
                    width: 300px;
                }
                
                .simple-sidebar.expanded {
                    transform: translateY(-50%) translateX(0);
                }
                
                .simple-sidebar-toggle {
                    position: fixed;
                    top: 50%;
                    transform: translateY(-50%);
                    width: 40px;
                    height: 40px;
                    background: #4CAF50;
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    border-radius: 8px 0 0 8px;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
                    transition: all 0.3s ease;
                    z-index: 999999;
                    right: 0;
                }
                
                .simple-sidebar.expanded .simple-sidebar-toggle {
                    right: 300px;
                }
                
                .simple-sidebar-toggle:hover {
                    background: #45a049;
                }
                
                .simple-sidebar-content {
                    width: 300px;
                    max-height: 80vh;
                    overflow-y: auto;
                    background: white;
                    color: #333;
                    border-radius: 8px 0 0 8px;
                    box-shadow: -2px 0 10px rgba(0,0,0,0.1);
                    padding: 20px;
                }
                
                .simple-sidebar-title {
                    margin: 0 0 20px 0;
                    font-size: 18px;
                    font-weight: bold;
                    color: #333;
                    text-align: center;
                }
                
                .simple-sidebar-section {
                    margin-bottom: 20px;
                    padding-bottom: 15px;
                    border-bottom: 1px solid #eee;
                }
                
                .simple-section-title {
                    margin: 0 0 10px 0;
                    font-size: 14px;
                    font-weight: bold;
                    color: #666;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                
                .simple-section-content {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }
                
                .simple-toggle-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 8px 0;
                }
                
                .simple-toggle-item label {
                    font-size: 14px;
                    color: #333;
                    cursor: pointer;
                }
                
                .simple-toggle {
                    position: relative;
                    display: inline-block;
                    width: 48px;
                    height: 24px;
                }
                
                .simple-toggle input {
                    opacity: 0;
                    width: 0;
                    height: 0;
                }
                
                .simple-toggle-slider {
                    position: absolute;
                    cursor: pointer;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: #ccc;
                    transition: .4s;
                    border-radius: 24px;
                }
                
                .simple-toggle-slider:before {
                    position: absolute;
                    content: "";
                    height: 18px;
                    width: 18px;
                    left: 3px;
                    bottom: 3px;
                    background-color: white;
                    transition: .4s;
                    border-radius: 50%;
                }
                
                input:checked + .simple-toggle-slider {
                    background-color: #4CAF50;
                }
                
                input:checked + .simple-toggle-slider:before {
                    transform: translateX(24px);
                }
                
                .simple-disabled-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 8px 0;
                    opacity: 0.6;
                }
                
                .simple-disabled-label {
                    font-size: 12px;
                    color: #999;
                    background: #f0f0f0;
                    padding: 2px 8px;
                    border-radius: 10px;
                }
                
                body.simple-dark-mode-active .simple-sidebar-content {
                    background: #2d2d2d;
                    color: #e0e0e0;
                }
                
                body.simple-dark-mode-active .simple-sidebar-title {
                    color: #e0e0e0;
                }
                
                body.simple-dark-mode-active .simple-section-title {
                    color: #aaa;
                }
                
                body.simple-dark-mode-active .simple-toggle-item label {
                    color: #e0e0e0;
                }
                
                body.simple-dark-mode-active .simple-sidebar-section {
                    border-bottom-color: #444;
                }
            `;
            
            injectStyle('simple-sidebar-style', sidebarCss);
            document.body.appendChild(sidebar);
            
            const toggle = sidebar.querySelector('.simple-sidebar-toggle');
            toggle.addEventListener('click', () => {
                sidebar.classList.toggle('expanded');
            });
            
            updateSidebarState();
            bindSidebarEvents();
            
        } catch (error) {
            console.error('Simple Dark Mode & Reader: 创建侧边栏时出错', error);
        }
    }
    
    /**
     * 更新侧边栏状态
     */
    function updateSidebarState() {
        try {
            if (!checkContextValid()) return;
            
            const allSettings = [
                'darkMode', 'enhancedDark', 'eyeCare', 'readerMode', 'cleanPage', 'forceCopy',
                'videoEnhance', 'preventPause', 'skipAds', 'removeTracking', 'hideCookie',
                'antiFingerprint', 'blockMediaPermission', 'smoothScroll', 'autoScroll',
                'blockPopups', 'blockRefresh', 'blockGif'
            ];
            
            safeStorageGet(allSettings, (result) => {
                try {
                    allSettings.forEach(setting => {
                        const toggle = document.getElementById(`${setting}-toggle`);
                        if (toggle) {
                            toggle.checked = result[setting] || false;
                        }
                    });
                } catch (error) {
                    console.error('Simple Dark Mode & Reader: 更新侧边栏状态回调错误', error);
                }
            });
        } catch (error) {
            console.error('Simple Dark Mode & Reader: 更新侧边栏状态时出错', error);
        }
    }
    
    /**
     * 绑定侧边栏事件
     */
    function bindSidebarEvents() {
        try {
            const toggles = document.querySelectorAll('.simple-toggle input[type="checkbox"]');
            toggles.forEach(toggle => {
                toggle.addEventListener('change', (e) => {
                    try {
                        if (!checkContextValid()) return;
                        
                        const settingName = e.target.id.replace('-toggle', '');
                        const value = e.target.checked;
                        
                        const update = {};
                        update[settingName] = value;
                        
                        safeStorageSet(update, () => {
                            try {
                                if (!checkContextValid()) return;
                                initialized = false;
                                initialize();
                            } catch (error) {
                                console.error('Simple Dark Mode & Reader: 侧边栏事件回调错误', error);
                            }
                        });
                    } catch (error) {
                        console.error('Simple Dark Mode & Reader: 侧边栏事件处理错误', error);
                    }
                });
            });
        } catch (error) {
            console.error('Simple Dark Mode & Reader: 绑定侧边栏事件时出错', error);
        }
    }
    
    /**
     * 检查是否需要添加深色模式类
     */
    function checkDarkModeStatus() {
        try {
            if (!checkContextValid()) return;
            
            safeStorageGet(['darkMode'], (result) => {
                try {
                    if (result.darkMode) {
                        document.body.classList.add('simple-dark-mode-active');
                    } else {
                        document.body.classList.remove('simple-dark-mode-active');
                    }
                } catch (error) {
                    console.error('Simple Dark Mode & Reader: 检查深色模式状态回调错误', error);
                }
            });
        } catch (error) {
            console.error('Simple Dark Mode & Reader: 检查深色模式状态时出错', error);
        }
    }
    
    // 确保DOM就绪后创建侧边栏
    function ensureSidebarCreated() {
        try {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', createSidebar);
            } else {
                createSidebar();
            }
        } catch (error) {
            console.error('Simple Dark Mode & Reader: 确保侧边栏创建错误', error);
        }
    }
    
    // 创建侧边栏
    ensureSidebarCreated();
    
    // 页面加载完成后创建侧边栏
    window.addEventListener('load', () => {
        createSidebar();
        checkDarkModeStatus();
    });
    
    // 监听页面变化，重新创建侧边栏
    const sidebarObserver = new MutationObserver(() => {
        try {
            if (!document.getElementById('simple-dark-mode-sidebar')) {
                createSidebar();
            }
        } catch (error) {
            console.error('Simple Dark Mode & Reader: 监听页面变化时出错', error);
        }
    });
    
    try {
        if (document.body) {
            sidebarObserver.observe(document.body, { childList: true, subtree: true });
            observers.push(sidebarObserver);
        }
    } catch (error) {
        console.error('Simple Dark Mode & Reader: 添加侧边栏观察器错误', error);
    }
    
    // 监听历史记录变化，重新创建侧边栏
    window.addEventListener('popstate', () => {
        setTimeout(createSidebar, 100);
    });
    
})();
