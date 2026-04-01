let currentTab;
let autoScrollInterval = null;
let refreshInterval = null;

// 加载用户设置
function loadSettings() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const currentTab = tabs[0];
        const url = currentTab?.url || '';
        const domain = new URL(url).hostname || '';
        
        const settings = [
            'darkMode', 'readerMode', 'fontSize', 'lineHeight', 'wordSpacing',
            'removeWatermark', 'cleanPage', 'forceCopy', 'videoEnhance', 'smoothScroll',
            'enhancedDark', 'darkModeLevel', 'whitelist', 'siteSettings',
            'removeTracking', 'hideCookie', 'blockMediaPermission', 'antiFingerprint',
            'eyeCare', 'autoScroll', 'videoSpeed', 'skipAds', 'preventPause',
            'blockPopups', 'blockRefresh', 'blockGif', 'autoRefresh', 'userAgent'
        ];
        
        chrome.storage.local.get(settings, (result) => {
            // 深色模式
            const darkMode = result.siteSettings?.[domain]?.darkMode ?? result.darkMode ?? false;
            document.getElementById('dark-mode').checked = darkMode;
            
            // 深色模式档位
            const darkModeLevel = result.siteSettings?.[domain]?.darkModeLevel ?? result.darkModeLevel ?? 'standard';
            document.getElementById('dark-mode-level').value = darkModeLevel;
            
            // 深色增强
            document.getElementById('enhanced-dark').checked = result.enhancedDark ?? false;
            
            // 护眼黄底
            document.getElementById('eye-care').checked = result.eyeCare ?? false;
            
            // 阅读模式
            document.getElementById('reader-mode').checked = result.readerMode ?? false;
            
            // 自动滚屏
            document.getElementById('auto-scroll').checked = result.autoScroll ?? false;
            
            // 平滑滚动
            document.getElementById('smooth-scroll').checked = result.smoothScroll ?? false;
            
            // 字体大小
            const fontSize = result.fontSize ?? 16;
            document.getElementById('font-size').value = fontSize;
            document.getElementById('font-size-value').textContent = fontSize;
            
            // 行距
            const lineHeight = result.lineHeight ?? 1.6;
            document.getElementById('line-height').value = lineHeight;
            document.getElementById('line-height-value').textContent = lineHeight;
            
            // 间距
            const wordSpacing = result.wordSpacing ?? 0;
            document.getElementById('word-spacing').value = wordSpacing;
            document.getElementById('word-spacing-value').textContent = wordSpacing;
            
            // 强制复制
            document.getElementById('force-copy').checked = result.forceCopy ?? false;
            
            // 视频增强
            document.getElementById('video-enhance').checked = result.videoEnhance ?? false;
            
            // 视频倍速
            const videoSpeed = result.videoSpeed ?? 1.0;
            document.getElementById('video-speed').value = videoSpeed;
            document.getElementById('video-speed-value').textContent = videoSpeed.toFixed(2);
            
            // 跳过广告
            document.getElementById('skip-ads').checked = result.skipAds ?? false;
            
            // 禁止自动暂停
            document.getElementById('prevent-pause').checked = result.preventPause ?? false;
            
            // 清除跟踪参数
            document.getElementById('remove-tracking').checked = result.removeTracking ?? false;
            
            // 隐藏Cookie提示
            document.getElementById('hide-cookie').checked = result.hideCookie ?? false;
            
            // 禁止媒体权限
            document.getElementById('block-media-permission').checked = result.blockMediaPermission ?? false;
            
            // 防指纹追踪
            document.getElementById('anti-fingerprint').checked = result.antiFingerprint ?? false;
            
            // 页面净化
            document.getElementById('clean-page').checked = result.cleanPage ?? false;
            
            // 屏蔽弹窗
            document.getElementById('block-popups').checked = result.blockPopups ?? false;
            
            // 禁止自动刷新
            document.getElementById('block-refresh').checked = result.blockRefresh ?? false;
            
            // 关闭GIF动画
            document.getElementById('block-gif').checked = result.blockGif ?? false;
            
            // 定时刷新
            const autoRefresh = result.autoRefresh ?? 0;
            document.getElementById('auto-refresh').value = autoRefresh.toString();
            
            // 切换UA
            document.getElementById('user-agent').value = result.userAgent ?? 'default';
        });
    });
}

