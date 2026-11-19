// Phone and tablet view: works out what the visitor is on and keeps <html> classes and CSS variables up to date,
// so the stylesheet can switch to the touch layout and follow rotation.
//
//   html.m-touch        touch screen as the main pointer
//   html.m-phone        the phone view is on (touch phone or small tablet, or Browser mode: Mobile)
//   html.m-ios / m-iphone / m-android / m-standalone (opened from the home screen)
//   html.m-portrait / m-landscape
//   --app-h             the visible height in px (iOS Safari's toolbars make 100vh too tall)
//
// The layout follows the home page's Browser mode option (Auto / Desktop / Mobile); ?view=phone|desktop|auto overrides it.
const OPTIONS_KEY = "ejs-launcher-options";
const html = document.documentElement;
const ua = navigator.userAgent;

export const device = (() => {
    const ios = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const iphone = /iPhone|iPod/.test(ua);
    const android = /Android/.test(ua);
    const touch = window.matchMedia("(pointer: coarse)").matches || navigator.maxTouchPoints > 0 && (ios || android);
    const shortSide = Math.min(screen.width, screen.height);
    const standalone = navigator.standalone === true || window.matchMedia("(display-mode: standalone)").matches || window.matchMedia("(display-mode: fullscreen)").matches;
    return { ios, iphone, android, touch, shortSide, standalone };
})();

/** "phone", "desktop" or "auto": ?view= on the address, else the home page's Browser mode option (Mobile / Desktop / Auto). */
export function viewSetting() {
    const fromUrl = new URLSearchParams(location.search).get("view");
    if (fromUrl === "phone" || fromUrl === "desktop" || fromUrl === "auto") return fromUrl;
    try {
        const mode = (JSON.parse(localStorage.getItem(OPTIONS_KEY) || "{}").mode) || "";
        return mode === "mobile" ? "phone" : mode === "desktop" ? "desktop" : "auto";
    } catch (e) {
        return "auto";
    }
}

/** Phone view: touch devices up to large phones and small tablets (short side up to 820 px), unless overridden. */
export function isPhoneView() {
    const setting = viewSetting();
    if (setting === "phone") return true;
    if (setting === "desktop") return false;
    return device.touch && device.shortSide <= 820;
}

let listeners = [];
/** Calls fn(orientation) after every rotation or size change, once the browser has settled the new size. */
export function onOrientation(fn) {
    listeners.push(fn);
}

function orientation() {
    if (screen.orientation && screen.orientation.type) return screen.orientation.type.startsWith("portrait") ? "portrait" : "landscape";
    return window.innerHeight >= window.innerWidth ? "portrait" : "landscape";
}

let last = null;
function update() {
    const o = window.innerHeight >= window.innerWidth ? "portrait" : orientation();
    const height = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    html.style.setProperty("--app-h", Math.round(height) + "px");
    html.classList.toggle("m-portrait", o === "portrait");
    html.classList.toggle("m-landscape", o !== "portrait");
    const key = o + ":" + window.innerWidth + "x" + Math.round(height);
    if (key !== last) {
        last = key;
        for (const fn of listeners) {
            try { fn(o); } catch (e) { console.warn(e); }
        }
    }
}

/** Sets the classes and starts following rotation. Call once per page. */
export function applyView() {
    const phone = isPhoneView();
    html.classList.toggle("m-phone", phone);
    return phone;
}
export function initDevice({ game = false } = {}) {
    const phone = applyView();
    html.classList.toggle("m-touch", device.touch);
    html.classList.toggle("m-ios", device.ios);
    html.classList.toggle("m-iphone", device.iphone);
    html.classList.toggle("m-android", device.android);
    html.classList.toggle("m-standalone", device.standalone);
    update();
    // iOS reports the new size a little after the rotation event, so check again shortly after
    const settle = () => {
        update();
        setTimeout(update, 150);
        setTimeout(update, 450);
    };
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", settle);
    if (screen.orientation && screen.orientation.addEventListener) screen.orientation.addEventListener("change", settle);
    if (window.visualViewport) window.visualViewport.addEventListener("resize", update);

    if (game && (phone || device.touch)) {
        // While playing, a pinch, double tap or long press should never zoom the page or pop up a menu
        document.addEventListener("gesturestart", (e) => e.preventDefault(), { passive: false });
        document.addEventListener("dblclick", (e) => e.preventDefault(), { passive: false });
        document.addEventListener("contextmenu", (e) => {
            if (e.target.closest && e.target.closest("#display")) e.preventDefault();
        });
        // Double-tap zoom is turned off in CSS (touch-action), which keeps quick repeated button taps working
    }
    return { phone, device };
}
