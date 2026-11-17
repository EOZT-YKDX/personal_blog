/**
 * 导航栏移动端折叠
 * 桌面端保留完整链接，窄屏或链接溢出时折叠为抽屉菜单
 */

(function () {
    "use strict";

    const navRightContent = document.querySelector(".nav-right-content");
    if (!navRightContent) return;

    const baseBreakpoint = 768;
    const originalContent = navRightContent.innerHTML;

    // 弹窗停留时长：滑入后等待 3 秒再向右移出
    const toastHold = 3000;

    function measureOverflow() {
        const links = navRightContent.querySelectorAll("a");
        if (links.length === 0) return false;

        let totalLinksWidth = 0;
        links.forEach(function (link) {
            totalLinksWidth += link.offsetWidth;
        });

        // 加上链接之间的间距，避免刚好放不下时判定为不溢出
        const gap = parseFloat(getComputedStyle(navRightContent).columnGap) || 0;
        totalLinksWidth += gap * (links.length - 1);

        return totalLinksWidth > navRightContent.offsetWidth;
    }

    function openDrawer() {
        const overlay = document.querySelector(".mobile-nav-overlay");
        const drawer = document.querySelector(".mobile-nav-drawer");
        if (overlay) overlay.classList.add("active");
        if (drawer) drawer.classList.add("active");

        // 抽屉打开期间锁住背景滚动，避免遮罩后的页面跟着手指滑动
        document.documentElement.classList.add("is-nav-locked");
    }

    function closeDrawer() {
        const overlay = document.querySelector(".mobile-nav-overlay");
        const drawer = document.querySelector(".mobile-nav-drawer");
        if (overlay) overlay.classList.remove("active");
        if (drawer) drawer.classList.remove("active");

        document.documentElement.classList.remove("is-nav-locked");
    }

    let toastTimer = null;
    let toastExitTimer = null;

    // 移出动画结束后再移除节点，时长与 --duration-drawer 对齐并留一点余量
    const toastExitDelay = 320;

    function hideToast() {
        const toast = document.querySelector(".nav-toast");
        if (!toast) return;

        window.clearTimeout(toastTimer);
        toast.classList.remove("active");

        window.clearTimeout(toastExitTimer);
        toastExitTimer = window.setTimeout(function () {
            // 移出期间再次点击会复用同一个节点，此时不能移除
            if (toast.classList.contains("active")) return;
            toast.remove();
        }, toastExitDelay);
    }

    // 取当前页面的中文名称：优先导航栏当前页，折叠态时退到页脚当前页
    function getCurrentPageLabel() {
        const activeLink =
            document.querySelector('.nav-right-content a[aria-current="page"]') ||
            document.querySelector('.footer-link[aria-current="page"]');

        if (activeLink) return activeLink.textContent.trim();

        // 兜底：从页面标题里取站点名之前的部分（标题形如「关于 · 夜の星」）
        const title = document.title.split(/[-|｜·]/)[0];
        return title ? title.trim() : "";
    }

    // 弹窗结构：极简窗口，标题条沿用首屏更新窗口的圆点语言，正文是终端提示行
    function buildToastBody(text) {
        const bar = document.createElement("div");
        bar.className = "nav-toast-bar";

        const dots = document.createElement("div");
        dots.className = "nav-toast-dots";
        for (let i = 0; i < 3; i += 1) {
            dots.appendChild(document.createElement("span"));
        }

        const label = document.createElement("span");
        label.className = "nav-toast-label";
        label.textContent = "system / notice";

        bar.appendChild(dots);
        bar.appendChild(label);

        const body = document.createElement("div");
        body.className = "nav-toast-body";

        const prompt = document.createElement("span");
        prompt.className = "nav-toast-prompt";
        prompt.textContent = ">";

        const content = document.createElement("span");
        content.className = "nav-toast-text";
        content.textContent = text;

        body.appendChild(prompt);
        body.appendChild(content);

        return { bar: bar, body: body };
    }

    function showToast() {
        const label = getCurrentPageLabel();
        const text = label
            ? "已经在" + label + "页面了，去看看别的吧"
            : "已经在对应页面了，去看看别的吧";

        const existing = document.querySelector(".nav-toast");
        if (existing) {
            // 连续点击时只刷新文案并重置计时，避免弹窗提前移出
            window.clearTimeout(toastTimer);
            const textNode = existing.querySelector(".nav-toast-text");
            if (textNode) textNode.textContent = text;
            existing.classList.add("active");
            toastTimer = window.setTimeout(hideToast, toastHold);
            return;
        }

        const toast = document.createElement("div");
        toast.className = "nav-toast";
        toast.setAttribute("role", "status");

        const parts = buildToastBody(text);
        toast.appendChild(parts.bar);
        toast.appendChild(parts.body);

        document.body.appendChild(toast);

        // 强制回流，确保初始的位移状态被记录，随后才能过渡到滑入态
        void toast.offsetWidth;
        toast.classList.add("active");

        toastTimer = window.setTimeout(hideToast, toastHold);
    }

    // 判断点击的链接是否指向当前页面：以 aria-current 为准，再兜底比对路径
    function isCurrentPageLink(link) {
        if (!link) return false;
        if (link.getAttribute("aria-current") === "page") return true;

        const href = link.getAttribute("href");
        if (!href || href.indexOf("#") === 0 || /^(http|mailto|tel)/.test(href)) return false;

        const current = window.location.pathname.split("/").pop() || "index.html";
        const target = href.split("/").pop().split("#")[0];
        return target === current;
    }

    function handleLinkClick(event) {
        if (!isCurrentPageLink(event.currentTarget)) return;

        // 带修饰键或非左键时保留浏览器默认行为（新标签打开等）
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        if (event.button !== 0) return;

        event.preventDefault();
        showToast();
    }

    // 导航栏、抽屉、页脚共用同一套拦截：点了当前页就弹提示而不是重新跳转
    function bindCurrentPageGuard() {
        const links = document.querySelectorAll(
            ".nav-right-content a, .mobile-nav-drawer a, .footer-link"
        );
        links.forEach(function (link) {
            if (link.dataset.navGuarded) return;
            link.dataset.navGuarded = "true";
            link.addEventListener("click", handleLinkClick);
        });
    }

    function buildDrawer() {
        if (!document.querySelector(".mobile-nav-overlay")) {
            const overlay = document.createElement("div");
            overlay.className = "mobile-nav-overlay";
            overlay.addEventListener("click", closeDrawer);
            document.body.appendChild(overlay);
        }

        if (!document.querySelector(".mobile-nav-drawer")) {
            const drawer = document.createElement("div");
            drawer.className = "mobile-nav-drawer";

            const header = document.createElement("div");
            header.className = "mobile-nav-header";
            header.innerHTML =
                '<span class="mobile-nav-title">菜单</span>' +
                '<button class="mobile-nav-close" type="button" aria-label="关闭菜单">X</button>';
            drawer.appendChild(header);

            const tempDiv = document.createElement("div");
            tempDiv.innerHTML = originalContent;

            // 条目统一收进列表容器，间距交给 .mobile-nav-list 控制，
            // 与前端工具侧边栏的紧凑分组保持一致
            const list = document.createElement("div");
            list.className = "mobile-nav-list";

            tempDiv.querySelectorAll("a").forEach(function (link) {
                const newLink = link.cloneNode(true);
                newLink.addEventListener("click", closeDrawer);
                list.appendChild(newLink);
            });

            drawer.appendChild(list);

            drawer.querySelector(".mobile-nav-close").addEventListener("click", closeDrawer);
            document.body.appendChild(drawer);
        }

        bindCurrentPageGuard();
    }

    function collapseNav() {
        if (navRightContent.querySelector(".mobile-nav-menu")) return;

        navRightContent.innerHTML =
            '<button class="mobile-nav-menu" type="button" aria-label="打开菜单">' +
            '<span class="nav-menu-btn-bar"></span>' +
            '<span class="nav-menu-btn-bar"></span>' +
            '<span class="nav-menu-btn-bar"></span>' +
            "</button>";

        navRightContent.querySelector(".mobile-nav-menu").addEventListener("click", openDrawer);
        buildDrawer();
    }

    function restoreNav() {
        if (navRightContent.querySelector("a")) return;

        navRightContent.innerHTML = originalContent;

        const overlay = document.querySelector(".mobile-nav-overlay");
        const drawer = document.querySelector(".mobile-nav-drawer");
        if (overlay) overlay.remove();
        if (drawer) drawer.remove();

        // 复原到桌面端时抽屉已被移除，滚动锁也要一并解除
        document.documentElement.classList.remove("is-nav-locked");

        bindCurrentPageGuard();
    }

    function applyLayout() {
        if (window.innerWidth <= baseBreakpoint) {
            collapseNav();
            return;
        }

        if (navRightContent.querySelector("a")) {
            if (!measureOverflow()) return;
            collapseNav();
            return;
        }

        // 当前处于折叠态：先复原再测量，避免误判
        restoreNav();
        if (measureOverflow()) collapseNav();
    }

    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") closeDrawer();
    });

    applyLayout();
    bindCurrentPageGuard();
    window.addEventListener("resize", applyLayout);
})();