// 绑定事件监听器
function bindEventListeners() {
    // 深色模式
    document.getElementById('dark-mode').addEventListener('change', (e) => {
        const enabled = e.target.checked;
        saveSetting('darkMode', enabled);
        toggleDarkMode(enabled);
    });
    
    // 深色模式档位
    document.getElementById('dark-mode-level').addEventListener('change', (e) => {
        saveSiteSetting('darkModeLevel', e.target.value);
        updateDarkMode();
    });
    
    // 深色增强
    document.getElementById('enhanced-dark').addEventListener('change', (e) => {
        const enabled = e.target.checked;
        saveSetting('enhancedDark', enabled);
        if (enabled && !document.getElementById('dark-mode').checked) {
            document.getElementById('dark-mode').checked = true;
            saveSetting('darkMode', true);
            toggleDarkMode(true);
        }
        toggleEnhancedDark(enabled);
    });
    
    // 护眼黄底
    document.getElementById('eye-care').addEventListener('change', (e) => {
        saveSetting('eyeCare', e.target.checked);
        toggleEyeCare(e.target.checked);
    });
    
    // 添加到白名单
    document.getElementById('add-whitelist').addEventListener('click', addToWhitelist);
    
    // 一键还原
    document.getElementById('reset-styles').addEventListener('click', resetStyles);
    
    // 阅读模式
    document.getElementById('reader-mode').addEventListener('change', (e) => {
        saveSetting('readerMode', e.target.checked);
        toggleReaderMode(e.target.checked);
    });
    
    // 自动滚屏
    document.getElementById('auto-scroll').addEventListener('change', (e) => {
        saveSetting('autoScroll', e.target.checked);
        toggleAutoScroll(e.target.checked);
    });
    
    // 平滑滚动
    document.getElementById('smooth-scroll').addEventListener('change', (e) => {
        saveSetting('smoothScroll', e.target.checked);
        toggleSmoothScroll(e.target.checked);
    });
    
    // 字体大小
    document.getElementById('font-size').addEventListener('input', (e) => {
        const value = e.target.value;
        document.getElementById('font-size-value').textContent = value;
        saveSetting('fontSize', parseInt(value));
        updateTextStyle();
    });
    
    // 行距
    document.getElementById('line-height').addEventListener('input', (e) => {
        const value = e.target.value;
        document.getElementById('line-height-value').textContent = value;
        saveSetting('lineHeight', parseFloat(value));
        updateTextStyle();
    });
    
    // 间距
    document.getElementById('word-spacing').addEventListener('input', (e) => {
        const value = e.target.value;
        document.getElementById('word-spacing-value').textContent = value;
        saveSetting('wordSpacing', parseFloat(value));
        updateTextStyle();
    });
    
    // 强制复制
    document.getElementById('force-copy').addEventListener('change', (e) => {
        saveSetting('forceCopy', e.target.checked);
        toggleForceCopy(e.target.checked);
    });
    
    // 复制正文
    document.getElementById('copy-content').addEventListener('click', copyMainContent);
    
    // 复制所有链接
    document.getElementById('copy-links').addEventListener('click', copyAllLinks);
    
    // 视频增强
    document.getElementById('video-enhance').addEventListener('change', (e) => {
        saveSetting('videoEnhance', e.target.checked);
        toggleVideoEnhance(e.target.checked);
    });
    
    // 视频倍速
    document.getElementById('video-speed').addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        document.getElementById('video-speed-value').textContent = value.toFixed(2);
        saveSetting('videoSpeed', value);
        setVideoSpeed(value);
    });
    
    // 跳过广告
    document.getElementById('skip-ads').addEventListener('change', (e) => {
        saveSetting('skipAds', e.target.checked);
        toggleSkipAds(e.target.checked);
    });
    
    // 禁止自动暂停
    document.getElementById('prevent-pause').addEventListener('change', (e) => {
        saveSetting('preventPause', e.target.checked);
        togglePreventPause(e.target.checked);
    });
    
    // 画中画
    document.getElementById('pip-mode').addEventListener('click', togglePictureInPicture);
    
    // 网页全屏
    document.getElementById('web-fullscreen').addEventListener('click', toggleWebFullscreen);
    
    // 清除跟踪参数
    document.getElementById('remove-tracking').addEventListener('change', (e) => {
        saveSetting('removeTracking', e.target.checked);
        toggleRemoveTracking(e.target.checked);
    });
    
    // 隐藏Cookie提示
    document.getElementById('hide-cookie').addEventListener('change', (e) => {
        saveSetting('hideCookie', e.target.checked);
        toggleHideCookie(e.target.checked);
    });
    
    // 禁止媒体权限
    document.getElementById('block-media-permission').addEventListener('change', (e) => {
        saveSetting('blockMediaPermission', e.target.checked);
        toggleBlockMediaPermission(e.target.checked);
    });
    
    // 防指纹追踪
    document.getElementById('anti-fingerprint').addEventListener('change', (e) => {
        saveSetting('antiFingerprint', e.target.checked);
        toggleAntiFingerprint(e.target.checked);
    });
    
    // 页面净化
    document.getElementById('clean-page').addEventListener('change', (e) => {
        saveSetting('cleanPage', e.target.checked);
        toggleCleanPage(e.target.checked);
    });
    
    // 屏蔽弹窗
    document.getElementById('block-popups').addEventListener('change', (e) => {
        saveSetting('blockPopups', e.target.checked);
        toggleBlockPopups(e.target.checked);
    });
    
    // 禁止自动刷新
    document.getElementById('block-refresh').addEventListener('change', (e) => {
        saveSetting('blockRefresh', e.target.checked);
        toggleBlockRefresh(e.target.checked);
    });
    
    // 关闭GIF动画
    document.getElementById('block-gif').addEventListener('change', (e) => {
        saveSetting('blockGif', e.target.checked);
        toggleBlockGif(e.target.checked);
    });
    
    // 导出PDF
    document.getElementById('pdf-export').addEventListener('click', exportToPDF);
    
    // 长截图
    document.getElementById('full-screenshot').addEventListener('click', takeFullScreenshot);
    
    // 定时刷新
    document.getElementById('auto-refresh').addEventListener('change', (e) => {
        const value = parseInt(e.target.value);
        saveSetting('autoRefresh', value);
        setupAutoRefresh(value);
    });
    
    // 切换UA
    document.getElementById('user-agent').addEventListener('change', (e) => {
        saveSetting('userAgent', e.target.value);
        toggleUserAgent(e.target.value);
    });
}

