// Hover / keyboard-focus help for elements with a data-tip attribute.
// Touch devices get the same text by tapping the small "?" badge.
export function initTooltips(root = document) {
    const tip = document.createElement("div");
    tip.id = "tooltip";
    tip.setAttribute("role", "tooltip");
    tip.hidden = true;
    document.body.appendChild(tip);
    let current = null;

    const place = (target) => {
        const rect = target.getBoundingClientRect();
        tip.style.left = "0px";
        tip.style.top = "0px";
        const width = tip.offsetWidth;
        const height = tip.offsetHeight;
        let left = Math.min(Math.max(8, rect.left), window.innerWidth - width - 8);
        let top = rect.bottom + 8;
        if (top + height > window.innerHeight - 8) top = Math.max(8, rect.top - height - 8);
        tip.style.left = left + "px";
        tip.style.top = top + "px";
    };
    const show = (target) => {
        current = target;
        tip.textContent = target.dataset.tip;
        tip.hidden = false;
        place(target);
        target.setAttribute("aria-describedby", "tooltip");
    };
    const hide = (target) => {
        if (target && target !== current) return;
        tip.hidden = true;
        if (current) current.removeAttribute("aria-describedby");
        current = null;
    };
    const owner = (node) => (node && node.closest ? node.closest("[data-tip]") : null);

    root.addEventListener("mouseover", (e) => {
        const target = owner(e.target);
        if (target && target !== current) show(target);
    });
    root.addEventListener("mouseout", (e) => {
        const target = owner(e.target);
        if (target && !target.contains(e.relatedTarget)) hide(target);
    });
    root.addEventListener("focusin", (e) => {
        const target = owner(e.target);
        if (target) show(target);
    });
    root.addEventListener("focusout", (e) => hide(owner(e.target)));
    window.addEventListener("scroll", () => current && place(current), { passive: true });
    window.addEventListener("keydown", (e) => {
        if (e.key === "Escape") hide();
    });

    // A "?" badge on each item: tap to toggle on touch screens, also reachable by keyboard
    for (const target of root.querySelectorAll("[data-tip]")) {
        if (target.querySelector(":scope > .tip-badge")) continue;
        const badge = document.createElement("button");
        badge.type = "button";
        badge.className = "tip-badge";
        badge.textContent = "?";
        badge.setAttribute("aria-label", "What is this?");
        badge.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (current === target && !tip.hidden) hide();
            else show(target);
        });
        target.appendChild(badge);
    }
    document.addEventListener("click", (e) => {
        if (current && !owner(e.target)) hide();
    });
}
