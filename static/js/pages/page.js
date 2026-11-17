/**
 * 内页入口
 * 只负责并行读取站点公共数据与当前页数据，然后交给已登记的页面模块渲染
 * 具体渲染逻辑分散在 page-common.js 与各 page-*.js 中，按 body 的 data-page 选择
 */

(function () {
    "use strict";

    const App = window.PageApp;
    if (!App) return;

    function loadJson(url) {
        return fetch(url, { cache: "no-store" }).then(function (response) {
            if (!response.ok) throw new Error(url + " HTTP " + response.status);
            return response.json();
        });
    }

    // 站点公共数据与当前页数据并行读取，任一失败只在控制台报错，不影响导航等其余交互
    Promise.all([loadJson(App.siteUrl), loadJson(App.pageUrl)])
        .then(function (results) {
            App.render(results[0], results[1]);
        })
        .catch(function (error) {
            console.error("加载页面数据失败：", error);

            // 数据没到就渲染不出正文，此处兜底一句提示，避免页面停留在空白状态
            App.renderError();
        })
        .then(function () {
            // 无论成功或失败都通知加载层：页面内容已处理完毕
            if (typeof window.__pageLoaderContentReady === "function") {
                window.__pageLoaderContentReady();
            }
        });
})();