// 保存设置
function saveSetting(key, value) {
    chrome.storage.local.set({ [key]: value });
}

// 保存网站特定设置
function saveSiteSetting(key, value) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const url = tabs[0]?.url || '';
        const domain = new URL(url).hostname || '';
        
        if (domain) {
            chrome.storage.local.get('siteSettings', (result) => {
                const siteSettings = result.siteSettings || {};
                if (!siteSettings[domain]) siteSettings[domain] = {};
                siteSettings[domain][key] = value;
                chrome.storage.local.set({ siteSettings });
            });
        }
    });
}

// 添加到白名单
function addToWhitelist() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const url = tabs[0]?.url || '';
        const domain = new URL(url).hostname || '';
        
        if (domain) {
            chrome.storage.local.get('whitelist', (result) => {
                const whitelist = result.whitelist || [];
                if (!whitelist.includes(domain)) {
                    whitelist.push(domain);
                    chrome.storage.local.set({ whitelist });
                    alert(`已将 ${domain} 添加到白名单`);
                    document.getElementById('dark-mode').checked = false;
                    toggleDarkMode(false);
                } else {
                    alert(`${domain} 已在白名单中`);
                }
            });
        }
    });
}

// 一键还原
function resetStyles() {
    if (!currentTab) return;
    
    chrome.scripting.executeScript({
        target: { tabId: currentTab.id },
        func: () => {
            document.querySelectorAll('[id^="simple-"], [id*="-dark"], [id*="-reader"], [id*="-eye"], [id*="-text"], [id*="-copy"], [id*="-hide"], [id*="-clean"], [id*="-block"]').forEach(el => el.remove());
            location.reload();
        }
    }, () => {
        setTimeout(detectNativeTheme, 1000);
    });
}

