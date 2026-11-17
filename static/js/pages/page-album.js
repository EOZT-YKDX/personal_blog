/**
 * 相册页渲染
 * 数据来自 data/album.json：无 id 参数时展示相册列表，带 id 参数时展示该相册详情
 * 照片探测交给 album-photos.js，本文件只负责结构与交互
 */

(function () {
    "use strict";

    const App = window.PageApp;
    if (!App) return;

    const create = App.create;

    // 打开某个相册：通过 URL 参数传递相册 id，复用同一个 album.html
    function openAlbum(id) {
        window.location.href = "album.html?id=" + encodeURIComponent(id);
    }

    function renderCard(item) {
        const card = create("article", "album-card");

        if (item.id) {
            card.id = item.id;

            // 整张卡片可点击，并支持键盘回车/空格进入详情
            card.tabIndex = 0;
            card.setAttribute("role", "link");
            card.setAttribute("aria-label", "打开相册：" + (item.title || ""));

            card.addEventListener("click", function () {
                openAlbum(item.id);
            });

            card.addEventListener("keydown", function (event) {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    openAlbum(item.id);
                }
            });
        }

        const cover = create("div", "album-cover");

        // 封面由文件夹内容自动决定，先放占位图标，探测到真实封面后再替换
        const placeholder = create("img", "album-cover-placeholder");
        placeholder.src = "./static/img/icons/gallery.svg";
        placeholder.alt = "";
        cover.appendChild(placeholder);

        card.appendChild(cover);

        if (item.id && window.albumPhotos) {
            window.albumPhotos.findCover(item.id).then(function (src) {
                if (!src) return;

                const image = create("img", "album-cover-image");
                image.src = src;
                image.alt = item.title || "";
                image.loading = "lazy";
                image.decoding = "async";

                cover.innerHTML = "";
                cover.appendChild(image);
            });
        }

        const info = create("div", "album-info");
        info.appendChild(create("h2", "album-title", item.title || ""));
        info.appendChild(create("p", "album-date", item.date || ""));
        info.appendChild(create("p", "album-desc", item.desc || ""));

        card.appendChild(info);
        return card;
    }

    // 读取 URL 里的相册 id：album.html?id=eyes
    function getAlbumId() {
        const params = new URLSearchParams(window.location.search);
        return params.get("id");
    }

    // 返回列表时携带的来源相册 id：album.html?focus=eyes
    function getFocusId() {
        const params = new URLSearchParams(window.location.search);
        return params.get("focus");
    }

    // 返回相册列表后定位到刚看过的卡片
    // 定位发生在加载层淡出之前（画面仍被遮住），因此用瞬时跳转而非平滑滚动，
    // 避免用户先看到列表顶部再滑下来；块级居中可同时避开顶部固定导航
    function scrollToFocusedAlbum(id) {
        if (!id) return;

        const scroll = function () {
            const card = document.getElementById(id);
            if (!card) return;

            card.scrollIntoView({ behavior: "auto", block: "center" });
        };

        if (typeof window.__pageLoaderOnFinish === "function") {
            window.__pageLoaderOnFinish(scroll);
        } else {
            scroll();
        }
    }

    // 详情页返回入口：插在首屏标签上方，点击直接回到相册列表
    function renderBack(id) {
        const hero = document.querySelector(".page-hero .shell");
        if (!hero || hero.querySelector(".album-back")) return;

        const back = create("a", "album-back");

        // 带上来源相册 id，列表页据此滚动到对应卡片
        back.href = id ? "album.html?focus=" + encodeURIComponent(id) : "album.html";
        back.setAttribute("aria-label", "返回相册列表");

        const arrow = create("span", "album-back-arrow", "←");
        arrow.setAttribute("aria-hidden", "true");

        back.appendChild(arrow);
        back.appendChild(create("span", "", "返回相册"));

        hero.insertBefore(back, hero.firstChild);
    }

    function renderDetail(album, item) {
        if (!App.pageBody) return;

        // 标题、简介、日期来自该相册自身的数据
        App.setText(App.pageLabel, album.label);
        App.setText(App.pageTitle, item.title);
        App.setText(App.pageLead, item.desc);

        renderBack(item.id);

        document.title = (item.title || "相册") + " · 夜の星";

        const block = create("section", "page-block page-block-single album-detail");
        const body = create("div", "block-body");

        const meta = create("div", "album-detail-meta");
        meta.appendChild(create("p", "album-detail-date", item.date || ""));

        // 张数需要等照片扫描完成，先留出节点位置
        const count = create("span", "album-detail-count");
        count.hidden = true;
        meta.appendChild(count);

        body.appendChild(meta);

        const grid = create("div", "album-photo-grid");
        const tip = create("p", "album-detail-tip");
        tip.hidden = true;
        body.appendChild(grid);
        body.appendChild(tip);

        block.appendChild(body);

        App.pageBody.innerHTML = "";
        App.pageBody.appendChild(block);

        if (!window.albumPhotos) return;

        // 扫描完成后一次性填充照片，避免逐张插入造成布局抖动
        window.albumPhotos.scanPhotos(item.id).then(function (photos) {
            if (!photos.length) {
                tip.textContent = "这个相册还没有照片。";
                tip.hidden = false;
                return;
            }

            const fragment = document.createDocumentFragment();

            photos.forEach(function (src, index) {
                const figure = create("figure", "album-photo");
                const image = create("img", "album-photo-image");
                image.src = src;
                image.alt = (item.title || "") + " · " + (index + 1);
                image.loading = "lazy";
                image.decoding = "async";

                figure.appendChild(image);
                fragment.appendChild(figure);
            });

            grid.appendChild(fragment);

            count.textContent = photos.length + " 张照片";
            count.hidden = false;
        });
    }

    App.register("album", function renderAlbum(album) {
        if (!album || !App.pageBody) return;

        const items = album.items || [];
        const id = getAlbumId();
        const current = id
            ? items.find(function (item) {
                  return item.id === id;
              })
            : null;

        // 带 id 参数进入详情页，否则展示相册列表
        if (current) {
            renderDetail(album, current);
            return;
        }

        App.renderHead(album);

        const block = create("section", "page-block page-block-single");
        const body = create("div", "block-body");
        const grid = create("div", "album-grid");

        items.forEach(function (item) {
            grid.appendChild(renderCard(item));
        });

        body.appendChild(grid);
        block.appendChild(body);

        App.pageBody.innerHTML = "";
        App.pageBody.appendChild(block);

        // 从详情页返回时，列表渲染完成后定位到刚看过的卡片
        scrollToFocusedAlbum(getFocusId());
    });
})();