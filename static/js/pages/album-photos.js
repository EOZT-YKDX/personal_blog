/**
 * 相册照片探测
 * 浏览器无法列出目录，因此通过 HEAD 请求逐张探测文件是否存在
 * 对外暴露 albumPhotos.detectPattern / findCover / scanPhotos
 */

(function () {
    "use strict";

    // 相册资源约定：子文件夹名即相册 id，封面优先 cover.*，照片按 1.png、2.png 递增
    const ALBUM_BASE = "./static/img/album/";
    const PHOTO_EXTENSIONS = ["svg", "png", "jpg", "jpeg", "webp", "gif", "avif"];
    const COVER_STEM = "cover";
    const MAX_PHOTOS = 999;

    // 每批并行探测的张数，兼顾速度与请求数量
    const PROBE_BATCH = 12;

    // 用 HEAD 探测文件是否存在：只取响应头，不下载图片内容，保留懒加载的收益
    // 同时校验 content-type，避免服务器对缺失文件返回 HTML 兜底页时被误判为存在
    function probeFile(url) {
        return fetch(url, { method: "HEAD", cache: "no-store" })
            .then(function (response) {
                if (!response.ok) return false;

                const type = response.headers.get("content-type") || "";
                return !type || type.indexOf("image/") === 0;
            })
            .catch(function () {
                return false;
            });
    }

    // 序号转文件名：补零位数可配，两位补零时 1 变为 01
    function photoName(index, pad) {
        let text = String(index);
        while (pad && text.length < pad) text = "0" + text;
        return text;
    }

    function albumBase(id) {
        return ALBUM_BASE + encodeURIComponent(id) + "/";
    }

    // 并行探测一组候选，按传入顺序返回第一个命中的地址，未命中返回空串
    function probeFirst(urls) {
        return Promise.all(
            urls.map(function (url) {
                return probeFile(url).then(function (ok) {
                    return ok ? url : "";
                });
            })
        ).then(function (results) {
            return results.find(function (url) {
                return url;
            }) || "";
        });
    }

    // 识别命名规律：先试两位补零（01.png），再试不补零（1.png）
    function detectPattern(id) {
        const base = albumBase(id);
        const urls = [];
        const patterns = [];

        [2, 1].forEach(function (pad) {
            PHOTO_EXTENSIONS.forEach(function (ext) {
                urls.push(base + photoName(1, pad) + "." + ext);
                patterns.push({ pad: pad, ext: ext });
            });
        });

        return probeFirst(urls).then(function (url) {
            return url ? patterns[urls.indexOf(url)] : null;
        });
    }

    // 封面：优先 cover.*，没有则用第一张照片，都没有则返回空串交给占位图标
    function findCover(id) {
        const base = albumBase(id);
        const urls = PHOTO_EXTENSIONS.map(function (ext) {
            return base + COVER_STEM + "." + ext;
        });

        return probeFirst(urls).then(function (cover) {
            if (cover) return cover;
            return detectPattern(id).then(function (pattern) {
                if (!pattern) return "";
                return base + photoName(1, pattern.pad) + "." + pattern.ext;
            });
        });
    }

    // 按识别出的命名规律从 1 开始分批探测：同批并行，遇到缺口即结束
    function scanPhotos(id) {
        return detectPattern(id).then(function (pattern) {
            if (!pattern) return [];

            const base = albumBase(id);
            const list = [];

            function batch(start) {
                if (start > MAX_PHOTOS) return Promise.resolve(list);

                const indexes = [];
                for (let index = start; index < start + PROBE_BATCH && index <= MAX_PHOTOS; index++) {
                    indexes.push(index);
                }

                return Promise.all(
                    indexes.map(function (index) {
                        const url = base + photoName(index, pattern.pad) + "." + pattern.ext;
                        return probeFile(url).then(function (ok) {
                            return ok ? url : "";
                        });
                    })
                ).then(function (results) {
                    // 只接受连续命中，遇到第一张缺失就收尾，保证照片顺序不断档
                    for (let i = 0; i < results.length; i++) {
                        if (!results[i]) return list;
                        list.push(results[i]);
                    }

                    return batch(start + PROBE_BATCH);
                });
            }

            return batch(1);
        });
    }

    window.albumPhotos = {
        detectPattern: detectPattern,
        findCover: findCover,
        scanPhotos: scanPhotos
    };
})();