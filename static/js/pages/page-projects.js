/**
 * 作品页渲染
 * 数据来自 data/projects.json：项目卡片列表，含类型、年份、状态、技术栈与链接
 */

(function () {
    "use strict";

    const App = window.PageApp;
    if (!App) return;

    const create = App.create;

    function renderCard(item) {
        const card = create("article", "project-card");
        if (item.id) card.id = item.id;

        card.appendChild(create("p", "project-type", item.type || ""));
        card.appendChild(create("h2", "project-name", item.title || ""));
        card.appendChild(create("p", "project-desc", item.desc || ""));

        const meta = create("p", "project-meta");
        meta.appendChild(create("span", "", item.year || ""));
        meta.appendChild(create("span", "project-status", item.status || ""));
        card.appendChild(meta);

        if (Array.isArray(item.stack) && item.stack.length > 0) {
            const stack = create("div", "project-stack");
            item.stack.forEach(function (name) {
                stack.appendChild(create("span", "stack-chip", name));
            });
            card.appendChild(stack);
        }

        if (item.link) {
            const more = create("a", "project-more");
            more.href = item.link;
            more.appendChild(create("span", "", "查看项目"));
            more.appendChild(create("span", "project-more-arrow", "→"));
            card.appendChild(more);
        } else {
            const idle = create("span", "project-more project-more-idle");
            idle.appendChild(create("span", "", "敬请期待"));
            idle.appendChild(create("span", "project-more-arrow", "→"));
            card.appendChild(idle);
        }

        return card;
    }

    App.register("projects", function renderProjects(projects) {
        if (!projects || !App.pageBody) return;

        App.renderHead(projects);

        const block = create("section", "page-block page-block-single");
        const body = create("div", "block-body");
        const grid = create("div", "work-grid");

        (projects.items || []).forEach(function (item) {
            grid.appendChild(renderCard(item));
        });

        body.appendChild(grid);
        block.appendChild(body);

        App.pageBody.innerHTML = "";
        App.pageBody.appendChild(block);
    });
})();