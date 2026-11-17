/**
 * 内页公共逻辑
 * 提供 DOM 引用、文本与节点创建工具、页头页脚渲染以及页脚时钟
 * 各页面模块通过 PageApp.register 登记渲染函数，由 page.js 按 data-page 调用
 */

(function () {
    "use strict";

    // 站点公共数据：导航标题与页脚
    const SITE_URL = "./data/site.json";

    // 具体渲染哪一块由 body 上的 data-page 决定
    const page = document.body.dataset.page;

    // 每个内页只读取自己的数据文件，改一页不会牵动其它页面
    const pageUrl = page ? "./data/" + page + ".json" : "";

    const navTitle = document.getElementById("nav-title");
    const pageLabel = document.getElementById("pageLabel");
    const pageTitle = document.getElementById("pageTitle");
    const pageLead = document.getElementById("pageLead");
    const pageBody = document.getElementById("pageBody");
    const footerMark = document.getElementById("footerMark");
    const footerNote = document.getElementById("footerNote");
    const footerCopy = document.getElementById("footerCopy");
    const footerVersion = document.getElementById("footerVersion");
    const footerTime = document.getElementById("footerTime");

    // 用 textContent 写入，避免数据里的尖括号被当作标签解析
    function setText(el, value) {
        if (el && typeof value === "string") el.textContent = value;
    }

    function create(tag, className, text) {
        const el = document.createElement(tag);
        if (className) el.className = className;
        if (typeof text === "string") el.textContent = text;
        return el;
    }

    function renderHead(section) {
        if (!section) return;

        setText(pageLabel, section.label);
        setText(pageTitle, section.title);
        setText(pageLead, section.lead);
    }

    function renderFooter(footer) {
        if (!footer) return;

        setText(footerMark, footer.mark);
        setText(footerNote, footer.note);
        setText(footerCopy, footer.copy);
        setText(footerVersion, footer.version);
    }

    // 页脚本地时间：每秒刷新一次，补零保证等宽对齐
    function startClock() {
        if (!footerTime) return;

        function pad(value) {
            return value < 10 ? "0" + value : String(value);
        }

        function tick() {
            const now = new Date();
            footerTime.textContent =
                pad(now.getHours()) + ":" + pad(now.getMinutes()) + ":" + pad(now.getSeconds());
        }

        tick();
        setInterval(tick, 1000);
    }

    // 各页面模块登记自己的渲染函数，键名与 body 的 data-page 对应
    const renderers = {};

    function register(name, renderer) {
        if (typeof renderer === "function") renderers[name] = renderer;
    }

    function render(site, data) {
        setText(navTitle, site && site.site && site.site.nav_title);
        renderFooter(site && site.footer);

        const renderer = renderers[page];
        if (!renderer) {
            // 页面模块脚本缺失或未登记，同样视为加载失败
            renderError();
            return;
        }

        // 数据结构里缺少当前页字段时也渲染不出内容，按加载失败处理
        if (!data || !data[page]) {
            renderError();
            return;
        }

        renderer(data[page]);
    }

    // 数据加载失败时在正文位置给出提示，避免整页只剩空骨架
    function renderError() {
        if (!pageBody) return;

        pageBody.innerHTML = "";
        pageBody.appendChild(create("p", "page-error", "内容加载失败，请刷新重试"));
    }

    startClock();

    window.PageApp = {
        siteUrl: SITE_URL,
        pageUrl: pageUrl,
        page: page,
        pageBody: pageBody,
        pageLabel: pageLabel,
        pageTitle: pageTitle,
        pageLead: pageLead,
        setText: setText,
        create: create,
        renderHead: renderHead,
        renderFooter: renderFooter,
        renderError: renderError,
        register: register,
        render: render
    };
})();