/**
 * 关于页渲染
 * 数据来自 data/about.json：段落、要点列表、技术栈分组、时间线
 */

(function () {
    "use strict";

    const App = window.PageApp;
    if (!App) return;

    const create = App.create;

    function renderSection(section) {
        const block = create("section", "page-block");

        const aside = create("div", "block-aside");
        aside.appendChild(create("p", "label block-label", section.label || ""));
        aside.appendChild(create("h2", "block-title", section.title || ""));

        const body = create("div", "block-body");

        if (Array.isArray(section.paragraphs)) {
            section.paragraphs.forEach(function (line) {
                body.appendChild(create("p", "block-text", line));
            });
        }

        if (section.list) {
            const wrap = create("div", "block-list");

            if (section.list.title) {
                wrap.appendChild(create("p", "block-list-title", section.list.title));
            }

            const items = create("ul", "block-list-items");
            (section.list.items || []).forEach(function (line) {
                items.appendChild(create("li", "block-list-item", line));
            });

            wrap.appendChild(items);
            body.appendChild(wrap);
        }

        if (section.outro) {
            body.appendChild(create("p", "block-text", section.outro));
        }

        if (Array.isArray(section.groups)) {
            const groups = create("div", "stack-groups");

            section.groups.forEach(function (group) {
                const wrap = create("div", "stack-group");
                wrap.appendChild(create("p", "stack-group-name", group.name || ""));

                const items = create("div", "stack-group-items");
                (group.items || []).forEach(function (name) {
                    items.appendChild(create("span", "stack-chip", name));
                });

                wrap.appendChild(items);
                groups.appendChild(wrap);
            });

            body.appendChild(groups);
        }

        if (Array.isArray(section.timeline)) {
            const timeline = create("div", "timeline");

            section.timeline.forEach(function (node) {
                const row = create("div", "timeline-row");
                row.appendChild(create("span", "timeline-date", node.date || ""));

                const main = create("div", "timeline-main");
                main.appendChild(create("p", "timeline-title", node.title || ""));
                main.appendChild(create("p", "timeline-desc", node.desc || ""));

                row.appendChild(main);
                timeline.appendChild(row);
            });

            body.appendChild(timeline);
        }

        block.appendChild(aside);
        block.appendChild(body);
        return block;
    }

    App.register("about", function renderAbout(about) {
        if (!about || !App.pageBody) return;

        App.renderHead(about);

        App.pageBody.innerHTML = "";
        (about.sections || []).forEach(function (section) {
            App.pageBody.appendChild(renderSection(section));
        });
    });
})();