// 复制正文
function copyMainContent() {
    if (!currentTab) return;
    
    chrome.scripting.executeScript({
        target: { tabId: currentTab.id },
        func: () => {
            const article = document.querySelector('article, .article, .content, .post, .entry-content, main');
            const content = article ? article.innerText : document.body.innerText;
            navigator.clipboard.writeText(content).then(() => {
                alert('正文已复制到剪贴板！');
            });
        }
    });
}

// 复制所有链接
function copyAllLinks() {
    if (!currentTab) return;
    
    chrome.scripting.executeScript({
        target: { tabId: currentTab.id },
        func: () => {
            const links = Array.from(document.querySelectorAll('a[href]'))
                .map(a => a.href)
                .filter((href, index, self) => self.indexOf(href) === index);
            navigator.clipboard.writeText(links.join('\n')).then(() => {
                alert(`已复制 ${links.length} 个链接到剪贴板！`);
            });
        }
    });
}

// 画中画
function togglePictureInPicture() {
    if (!currentTab) return;
    
    chrome.scripting.executeScript({
        target: { tabId: currentTab.id },
        func: () => {
            const video = document.querySelector('video');
            if (video && document.pictureInPictureEnabled) {
                if (document.pictureInPictureElement) {
                    document.exitPictureInPicture();
                } else {
                    video.requestPictureInPicture();
                }
            }
        }
    });
}

// 网页全屏
function toggleWebFullscreen() {
    if (!currentTab) return;
    
    chrome.scripting.executeScript({
        target: { tabId: currentTab.id },
        func: () => {
            const video = document.querySelector('video');
            if (video) {
                if (video.webkitEnterFullscreen) {
                    video.webkitEnterFullscreen();
                } else if (video.requestFullscreen) {
                    video.requestFullscreen();
                }
            }
        }
    });
}

// 导出PDF
function exportToPDF() {
    if (!currentTab) return;
    chrome.tabs.sendMessage(currentTab.id, { action: 'exportPDF' });
}

// 长截图
function takeFullScreenshot() {
    if (!currentTab) return;
    
    chrome.scripting.executeScript({
        target: { tabId: currentTab.id },
        func: () => {
            alert('长截图功能需要额外权限，建议使用浏览器自带截图工具或第三方扩展。');
        }
    });
}

// 检测原生主题
function detectNativeTheme() {
    if (!currentTab) return;
    
    chrome.tabs.sendMessage(currentTab.id, { action: 'detectNativeTheme' }, (response) => {
        if (response) {
            const { prefersDark, hasNativeDark } = response;
            const isDark = prefersDark || hasNativeDark;
            document.getElementById('dark-mode').checked = isDark;
            saveSiteSetting('darkMode', isDark);
        }
    });
}

// 检查AdGuard状态
function checkAdGuardStatus() {
    const adguardStatus = document.getElementById('adguard-status');
    const adguardButton = document.getElementById('open-adguard-assistant');
    
    adguardStatus.className = 'adguard-status adguard-status-not-installed';
    adguardStatus.innerHTML = '<span class="status-label">状态:</span><span class="status-text">未安装</span>';
    adguardButton.disabled = true;
}

// 初始化
async function init() {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    currentTab = tabs[0];
    
    loadSettings();
    bindEventListeners();
    checkAdGuardStatus();
    detectNativeTheme();
}

init();

// ==================== 功能实现函数 ====================

