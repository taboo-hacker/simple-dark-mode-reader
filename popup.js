// Popup script for Simple Dark Mode & Reader
// 弹出面板脚本，处理用户交互和设置保存

(function() {
    'use strict';
    
    let currentTab = null;
    
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
     * 安全地获取当前标签页
     * @param {function} callback 回调函数
     */
    function safeGetCurrentTab(callback) {
        try {
            if (!checkContextValid()) {
                callback(null);
                return;
            }
            
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (chrome.runtime.lastError) {
                    console.error('获取当前标签页错误:', chrome.runtime.lastError);
                    callback(null);
                    return;
                }
                callback(tabs[0] || null);
            });
        } catch (error) {
            console.error('获取当前标签页异常:', error);
            callback(null);
        }
    }
    
    /**
     * 安全地发送消息到content script
     * @param {number} tabId 标签页ID
     * @param {Object} message 消息对象
     * @param {function} callback 回调函数
     */
    function safeSendMessage(tabId, message, callback) {
        try {
            if (!checkContextValid() || !tabId) {
                if (callback) callback(null);
                return;
            }
            
            chrome.tabs.sendMessage(tabId, message, (response) => {
                if (chrome.runtime.lastError) {
                    console.log('发送消息错误:', chrome.runtime.lastError.message);
                    if (callback) callback(null);
                    return;
                }
                if (callback) callback(response);
            });
        } catch (error) {
            console.error('发送消息异常:', error);
            if (callback) callback(null);
        }
    }
    
    /**
     * 安全地执行脚本
     * @param {number} tabId 标签页ID
     * @param {Object} details 脚本详情
     * @param {function} callback 回调函数
     */
    function safeExecuteScript(tabId, details, callback) {
        try {
            if (!checkContextValid() || !tabId) {
                if (callback) callback(null);
                return;
            }
            
            chrome.scripting.executeScript({
                target: { tabId: tabId },
                ...details
            }, (results) => {
                if (chrome.runtime.lastError) {
                    console.log('执行脚本错误:', chrome.runtime.lastError.message);
                    if (callback) callback(null);
                    return;
                }
                if (callback) callback(results);
            });
        } catch (error) {
            console.error('执行脚本异常:', error);
            if (callback) callback(null);
        }
    }
    
    /**
     * 安全地保存设置
     * @param {string} key 设置键
     * @param {any} value 设置值
     * @param {function} callback 回调函数
     */
    function safeSaveSetting(key, value, callback) {
        try {
            if (!checkContextValid()) {
                if (callback) callback(false);
                return;
            }
            
            chrome.storage.local.set({ [key]: value }, () => {
                if (chrome.runtime.lastError) {
                    console.error('保存设置错误:', chrome.runtime.lastError);
                    if (callback) callback(false);
                    return;
                }
                if (callback) callback(true);
            });
        } catch (error) {
            console.error('保存设置异常:', error);
            if (callback) callback(false);
        }
    }
    
    /**
     * 安全地获取设置
     * @param {string[]} keys 设置键数组
     * @param {function} callback 回调函数
     */
    function safeGetSettings(keys, callback) {
        try {
            if (!checkContextValid()) {
                callback({});
                return;
            }
            
            chrome.storage.local.get(keys, (result) => {
                if (chrome.runtime.lastError) {
                    console.error('获取设置错误:', chrome.runtime.lastError);
                    callback({});
                    return;
                }
                callback(result);
            });
        } catch (error) {
            console.error('获取设置异常:', error);
            callback({});
        }
    }
    
    /**
     * 加载用户设置
     */
    function loadSettings() {
        try {
            safeGetCurrentTab((tab) => {
                if (!tab) return;
                
                currentTab = tab;
                const url = tab.url || '';
                let domain = '';
                try {
                    domain = new URL(url).hostname || '';
                } catch (e) {
                    domain = '';
                }
                
                const settings = [
                    'darkMode', 'readerMode', 'fontSize', 'lineHeight', 'wordSpacing',
                    'cleanPage', 'forceCopy', 'videoEnhance', 'smoothScroll',
                    'enhancedDark', 'darkModeLevel', 'whitelist', 'siteSettings',
                    'removeTracking', 'hideCookie', 'blockMediaPermission', 'antiFingerprint',
                    'eyeCare', 'autoScroll', 'videoSpeed', 'skipAds', 'preventPause',
                    'blockPopups', 'blockRefresh', 'blockGif', 'autoRefresh', 'userAgent'
                ];
                
                safeGetSettings(settings, (result) => {
                    try {
                        // 深色模式
                        const darkMode = result.siteSettings?.[domain]?.darkMode ?? result.darkMode ?? false;
                        const darkModeEl = document.getElementById('dark-mode-toggle');
                        if (darkModeEl) darkModeEl.checked = darkMode;
                        
                        // 深色模式档位
                        const darkModeLevel = result.siteSettings?.[domain]?.darkModeLevel ?? result.darkModeLevel ?? 'standard';
                        const darkModeLevelEl = document.getElementById('dark-mode-level');
                        if (darkModeLevelEl) darkModeLevelEl.value = darkModeLevel;
                        
                        // 深色增强
                        const enhancedDarkEl = document.getElementById('enhanced-dark-toggle');
                        if (enhancedDarkEl) enhancedDarkEl.checked = result.enhancedDark ?? false;
                        
                        // 护眼黄底
                        const eyeCareEl = document.getElementById('eye-care-toggle');
                        if (eyeCareEl) eyeCareEl.checked = result.eyeCare ?? false;
                        
                        // 阅读模式
                        const readerModeEl = document.getElementById('reader-mode-toggle');
                        if (readerModeEl) readerModeEl.checked = result.readerMode ?? false;
                        
                        // 自动滚屏
                        const autoScrollEl = document.getElementById('auto-scroll-toggle');
                        if (autoScrollEl) autoScrollEl.checked = result.autoScroll ?? false;
                        
                        // 平滑滚动
                        const smoothScrollEl = document.getElementById('smooth-scroll-toggle');
                        if (smoothScrollEl) smoothScrollEl.checked = result.smoothScroll ?? false;
                        
                        // 字体大小
                        const fontSize = result.fontSize ?? 16;
                        const fontSizeEl = document.getElementById('font-size-slider');
                        const fontSizeValueEl = document.getElementById('font-size-display');
                        if (fontSizeEl) fontSizeEl.value = fontSize;
                        if (fontSizeValueEl) fontSizeValueEl.textContent = fontSize + 'px';
                        
                        // 行距
                        const lineHeight = result.lineHeight ?? 1.6;
                        const lineHeightEl = document.getElementById('line-height-slider');
                        const lineHeightValueEl = document.getElementById('line-height-display');
                        if (lineHeightEl) lineHeightEl.value = lineHeight;
                        if (lineHeightValueEl) lineHeightValueEl.textContent = lineHeight;
                        
                        // 间距
                        const wordSpacing = result.wordSpacing ?? 0;
                        const wordSpacingEl = document.getElementById('word-spacing-slider');
                        const wordSpacingValueEl = document.getElementById('word-spacing-display');
                        if (wordSpacingEl) wordSpacingEl.value = wordSpacing;
                        if (wordSpacingValueEl) wordSpacingValueEl.textContent = wordSpacing + 'px';
                        
                        // 强制复制
                        const forceCopyEl = document.getElementById('force-copy-toggle');
                        if (forceCopyEl) forceCopyEl.checked = result.forceCopy ?? false;
                        
                        // 视频增强
                        const videoEnhanceEl = document.getElementById('video-enhance-toggle');
                        if (videoEnhanceEl) videoEnhanceEl.checked = result.videoEnhance ?? false;
                        
                        // 视频倍速
                        const videoSpeed = result.videoSpeed ?? 1.0;
                        const videoSpeedEl = document.getElementById('video-speed-slider');
                        const videoSpeedValueEl = document.getElementById('video-speed-display');
                        if (videoSpeedEl) videoSpeedEl.value = videoSpeed;
                        if (videoSpeedValueEl) videoSpeedValueEl.textContent = videoSpeed.toFixed(2) + 'x';
                        
                        // 跳过广告
                        const skipAdsEl = document.getElementById('skip-ads-toggle');
                        if (skipAdsEl) skipAdsEl.checked = result.skipAds ?? false;
                        
                        // 禁止自动暂停
                        const preventPauseEl = document.getElementById('prevent-pause-toggle');
                        if (preventPauseEl) preventPauseEl.checked = result.preventPause ?? false;
                        
                        // 清除跟踪参数
                        const removeTrackingEl = document.getElementById('remove-tracking-toggle');
                        if (removeTrackingEl) removeTrackingEl.checked = result.removeTracking ?? false;
                        
                        // 隐藏Cookie提示
                        const hideCookieEl = document.getElementById('hide-cookie-toggle');
                        if (hideCookieEl) hideCookieEl.checked = result.hideCookie ?? false;
                        
                        // 禁止媒体权限
                        const blockMediaPermissionEl = document.getElementById('block-media-permission-toggle');
                        if (blockMediaPermissionEl) blockMediaPermissionEl.checked = result.blockMediaPermission ?? false;
                        
                        // 防指纹追踪
                        const antiFingerprintEl = document.getElementById('anti-fingerprint-toggle');
                        if (antiFingerprintEl) antiFingerprintEl.checked = result.antiFingerprint ?? false;
                        
                        // 页面净化
                        const cleanPageEl = document.getElementById('clean-page-toggle');
                        if (cleanPageEl) cleanPageEl.checked = result.cleanPage ?? false;
                        
                        // 屏蔽弹窗
                        const blockPopupsEl = document.getElementById('block-popups-toggle');
                        if (blockPopupsEl) blockPopupsEl.checked = result.blockPopups ?? false;
                        
                        // 禁止自动刷新
                        const blockRefreshEl = document.getElementById('block-refresh-toggle');
                        if (blockRefreshEl) blockRefreshEl.checked = result.blockRefresh ?? false;
                        
                        // 关闭GIF动画
                        const blockGifEl = document.getElementById('block-gif-toggle');
                        if (blockGifEl) blockGifEl.checked = result.blockGif ?? false;
                        
                        // 定时刷新
                        const autoRefresh = result.autoRefresh ?? 0;
                        const autoRefreshEl = document.getElementById('auto-refresh-select');
                        if (autoRefreshEl) autoRefreshEl.value = autoRefresh.toString();
                        
                        // 切换UA
                        const userAgentEl = document.getElementById('user-agent-select');
                        if (userAgentEl) userAgentEl.value = result.userAgent ?? 'default';
                    } catch (error) {
                        console.error('加载设置回调错误:', error);
                    }
                });
            });
        } catch (error) {
            console.error('加载设置错误:', error);
        }
    }
    
    /**
     * 绑定事件监听器
     */
    function bindEventListeners() {
        try {
            // 左侧导航菜单
            const navItems = document.querySelectorAll('.nav-item');
            const contentSections = document.querySelectorAll('.content-section');
            
            navItems.forEach(item => {
                item.addEventListener('click', () => {
                    // 移除所有活动状态
                    navItems.forEach(nav => nav.classList.remove('active'));
                    contentSections.forEach(section => section.classList.remove('active'));
                    
                    // 添加当前活动状态
                    item.classList.add('active');
                    const sectionId = item.dataset.section;
                    const section = document.getElementById(sectionId);
                    if (section) section.classList.add('active');
                });
            });
            
            // 深色模式
            const darkModeEl = document.getElementById('dark-mode-toggle');
            if (darkModeEl) {
                darkModeEl.addEventListener('change', (e) => {
                    const enabled = e.target.checked;
                    safeSaveSetting('darkMode', enabled);
                    toggleDarkMode(enabled);
                });
            }
            
            // 深色模式档位
            const darkModeLevelEl = document.getElementById('dark-mode-level');
            if (darkModeLevelEl) {
                darkModeLevelEl.addEventListener('change', (e) => {
                    saveSiteSetting('darkModeLevel', e.target.value);
                    updateDarkMode();
                });
            }
            
            // 深色增强
            const enhancedDarkEl = document.getElementById('enhanced-dark-toggle');
            if (enhancedDarkEl) {
                enhancedDarkEl.addEventListener('change', (e) => {
                    const enabled = e.target.checked;
                    safeSaveSetting('enhancedDark', enabled);
                    if (enabled) {
                        const darkModeEl = document.getElementById('dark-mode-toggle');
                        if (darkModeEl && !darkModeEl.checked) {
                            darkModeEl.checked = true;
                            safeSaveSetting('darkMode', true);
                            toggleDarkMode(true);
                        }
                    }
                    toggleEnhancedDark(enabled);
                });
            }
            
            // 护眼黄底
            const eyeCareEl = document.getElementById('eye-care-toggle');
            if (eyeCareEl) {
                eyeCareEl.addEventListener('change', (e) => {
                    safeSaveSetting('eyeCare', e.target.checked);
                    toggleEyeCare(e.target.checked);
                });
            }
            
            // 添加到白名单
            const addWhitelistEl = document.getElementById('add-whitelist-btn');
            if (addWhitelistEl) {
                addWhitelistEl.addEventListener('click', addToWhitelist);
            }
            
            // 一键还原
            const resetStylesEl = document.getElementById('reset-styles-btn');
            if (resetStylesEl) {
                resetStylesEl.addEventListener('click', resetStyles);
            }
            
            // 阅读模式
            const readerModeEl = document.getElementById('reader-mode-toggle');
            if (readerModeEl) {
                readerModeEl.addEventListener('change', (e) => {
                    safeSaveSetting('readerMode', e.target.checked);
                    toggleReaderMode(e.target.checked);
                });
            }
            
            // 自动滚屏
            const autoScrollEl = document.getElementById('auto-scroll-toggle');
            if (autoScrollEl) {
                autoScrollEl.addEventListener('change', (e) => {
                    safeSaveSetting('autoScroll', e.target.checked);
                    toggleAutoScroll(e.target.checked);
                });
            }
            
            // 平滑滚动
            const smoothScrollEl = document.getElementById('smooth-scroll-toggle');
            if (smoothScrollEl) {
                smoothScrollEl.addEventListener('change', (e) => {
                    safeSaveSetting('smoothScroll', e.target.checked);
                    toggleSmoothScroll(e.target.checked);
                });
            }
            
            // 字体大小
            const fontSizeEl = document.getElementById('font-size-slider');
            if (fontSizeEl) {
                fontSizeEl.addEventListener('input', (e) => {
                    const value = e.target.value;
                    const fontSizeValueEl = document.getElementById('font-size-display');
                    if (fontSizeValueEl) fontSizeValueEl.textContent = value + 'px';
                    safeSaveSetting('fontSize', parseInt(value));
                    updateTextStyle();
                });
            }
            
            // 行距
            const lineHeightEl = document.getElementById('line-height-slider');
            if (lineHeightEl) {
                lineHeightEl.addEventListener('input', (e) => {
                    const value = e.target.value;
                    const lineHeightValueEl = document.getElementById('line-height-display');
                    if (lineHeightValueEl) lineHeightValueEl.textContent = value;
                    safeSaveSetting('lineHeight', parseFloat(value));
                    updateTextStyle();
                });
            }
            
            // 间距
            const wordSpacingEl = document.getElementById('word-spacing-slider');
            if (wordSpacingEl) {
                wordSpacingEl.addEventListener('input', (e) => {
                    const value = e.target.value;
                    const wordSpacingValueEl = document.getElementById('word-spacing-display');
                    if (wordSpacingValueEl) wordSpacingValueEl.textContent = value + 'px';
                    safeSaveSetting('wordSpacing', parseFloat(value));
                    updateTextStyle();
                });
            }
            
            // 强制复制
            const forceCopyEl = document.getElementById('force-copy-toggle');
            if (forceCopyEl) {
                forceCopyEl.addEventListener('change', (e) => {
                    safeSaveSetting('forceCopy', e.target.checked);
                    toggleForceCopy(e.target.checked);
                });
            }
            
            // 复制正文
            const copyContentEl = document.getElementById('copy-content-btn');
            if (copyContentEl) {
                copyContentEl.addEventListener('click', copyMainContent);
            }
            
            // 复制所有链接
            const copyLinksEl = document.getElementById('copy-links-btn');
            if (copyLinksEl) {
                copyLinksEl.addEventListener('click', copyAllLinks);
            }
            
            // 视频增强
            const videoEnhanceEl = document.getElementById('video-enhance-toggle');
            if (videoEnhanceEl) {
                videoEnhanceEl.addEventListener('change', (e) => {
                    safeSaveSetting('videoEnhance', e.target.checked);
                    toggleVideoEnhance(e.target.checked);
                });
            }
            
            // 视频倍速
            const videoSpeedEl = document.getElementById('video-speed-slider');
            if (videoSpeedEl) {
                videoSpeedEl.addEventListener('input', (e) => {
                    const value = parseFloat(e.target.value);
                    const videoSpeedValueEl = document.getElementById('video-speed-display');
                    if (videoSpeedValueEl) videoSpeedValueEl.textContent = value.toFixed(2) + 'x';
                    safeSaveSetting('videoSpeed', value);
                    setVideoSpeed(value);
                });
            }
            
            // 跳过广告
            const skipAdsEl = document.getElementById('skip-ads-toggle');
            if (skipAdsEl) {
                skipAdsEl.addEventListener('change', (e) => {
                    safeSaveSetting('skipAds', e.target.checked);
                    toggleSkipAds(e.target.checked);
                });
            }
            
            // 禁止自动暂停
            const preventPauseEl = document.getElementById('prevent-pause-toggle');
            if (preventPauseEl) {
                preventPauseEl.addEventListener('change', (e) => {
                    safeSaveSetting('preventPause', e.target.checked);
                    togglePreventPause(e.target.checked);
                });
            }
            
            // 画中画
            const pipModeEl = document.getElementById('pip-mode-btn');
            if (pipModeEl) {
                pipModeEl.addEventListener('click', togglePictureInPicture);
            }
            
            // 网页全屏
            const webFullscreenEl = document.getElementById('web-fullscreen-btn');
            if (webFullscreenEl) {
                webFullscreenEl.addEventListener('click', toggleWebFullscreen);
            }
            
            // 清除跟踪参数
            const removeTrackingEl = document.getElementById('remove-tracking-toggle');
            if (removeTrackingEl) {
                removeTrackingEl.addEventListener('change', (e) => {
                    safeSaveSetting('removeTracking', e.target.checked);
                    toggleRemoveTracking(e.target.checked);
                });
            }
            
            // 隐藏Cookie提示
            const hideCookieEl = document.getElementById('hide-cookie-toggle');
            if (hideCookieEl) {
                hideCookieEl.addEventListener('change', (e) => {
                    safeSaveSetting('hideCookie', e.target.checked);
                    toggleHideCookie(e.target.checked);
                });
            }
            
            // 禁止媒体权限
            const blockMediaPermissionEl = document.getElementById('block-media-permission-toggle');
            if (blockMediaPermissionEl) {
                blockMediaPermissionEl.addEventListener('change', (e) => {
                    safeSaveSetting('blockMediaPermission', e.target.checked);
                    toggleBlockMediaPermission(e.target.checked);
                });
            }
            
            // 防指纹追踪
            const antiFingerprintEl = document.getElementById('anti-fingerprint-toggle');
            if (antiFingerprintEl) {
                antiFingerprintEl.addEventListener('change', (e) => {
                    safeSaveSetting('antiFingerprint', e.target.checked);
                    toggleAntiFingerprint(e.target.checked);
                });
            }
            
            // 页面净化
            const cleanPageEl = document.getElementById('clean-page-toggle');
            if (cleanPageEl) {
                cleanPageEl.addEventListener('change', (e) => {
                    safeSaveSetting('cleanPage', e.target.checked);
                    toggleCleanPage(e.target.checked);
                });
            }
            
            // 屏蔽弹窗
            const blockPopupsEl = document.getElementById('block-popups-toggle');
            if (blockPopupsEl) {
                blockPopupsEl.addEventListener('change', (e) => {
                    safeSaveSetting('blockPopups', e.target.checked);
                    toggleBlockPopups(e.target.checked);
                });
            }
            
            // 禁止自动刷新
            const blockRefreshEl = document.getElementById('block-refresh-toggle');
            if (blockRefreshEl) {
                blockRefreshEl.addEventListener('change', (e) => {
                    safeSaveSetting('blockRefresh', e.target.checked);
                    toggleBlockRefresh(e.target.checked);
                });
            }
            
            // 关闭GIF动画
            const blockGifEl = document.getElementById('block-gif-toggle');
            if (blockGifEl) {
                blockGifEl.addEventListener('change', (e) => {
                    safeSaveSetting('blockGif', e.target.checked);
                    toggleBlockGif(e.target.checked);
                });
            }
            
            // 导出PDF
            const pdfExportEl = document.getElementById('export-pdf-btn');
            if (pdfExportEl) {
                pdfExportEl.addEventListener('click', exportToPDF);
            }
            
            // 长截图
            const fullScreenshotEl = document.getElementById('screenshot-btn');
            if (fullScreenshotEl) {
                fullScreenshotEl.addEventListener('click', takeFullScreenshot);
            }
            
            // 定时刷新
            const autoRefreshEl = document.getElementById('auto-refresh-select');
            if (autoRefreshEl) {
                autoRefreshEl.addEventListener('change', (e) => {
                    const value = parseInt(e.target.value);
                    safeSaveSetting('autoRefresh', value);
                    setupAutoRefresh(value);
                });
            }
            
            // 切换UA
            const userAgentEl = document.getElementById('user-agent-select');
            if (userAgentEl) {
                userAgentEl.addEventListener('change', (e) => {
                    safeSaveSetting('userAgent', e.target.value);
                    toggleUserAgent(e.target.value);
                });
            }
        } catch (error) {
            console.error('绑定事件监听器错误:', error);
        }
    }
    
    /**
     * 保存网站特定设置
     * @param {string} key 设置键
     * @param {any} value 设置值
     */
    function saveSiteSetting(key, value) {
        try {
            safeGetCurrentTab((tab) => {
                if (!tab) return;
                
                const url = tab.url || '';
                let domain = '';
                try {
                    domain = new URL(url).hostname || '';
                } catch (e) {
                    domain = '';
                }
                
                if (domain) {
                    safeGetSettings(['siteSettings'], (result) => {
                        try {
                            const siteSettings = result.siteSettings || {};
                            if (!siteSettings[domain]) siteSettings[domain] = {};
                            siteSettings[domain][key] = value;
                            safeSaveSetting('siteSettings', siteSettings);
                        } catch (error) {
                            console.error('保存网站设置回调错误:', error);
                        }
                    });
                }
            });
        } catch (error) {
            console.error('保存网站设置错误:', error);
        }
    }
    
    /**
     * 添加到白名单
     */
    function addToWhitelist() {
        try {
            safeGetCurrentTab((tab) => {
                if (!tab) return;
                
                const url = tab.url || '';
                let domain = '';
                try {
                    domain = new URL(url).hostname || '';
                } catch (e) {
                    domain = '';
                }
                
                if (domain) {
                    safeGetSettings(['whitelist'], (result) => {
                        try {
                            const whitelist = result.whitelist || [];
                            if (!whitelist.includes(domain)) {
                                whitelist.push(domain);
                                safeSaveSetting('whitelist', whitelist);
                                alert(`已将 ${domain} 添加到白名单`);
                                const darkModeEl = document.getElementById('dark-mode-toggle');
                                if (darkModeEl) darkModeEl.checked = false;
                                toggleDarkMode(false);
                            } else {
                                alert(`${domain} 已在白名单中`);
                            }
                        } catch (error) {
                            console.error('添加到白名单回调错误:', error);
                        }
                    });
                }
            });
        } catch (error) {
            console.error('添加到白名单错误:', error);
        }
    }
    
    /**
     * 一键还原
     */
    function resetStyles() {
        try {
            if (!currentTab) return;
            
            safeExecuteScript(currentTab.id, {
                func: () => {
                    document.querySelectorAll('[id^="simple-"], [id*="-dark"], [id*="-reader"], [id*="-eye"], [id*="-text"], [id*="-copy"], [id*="-hide"], [id*="-clean"], [id*="-block"]').forEach(el => el.remove());
                    location.reload();
                }
            });
        } catch (error) {
            console.error('一键还原错误:', error);
        }
    }
    
    /**
     * 复制正文
     */
    function copyMainContent() {
        try {
            if (!currentTab) return;
            
            safeExecuteScript(currentTab.id, {
                func: () => {
                    try {
                        const article = document.querySelector('article, .article, .content, .post, .entry-content, main');
                        const content = article ? article.innerText : document.body.innerText;
                        navigator.clipboard.writeText(content).then(() => {
                            alert('正文已复制到剪贴板！');
                        }).catch(() => {
                            alert('复制失败，请手动复制');
                        });
                    } catch (e) {
                        alert('复制失败，请手动复制');
                    }
                }
            });
        } catch (error) {
            console.error('复制正文错误:', error);
        }
    }
    
    /**
     * 复制所有链接
     */
    function copyAllLinks() {
        try {
            if (!currentTab) return;
            
            safeExecuteScript(currentTab.id, {
                func: () => {
                    try {
                        const links = Array.from(document.querySelectorAll('a[href]'))
                            .map(a => a.href)
                            .filter((href, index, self) => self.indexOf(href) === index);
                        navigator.clipboard.writeText(links.join('\n')).then(() => {
                            alert(`已复制 ${links.length} 个链接到剪贴板！`);
                        }).catch(() => {
                            alert('复制失败，请手动复制');
                        });
                    } catch (e) {
                        alert('复制失败，请手动复制');
                    }
                }
            });
        } catch (error) {
            console.error('复制所有链接错误:', error);
        }
    }
    
    /**
     * 画中画
     */
    function togglePictureInPicture() {
        try {
            if (!currentTab) return;
            
            safeExecuteScript(currentTab.id, {
                func: () => {
                    try {
                        const video = document.querySelector('video');
                        if (video && document.pictureInPictureEnabled) {
                            if (document.pictureInPictureElement) {
                                document.exitPictureInPicture();
                            } else {
                                video.requestPictureInPicture();
                            }
                        }
                    } catch (e) {
                        console.error('画中画错误:', e);
                    }
                }
            });
        } catch (error) {
            console.error('画中画错误:', error);
        }
    }
    
    /**
     * 网页全屏
     */
    function toggleWebFullscreen() {
        try {
            if (!currentTab) return;
            
            safeExecuteScript(currentTab.id, {
                func: () => {
                    try {
                        const video = document.querySelector('video');
                        if (video) {
                            if (video.webkitEnterFullscreen) {
                                video.webkitEnterFullscreen();
                            } else if (video.requestFullscreen) {
                                video.requestFullscreen();
                            }
                        }
                    } catch (e) {
                        console.error('网页全屏错误:', e);
                    }
                }
            });
        } catch (error) {
            console.error('网页全屏错误:', error);
        }
    }
    
    /**
     * 导出PDF
     */
    function exportToPDF() {
        try {
            if (!currentTab) return;
            safeSendMessage(currentTab.id, { action: 'exportPDF' });
        } catch (error) {
            console.error('导出PDF错误:', error);
        }
    }
    
    /**
     * 长截图
     */
    function takeFullScreenshot() {
        try {
            if (!currentTab) return;
            
            safeExecuteScript(currentTab.id, {
                func: () => {
                    alert('长截图功能需要额外权限，建议使用浏览器自带截图工具或第三方扩展。');
                }
            });
        } catch (error) {
            console.error('长截图错误:', error);
        }
    }
    
    /**
     * 检测原生主题
     */
    function detectNativeTheme() {
        try {
            if (!currentTab) return;
            
            safeSendMessage(currentTab.id, { action: 'detectNativeTheme' }, (response) => {
                try {
                    if (response) {
                        const { prefersDark, hasNativeDark } = response;
                        const isDark = prefersDark || hasNativeDark;
                        const darkModeEl = document.getElementById('dark-mode-toggle');
                        if (darkModeEl) darkModeEl.checked = isDark;
                        saveSiteSetting('darkMode', isDark);
                    }
                } catch (error) {
                    console.error('检测原生主题回调错误:', error);
                }
            });
        } catch (error) {
            console.error('检测原生主题错误:', error);
        }
    }
    
    /**
     * 检查AdGuard状态
     */
    function checkAdGuardStatus() {
        try {
            // 由于popup.html中没有这些元素，暂时跳过
        } catch (error) {
            console.error('检查AdGuard状态错误:', error);
        }
    }
    
    /**
     * 初始化
     */
    async function init() {
        try {
            if (!checkContextValid()) {
                console.error('扩展上下文已失效');
                return;
            }
            
            safeGetCurrentTab((tab) => {
                currentTab = tab;
                loadSettings();
                bindEventListeners();
                checkAdGuardStatus();
                detectNativeTheme();
            });
        } catch (error) {
            console.error('初始化错误:', error);
        }
    }
    
    // 启动初始化
    init();
    
    // ==================== 功能实现函数 ====================
    
    /**
     * 深色模式
     * @param {boolean} enabled 是否启用
     */
    function toggleDarkMode(enabled) {
        try {
            if (!currentTab) return;
            
            safeGetCurrentTab((tab) => {
                if (!tab) return;
                
                const url = tab.url || '';
                let domain = '';
                try {
                    domain = new URL(url).hostname || '';
                } catch (e) {
                    domain = '';
                }
                
                safeGetSettings(['whitelist', 'darkModeLevel'], (result) => {
                    try {
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
                        
                        safeExecuteScript(currentTab.id, {
                            func: (enabled, colors) => {
                                try {
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
                                } catch (e) {
                                    console.error('深色模式执行错误:', e);
                                }
                            },
                            args: [enabled, colors]
                        });
                    } catch (error) {
                        console.error('深色模式回调错误:', error);
                    }
                });
            });
        } catch (error) {
            console.error('深色模式错误:', error);
        }
    }
    
    /**
     * 更新深色模式
     */
    function updateDarkMode() {
        try {
            const darkModeEl = document.getElementById('dark-mode-toggle');
            const enabled = darkModeEl ? darkModeEl.checked : false;
            if (enabled) toggleDarkMode(true);
        } catch (error) {
            console.error('更新深色模式错误:', error);
        }
    }
    
    /**
     * 护眼黄底
     * @param {boolean} enabled 是否启用
     */
    function toggleEyeCare(enabled) {
        try {
            if (!currentTab) return;
            
            safeExecuteScript(currentTab.id, {
                func: (enabled) => {
                    try {
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
                    } catch (e) {
                        console.error('护眼黄底执行错误:', e);
                    }
                },
                args: [enabled]
            });
        } catch (error) {
            console.error('护眼黄底错误:', error);
        }
    }
    
    /**
     * 阅读模式
     * @param {boolean} enabled 是否启用
     */
    function toggleReaderMode(enabled) {
        try {
            if (!currentTab) return;
            
            safeExecuteScript(currentTab.id, {
                func: (enabled) => {
                    try {
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
                    } catch (e) {
                        console.error('阅读模式执行错误:', e);
                    }
                },
                args: [enabled]
            });
        } catch (error) {
            console.error('阅读模式错误:', error);
        }
    }
    
    /**
     * 自动滚屏
     * @param {boolean} enabled 是否启用
     */
    function toggleAutoScroll(enabled) {
        try {
            if (!currentTab) return;
            
            safeExecuteScript(currentTab.id, {
                func: (enabled) => {
                    try {
                        if (enabled) {
                            window.simpleAutoScroll = setInterval(() => {
                                window.scrollBy(0, 1);
                            }, 50);
                        } else {
                            clearInterval(window.simpleAutoScroll);
                        }
                    } catch (e) {
                        console.error('自动滚屏执行错误:', e);
                    }
                },
                args: [enabled]
            });
        } catch (error) {
            console.error('自动滚屏错误:', error);
        }
    }
    
    /**
     * 平滑滚动
     * @param {boolean} enabled 是否启用
     */
    function toggleSmoothScroll(enabled) {
        try {
            if (!currentTab) return;
            
            safeExecuteScript(currentTab.id, {
                func: (enabled) => {
                    try {
                        document.documentElement.style.scrollBehavior = enabled ? 'smooth' : 'auto';
                    } catch (e) {
                        console.error('平滑滚动执行错误:', e);
                    }
                },
                args: [enabled]
            });
        } catch (error) {
            console.error('平滑滚动错误:', error);
        }
    }
    
    /**
     * 更新文本样式
     */
    function updateTextStyle() {
        try {
            if (!currentTab) return;
            
            const fontSizeEl = document.getElementById('font-size-slider');
            const lineHeightEl = document.getElementById('line-height-slider');
            const wordSpacingEl = document.getElementById('word-spacing-slider');
            
            const fontSize = fontSizeEl ? fontSizeEl.value : 16;
            const lineHeight = lineHeightEl ? lineHeightEl.value : 1.6;
            const wordSpacing = wordSpacingEl ? wordSpacingEl.value : 0;
            
            safeExecuteScript(currentTab.id, {
                func: (fontSize, lineHeight, wordSpacing) => {
                    try {
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
                    } catch (e) {
                        console.error('文本样式执行错误:', e);
                    }
                },
                args: [fontSize, lineHeight, wordSpacing]
            });
        } catch (error) {
            console.error('更新文本样式错误:', error);
        }
    }
    
    /**
     * 强制复制
     * @param {boolean} enabled 是否启用
     */
    function toggleForceCopy(enabled) {
        try {
            if (!currentTab) return;
            
            safeExecuteScript(currentTab.id, {
                func: (enabled) => {
                    try {
                        if (enabled) {
                            ['copy', 'cut', 'paste', 'contextmenu', 'selectstart'].forEach(event => {
                                document.addEventListener(event, e => e.stopPropagation(), true);
                            });
                            let style = document.createElement('style');
                            style.id = 'simple-force-copy';
                            style.textContent = '* { user-select: text !important; -webkit-user-select: text !important; }';
                            document.head.appendChild(style);
                        } else {
                            const style = document.getElementById('simple-force-copy');
                            if (style) style.remove();
                        }
                    } catch (e) {
                        console.error('强制复制执行错误:', e);
                    }
                },
                args: [enabled]
            });
        } catch (error) {
            console.error('强制复制错误:', error);
        }
    }
    
    /**
     * 视频增强
     * @param {boolean} enabled 是否启用
     */
    function toggleVideoEnhance(enabled) {
        try {
            if (!currentTab) return;
            
            safeExecuteScript(currentTab.id, {
                func: (enabled) => {
                    try {
                        const videos = document.querySelectorAll('video');
                        videos.forEach(video => {
                            if (enabled) {
                                video.controls = true;
                                video.setAttribute('controlsList', 'nodownload');
                            }
                        });
                    } catch (e) {
                        console.error('视频增强执行错误:', e);
                    }
                },
                args: [enabled]
            });
        } catch (error) {
            console.error('视频增强错误:', error);
        }
    }
    
    /**
     * 设置视频倍速
     * @param {number} speed 播放速度
     */
    function setVideoSpeed(speed) {
        try {
            if (!currentTab) return;
            
            safeExecuteScript(currentTab.id, {
                func: (speed) => {
                    try {
                        document.querySelectorAll('video').forEach(v => v.playbackRate = speed);
                    } catch (e) {
                        console.error('视频倍速执行错误:', e);
                    }
                },
                args: [speed]
            });
        } catch (error) {
            console.error('设置视频倍速错误:', error);
        }
    }
    
    /**
     * 跳过广告
     * @param {boolean} enabled 是否启用
     */
    function toggleSkipAds(enabled) {
        try {
            if (!currentTab) return;
            
            safeExecuteScript(currentTab.id, {
                func: (enabled) => {
                    try {
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
                    } catch (e) {
                        console.error('跳过广告执行错误:', e);
                    }
                },
                args: [enabled]
            });
        } catch (error) {
            console.error('跳过广告错误:', error);
        }
    }
    
    /**
     * 禁止自动暂停
     * @param {boolean} enabled 是否启用
     */
    function togglePreventPause(enabled) {
        try {
            if (!currentTab) return;
            
            safeExecuteScript(currentTab.id, {
                func: (enabled) => {
                    try {
                        document.querySelectorAll('video').forEach(video => {
                            if (enabled) {
                                video.addEventListener('pause', () => video.play(), true);
                            }
                        });
                    } catch (e) {
                        console.error('禁止自动暂停执行错误:', e);
                    }
                },
                args: [enabled]
            });
        } catch (error) {
            console.error('禁止自动暂停错误:', error);
        }
    }
    
    /**
     * 清除跟踪参数
     * @param {boolean} enabled 是否启用
     */
    function toggleRemoveTracking(enabled) {
        try {
            if (!currentTab) return;
            
            safeExecuteScript(currentTab.id, {
                func: (enabled) => {
                    try {
                        if (enabled) {
                            const cleanUrl = () => {
                                const url = new URL(window.location.href);
                                ['utm_source', 'utm_medium', 'utm_campaign', 'fbclid', 'gclid'].forEach(p => url.searchParams.delete(p));
                                window.history.replaceState({}, '', url);
                            };
                            cleanUrl();
                        }
                    } catch (e) {
                        console.error('清除跟踪参数执行错误:', e);
                    }
                },
                args: [enabled]
            });
        } catch (error) {
            console.error('清除跟踪参数错误:', error);
        }
    }
    
    /**
     * 隐藏Cookie提示
     * @param {boolean} enabled 是否启用
     */
    function toggleHideCookie(enabled) {
        try {
            if (!currentTab) return;
            
            safeExecuteScript(currentTab.id, {
                func: (enabled) => {
                    try {
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
                    } catch (e) {
                        console.error('隐藏Cookie提示执行错误:', e);
                    }
                },
                args: [enabled]
            });
        } catch (error) {
            console.error('隐藏Cookie提示错误:', error);
        }
    }
    
    /**
     * 禁止媒体权限
     * @param {boolean} enabled 是否启用
     */
    function toggleBlockMediaPermission(enabled) {
        try {
            if (!currentTab) return;
            
            safeExecuteScript(currentTab.id, {
                func: (enabled) => {
                    try {
                        if (enabled) {
                            navigator.mediaDevices.getUserMedia = () => Promise.reject(new Error('Blocked'));
                        }
                    } catch (e) {
                        console.error('禁止媒体权限执行错误:', e);
                    }
                },
                args: [enabled]
            });
        } catch (error) {
            console.error('禁止媒体权限错误:', error);
        }
    }
    
    /**
     * 防指纹追踪
     * @param {boolean} enabled 是否启用
     */
    function toggleAntiFingerprint(enabled) {
        try {
            if (!currentTab) return;
            
            safeExecuteScript(currentTab.id, {
                func: (enabled) => {
                    try {
                        if (enabled) {
                            Object.defineProperty(navigator, 'webdriver', { get: () => false });
                            Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3] });
                        }
                    } catch (e) {
                        console.error('防指纹追踪执行错误:', e);
                    }
                },
                args: [enabled]
            });
        } catch (error) {
            console.error('防指纹追踪错误:', error);
        }
    }
    
    /**
     * 页面净化
     * @param {boolean} enabled 是否启用
     */
    function toggleCleanPage(enabled) {
        try {
            if (!currentTab) return;
            
            safeExecuteScript(currentTab.id, {
                func: (enabled) => {
                    try {
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
                    } catch (e) {
                        console.error('页面净化执行错误:', e);
                    }
                },
                args: [enabled]
            });
        } catch (error) {
            console.error('页面净化错误:', error);
        }
    }
    
    /**
     * 屏蔽弹窗
     * @param {boolean} enabled 是否启用
     */
    function toggleBlockPopups(enabled) {
        try {
            if (!currentTab) return;
            
            safeExecuteScript(currentTab.id, {
                func: (enabled) => {
                    try {
                        if (enabled) {
                            window.open = () => null;
                            window.alert = () => null;
                            window.confirm = () => true;
                        }
                    } catch (e) {
                        console.error('屏蔽弹窗执行错误:', e);
                    }
                },
                args: [enabled]
            });
        } catch (error) {
            console.error('屏蔽弹窗错误:', error);
        }
    }
    
    /**
     * 禁止自动刷新
     * @param {boolean} enabled 是否启用
     */
    function toggleBlockRefresh(enabled) {
        try {
            if (!currentTab) return;
            
            safeExecuteScript(currentTab.id, {
                func: (enabled) => {
                    try {
                        if (enabled) {
                            const meta = document.querySelector('meta[http-equiv="refresh"]');
                            if (meta) meta.remove();
                            Object.defineProperty(window.location, 'reload', { value: () => {} });
                        }
                    } catch (e) {
                        console.error('禁止自动刷新执行错误:', e);
                    }
                },
                args: [enabled]
            });
        } catch (error) {
            console.error('禁止自动刷新错误:', error);
        }
    }
    
    /**
     * 关闭GIF动画
     * @param {boolean} enabled 是否启用
     */
    function toggleBlockGif(enabled) {
        try {
            if (!currentTab) return;
            
            safeExecuteScript(currentTab.id, {
                func: (enabled) => {
                    try {
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
                    } catch (e) {
                        console.error('关闭GIF动画执行错误:', e);
                    }
                },
                args: [enabled]
            });
        } catch (error) {
            console.error('关闭GIF动画错误:', error);
        }
    }
    
    // 定时刷新
    let refreshInterval = null;
    
    /**
     * 设置自动刷新
     * @param {number} seconds 刷新间隔（秒）
     */
    function setupAutoRefresh(seconds) {
        try {
            if (refreshInterval) clearInterval(refreshInterval);
            if (seconds > 0 && currentTab) {
                refreshInterval = setInterval(() => {
                    if (currentTab) chrome.tabs.reload(currentTab.id);
                }, seconds * 1000);
            }
        } catch (error) {
            console.error('设置自动刷新错误:', error);
        }
    }
    
    /**
     * 切换UA
     * @param {string} type UA类型
     */
    function toggleUserAgent(type) {
        try {
            if (!currentTab) return;
            
            safeExecuteScript(currentTab.id, {
                func: (type) => {
                    try {
                        const uas = {
                            mobile: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
                            desktop: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                        };
                        if (type !== 'default') {
                            Object.defineProperty(navigator, 'userAgent', { get: () => uas[type] || navigator.userAgent });
                        }
                    } catch (e) {
                        console.error('切换UA执行错误:', e);
                    }
                },
                args: [type]
            });
        } catch (error) {
            console.error('切换UA错误:', error);
        }
    }
    
    /**
     * 深色模式增强
     * @param {boolean} enabled 是否启用
     */
    function toggleEnhancedDark(enabled) {
        try {
            if (!currentTab) return;
            
            safeExecuteScript(currentTab.id, {
                func: (enabled) => {
                    try {
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
                    } catch (e) {
                        console.error('深色模式增强执行错误:', e);
                    }
                },
                args: [enabled]
            });
        } catch (error) {
            console.error('深色模式增强错误:', error);
        }
    }
    
})();
