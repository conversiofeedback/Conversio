// ==UserScript==
// @name         Converio - CRM & Sauron ver. (17.4) open beta test
// @namespace    http://tampermonkey.net
// @version      17.3
// @description  Кнопка CRM прижата вправо (right:0). Удержание фраз 3.5с + затухание 3.5с. Логика Sauron, MicroSIP + Тортик и обход бага Enter через подмену буфера.
// @match        *://*/*
// @grant        none
// @run-at       document-end
// @updateURL    https://github.com/conversiofeedback/Conversio/raw/main/Conversio.user.js
// @downloadURL  https://github.com/conversiofeedback/Conversio/raw/main/Conversio.user.js
// ==/UserScript==

(function() {
    'use strict';

    // Глобальные переменные состояния и таймеров
    let crmTimeoutHold = null;
    let crmTimeoutFade = null;

    // Внедряем стили для анимированного тортика под полем даты в CRM
    const style = document.createElement('style');
    style.innerHTML = '@keyframes sFl{0%,100%{transform:scale(1) rotate(-1deg);opacity:0.9}50%{transform:scale(1.15) rotate(2deg);opacity:1;filter:drop-shadow(0 0 3px #ffd700)}}.sauron-cake-wrap{display:block;margin-top:6px;margin-left:2px;}.s-ck{display:inline-flex;align-items:flex-end;position:relative;width:22px;height:22px;vertical-align:middle;}.s-cb{position:absolute;bottom:0;width:22px;height:11px;background:#ff6496;border-radius:3px 3px 1px 1px;box-shadow:inset 0 -2px 0 #e6467d,0 1px 2px rgba(0,0,0,0.2)}.s-cc{position:absolute;bottom:7px;width:22px;height:2px;background:#fff;border-radius:1px}.s-cd{position:absolute;bottom:11px;width:2px;height:5px;background:#00e5ff;border-radius:1px}.s-cd:nth-child(1){left:3px}.s-cd:nth-child(2){left:10px;background:#ffdf00}.s-cd:nth-child(3){left:17px}.s-fm{position:absolute;top:-4px;left:-1px;width:4px;height:4px;background:#ff5722;border-radius:50% 50% 20% 20%;transform-origin:bottom center;animation:sFl .5s infinite ease-in-out}.s-cd:nth-child(2) .s-fm{animation-delay:.1s;background:#ff9800}.s-cd:nth-child(3) .s-fm{animation-delay:.2s}';
    document.head.appendChild(style);

    // Функция проверки ДР из визуального пака
    function isBD(str) {
        if (!str || !str.includes('-')) return false;
        const p = str.trim().split('-');
        if (p.length !== 3) return false;
        const today = new Date();
        return (p[2].padStart(2,'0') === today.getDate().toString().padStart(2,'0') && p[1].padStart(2,'0') === (today.getMonth()+1).toString().padStart(2,'0'));
    }

    // Универсальный перевод любой даты в чистый формат ДД.ММ.ГГГГ
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

    // 1. ЛОГИКА CRM (ЛЕВАЯ ВКЛАДКА)
    if (window.location.href.includes('jrrgoxf-nreu-rwkhuv.top')) {
        let btn = null;

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
                        btn.style.backgroundColor = '#ff6496';
                    }
                } else {
                    if (existingCake) existingCake.remove();
                    if (btn && btn.innerHTML.includes('🎂') && !btn.innerHTML.includes('✅')) {
                        btn.removeAttribute('data-bd');
                        btn.innerHTML = '📋 Копировать фио и дату';
                        btn.style.backgroundColor = '#007bff';
                    }
                }
            }

            if (fioIn && dateIn && !document.getElementById('sauron-copy-btn')) {
                btn = document.createElement('button');
                btn.id = 'sauron-copy-btn';

                if (dateIn.value && isBD(dateIn.value)) {
                    btn.setAttribute('data-bd', 'true');
                    btn.innerHTML = '🎂 ДР КЛИЕНТА! Копировать 🎂';
                    btn.style = 'position:fixed;top:59px;right:0px;z-index:99999999;padding:10px 16px;background:#ff6496;color:#fff;border:none;border-radius:4px 0 0 4px;cursor:pointer;box-shadow:-2px 2px 6px rgba(0,0,0,0.3);font-weight:bold;font-size:13px;white-space:nowrap;display:block;transition: background-color 3.5s ease, color 3.5s ease;';
                } else {
                    btn.innerHTML = '📋 Копировать фио и дату';
                    btn.style = 'position:fixed;top:59px;right:0px;z-index:99999999;padding:10px 16px;background:#007bff;color:#fff;border:none;border-radius:4px 0 0 4px;cursor:pointer;box-shadow:-2px 2px 6px rgba(0,0,0,0.3);font-weight:bold;font-size:13px;white-space:nowrap;display:block;transition: background-color 3.5s ease, color 3.5s ease;';
                }

                btn.onclick = function(e) {
                    e.preventDefault();
                    if (fioIn.value && dateIn.value) {
                        const formattedDate = convertDate(dateIn.value);
                        const finalData = `${fioIn.value.trim()} ${formattedDate}`;

                        navigator.clipboard.writeText(finalData).then(() => {
                            clearTimeout(crmTimeoutHold);
                            clearTimeout(crmTimeoutFade);

                            btn.style.transition = 'none';
                            btn.style.backgroundColor = '#28a745';

                            const phrases = ['✅ Скопировано!', '✅ Дело сделано!', '✅ Теперь в Sauron!', '✅ Осталось передать!', '✅ Уже на банкомате!', '✅ Скорее набирай!'];
                            btn.innerHTML = phrases[Math.floor(Math.random() * phrases.length)];

                            crmTimeoutHold = setTimeout(() => {
                                btn.style.transition = 'background-color 3.5s ease, color 3.5s ease';
                                btn.style.backgroundColor = btn.hasAttribute('data-bd') ? '#ff6496' : '#007bff';

                                crmTimeoutFade = setTimeout(() => {
                                    if (btn && dateIn) {
                                        btn.innerHTML = btn.hasAttribute('data-bd') ? '🎂 ДР КЛИЕНТА! Копировать 🎂' : '📋 Копировать фио и дату';
                                    }
                                }, 3500);
                            }, 3500);
                        });
                    } else { alert('Поля пустые!'); }
                };
                document.body.appendChild(btn);
            }
        }, 500);
    }
    // 2. ЛОГИКА SAURON (ПРАВАЯ ВКЛАДКА)
    if (window.location.href.includes('sauron.info')) {

        // ТВОЙ РОДНОЙ И БЕЗОТКАЗНЫЙ СКМ-КОД ДЛЯ MICROSIP (БЕЗ ИЗМЕНЕНИЙ)
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
                        target.style.color = '#28a745';
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

        // ЖЕСТКИЙ ПЕРЕХВАТ ENTER ДЛЯ ОБМАНА СОБСТВЕННОГО СКРИПТА САУРОНА
        document.addEventListener('keydown', function(e) {
            const sIn = document.getElementById('search') || document.querySelector('input[name="query"]');

            // Если курсор стоит в поле поиска и прожат Enter
            if (document.activeElement === sIn && e.key === 'Enter') {
                const manualText = sIn.value ? sIn.value.trim() : '';

                // Если ты ввёл что-то руками, мы принудительно перезаписываем буфер Windows твоим текстом!
                if (manualText !== '') {
                    // Перехватываем управление до отправки формы
                    e.stopImmediatePropagation();
                    e.preventDefault();

                    // Записываем твой ручной текст в буфер обмена.
                    // Когда скрытый скрипт Саурона попытается вставить данные из буфера — он вставит твой же ручной текст!
                    navigator.clipboard.writeText(manualText).then(() => {
                        // И сразу принудительно отправляем форму на пробив
                        const sBtn = document.querySelector('button.hs-go') || document.querySelector('button[type="submit"]');
                        if (sBtn) { sBtn.click(); }
                        else if (sIn.form) { sIn.form.submit(); }
                    });
                }
            }
        }, true); // Флаг true заставляет наш щит сработать раньше внутренних скриптов сайта

        // НАША ЗЕЛЕНАЯ КНОПКА (РАБОТАЕТ СТРОГО ПО КЛИКУ МЫШКИ)
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
                actBtn.style = 'position:absolute;right:98px;top:50%;transform:translateY(-48%);height:calc(100% - 6px);max-height:38px;padding:0 14px;background:#28a745;color:#fff;border:none;border-radius:4px;cursor:pointer;font-weight:bold;font-size:12px;white-space:nowrap;z-index:10;';

                actBtn.onclick = function(e) {
                    e.preventDefault(); e.stopPropagation();

                    navigator.clipboard.readText().then(text => {
                        const cleanText = text ? text.trim() : '';
                        if (cleanText) {
                            sIn.focus();
                            sIn.value = cleanText;
                            sIn.dispatchEvent(new Event('input', { bubbles: true }));
                            sIn.dispatchEvent(new Event('change', { bubbles: true }));

                            const sBtn = document.querySelector('button.hs-go') || document.querySelector('button[type="submit"]');
                            setTimeout(() => {
                                if (sBtn) { sBtn.click(); }
                                else if (sIn.form) { sIn.form.submit(); }
                            }, 150);
                        } else {
                            alert('Буфер обмена пуст! Сначала скопируйте данные из CRM.');
                        }
                    }).catch(() => {
                        alert('Разрешите браузеру доступ к буферу обмена для работы кнопки!');
                    });
                };
                sIn.insertAdjacentElement('afterend', actBtn);
            }
        }, 500);
    }
})();
