// Local JSZip 3.10.1 (MIT or GPLv3, header in jszip.min.js) as an ES module, replacing the esm.sh CDN import.
const url = new URL("./jszip.min.js", import.meta.url).href;
if (!window.JSZip) {
    await new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = url;
        script.onload = resolve;
        script.onerror = () => reject(new Error("Could not load " + url));
        document.head.appendChild(script);
    });
}
export default window.JSZip;
