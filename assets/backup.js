// Export and import of everything that holds player progress:
// in-game saves (IDBFS "/data/saves"), save states ("EmulatorJS-states") and ejs-* settings in localStorage.
const SAVE_DATABASES = ["/data/saves", "EmulatorJS-states"];
const FORMAT = "emulatorjs-backup";

function toBase64(bytes) {
    let out = "";
    for (let i = 0; i < bytes.length; i += 0x8000) out += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(out);
}
function fromBase64(text) {
    const raw = atob(text);
    const bytes = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
    return bytes;
}
function encode(value) {
    if (value instanceof Uint8Array) return { __u8: toBase64(value) };
    if (value instanceof ArrayBuffer) return { __ab: toBase64(new Uint8Array(value)) };
    if (ArrayBuffer.isView(value)) return { __u8: toBase64(new Uint8Array(value.buffer, value.byteOffset, value.byteLength)) };
    if (value instanceof Date) return { __date: value.getTime() };
    if (Array.isArray(value)) return value.map(encode);
    if (value && typeof value === "object") {
        const out = {};
        for (const k of Object.keys(value)) out[k] = encode(value[k]);
        return out;
    }
    return value;
}
function decode(value) {
    if (Array.isArray(value)) return value.map(decode);
    if (value && typeof value === "object") {
        if (typeof value.__u8 === "string") return fromBase64(value.__u8);
        if (typeof value.__ab === "string") return fromBase64(value.__ab).buffer;
        if (typeof value.__date === "number") return new Date(value.__date);
        const out = {};
        for (const k of Object.keys(value)) out[k] = decode(value[k]);
        return out;
    }
    return value;
}

async function existingDatabases() {
    if (indexedDB.databases) {
        try {
            const names = (await indexedDB.databases()).map((d) => d.name);
            return SAVE_DATABASES.filter((n) => names.includes(n));
        } catch (e) { /* fall through */ }
    }
    return SAVE_DATABASES;
}

function openDb(name, version, upgrade) {
    return new Promise((resolve, reject) => {
        const request = version ? indexedDB.open(name, version) : indexedDB.open(name);
        request.onupgradeneeded = () => upgrade && upgrade(request.result, request.transaction);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
        request.onblocked = () => reject(new Error("Close other tabs running the emulator and try again."));
    });
}

async function dumpDatabase(name) {
    const db = await openDb(name);
    const out = { name, version: db.version, stores: [] };
    for (const storeName of Array.from(db.objectStoreNames)) {
        const store = db.transaction(storeName, "readonly").objectStore(storeName);
        const info = {
            name: storeName,
            keyPath: store.keyPath,
            autoIncrement: store.autoIncrement,
            indexes: Array.from(store.indexNames).map((n) => {
                const index = store.index(n);
                return { name: n, keyPath: index.keyPath, unique: index.unique, multiEntry: index.multiEntry };
            }),
            records: []
        };
        await new Promise((resolve) => {
            const request = store.openCursor();
            request.onsuccess = () => {
                const cursor = request.result;
                if (!cursor) return resolve();
                info.records.push([cursor.key, encode(cursor.value)]);
                cursor.continue();
            };
            request.onerror = () => resolve();
        });
        out.stores.push(info);
    }
    db.close();
    return out;
}

/** Builds the backup and returns it as a downloadable Blob plus a summary count. */
export async function exportBackup() {
    const databases = [];
    let records = 0;
    for (const name of await existingDatabases()) {
        const dump = await dumpDatabase(name);
        records += dump.stores.reduce((n, s) => n + s.records.length, 0);
        databases.push(dump);
    }
    const settings = {};
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("ejs-") && key !== "ejs-recent") settings[key] = localStorage.getItem(key);
    }
    const backup = { format: FORMAT, version: 1, created: new Date().toISOString(), databases, settings };
    return { blob: new Blob([JSON.stringify(backup)], { type: "application/json" }), records };
}

/** Restores a backup produced by exportBackup. Existing entries with the same keys are replaced. */
export async function importBackup(file) {
    const backup = JSON.parse(await file.text());
    if (!backup || backup.format !== FORMAT) throw new Error("This is not an EmulatorJS backup file.");
    let records = 0;
    for (const dump of backup.databases || []) {
        const createMissing = (database) => {
            for (const s of dump.stores) {
                if (database.objectStoreNames.contains(s.name)) continue;
                const options = { autoIncrement: !!s.autoIncrement };
                if (s.keyPath !== null && s.keyPath !== undefined) options.keyPath = s.keyPath;
                const store = database.createObjectStore(s.name, options);
                for (const index of s.indexes || []) store.createIndex(index.name, index.keyPath, { unique: index.unique, multiEntry: index.multiEntry });
            }
        };
        // Keep the original version so the emulator can still open the database afterwards
        let db;
        try {
            db = await openDb(dump.name, dump.version || 1, createMissing);
        } catch (e) {
            db = await openDb(dump.name);
        }
        if (dump.stores.some((s) => !db.objectStoreNames.contains(s.name))) {
            const version = db.version + 1;
            db.close();
            db = await openDb(dump.name, version, createMissing);
        }
        for (const s of dump.stores) {
            if (!db.objectStoreNames.contains(s.name)) continue;
            await new Promise((resolve, reject) => {
                const transaction = db.transaction(s.name, "readwrite");
                const store = transaction.objectStore(s.name);
                for (const [key, value] of s.records) {
                    if (store.keyPath !== null) store.put(decode(value));
                    else store.put(decode(value), key);
                    records++;
                }
                transaction.oncomplete = resolve;
                transaction.onerror = () => reject(transaction.error);
            });
        }
        db.close();
    }
    for (const [key, value] of Object.entries(backup.settings || {})) {
        try { localStorage.setItem(key, value); } catch (e) { /* storage full */ }
    }
    return records;
}
