// ==UserScript==
// @name        Conversio - CRM & Sauron ver. (21.1) Release
// @namespace   http://tampermonkey.net
// @version     21.1
// @description Фоновая проверка обновлений, запрет разрыва слов, автозвонок и копирование номеров в Sauron, точные фирменные цвета кнопки.
// @match       *://*/*
// @grant       GM_xmlhttpRequest
// @connect     raw.githubusercontent.com
// @run-at      document-end
// @updateURL   https://raw.githubusercontent.com/conversiofeedback/Conversio/main/Conversio.user.js
// @downloadURL https://raw.githubusercontent.com/conversiofeedback/Conversio/main/Conversio.user.js
// ==/UserScript==

(function() {
    'use strict';

    const SCRIPT_VERSION = '21.1';
    const SCRIPT_DESC = 'Версия 21.1: Актуализированы точные оттенки цветов кнопки и логика подсветки для светлой и темной тем Sauron.';
    const RAW_SCRIPT_URL = 'https://raw.githubusercontent.com/conversiofeedback/Conversio/main/Conversio.user.js';

    // 4 часа (в миллисекундах) + случайный разброс от -15 до +15 минут
    const BASE_INTERVAL = 4 * 60 * 60 * 1000;
    const RANDOM_JITTER = (Math.random() * 30 - 15) * 60 * 1000;
    const CHECK_INTERVAL = BASE_INTERVAL + RANDOM_JITTER;

    const CHANGELOG_TEXT = [
        '🚀 Версия 21.1',
        '✨ Актуализированы точные оттенки цветов кнопки и логика подсветки для тем Sauron',
    ];

    let crmTimeoutHold = null;

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
            word-break: normal;
            overflow-wrap: break-word;
        `;

        banner.innerHTML = `
            <div>
                🚀 Доступна версия <b>${newVersion}</b>!
            </div>
            <button id="conversio-update-btn" style="background-color:#10b981; border:none; color:#fff; padding: 6px 12px; border-radius: 5px; font-weight:bold; font-size: 12px; cursor:pointer; transition: background-color 0.2s;">
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
            width: 480px;
            max-width: 90vw;
            background: #2d264f;
            color: #ffffff;
            border: 2px solid #6c5ce7;
            border-radius: 12px;
            padding: 24px;
            box-shadow: 0 15px 35px rgba(0,0,0,0.6), 0 0 15px rgba(108, 92, 231, 0.4);
            z-index: 99999999;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            word-break: normal;
            overflow-wrap: break-word;
        `;

        modal.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 14px; border-bottom: 1px solid #433878; padding-bottom: 10px;">
                <strong style="color: #ffffff; font-size: 16px; display:flex; align-items:center; gap: 6px;">
                    <span>👋</span> Добро пожаловать в Conversio!
                </strong>
                <span id="close-modal-btn" style="cursor:pointer; color:#a29bfe; font-weight:bold; font-size: 20px;">&times;</span>
            </div>
            <div style="font-size: 13px; line-height: 1.6; color: #dcdde1; margin-bottom: 18px; word-break: normal; overflow-wrap: break-word;">
                <p style="margin-top:0; margin-bottom: 12px;">
                    <b>📋 Копирование лида (CRM):</b><br>
                    Нажми «Копировать ФИО и дату» — данные лида будут скопированы в подходящем формате для Sauron:<br>
                    <code style="background: rgba(0,0,0,0.3); padding: 2px 6px; border-radius: 4px; display: inline-block; margin-top: 4px; color: #a29bfe; font-size: 12px;">Фамилия Имя Отчество ДД.ММ.ГГГГ</code>
                </p>
                <p style="margin-bottom: 12px;">
                    <b>🔍 Мгновенный пробив (Sauron):</b><br>
                    Кнопка «Вставить и пробить клиента» автоматически вставит текст и запустит поиск.
                </p>
                <p style="margin-bottom: 0;">
                    <b>📞 Работа с номерами в Sauron:</b><br>
                    Рядом с каждым номером доступна кнопка 📋 для быстрого копирования в буфер обмена.<br>
                    Клик по самому номеру мгновенно совершает автозвонок в MicroSIP.
                </p>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; border-top: 1px solid #433878; padding-top: 14px;">
                <label style="font-size: 12px; color: #a29bfe; cursor:pointer; display:flex; align-items:center; gap: 6px; user-select:none;">
                    <input type="checkbox" id="dont-show-again" style="cursor:pointer; accent-color: #6c5ce7;">
                    Больше не показывать
                </label>
                <button id="ack-modal-btn" style="background-color:#10b981; border:none; color:#fff; padding: 8px 18px; border-radius: 6px; font-weight:bold; font-size: 13px; cursor:pointer; box-shadow: 0 2px 8px rgba(16, 185, 129, 0.4);">
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
            word-break: normal;
            overflow-wrap: break-word;
        `;

        let listHtml = CHANGELOG_TEXT.slice(1).map(item => `<li style="margin-bottom: 6px; font-size: 12px; line-height: 1.4; color: #dcdde1; word-break: normal; overflow-wrap: break-word;">${item}</li>`).join('');

        modal.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 8px; border-bottom: 1px solid #433878; padding-bottom: 6px;">
                <strong style="color: #ffffff; font-size: 14px;">🚀 Обновление Conversio v${SCRIPT_VERSION}</strong>
                <span id="close-changelog" style="cursor:pointer; color:#a29bfe; font-weight:bold; font-size: 18px;">&times;</span>
            </div>
            <div style="font-size: 11px; color: #a29bfe; margin-bottom: 10px; font-style: italic; word-break: normal; overflow-wrap: break-word;">
                ${SCRIPT_DESC}
            </div>
            <ul style="padding-left: 18px; margin: 0 0 14px 0;">
                ${listHtml}
            </ul>
            <button id="ack-changelog" style="width:100%; background-color:#10b981; border:none; color:#fff; padding: 8px; border-radius: 6px; font-weight:bold; font-size: 12px; cursor:pointer;">
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

    // --- СТИЛИ КНОПКИ В CRM ---
    const style = document.createElement('style');
    style.innerHTML = `
        /* Анимация праздничного тортика */
        @keyframes sFl{0%,100%{transform:scale(1) rotate(-1deg);opacity:0.9}50%{transform:scale(1.15) rotate(2deg);opacity:1;filter:drop-shadow(0 0 3px #ffd700)}}
        .sauron-cake-wrap{display:block;margin-top:6px;margin-left:2px;}
        .s-ck{display:inline-flex;align-items:flex-end;position:relative;width:22px;height:22px;vertical-align:middle;}
        .s-cb{position:absolute;bottom:0;width:22px;height:11px;background:#ff6496;border-radius:3px 3px 1px 1px;box-shadow:inset 0 -2px 0 #e6467d,0 1px 2px rgba(0,0,0,0.2)}
        .s-cc{position:absolute;bottom:7px;width:22px;height:2px;background:#fff;border-radius:1px}
        .s-cd{position:absolute;bottom:11px;width:2px;height:5px;background:#00e5ff;border-radius:1px}
        .s-cd:nth-child(1){left:3px}
        .s-cd:nth-child(2){left:10px;background:#ffdf00}
        .s-cd:nth-child(3){left:17px}
        .s-fm{position:absolute;top:-4px;left:-1px;width:4px;height:4px;background:#ff5722;border-radius:50% 50% 20% 20%;transform-origin:bottom center;animation:sFl .5s infinite ease-in-out}
        .s-cd:nth-child(2) .s-fm{animation-delay:.1s;background:#ff9800}
        .s-cd:nth-child(3) .s-fm{animation-delay:.2s}

        /* АНИМАЦИИ ВСПЫШЕК */
        @keyframes glowForward {
            0% { left: -150%; }
            100% { left: 150%; }
        }
        @keyframes glowBackward {
            0% { left: 150%; }
            100% { left: -150%; }
        }

        /* Главная кнопка в CRM (Базовое состояние) */
        .conversio-main-btn {
            position: fixed;
            top: 59px;
            right: 0px;
            z-index: 99999999;
            padding: 0;
            background-color: #2d264f;
            color: #ffffff;
            border: 1px solid #6c5ce7;
            border-right: none;
            border-radius: 6px 0 0 6px;
            cursor: pointer;
            box-shadow: -2px 2px 8px rgba(0, 0, 0, 0.4);
            font-weight: bold;
            font-size: 13px;
            white-space: nowrap;
            display: block;
            overflow: hidden;

            transition: background-color 0.6s cubic-bezier(0.4, 0, 0.2, 1),
                        border-color 0.6s cubic-bezier(0.4, 0, 0.2, 1),
                        transform 0.15s ease;
        }

        /* СТИЛИ ДЛЯ ПЛАВНОЙ СМЕНЫ ТЕКСТА */
        .conversio-btn-text {
            display: inline-block;
            padding: 10px 16px;
            opacity: 1;
            transition: opacity 0.2s cubic-bezier(0.25, 1, 0.5, 1);
        }
        .conversio-text-hidden {
            opacity: 0 !important;
        }

        /* Глянцевый блик-вспышка */
        .conversio-main-btn::after {
            content: '';
            position: absolute;
            top: 0;
            left: -150%;
            width: 60%;
            height: 100%;
            background: linear-gradient(
                90deg,
                rgba(255, 255, 255, 0) 0%,
                rgba(255, 255, 255, 0.55) 50%,
                rgba(255, 255, 255, 0) 100%
            );
            transform: skewX(-25deg);
            pointer-events: none;
        }

        /* Тактильный клик */
        .conversio-main-btn:active {
            transform: scale(0.96);
        }

        /* Подсветка при наведении */
        .conversio-main-btn:hover {
            background-color: #3b326b;
            border-color: #8073eb;
        }

        /* Состояние ДР клиента */
        .conversio-main-btn[data-bd="true"] {
            background-color: #8e2a59;
            border-color: #ff6496;
        }
        .conversio-main-btn[data-bd="true"]:hover {
            background-color: #a8336a;
            border-color: #ff7da8;
        }

        /* МГНОВЕННЫЙ ЗЕЛЕНЫЙ (Туда) */
        .conversio-main-btn[data-success="true"] {
            background-color: #2ecc71 !important;
            border-color: #27ae60 !important;
            transition: 0s !important;
            box-shadow: -2px 2px 15px rgba(46, 204, 113, 0.6);
        }
        .conversio-main-btn[data-success="true"]::after {
            animation: glowForward 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }

        /* РЕЖИМ СТИРАНИЯ ЦВЕТА (Обратная вспышка) */
        .conversio-main-btn.conversio-glow-back::after {
            animation: glowBackward 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
    `;
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

    function makeCall(rawPhone, targetElement) {
        let cleanPhone = rawPhone.replace(/\D/g, '');
        if (cleanPhone.startsWith('8')) cleanPhone = '7' + cleanPhone.substring(1);

        if (cleanPhone.length >= 10) {
            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            iframe.src = `sip:${cleanPhone}`;
            document.body.appendChild(iframe);
            setTimeout(() => { document.body.removeChild(iframe); }, 300);
        }
    }

    // 1. ЛОГИКА CRM
    if (window.location.href.includes('jrrgoxf-nreu-rwkhuv.top/crm/clients/work')) {
        let btn = null;

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
                    if (btn && !btn.querySelector('.conversio-btn-text').innerHTML.includes('🎂') && !btn.hasAttribute('data-success')) {
                        btn.setAttribute('data-bd', 'true');
                        btn.style.backgroundColor = '#8e2a59';
                        btn.style.borderColor = '#ff6496';
                        const txt = btn.querySelector('.conversio-btn-text');
                        if (txt) txt.innerHTML = '🎂 ДР КЛИЕНТА! Копировать 🎂';
                    }
                } else {
                    if (existingCake) existingCake.remove();
                    if (btn && btn.querySelector('.conversio-btn-text').innerHTML.includes('🎂') && !btn.hasAttribute('data-success')) {
                        btn.removeAttribute('data-bd');
                        btn.style.backgroundColor = '#2d264f';
                        btn.style.borderColor = '#6c5ce7';
                        const txt = btn.querySelector('.conversio-btn-text');
                        if (txt) txt.innerHTML = '📋 Копировать фио и дату';
                    }
                }
            }

            if (fioIn && dateIn && !document.getElementById('sauron-copy-btn')) {
                btn = document.createElement('button');
                btn.id = 'sauron-copy-btn';
                btn.className = 'conversio-main-btn';

                const isBirthday = dateIn.value && isBD(dateIn.value);
                if (isBirthday) {
                    btn.setAttribute('data-bd', 'true');
                }

                const initialText = isBirthday ? '🎂 ДР КЛИЕНТА! Копировать 🎂' : '📋 Копировать фио и дату';
                btn.innerHTML = `<span class="conversio-btn-text">${initialText}</span>`;

                btn.onclick = function(e) {
                    e.preventDefault();
                    if (fioIn.value && dateIn.value) {
                        const formattedDate = convertDate(dateIn.value);
                        const finalData = `${fioIn.value.trim()} ${formattedDate}`;

                        navigator.clipboard.writeText(finalData).then(() => {
                            clearTimeout(crmTimeoutHold);

                            btn.classList.remove('conversio-glow-back');
                            btn.setAttribute('data-success', 'true');

                            const textSpan = btn.querySelector('.conversio-btn-text');
                            const bd = btn.hasAttribute('data-bd');

                            const standardPhrases = [
                                '✅ Дело сделано!',
                                '✅ Уже на банкомате!',
                                '✅ Теперь в Sauron!',
                                '✅ Осталось передать!',
                                '✅ Лёгкая, легчайшая!'
                            ];

                            let chosenPhrase;
                            if (Math.random() < 0.003) {
                                chosenPhrase = '✅ Шо вы за колл-центр тут устроили?';
                            } else {
                                chosenPhrase = standardPhrases[Math.floor(Math.random() * standardPhrases.length)];
                            }

                            if (textSpan) {
                                textSpan.classList.add('conversio-text-hidden');
                                setTimeout(() => {
                                    textSpan.innerHTML = chosenPhrase;
                                    textSpan.classList.remove('conversio-text-hidden');
                                }, 150);
                            }

                            crmTimeoutHold = setTimeout(() => {
                                btn.removeAttribute('data-success');
                                btn.classList.add('conversio-glow-back');

                                if (textSpan && dateIn) {
                                    textSpan.classList.add('conversio-text-hidden');
                                    setTimeout(() => {
                                        textSpan.innerHTML = bd ? '🎂 ДР КЛИЕНТА! Копировать 🎂' : '📋 Копировать фио и дату';
                                        textSpan.classList.remove('conversio-text-hidden');
                                    }, 150);
                                }

                                setTimeout(() => {
                                    btn.classList.remove('conversio-glow-back');
                                }, 600);

                            }, 1500);
                        });
                    } else { alert('Поля пустые!'); }
                };
                document.body.appendChild(btn);
            }
        }, 500);
    }

    // 2. ЛОГИКА SAURON
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

        // Интегрированные стили для номеров телефонов
        if (!document.getElementById('sauron-phone-styles')) {
            const phoneStyle = document.createElement('style');
            phoneStyle.id = 'sauron-phone-styles';
            phoneStyle.innerHTML = `
                .rh-text {
                    display: inline-block;
                    transition: color 0.4s cubic-bezier(0.25, 1, 0.5, 1),
                                transform 0.2s cubic-bezier(0.25, 1, 0.5, 1) !important;
                    will-change: transform, color;
                }

                .rh-text:hover {
                    color: #c45224 !important;
                    transform: scale(1.04);
                }

                .rh-text.phone-clicked {
                    color: #9c3f19 !important;
                    transform: scale(0.96);
                    transition: 0s !important;
                }
            `;
            document.head.appendChild(phoneStyle);
        }

        // 1. Добавляем точные CSS-стили для объема, ховера и эффекта нажатия
        if (!document.getElementById('sauron-btn-effects')) {
            const btnStyle = document.createElement('style');
            btnStyle.id = 'sauron-btn-effects';
            btnStyle.innerHTML = `
                #sauron-paste-btn {
                    /* Тонкий внутренний блик по верхнему краю для объема, как у оригинала */
                    box-shadow: inset 0 1px 0 rgba(255,255,255,0.2), 0 1px 2px rgba(0,0,0,0.15) !important;
                    text-shadow: 0 -1px 0 rgba(0,0,0,0.2);
                    /* Плавный переход цвета при наведении мыши (0.15 секунды) */
                    transition: transform 0.1s ease, background-color 0.15s ease, border-color 0.15s ease !important;
                }

                /* Эффект при наведении курсора (hover) — точные цвета оригинальной кнопки сайта */
                #sauron-paste-btn:hover {
                    background-color: var(--sauron-btn-hover-bg) !important;
                    border-color: var(--sauron-btn-hover-border) !important;
                }

                /* Мгновенная тактильная анимация нажатия перед обновлением страницы */
                #sauron-paste-btn:active {
                    transform: translateY(-48%) scale(0.96) !important; /* Физическое сжатие кнопки на 4% */
                    background-color: var(--sauron-btn-active-bg) !important; /* Индивидуальный цвет клика темы */
                    border-color: var(--sauron-btn-active-border) !important;
                    box-shadow: inset 0 2px 4px rgba(0,0,0,0.4) !important; /* Глубокая внутренняя тень проседания */
                }
            `;
            document.head.appendChild(btnStyle);
        }

        // Функция динамического обновления базовых цветов кнопки под оригинальный стиль Саурона
        function updateButtonTheme() {
            const btn = document.getElementById('sauron-paste-btn');
            if (!btn) return;

            const light = isLightTheme();

            if (light) {
                // СВЕТЛАЯ ТЕМА: Идеальный баланс из прошлых шагов
                btn.style.backgroundColor = '#be5524'; // Обычное состояние (оригинал)
                btn.style.borderColor = '#a8471b';

                btn.style.setProperty('--sauron-btn-hover-bg', '#a4431b'); // При наведении (темнее днём)
                btn.style.setProperty('--sauron-btn-hover-border', '#8c3612');

                btn.style.setProperty('--sauron-btn-active-bg', '#8a2f0c'); // При клике
                btn.style.setProperty('--sauron-btn-active-border', '#702508');
            } else {
                // ТЁМНАЯ ТЕМА: Исправленная логика подсветки (теперь кнопка СВЕТЛЕЕТ при наведении!)
                btn.style.backgroundColor = '#d35c25'; // Обычное состояние (как у оригинала "Найти")
                btn.style.borderColor = '#b74e1d';

                btn.style.setProperty('--sauron-btn-hover-bg', '#e46833'); // При наведении загорается ЯРЧЕ (точный замер)
                btn.style.setProperty('--sauron-btn-hover-border', '#ca5828');

                btn.style.setProperty('--sauron-btn-active-bg', '#ba4a1a'); // При клике (сочный упругий отклик)
                btn.style.setProperty('--sauron-btn-active-border', '#9c3b12');
            }
        }

        // НАДЕЖНАЯ СИНХРОНИЗАЦИЯ ТЕМЫ: Следим за изменением классов сайта в реальном времени
        const themeObserver = new MutationObserver(() => {
            updateButtonTheme();
        });
        themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme'] });
        themeObserver.observe(document.body, { attributes: true, attributeFilter: ['class', 'data-theme'] });

        setInterval(function() {
            const phoneElements = document.querySelectorAll('.rh-text');
            phoneElements.forEach(el => {
                const text = el.innerText ? el.innerText.trim() : '';

                if (/^\+?[\d\s\-\(\)]{10,20}$/.test(text)) {
                    if (!el.hasAttribute('data-conversio-call')) {
                        el.setAttribute('data-conversio-call', 'true');
                        el.title = '📞 Клик — автозвонок в MicroSIP';
                        el.style.cursor = 'pointer';

                        el.addEventListener('click', (e) => {
                            e.preventDefault();
                            e.stopPropagation();

                            el.classList.add('phone-clicked');
                            makeCall(text, el);

                            setTimeout(() => {
                                el.classList.remove('phone-clicked');
                            }, 150);
                        });
                    }

                    let parentContainer = el.parentNode;
                    if (parentContainer && !parentContainer.querySelector('.conversio-copy-phone-btn')) {
                        parentContainer.style.display = 'inline-flex';
                        parentContainer.style.alignItems = 'center';
                        parentContainer.style.gap = '6px';

                        const copyBtn = document.createElement('button');
                        copyBtn.className = 'conversio-copy-phone-btn';
                        copyBtn.innerHTML = '📋';
                        copyBtn.title = 'Копировать номер в буфер обмена';
                        copyBtn.style = `
                            background-color: transparent;
                            border: none;
                            cursor: pointer;
                            font-size: 13px;
                            padding: 0 2px;
                            line-height: 1;
                            opacity: 0.7;
                            transition: opacity 0.2s ease, transform 0.1s ease;
                        `;

                        copyBtn.onmouseenter = () => { copyBtn.style.opacity = '1'; copyBtn.style.transform = 'scale(1.15)'; };
                        copyBtn.onmouseleave = () => { copyBtn.style.opacity = '0.7'; copyBtn.style.transform = 'scale(1)'; };

                        copyBtn.onclick = (e) => {
                            e.preventDefault();
                            e.stopPropagation();

                            let cleanPhone = text.replace(/\D/g, '');
                            if (cleanPhone.startsWith('8')) cleanPhone = '7' + cleanPhone.substring(1);

                            navigator.clipboard.writeText(cleanPhone).then(() => {
                                copyBtn.innerHTML = '✅';
                                setTimeout(() => { copyBtn.innerHTML = '📋'; }, 1500);
                            });
                        };

                        el.insertAdjacentElement('afterend', copyBtn);
                    }
                }
            });
        }, 1000);

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

                // Первичное позиционирование геометрии кнопки
                actBtn.style = `
                    position: absolute;
                    right: 98px;
                    top: 50%;
                    transform: translateY(-48%);
                    height: calc(100% - 6px);
                    max-height: 38px;
                    padding: 0 14px;
                    color: #fff;
                    border: 1px solid transparent;
                    border-radius: 4px;
                    cursor: pointer;
                    font-weight: bold;
                    font-size: 12px;
                    white-space: nowrap;
                    z-index: 10;
                `;

                sIn.insertAdjacentElement('afterend', actBtn);

                // Сразу же красим кнопку под текущую активную тему
                updateButtonTheme();

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
            }
        }, 500);
    }
})();
