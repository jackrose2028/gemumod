// Sets the phone-view classes before the page is first drawn, so phones never flash the desktop layout.
// assets/mobile.js keeps them up to date afterwards (same rules).
(function () {
    try {
        var h = document.documentElement, ua = navigator.userAgent;
        var ios = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
        var android = /Android/.test(ua);
        var touch = matchMedia("(pointer: coarse)").matches || (navigator.maxTouchPoints > 0 && (ios || android));
        var view = new URLSearchParams(location.search).get("view");
        if (view !== "phone" && view !== "desktop") {
            var mode = (JSON.parse(localStorage.getItem("ejs-launcher-options") || "{}").mode) || "";
            view = mode === "mobile" ? "phone" : mode === "desktop" ? "desktop" : "auto";
        }
        var phone = view === "phone" || (view === "auto" && touch && Math.min(screen.width, screen.height) <= 820);
        var portrait = innerHeight >= innerWidth;
        var add = function (name, on) { if (on) h.classList.add(name); };
        add("m-touch", touch); add("m-phone", phone); add("m-ios", ios); add("m-iphone", /iPhone|iPod/.test(ua));
        add("m-android", android); add("m-standalone", navigator.standalone === true || matchMedia("(display-mode: standalone)").matches);
        add(portrait ? "m-portrait" : "m-landscape", true);
    } catch (e) { /* mobile.js sets them later */ }
})();
