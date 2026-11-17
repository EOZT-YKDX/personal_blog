/**
 * 联系页渲染
 * 数据来自 data/contact.json：联系方式列表，可复制的条目附带复制按钮
 */

(function () {
    "use strict";

    const App = window.PageApp;
    if (!App) return;

    const create = App.create;

    function copyText(text, button) {
        const done = function () {
            const original = button.textContent;
            button.textContent = "已复制";
            window.setTimeout(function () {
                button.textContent = original;
            }, 1500);
        };

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(done, function () {
                fallbackCopy(text, done);
            });
            return;
        }

        fallbackCopy(text, done);
    }

    // 非安全上下文下没有剪贴板 API，用临时文本域兜底
    function fallbackCopy(text, done) {
        const area = document.createElement("textarea");
        area.value = text;
        area.setAttribute("readonly", "");
        area.style.position = "fixed";
        area.style.opacity = "0";
        document.body.appendChild(area);
        area.select();

        try {
            document.execCommand("copy");
            done();
        } catch (error) {
            console.error("复制失败：", error);
        }

        document.body.removeChild(area);
    }

    function renderRow(item) {
        const row = create("li", "contact-row");

        // 供外部带 hash 跳转时定位：#qq / #wechat / #mail / #github
        if (item.id) row.id = item.id;

        const label = create("span", "label contact-label");

        if (item.icon) {
            const icon = create("img", "contact-icon");
            icon.src = item.icon;
            icon.alt = "";
            icon.loading = "lazy";
            icon.decoding = "async";
            label.appendChild(icon);
        }

        label.appendChild(create("span", "", item.label || ""));
        row.appendChild(label);

        const main = create("div", "contact-main");
        main.appendChild(create("span", "contact-value", item.value || ""));

        if (item.note) main.appendChild(create("span", "contact-note", item.note));
        row.appendChild(main);

        if (item.copy) {
            const button = create("button", "contact-action", "复制");
            button.type = "button";
            button.addEventListener("click", function () {
                copyText(item.value || "", button);
            });
            row.appendChild(button);
        }

        return row;
    }

    // 从工具页等处带 hash 进入时定位到对应联系方式：contact.html#wechat
    // 定位在加载层淡出之后执行，避免用户先看到列表顶部再被滚下来；
    // 块级居中可同时避开顶部固定导航，无需再算导航高度
    function scrollToHashedItem() {
        const id = window.location.hash.replace("#", "");
        if (!id) return;

        const scroll = function () {
            const row = document.getElementById(id);
            if (!row) return;

            row.scrollIntoView({ behavior: "auto", block: "center" });
        };

        if (typeof window.__pageLoaderOnFinish === "function") {
            window.__pageLoaderOnFinish(scroll);
        } else {
            scroll();
        }
    }

    App.register("contact", function renderContact(contact) {
        if (!contact || !App.pageBody) return;

        App.renderHead(contact);

        const block = create("section", "page-block page-block-single");
        const body = create("div", "block-body");
        const list = create("ul", "contact-list");

        (contact.items || []).forEach(function (item) {
            list.appendChild(renderRow(item));
        });

        body.appendChild(list);

        if (contact.note) body.appendChild(create("p", "contact-footnote", contact.note));

        block.appendChild(body);

        App.pageBody.innerHTML = "";
        App.pageBody.appendChild(block);

        // 列表渲染完成后才定位，确保目标行已经存在于 DOM 中
        scrollToHashedItem();
    });
})();