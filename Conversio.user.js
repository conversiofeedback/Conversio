// ==UserScript==
// @name        Conversio - CRM & Sauron ver. (20.2) Release
// @namespace   http://tampermonkey.net
// @version     20.2
// @description Фоновая проверка обновлений, копирование ФИО и даты рождения.
// @match       *://*/*
// @grant       GM_xmlhttpRequest
// @connect     raw.githubusercontent.com
// @run-at      document-end
// @updateURL   https://raw.githubusercontent.com/conversiofeedback/Conversio/main/Conversio.user.js
// @downloadURL https://raw.githubusercontent.com/conversiofeedback/Conversio/main/Conversio.user.js
// ==/UserScript==

(function() {
    'use strict';

    const SCRIPT_VERSION = '20.2';
    const SCRIPT_DESC = 'Фоновая проверка обновлений, копирование ФИО и даты рождения.';
    const RAW_SCRIPT_URL = 'https://raw.githubusercontent.com/conversiofeedback/Conversio/main/Conversio.user.js';
    
    // 4 часа (в миллисекундах) + случайный разброс от -15 до +15 минут для распределения нагрузки
    const BASE_INTERVAL = 4 * 60 * 60 * 1000;
    const RANDOM_JITTER = (Math.random() * 30 - 15) * 60 * 1000;
    const CHECK_INTERVAL = BASE_INTERVAL + RANDOM_JITTER;

    const CHANGELOG_TEXT = [
        '🎉 Скрипт вышел из беты в полноценный релиз!',
        '🔄 Добавлена фоновая проверка обновлений',
        '🔔 Появление умного баннера при выходе новой версии',
        '🛠️ Исправлена проблема с доступом к буферу обмена'
    ];

    let crmTimeoutHold = null;
    let crmTimeoutFade = null;

    // --- БЛОК АВТОМАТИЧЕСКОЙ ПРОВЕРКИ ОБНОВЛЕНИЙ ---
    function checkAutoUpdate() {
        const lastCheck = parseInt(localStorage.getItem('conversio_last_update_check') || '0', 10);
        const now = Date.now();

        if (now - lastCheck < CHECK_INTERVAL) return;

        localStorage.setItem('conversio_last_update_check', now.toString());

        GM_xmlhttpRequest({
            method: 'GET',
            url: RAW_SCRIPT_URL + '?t=' + now,
            onload: function(response) {
                if (response.status === 200) {
                    const remoteText = response.responseText;
                    const versionMatch = remoteText.match(/\/\/\s*@version\s+([\d\.]+)/);
                    
                    if (versionMatch && versionMatch[1]) {
                        const remoteVersion = versionMatch[1].trim();
                        
                        if (parseFloat(remoteVersion) > parseFloat(SCRIPT_VERSION)) {
                            showUpdateBanner(remoteVersion);
                        }
                    }
                }
            }
        });
    }

    function showUpdateBanner(newVersion) {
        if (document.getElementById('conversio-update-banner')) return;

        const banner = document.createElement('div');
        banner.id = 'conversio-update-banner';
        banner.style = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            z-index: 99999999;
            background: #2d264f;
            color: #ffffff;
            border: 2px solid #10b981;
            border-radius: 8px;
            padding: 12px 16px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.5), 0 0 10px rgba(16, 185, 129, 0.3);
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            font-size: 13px;
            display: flex;
            align-items: center;
            gap: 12px;
            animation: fadeIn 0.3s ease;
        `;

        banner.innerHTML = `
            <div>
                🚀 Доступна версия <b>${newVersion}</b>!
            </div>
            <button id="conversio-update-btn" style="background:#10b981; border:none; color:#fff; padding: 6px 12px; border-radius: 5px; font-weight:bold; font-size: 12px; cursor:pointer; transition: background 0.2s;">
                Обновить
            </button>
            <span id="conversio-close-banner" style="cursor:pointer; color:#a29bfe; font-weight:bold; font-size: 16px; margin-left: 4px;">&times;</span>
        `;

        document.body.appendChild(banner);

        const updateBtn = document.getElementById('conversio-update-btn');
        const closeBtn = document.getElementById('conversio-close-banner');

        updateBtn.onclick = () => {
            window.location.href = RAW_SCRIPT_URL;
            banner.remove();
        };

        closeBtn.onclick = () => {
            banner.remove();
        };
    }

    function smartCleanText(str) {
        if (!str) return '';
        return str.trim();
    }

    function showTutorialModal() {
        if (localStorage.getItem('conversio_hide_tutorial') === 'true') return;
        if (document.getElementById('conversio-modal')) return;

        const modal = document.createElement('div');
        modal.id = 'conversio-modal';
        modal.style = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 460px;
            max-width: 90vw;
            background: #2d264f;
            color: #ffffff;
            border: 2px solid #6c5ce7;
            border-radius: 12px;
            padding: 24px;
            box-shadow: 0 15px 35px rgba(0,0,0,0.6), 0 0 15px rgba(108, 92, 231, 0.4);
            z-index: 99999999;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            word-break: keep-all;
            overflow-wrap: break-word;
            hyphens: none;
        `;

        modal.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 14px; border-bottom: 1px solid #433878; padding-bottom: 10px;">
                <strong style="color: #ffffff; font-size: 16px; display:flex; align-items:center; gap: 6px;">
                    <span>👋</span> Добро пожаловать в Conversio!
                </strong>
                <span id="close-modal-btn" style="cursor:pointer; color:#a29bfe; font-weight:bold; font-size: 20px;">&times;</span>
            </div>
            <div style="font-size: 13px; line-height: 1.6; color: #dcdde1; margin-bottom: 18px; word-break: keep-all;">
                <p style="margin-top:0; margin-bottom: 12px;">
                    <b>📋 Копирование лида (CRM):</b><br>
                    Нажми «Копировать ФИО и&nbsp;дату»&nbsp;— данные лида будут скопированы в&nbsp;подходящем формате для Sauron:<br>
                    <code style="background: rgba(0,0,0,0.3); padding: 2px 6px; border-radius: 4px; display: inline-block; margin-top: 4px;">(Фамилия Имя Отчество ДД.ММ.ГГГГ).</code>
                </p>
                <p style="margin-bottom: 12px;">
                    <b>🔍 Мгновенный пробив (Sauron):</b><br>
                    Кнопка «Вставить и&nbsp;пробить клиента» автоматически вставит текст и&nbsp;сразу запустит поиск.
                </p>
                <p style="margin-bottom: 0;">
                    <b>📞 Быстрый звонок (Sauron):</b><br>
                    Наведи курсор на&nbsp;номер телефона и&nbsp;нажми на&nbsp;колесико&nbsp;мыши&nbsp;<span style="white-space:nowrap;">(СКМ)</span>&nbsp;— номер подсветится и&nbsp;будет автоматически набран в&nbsp;MicroSIP.
                </p>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; border-top: 1px solid #433878; padding-top: 14px;">
                <label style="font-size: 12px; color: #a29bfe; cursor:pointer; display:flex; align-items:center; gap: 6px; user-select:none;">
                    <input type="checkbox" id="dont-show-again" style="cursor:pointer; accent-color: #6c5ce7;">
                    Больше не показывать
                </label>
                <button id="ack-modal-btn" style="background:#10b981; border:none; color:#fff; padding: 8px 18px; border-radius: 6px; font-weight:bold; font-size: 13px; cursor:pointer; box-shadow: 0 2px 8px rgba(16, 185, 129, 0.4); transition: background 0.2s;">
                    Понятно!
                </button>
            </div>
        `;

        document.body.appendChild(modal);

        const closeBtn = document.getElementById('close-modal-btn');
        const ackBtn = document.getElementById('ack-modal-btn');
        const dontShowCheckbox = document.getElementById('dont-show-again');

        const saveAndClose = () => {
            if (dontShowCheckbox && dontShowCheckbox.checked) {
                localStorage.setItem('conversio_hide_tutorial', 'true');
            }
            modal.remove();
        };

        if (closeBtn) closeBtn.onclick = saveAndClose;
        if (ackBtn) ackBtn.onclick = saveAndClose;
    }

    function checkChangelog() {
        const savedVersion = localStorage.getItem('conversio_version');
        
        if (!savedVersion) {
            showTutorialModal();
            localStorage.setItem('conversio_version', SCRIPT_VERSION);
        } else if (savedVersion !== SCRIPT_VERSION) {
            showTutorialModal();
            showChangelogModal();
            localStorage.setItem('conversio_version', SCRIPT_VERSION);
        } else {
            showTutorialModal();
        }
    }

    function showChangelogModal() {
        if (document.getElementById('conversio-changelog-modal')) return;

        const modal = document.createElement('div');
        modal.id = 'conversio-changelog-modal';
        modal.style = `
            position: fixed;
            bottom: 24px;
            right: 24px;
            width: 380px;
            max-width: 90vw;
            background: #2d264f;
            color: #ffffff;
            border: 2px solid #6c5ce7;
            border-radius: 10px;
            padding: 18px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.6), 0 0 12px rgba(108, 92, 231, 0.3);
            z-index: 99999999;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            word-break: keep-all;
            overflow-wrap: break-word;
        `;

        let listHtml = CHANGELOG_TEXT.map(item => `<li style="margin-bottom: 6px; font-size: 12px; line-height: 1.4; color: #dcdde1;">${item}</li>`).join('');

        modal.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 8px; border-bottom: 1px solid #433878; padding-bottom: 6px;">
                <strong style="color: #ffffff; font-size: 14px;">🚀 Обновление Conversio v${SCRIPT_VERSION}</strong>
                <span id="close-changelog" style="cursor:pointer; color:#a29bfe; font-weight:bold; font-size: 18px;">&times;</span>
            </div>
            <div style="font-size: 11px; color: #a29bfe; margin-bottom: 10px; font-style: italic;">
                ${SCRIPT_DESC}
            </div>
            <ul style="padding-left: 18px; margin: 0 0 14px 0;">
                ${listHtml}
            </ul>
            <button id="ack-changelog" style="width:100%; background:#10b981; border:none; color:#fff; padding: 8px; border-radius: 6px; font-weight:bold; font-size: 12px; cursor:pointer; box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);">
                Отлично, закрыть!
            </button>
        `;

        document.body.appendChild(modal);

        const closeBtn = document.getElementById('close-changelog');
        const ackBtn = document.getElementById('ack-changelog');
        const removeModal = () => modal.remove();

        if (closeBtn) closeBtn.onclick = removeModal;
        if (ackBtn) ackBtn.onclick = removeModal;
    }

    const style = document.createElement('style');
    style.innerHTML = '@keyframes sFl{0%,100%{transform:scale(1) rotate(-1deg);opacity:0.9}50%{transform:scale(1.15) rotate(2deg);opacity:1;filter:drop-shadow(0 0 3px #ffd700)}}.sauron-cake-wrap{display:block;margin-top:6px;margin-left:2px;}.s-ck{display:inline-flex;align-items:flex-end;position:relative;width:22px;height:22px;vertical-align:middle;}.s-cb{position:absolute;bottom:0;width:22px;height:11px;background:#ff6496;border-radius:3px 3px 1px 1px;box-shadow:inset 0 -2px 0 #e6467d,0 1px 2px rgba(0,0,0,0.2)}.s-cc{position:absolute;bottom:7px;width:22px;height:2px;background:#fff;border-radius:1px}.s-cd{position:absolute;bottom:11px;width:2px;height:5px;background:#00e5ff;border-radius:1px}.s-cd:nth-child(1){left:3px}.s-cd:nth-child(2){left:10px;background:#ffdf00}.s-cd:nth-child(3){left:17px}.s-fm{position:absolute;top:-4px;left:-1px;width:4px;height:4px;background:#ff5722;border-radius:50% 50% 20% 20%;transform-origin:bottom center;animation:sFl .5s infinite ease-in-out}.s-cd:nth-child(2) .s-fm{animation-delay:.1s;background:#ff9800}.s-cd:nth-child(3) .s-fm{animation-delay:.2s}';
    document.head.appendChild(style);

    function isBD(str) {
        if (!str || !str.includes('-')) return false;
        const p = str.trim().split('-');
        if (p.length !== 3) return false;
        const today = new Date();
        return (p[2].padStart(2,'0') === today.getDate().toString().padStart(2,'0') && p[1].padStart(2,'0') === (today.getMonth()+1).toString().padStart(2,'0'));
    }

    function convertDate(str) {
        if (!str) return '';
        const parts = str.match(/\d+/g);
        if (!parts || parts.length < 3) return str;

        let day, month, year;
        if (parts.length > 2) {
            year = parts[0]; month = parts[1]; day = parts[2];
        } else {
            day = parts[0]; month = parts[1]; year = parts[2];
        }
        return `${day.padStart(2, '0')}.${month.padStart(2, '0')}.${year}`;
    }

    // 1. ЛОГИКА CRM (ЛЕВАЯ ВКЛАДКА) — Баннер обновления срабатывает только здесь
    if (window.location.href.includes('jrrgoxf-nreu-rwkhuv.top')) {
        let btn = null;
        let isSuccessState = false;

        checkAutoUpdate();
        setTimeout(checkChangelog, 1000);

        setInterval(function() {
            let fioIn = document.getElementById('importField-770') || document.querySelector('textarea[data-id="770"]');
            let dateIn = document.getElementById('importField-4815') || document.querySelector('textarea[data-id="4815"]');

            if (dateIn && dateIn.value) {
                const birthday = isBD(dateIn.value);
                const existingCake = document.getElementById('sauron-cake-id');

                if (birthday) {
                    if (!existingCake) {
                        const cakeWrap = document.createElement('div');
                        cakeWrap.id = 'sauron-cake-id';
                        cakeWrap.className = 'sauron-cake-wrap';
                        cakeWrap.innerHTML = '<div class="s-ck"><div class="s-cd"><div class="s-fm"></div></div><div class="s-cd"><div class="s-fm"></div></div><div class="s-cd"><div class="s-fm"></div></div><div class="s-cb"></div><div class="s-cc"></div></div>';
                        dateIn.parentNode.appendChild(cakeWrap);
                    }
                    if (btn && !btn.innerHTML.includes('🎂') && !btn.innerHTML.includes('✅')) {
                        btn.setAttribute('data-bd', 'true');
                        btn.innerHTML = '🎂 ДР КЛИЕНТА! Копировать 🎂';
                        if (!isSuccessState) {
                            btn.style.backgroundColor = '#8e2a59';
                            btn.style.borderColor = '#ff6496';
                        }
                    }
                } else {
                    if (existingCake) existingCake.remove();
                    if (btn && btn.innerHTML.includes('🎂') && !btn.innerHTML.includes('✅')) {
                        btn.removeAttribute('data-bd');
                        btn.innerHTML = '📋 Копировать фио и дату';
                        if (!isSuccessState) {
                            btn.style.backgroundColor = '#2d264f';
                            btn.style.borderColor = '#6c5ce7';
                        }
                    }
                }
            }

            if (fioIn && dateIn && !document.getElementById('sauron-copy-btn')) {
                btn = document.createElement('button');
                btn.id = 'sauron-copy-btn';

                const isBirthday = dateIn.value && isBD(dateIn.value);
                if (isBirthday) {
                    btn.setAttribute('data-bd', 'true');
                    btn.innerHTML = '🎂 ДР КЛИЕНТА! Копировать 🎂';
                } else {
                    btn.innerHTML = '📋 Копировать фио и дату';
                }

                btn.style = `
                    position: fixed;
                    top: 59px;
                    right: 0px;
                    z-index: 99999999;
                    padding: 10px 16px;
                    background: ${isBirthday ? '#8e2a59' : '#2d264f'};
                    color: #ffffff;
                    border: 1px solid ${isBirthday ? '#ff6496' : '#6c5ce7'};
                    border-right: none;
                    border-radius: 6px 0 0 6px;
                    cursor: pointer;
                    box-shadow: -2px 2px 8px rgba(0, 0, 0, 0.4);
                    font-weight: bold;
                    font-size: 13px;
                    white-space: nowrap;
                    display: block;
                    transition: background 0.6s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.6s ease, box-shadow 0.6s ease;
                `;

                btn.onmouseenter = function() {
                    if (isSuccessState) return;
                    const bd = this.hasAttribute('data-bd');
                    this.style.background = bd ? '#a8326b' : '#6c5ce7';
                    this.style.boxShadow = bd ? '-2px 2px 14px rgba(255, 100, 150, 0.6)' : '-2px 2px 14px rgba(108, 92, 231, 0.6)';
                };
                btn.onmouseleave = function() {
                    if (isSuccessState) return;
                    const bd = this.hasAttribute('data-bd');
                    this.style.background = bd ? '#8e2a59' : '#2d264f';
                    this.style.boxShadow = '-2px 2px 8px rgba(0, 0, 0, 0.4)';
                };

                btn.onclick = function(e) {
                    e.preventDefault();
                    if (fioIn.value && dateIn.value) {
                        const formattedDate = convertDate(dateIn.value);
                        const finalData = `${fioIn.value.trim()} ${formattedDate}`;

                        navigator.clipboard.writeText(finalData).then(() => {
                            clearTimeout(crmTimeoutHold);
                            clearTimeout(crmTimeoutFade);

                            isSuccessState = true;

                            btn.style.backgroundColor = '#10b981';
                            btn.style.borderColor = '#34d399';
                            btn.style.boxShadow = '-2px 2px 16px rgba(16, 185, 129, 0.8)';

                            const phrases = ['✅ Скопировано!', '✅ Дело сделано!', '✅ Теперь в Sauron!', '✅ Осталось передать!', '✅ Уже на банкомате!', '✅ Скорее набирай!'];
                            btn.innerHTML = phrases[Math.floor(Math.random() * phrases.length)];

                            crmTimeoutHold = setTimeout(() => {
                                const bd = btn.hasAttribute('data-bd');
                                btn.style.backgroundColor = bd ? '#8e2a59' : '#2d264f';
                                btn.style.borderColor = bd ? '#ff6496' : '#6c5ce7';
                                btn.style.boxShadow = '-2px 2px 8px rgba(0, 0, 0, 0.4)';

                                crmTimeoutFade = setTimeout(() => {
                                    isSuccessState = false;
                                    if (btn && dateIn) {
                                        btn.innerHTML = btn.hasAttribute('data-bd') ? '🎂 ДР КЛИЕНТА! Копировать 🎂' : '📋 Копировать фио и дату';
                                    }
                                }, 600);
                            }, 3000);
                        });
                    } else { alert('Поля пустые!'); }
                };
                document.body.appendChild(btn);
            }
        }, 500);
    }

    // 2. ЛОГИКА SAURON (ПРАВАЯ ВКЛАДКА) — Проверка обновлений здесь не запускается
    if (window.location.href.includes('sauron.info')) {

        function isLightTheme() {
            if (document.documentElement.classList.contains('light') || document.body.classList.contains('light')) return true;
            if (document.documentElement.getAttribute('data-theme') === 'light' || document.body.getAttribute('data-theme') === 'light') return true;
            
            const bg = window.getComputedStyle(document.body).backgroundColor;
            const rgb = bg.match(/\d+/g);
            if (rgb && rgb.length >= 3) {
                return (parseInt(rgb[0]) + parseInt(rgb[1]) + parseInt(rgb[2])) / 3 > 150;
            }
            return false;
        }

        function updateButtonTheme() {
            const btn = document.getElementById('sauron-paste-btn');
            if (!btn) return;

            btn.style.background = '#D05A28';
            btn.style.borderColor = isLightTheme() ? '#B3461B' : '#E26833';
        }

        document.addEventListener('mousedown', function(e) {
            if (e.button === 1) {
                const target = e.target;
                if (!target) return;

                const isPhoneElement = (target.classList && target.classList.contains('rh-text')) ||
                                       (/^\+?[\d\s\-\(\)]+$/.test(target.innerText.trim()) && target.innerText.trim().length >= 10);

                if (isPhoneElement) {
                    let rawPhone = target.innerText.trim();
                    let cleanPhone = rawPhone.replace(/\D/g, '');
                    if (cleanPhone.startsWith('8')) cleanPhone = '7' + cleanPhone.substring(1);

                    if (cleanPhone.length >= 10) {
                        e.preventDefault(); e.stopPropagation();
                        
                        target.style.color = '#D05A28';
                        target.style.transition = 'color 0.2s ease';
                        setTimeout(() => { target.style.color = ''; }, 1200);

                        navigator.clipboard.writeText(cleanPhone);

                        const iframe = document.createElement('iframe');
                        iframe.style.display = 'none';
                        iframe.src = `sip:${cleanPhone}`;
                        document.body.appendChild(iframe);
                        setTimeout(() => { document.body.removeChild(iframe); }, 300);
                    }
                }
            }
        });

        document.addEventListener('keydown', function(e) {
            const sIn = document.getElementById('search') || document.querySelector('input[name="query"]');

            if (document.activeElement === sIn && e.key === 'Enter') {
                const manualText = sIn.value ? sIn.value.trim() : '';

                if (manualText !== '') {
                    e.stopImmediatePropagation();
                    e.preventDefault();

                    const cleanedText = smartCleanText(manualText);
                    sIn.value = cleanedText;

                    navigator.clipboard.writeText(cleanedText).then(() => {
                        const sBtn = document.querySelector('button.hs-go') || document.querySelector('button[type="submit"]');
                        if (sBtn) { sBtn.click(); }
                        else if (sIn.form) { sIn.form.submit(); }
                    });
                }
            }
        }, true);

        setInterval(function() {
            const themeBtn = document.getElementById('theme-toggle');
            if (themeBtn && !themeBtn.hasAttribute('data-sauron-bound')) {
                themeBtn.setAttribute('data-sauron-bound', 'true');
                themeBtn.addEventListener('click', function() {
                    setTimeout(updateButtonTheme, 50);
                });
            }

            const sIn = document.getElementById('search') || document.querySelector('input[name="query"]');
            if (sIn && !document.getElementById('sauron-paste-btn')) {
                const container = sIn.parentNode;
                if (container) {
                    container.style.position = 'relative';
                    container.style.display = 'flex';
                    container.style.alignItems = 'center';
                }
                sIn.style.paddingRight = '265px';

                const actBtn = document.createElement('button');
                actBtn.id = 'sauron-paste-btn';
                actBtn.innerHTML = '🔍 Вставить и пробить клиента';
                
                const light = isLightTheme();
                actBtn.style = `
                    position: absolute;
                    right: 98px;
                    top: 50%;
                    transform: translateY(-48%);
                    height: calc(100% - 6px);
                    max-height: 38px;
                    padding: 0 14px;
                    background: #D05A28;
                    color: #fff;
                    border: 1px solid ${light ? '#B3461B' : '#E26833'};
                    border-radius: 4px;
                    cursor: pointer;
                    font-weight: bold;
                    font-size: 12px;
                    white-space: nowrap;
                    z-index: 10;
                    transition: all 0.15s ease;
                `;

                actBtn.onmouseenter = function() { 
                    const isLight = isLightTheme();
                    this.style.background = isLight ? '#B3461B' : '#F17138'; 
                    this.style.borderColor = isLight ? '#963812' : '#F8834F';
                };
                actBtn.onmouseleave = function() { 
                    const isLight = isLightTheme();
                    this.style.background = '#D05A28'; 
                    this.style.borderColor = isLight ? '#B3461B' : '#E26833';
                };

                actBtn.onmousedown = function() {
                    const isLight = isLightTheme();
                    this.style.background = isLight ? '#963812' : '#E26229';
                };
                actBtn.onmouseup = function() {
                    const isLight = isLightTheme();
                    this.style.background = isLight ? '#B3461B' : '#F17138';
                };

                actBtn.onclick = function(e) {
                    e.preventDefault(); e.stopPropagation();

                    sIn.focus();
                    const pasted = document.execCommand('paste');

                    if (!pasted || !sIn.value.trim()) {
                        navigator.clipboard.readText().then(text => {
                            const rawText = text ? text.trim() : '';
                            if (rawText) {
                                sIn.value = smartCleanText(rawText);
                                sIn.dispatchEvent(new Event('input', { bubbles: true }));
                                sIn.dispatchEvent(new Event('change', { bubbles: true }));
                            }
                        }).catch(() => {});
                    }

                    setTimeout(() => {
                        const cleanText = smartCleanText(sIn.value);
                        if (cleanText) {
                            sIn.value = cleanText;
                            sIn.dispatchEvent(new Event('input', { bubbles: true }));
                            sIn.dispatchEvent(new Event('change', { bubbles: true }));

                            const sBtn = document.querySelector('button.hs-go') || document.querySelector('button[type="submit"]');
                            if (sBtn) { sBtn.click(); }
                            else if (sIn.form) { sIn.form.submit(); }
                        } else {
                            alert('Буфер обмена пуст или поле ввода не заполнилось! Сначала скопируйте данные из CRM.');
                        }
                    }, 150);
                };
                sIn.insertAdjacentElement('afterend', actBtn);

                const themeObserver = new MutationObserver(() => updateButtonTheme());
                themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme', 'style'] });
                themeObserver.observe(document.body, { attributes: true, attributeFilter: ['class', 'data-theme', 'style'] });
            }
        }, 500);
    }
})();