// 深色模式
function toggleDarkMode(enabled) {
    if (!currentTab) return;
    
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const url = tabs[0]?.url || '';
        const domain = new URL(url).hostname || '';
        
        chrome.storage.local.get(['whitelist', 'darkModeLevel'], (result) => {
            if (result.whitelist?.includes(domain)) return;
            
            const level = result.darkModeLevel || 'standard';
            saveSiteSetting('darkMode', enabled);
            
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
            
            chrome.scripting.executeScript({
                target: { tabId: currentTab.id },
                func: (enabled, colors) => {
                    let style = document.getElementById('simple-dark-mode');
                    if (!style) {
                        style = document.createElement('style');
                        style.id = 'simple-dark-mode';
                        document.head.appendChild(style);
                    }
                    
                    if (enabled) {
                        style.textContent = `
                            html, body { background: ${colors.bg} !important; color: ${colors.text} !important; }
                            * { background-color: ${colors.surface} !important; color: ${colors.text} !important; border-color: ${colors.border} !important; }
                            a { color: #90caf9 !important; }
                            img, video { background: transparent !important; }
                        `;
                    } else {
                        style.remove();
                    }
                },
                args: [enabled, colors]
            });
        });
    });
}

function updateDarkMode() {
    const enabled = document.getElementById('dark-mode').checked;
    if (enabled) toggleDarkMode(true);
}

// 护眼黄底
function toggleEyeCare(enabled) {
    if (!currentTab) return;
    chrome.scripting.executeScript({
        target: { tabId: currentTab.id },
        func: (enabled) => {
            let style = document.getElementById('simple-eye-care');
            if (enabled) {
                if (!style) {
                    style = document.createElement('style');
                    style.id = 'simple-eye-care';
                    document.head.appendChild(style);
                }
                style.textContent = `
                    html, body { background: #f5f0e1 !important; }
                    * { background-color: #f5f0e1 !important; color: #5c4b37 !important; }
                `;
            } else if (style) {
                style.remove();
            }
        },
        args: [enabled]
    });
}

// 阅读模式
function toggleReaderMode(enabled) {
    if (!currentTab) return;
    chrome.scripting.executeScript({
        target: { tabId: currentTab.id },
        func: (enabled) => {
            let style = document.getElementById('simple-reader-mode');
            if (enabled) {
                if (!style) {
                    style = document.createElement('style');
                    style.id = 'simple-reader-mode';
                    document.head.appendChild(style);
                }
                style.textContent = `
                    .ad, .ads, .sidebar, .widget, .social, .share, .comment, .related, .promotion, .popup, .modal, .banner { display: none !important; }
                    .content, article, .article, .post { max-width: 800px !important; margin: 0 auto !important; }
                `;
            } else if (style) {
                style.remove();
            }
        },
        args: [enabled]
    });
}

// 自动滚屏
function toggleAutoScroll(enabled) {
    if (!currentTab) return;
    chrome.scripting.executeScript({
        target: { tabId: currentTab.id },
        func: (enabled) => {
            if (enabled) {
                window.simpleAutoScroll = setInterval(() => {
                    window.scrollBy(0, 1);
                }, 50);
            } else {
                clearInterval(window.simpleAutoScroll);
            }
        },
        args: [enabled]
    });
}

// 平滑滚动
function toggleSmoothScroll(enabled) {
    if (!currentTab) return;
    chrome.scripting.executeScript({
        target: { tabId: currentTab.id },
        func: (enabled) => {
            document.documentElement.style.scrollBehavior = enabled ? 'smooth' : 'auto';
        },
        args: [enabled]
    });
}

// 更新文本样式
function updateTextStyle() {
    if (!currentTab) return;
    const fontSize = document.getElementById('font-size').value;
    const lineHeight = document.getElementById('line-height').value;
    const wordSpacing = document.getElementById('word-spacing').value;
    
    chrome.scripting.executeScript({
        target: { tabId: currentTab.id },
        func: (fontSize, lineHeight, wordSpacing) => {
            let style = document.getElementById('simple-text-style');
            if (!style) {
                style = document.createElement('style');
                style.id = 'simple-text-style';
                document.head.appendChild(style);
            }
            style.textContent = `
                body { font-size: ${fontSize}px !important; line-height: ${lineHeight} !important; word-spacing: ${wordSpacing}px !important; }
                p, div { font-size: ${fontSize}px !important; line-height: ${lineHeight} !important; }
            `;
        },
        args: [fontSize, lineHeight, wordSpacing]
    });
}

