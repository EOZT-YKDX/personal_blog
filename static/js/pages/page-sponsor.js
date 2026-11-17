/**
 * 赞助页渲染
 * 数据来自 data/sponsor.json：收款码、说明条目与赞助者名单
 */

(function () {
    "use strict";

    const App = window.PageApp;
    if (!App) return;

    const create = App.create;

    function renderWall(sponsors) {
        const wall = create("div", "sponsor-wall");

        if (sponsors.title) {
            wall.appendChild(create("p", "label sponsor-wall-label", sponsors.title));
        }

        const items = Array.isArray(sponsors.items) ? sponsors.items : [];

        if (items.length === 0) {
            wall.appendChild(create("p", "sponsor-wall-empty", sponsors.empty || ""));
            return wall;
        }

        const sorted = items.slice().sort(function (a, b) {
            return String(b.date || "").localeCompare(String(a.date || ""));
        });

        const table = create("div", "sponsor-wall-table");

        // 表头：三列标题与下方数据行共用同一套列宽，保证上下对齐
        const head = create("div", "sponsor-wall-head");
        head.appendChild(create("p", "label sponsor-wall-head-name", "赞助者"));
        head.appendChild(create("p", "label sponsor-wall-head-date", "赞助日期"));
        head.appendChild(create("p", "label sponsor-wall-head-message", "赞助留言"));
        table.appendChild(head);

        const list = create("ul", "sponsor-wall-list");
        sorted.forEach(function (item) {
            const row = create("li", "sponsor-wall-row");
            row.appendChild(create("span", "sponsor-wall-name", item.name || ""));
            row.appendChild(create("span", "sponsor-wall-date", item.date || ""));
            row.appendChild(create("span", "sponsor-wall-message", item.message || ""));
            list.appendChild(row);
        });
        table.appendChild(list);

        wall.appendChild(table);
        return wall;
    }

    App.register("sponsor", function renderSponsor(sponsor) {
        if (!sponsor || !App.pageBody) return;

        App.renderHead(sponsor);

        const block = create("section", "page-block page-block-single");
        const body = create("div", "block-body");

        const grid = create("div", "sponsor-grid");
        (sponsor.qrcodes || []).forEach(function (code) {
            const card = create("div", "sponsor-card");

            const image = create("img", "sponsor-image");
            image.src = code.image || "";
            image.alt = code.label || "";
            image.loading = "lazy";
            image.decoding = "async";

            card.appendChild(image);
            card.appendChild(create("p", "label sponsor-label", code.label || ""));
            grid.appendChild(card);
        });
        body.appendChild(grid);

        if (Array.isArray(sponsor.notes) && sponsor.notes.length > 0) {
            const notes = create("ul", "sponsor-notes");
            sponsor.notes.forEach(function (line) {
                notes.appendChild(create("li", "sponsor-note", line));
            });
            body.appendChild(notes);
        }

        if (sponsor.sponsors) body.appendChild(renderWall(sponsor.sponsors));

        block.appendChild(body);

        App.pageBody.innerHTML = "";
        App.pageBody.appendChild(block);
    });
})();