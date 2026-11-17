/**
 * 页面加载层控制
 * 必须等页面内容全部就绪后才淡出：文档加载完成、数据渲染完成、图片与字体全部就绪
 */

(function () {
    "use strict";

    const loader = document.getElementById("pageLoader");
    if (!loader) return;

    // 立即锁定滚动，避免加载期间背后内容被拖动
    document.documentElement.classList.add("is-loading");

    // 最短展示时长，避免"闪一下就消失"的廉价感
    const MIN_SHOW = 400;

    // 单项等待上限：图片或字体卡住时也能放行，避免永久停在加载层
    const ITEM_WAIT = 4000;

    // 总兜底：极端情况下最多等待这么久
    const FALLBACK_WAIT = 8000;

    const shownAt = Date.now();

    let finished = false;
    let checking = false;

    // 加载层结束后的回调队列：滚动锁已解除，此时定位才有效
    const finishCallbacks = [];

    // 文档（含图片、样式、脚本）是否加载完成
    let loadDone = document.readyState === "complete";

    // 数据是否已抓取并渲染进页面
    let contentDone = false;

    function delay(ms) {
        return new Promise(function (resolve) {
            setTimeout(resolve, ms);
        });
    }

    function doFinish() {
        if (finished) return;
        finished = true;

        // 先解除滚动锁，再放行定位逻辑：此刻加载层仍完全遮住画面，
        // 定位在同一帧内完成，用户看到的是淡出后列表已停在目标位置
        document.documentElement.classList.remove("is-loading");

        finishCallbacks.splice(0).forEach(function (callback) {
            callback();
        });

        loader.classList.add("hide");

        // 淡出结束后移除节点，避免残留遮挡
        loader.addEventListener("transitionend", function () {
            if (loader.parentNode) loader.remove();
        });

        // 兜底：过渡被打断时也能移除
        setTimeout(function () {
            if (loader.parentNode) loader.remove();
        }, 800);
    }

    // 等待所有图片解码完成，包含渲染后才插入的图片
    function waitImages() {
        const images = Array.prototype.slice.call(document.images || []);

        const pending = images.filter(function (image) {
            if (image.complete) return false;

            // 懒加载图片本就要等滚动才请求，不纳入等待，避免无谓地拖住加载层
            if (image.loading === "lazy") return false;

            return true;
        });

        if (pending.length === 0) return Promise.resolve();

        const all = Promise.all(pending.map(function (image) {
            return new Promise(function (resolve) {
                function done() {
                    image.removeEventListener("load", done);
                    image.removeEventListener("error", done);
                    resolve();
                }

                image.addEventListener("load", done);
                image.addEventListener("error", done);
            });
        }));

        return Promise.race([all, delay(ITEM_WAIT)]);
    }

    // 等待字体就绪，避免加载层消失后文字重新排版
    function waitFonts() {
        if (document.fonts && document.fonts.ready) {
            return Promise.race([
                document.fonts.ready.catch(function () {}),
                delay(ITEM_WAIT)
            ]);
        }

        return Promise.resolve();
    }

    function check() {
        if (finished || checking) return;
        if (!loadDone || !contentDone) return;

        checking = true;

        waitFonts()
            .then(waitImages)
            .then(function () {
                const wait = Math.max(0, MIN_SHOW - (Date.now() - shownAt));
                return delay(wait);
            })
            .then(doFinish);
    }

    if (!loadDone) {
        window.addEventListener("load", function () {
            loadDone = true;
            check();
        });
    }

    // 供页面脚本在渲染完成后调用，声明内容已就绪
    window.__pageLoaderContentReady = function () {
        contentDone = true;
        check();
    };

    // 供其他逻辑强制放行（跳过等待）
    window.__pageLoaderFinish = function () {
        loadDone = true;
        contentDone = true;
        check();
    };

    // 供页面脚本登记"加载层结束后再执行"的动作（例如滚动定位）
    // 已结束时立即执行，未结束时排队，避免在滚动被锁的阶段做定位
    window.__pageLoaderOnFinish = function (callback) {
        if (typeof callback !== "function") return;
        if (finished) {
            callback();
            return;
        }

        finishCallbacks.push(callback);
    };

    // 保险：最多等待 FALLBACK_WAIT，避免异常情况下卡在加载层
    setTimeout(function () {
        loadDone = true;
        contentDone = true;
        check();
    }, FALLBACK_WAIT);
})();