// 强制复制
function toggleForceCopy(enabled) {
    if (!currentTab) return;
    chrome.scripting.executeScript({
        target: { tabId: currentTab.id },
        func: (enabled) => {
            if (enabled) {
                ['copy', 'cut', 'paste', 'contextmenu', 'selectstart'].forEach(event => {
                    document.addEventListener(event, e => e.stopPropagation(), true);
                });
                let style = document.createElement('style');
                style.id = 'simple-force-copy';
                style.textContent = '* { user-select: text !important; -webkit-user-select: text !important; }';
                document.head.appendChild(style);
            } else {
                document.getElementById('simple-force-copy')?.remove();
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
            const videos = document.querySelectorAll('video');
            videos.forEach(video => {
                if (enabled) {
                    video.controls = true;
                    video.setAttribute('controlsList', 'nodownload');
                }
            });
        },
        args: [enabled]
    });
}

// 设置视频倍速
function setVideoSpeed(speed) {
    if (!currentTab) return;
    chrome.scripting.executeScript({
        target: { tabId: currentTab.id },
        func: (speed) => {
            document.querySelectorAll('video').forEach(v => v.playbackRate = speed);
        },
        args: [speed]
    });
}

// 跳过广告
function toggleSkipAds(enabled) {
    if (!currentTab) return;
    chrome.scripting.executeScript({
        target: { tabId: currentTab.id },
        func: (enabled) => {
            if (enabled) {
                const skipAds = () => {
                    document.querySelectorAll('.ad, .ads, .advertisement, [class*="ad-"], [id*="ad-"]').forEach(el => el.remove());
                    document.querySelectorAll('video').forEach(v => {
                        v.addEventListener('play', () => {
                            if (v.currentTime < 5) v.currentTime = 5;
                        });
                    });
                };
                skipAds();
                setInterval(skipAds, 3000);
            }
        },
        args: [enabled]
    });
}

// 禁止自动暂停
function togglePreventPause(enabled) {
    if (!currentTab) return;
    chrome.scripting.executeScript({
        target: { tabId: currentTab.id },
        func: (enabled) => {
            document.querySelectorAll('video').forEach(video => {
                if (enabled) {
                    video.addEventListener('pause', () => video.play(), true);
                }
            });
        },
        args: [enabled]
    });
}

// 清除跟踪参数
function toggleRemoveTracking(enabled) {
    if (!currentTab) return;
    chrome.scripting.executeScript({
        target: { tabId: currentTab.id },
        func: (enabled) => {
            if (enabled) {
                const cleanUrl = () => {
                    const url = new URL(window.location.href);
                    ['utm_source', 'utm_medium', 'utm_campaign', 'fbclid', 'gclid'].forEach(p => url.searchParams.delete(p));
                    window.history.replaceState({}, '', url);
                };
                cleanUrl();
            }
        },
        args: [enabled]
    });
}

// 隐藏Cookie提示
function toggleHideCookie(enabled) {
    if (!currentTab) return;
    chrome.scripting.executeScript({
        target: { tabId: currentTab.id },
        func: (enabled) => {
            let style = document.getElementById('simple-hide-cookie');
            if (enabled) {
                if (!style) {
                    style = document.createElement('style');
                    style.id = 'simple-hide-cookie';
                    document.head.appendChild(style);
                }
                style.textContent = '.cookie-banner, .cookie-consent, .cookie-notice, .gdpr-banner { display: none !important; }';
            } else if (style) {
                style.remove();
            }
        },
        args: [enabled]
    });
}

// 禁止媒体权限
function toggleBlockMediaPermission(enabled) {
    if (!currentTab) return;
    chrome.scripting.executeScript({
        target: { tabId: currentTab.id },
        func: (enabled) => {
            if (enabled) {
                navigator.mediaDevices.getUserMedia = () => Promise.reject(new Error('Blocked'));
            }
        },
        args: [enabled]
    });
}

// 防指纹追踪
function toggleAntiFingerprint(enabled) {
    if (!currentTab) return;
    chrome.scripting.executeScript({
        target: { tabId: currentTab.id },
        func: (enabled) => {
            if (enabled) {
                Object.defineProperty(navigator, 'webdriver', { get: () => false });
                Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3] });
            }
        },
        args: [enabled]
    });
}

