/*! * Columbo - Web analytics platform Dev Tools
 *
 * @description Columbo Web Dev Tools and brwoser extesnions
 * @version     1.0.0
 * @copyright   Apple, Inc 2016
 * @license     Apple Internal Use Only
 */

window._cwPluginModule = (function() {
    var el,
        elmId = 'cw-analytics',
        btnId = 'cw-analytics-btn',
        msg,
        showBtn = false;

    function loadScript(url, cache) {
        var s = document.createElement('script'),
            nowTs = new Date().getTime();
        s.setAttribute('src', (!cache ? (url + '?' + nowTs) : url));
        s.async = false;
        document.getElementsByTagName('head')[0].appendChild(s);
    }

    function loadStyle(url, cache) {
        var ss = document.createElement('link'),
            nowTs = new Date().getTime();
        ss.type = 'text/css';
        ss.rel = 'stylesheet';
        ss.href = !cache ? (url + '?' + nowTs) : url;
        document.getElementsByTagName('head')[0].appendChild(ss);
    }

    function loadDependenciesAndPlugin(pluginObj) {
        var cssIdx, jsIdx;
        // Load all JS and CSS dependencies, if provided
        if (pluginObj.dependencies) {
            for (cssIdx = 0; cssIdx < pluginObj.dependencies.css.length; cssIdx++) {
                loadStyle(pluginObj.dependencies.css[cssIdx], pluginObj.cache);
            }
            for (jsIdx = 0; jsIdx < pluginObj.dependencies.js.length; jsIdx++) {
                loadScript(pluginObj.dependencies.js[jsIdx], pluginObj.cache);
            }
        }
        // Load plugin script file
        loadScript(pluginObj.url, pluginObj.cache);
    }

    function fadeOut(el) {
        el.style.opacity = 1;
        var tick = function() {
            el.style.opacity = el.style.opacity - 0.01;
            if ((el.style.opacity -= 0.01) < 0) {
                el.style.display = 'none';
            } else {
                if (window.requestAnimationFrame) {
                    requestAnimationFrame(tick);
                } else {
                    setTimeout(tick, 16);
                }
            }
        };

        setTimeout(tick, 1500);
    }

    function fadeIn(el, dontFadeOut) {
        el.style.opacity = 0;
        el.style.display = 'block';
        var tick = function() {
            el.style.opacity = +el.style.opacity + 0.01;
            if (+el.style.opacity < 1) {
                if (window.requestAnimationFrame) {
                    requestAnimationFrame(tick);
                } else {
                    setTimeout(tick, 16);
                }
            } else if (!dontFadeOut) {
                fadeOut(el);
            }
        };

        tick();
    }

    function getStartBtn(triggerFn) {
        var btnStyle = 'font-size: 16px;line-height: 1.9375;font-weight: 500;letter-spacing: 0em;font-family: "Myriad Set Pro", "Helvetica Neue", "Helvetica", "Arial", sans-serif;background-color: #0070c9;background: -webkit-linear-gradient(#42a1ec, #0070c9);background: linear-gradient(#42a1ec, #0070c9);border-color: #07c;border-width: 1px;border-style: solid;border-radius: 4px;color: white;cursor: pointer;display: inline-block;min-width: 30px;padding-left: 15px;padding-right: 15px;padding-top: 1px;text-align: center;white-space: nowrap;', // jscs:ignore maximumLineLength
            button = document.getElementById(btnId) || document.createElement('a');

        button.style.cssText = btnStyle;
        /*jshint scripturl:true*/
        button.href = 'javascript:void(0)';
        button.title = 'Start';
        button.innerHTML = 'Start';
        if (typeof triggerFn !== 'function') {
            triggerFn = function() {};
        }
        button.onclick = function() {
            showBtn = false;
            triggerFn();
            // hide notification automatically when start button is clicked
            fadeOut(el);
        };
        return button;
    }

    function showNotification(msg, showBtn, triggerFn) {
        var b = document.getElementsByTagName('body')[0];
        el = document.getElementById(elmId) || document.createElement('div');
        el.style.cssText = 'font-size: 16px;line-height: 1.9375;font-weight: 500;letter-spacing: 0em;font-family: "Myriad Set Pro", "Helvetica Neue", "Helvetica", "Arial", sans-serif;position: fixed; margin: 0px auto; top: 0px; left: 40%; z-index: 9999999; padding: 10px 20px; border-radius: 3px; color: rgb(255, 255, 255); opacity: -0.02; display: none; background: -webkit-linear-gradient(to left, #02AAB0 , #00CDAC); background: linear-gradient(to left, rgb(2, 170, 176), rgb(0, 205, 172));'; // jscs:ignore maximumLineLength
        el.id = elmId;
        el.innerHTML = msg;
        if (showBtn) {
            el.appendChild(getStartBtn(triggerFn));
        }
        b.appendChild(el);
        fadeIn(el, showBtn);
    }

    function run(_pluginObj, triggerFn) {
        var _v;

        if (!_pluginObj || !_pluginObj.url || !_pluginObj.pluginName) {
            return;
        }
        if (typeof window[_pluginObj.namespace] !== 'undefined') {
            _v = window[_pluginObj.namespace]._version;
            msg = showBtn ? '&#9733; ' + _pluginObj.pluginName + ' is already loaded, Click Start to run ' :
                '&#9835; This page is already running ' + _pluginObj.pluginName + (_v ? (' v' + _v) : '') + ' ';
        } else {
            // Load JS and CSS dependencies, if any, and plugin script file
            loadDependenciesAndPlugin(_pluginObj);
            msg = '&#9733; ' + _pluginObj.pluginName + ' is now loaded, Happy Analytics ';
            showBtn = true;
        }
        showNotification(msg, showBtn, triggerFn);
    }

    return {
        run: run
    };
})();
