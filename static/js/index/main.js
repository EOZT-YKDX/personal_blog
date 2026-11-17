/**
 * 首页主体逻辑
 * 文案与作品数据按页面拆分存放在 data 目录：首页读取 index.json，站点公共信息读取 site.json
 * 探索按钮的双行文字切换由样式完成，此处仅控制点击后出现的下滑提示
 */

(function () {
    "use strict";

    // 站点公共数据：导航标题与页脚
    const SITE_URL = "./data/site.json";

    // 首页专属数据：首屏、更新、技术栈、最新作品
    const INDEX_URL = "./data/index.json";

    // 跑马灯基准时长：单份列表铺满一屏时走完一趟所用的秒数
    const stackBaseDuration = 28;

    let stackNames = [];
    let stackRepeat = 0;

    const heroTitle = document.getElementById("heroTitle");
    const heroSub = document.getElementById("heroSub");
    const navTitle = document.getElementById("nav-title");
    const updatesTitle = document.getElementById("updatesTitle");
    const updatesMeta = document.getElementById("updatesMeta");
    const updatesList = document.getElementById("updatesList");
    const stackList = document.getElementById("stackList");
    const stackListCopy = document.getElementById("stackListCopy");
    const stackTrack = document.getElementById("stackTrack");
    const workLabel = document.getElementById("workLabel");
    const workGrid = document.getElementById("workGrid");
    const footerMark = document.getElementById("footerMark");
    const footerNote = document.getElementById("footerNote");
    const footerCopy = document.getElementById("footerCopy");
    const footerVersion = document.getElementById("footerVersion");
    const footerTime = document.getElementById("footerTime");

    // 用 textContent 写入，避免数据里的尖括号被当作标签解析
    function setText(el, value) {
        if (el && typeof value === "string") el.textContent = value;
    }

    function renderHero(hero) {
        if (!hero) return;

        setText(heroTitle, hero.title);

        if (heroSub && Array.isArray(hero.paragraphs)) {
            heroSub.innerHTML = "";
            hero.paragraphs.forEach(function (line, index) {
                if (index > 0) heroSub.appendChild(document.createElement("br"));
                heroSub.appendChild(document.createTextNode(line));
            });
        }
    }

    // 窗口右上角日期：直接用 JS 取系统当前年月日，不再写死在数据文件里
    function currentMeta() {
        const now = new Date();

        function pad(value) {
            return value < 10 ? "0" + value : String(value);
        }

        return now.getFullYear() + " · " + pad(now.getMonth() + 1) + " · " + pad(now.getDate());
    }

    function renderUpdates(updates) {
        if (!updates) return;

        setText(updatesTitle, updates.title);
        setText(updatesMeta, currentMeta());

        if (!updatesList || !Array.isArray(updates.items)) return;

        updatesList.innerHTML = "";
        updates.items.forEach(function (item) {
            const row = document.createElement("li");
            row.className = "update-row";

            const date = document.createElement("span");
            date.className = "update-date";
            date.textContent = item.date || "";

            const text = document.createElement("span");
            text.className = "update-text";
            text.textContent = item.text || "";

            row.appendChild(date);
            row.appendChild(text);
            updatesList.appendChild(row);
        });
    }

    function renderStack(stack) {
        if (!Array.isArray(stack) || stack.length === 0 || !stackList) return;

        // 数据变化时强制重建，避免沿用旧的补齐结果
        stackNames = stack;
        stackRepeat = 0;
        layoutStack();
    }

    // 重建跑马灯：先按视口宽度把单份列表补足到至少一屏，再复制第二份
    function layoutStack() {
        if (!stackNames.length || !stackList) return;

        const viewport = window.innerWidth || document.documentElement.clientWidth || 0;

        // 已有内容时先量一次：补齐后的单份仍能铺满一屏就直接沿用，避免动画跳回起点
        if (stackRepeat > 0 && stackList.childElementCount > 0) {
            const currentUnit = stackList.getBoundingClientRect().width / stackRepeat;
            if (viewport > 0 && currentUnit > 0 && currentUnit * stackRepeat >= viewport) return;
        }

        stackList.innerHTML = "";
        if (stackListCopy) stackListCopy.innerHTML = "";

        function appendItems() {
            stackNames.forEach(function (name) {
                const item = document.createElement("li");
                item.textContent = name;
                stackList.appendChild(item);
            });
        }

        appendItems();

        const unitWidth = stackList.getBoundingClientRect().width;

        // 单份列表短于一屏时，循环后段右侧会露出空白，需要重复补齐
        let repeat = 1;
        if (viewport > 0 && unitWidth > 0) {
            repeat = Math.max(1, Math.ceil((viewport + 1) / unitWidth));
        }
        stackRepeat = repeat;

        for (let i = 1; i < repeat; i += 1) appendItems();

        // 复制一份完全相同的列表，位移一份宽度即可无缝衔接
        if (stackListCopy) stackListCopy.innerHTML = stackList.innerHTML;

        // 单份列表变长后位移距离随之变长，按比例延长时长以保持原滚动速度
        if (stackTrack) {
            stackTrack.style.animationDuration = (stackBaseDuration * repeat) + "s";
        }
    }

    // 视口或字体度量变化时重新校准，避免列表再次短于一屏
    let stackResizeTimer = 0;
    window.addEventListener("resize", function () {
        window.clearTimeout(stackResizeTimer);
        stackResizeTimer = window.setTimeout(layoutStack, 200);
    });

    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(layoutStack);
    }

    function renderWork(work) {
        if (!work || !workGrid) return;

        setText(workLabel, work.label);

        if (!Array.isArray(work.projects)) return;

        workGrid.innerHTML = "";
        work.projects.forEach(function (project) {
            const card = document.createElement("article");
            card.className = "project-card";

            const type = document.createElement("p");
            type.className = "project-type";
            type.textContent = project.type || "";

            const name = document.createElement("h2");
            name.className = "project-name";
            name.textContent = project.title || "";

            const desc = document.createElement("p");
            desc.className = "project-desc";
            desc.textContent = project.desc || "";

            const more = document.createElement("a");
            more.className = "project-more";
            more.href = project.link || "projects.html";

            const label = document.createElement("span");
            label.textContent = "了解详情";

            const arrow = document.createElement("span");
            arrow.className = "project-more-arrow";
            arrow.textContent = "→";

            more.appendChild(label);
            more.appendChild(arrow);

            card.appendChild(type);
            card.appendChild(name);
            card.appendChild(desc);
            card.appendChild(more);
            workGrid.appendChild(card);
        });
    }

    function renderFooter(footer) {
        if (!footer) return;

        setText(footerMark, footer.mark);
        setText(footerNote, footer.note);
        setText(footerCopy, footer.copy);
        setText(footerVersion, footer.version);
    }

    function render(site, data) {
        setText(navTitle, site && site.site && site.site.nav_title);
        renderHero(data && data.hero);
        renderUpdates(data && data.updates);
        renderStack(data && data.stack);
        renderWork(data && data.work);
        renderFooter(site && site.footer);
    }

    function loadJson(url) {
        return fetch(url, { cache: "no-store" }).then(function (response) {
            if (!response.ok) throw new Error(url + " HTTP " + response.status);
            return response.json();
        });
    }

    // 站点公共数据与首页数据并行读取，任一失败只在控制台报错，不影响导航与按钮等其余交互
    Promise.all([loadJson(SITE_URL), loadJson(INDEX_URL)])
        .then(function (results) {
            render(results[0], results[1]);
        })
        .catch(function (error) {
            console.error("加载页面数据失败：", error);
        })
        .then(function () {
            // 无论成功或失败都通知加载层：页面内容已处理完毕
            if (typeof window.__pageLoaderContentReady === "function") {
                window.__pageLoaderContentReady();
            }
        });

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

    startClock();

    // 探索按钮：点击后出现下滑提示
    const exploreButton = document.getElementById("exploreButton");
    const scrollHint = document.getElementById("scrollHint");
    if (exploreButton && scrollHint) {
        exploreButton.addEventListener("click", function () {
            scrollHint.classList.add("show");
        });
    }
})();