// 页面净化
function toggleCleanPage(enabled) {
    if (!currentTab) return;
    chrome.scripting.executeScript({
        target: { tabId: currentTab.id },
        func: (enabled) => {
            let style = document.getElementById('simple-clean-page');
            if (enabled) {
                if (!style) {
                    style = document.createElement('style');
                    style.id = 'simple-clean-page';
                    document.head.appendChild(style);
                }
                style.textContent = `
                    .ad, .ads, .popup, .modal, .banner, .sidebar, .widget, .promotion, .qr-code, .qrcode { display: none !important; }
                    .floating-button, .float-btn, .back-to-top { display: none !important; }
                `;
            } else if (style) {
                style.remove();
            }
        },
        args: [enabled]
    });
}

// 屏蔽弹窗
function toggleBlockPopups(enabled) {
    if (!currentTab) return;
    chrome.scripting.executeScript({
        target: { tabId: currentTab.id },
        func: (enabled) => {
            if (enabled) {
                window.open = () => null;
                window.alert = () => null;
                window.confirm = () => true;
            }
        },
        args: [enabled]
    });
}

// 禁止自动刷新
function toggleBlockRefresh(enabled) {
    if (!currentTab) return;
    chrome.scripting.executeScript({
        target: { tabId: currentTab.id },
        func: (enabled) => {
            if (enabled) {
                const meta = document.querySelector('meta[http-equiv="refresh"]');
                if (meta) meta.remove();
                Object.defineProperty(window.location, 'reload', { value: () => {} });
            }
        },
        args: [enabled]
    });
}

// 关闭GIF动画
function toggleBlockGif(enabled) {
    if (!currentTab) return;
    chrome.scripting.executeScript({
        target: { tabId: currentTab.id },
        func: (enabled) => {
            let style = document.getElementById('simple-block-gif');
            if (enabled) {
                if (!style) {
                    style = document.createElement('style');
                    style.id = 'simple-block-gif';
                    document.head.appendChild(style);
                }
                style.textContent = 'img[src*=".gif"] { display: none !important; }';
            } else if (style) {
                style.remove();
            }
        },
        args: [enabled]
    });
}

// 定时刷新
function setupAutoRefresh(seconds) {
    if (refreshInterval) clearInterval(refreshInterval);
    if (seconds > 0) {
        refreshInterval = setInterval(() => {
            if (currentTab) chrome.tabs.reload(currentTab.id);
        }, seconds * 1000);
    }
}

// 切换UA
function toggleUserAgent(type) {
    if (!currentTab) return;
    chrome.scripting.executeScript({
        target: { tabId: currentTab.id },
        func: (type) => {
            const uas = {
                mobile: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
                desktop: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            };
            if (type !== 'default') {
                Object.defineProperty(navigator, 'userAgent', { get: () => uas[type] || navigator.userAgent });
            }
        },
        args: [type]
    });
}

// 深色模式增强
function toggleEnhancedDark(enabled) {
    if (!currentTab) return;
    chrome.scripting.executeScript({
        target: { tabId: currentTab.id },
        func: (enabled) => {
            let style = document.getElementById('simple-enhanced-dark');
            if (enabled) {
                if (!style) {
                    style = document.createElement('style');
                    style.id = 'simple-enhanced-dark';
                    document.head.appendChild(style);
                }
                style.textContent = `
                    body { filter: brightness(0.9) contrast(1.1) !important; }
                    img, video { filter: brightness(0.8) !important; }
                `;
            } else if (style) {
                style.remove();
            }
        },
        args: [enabled]
    });
}
