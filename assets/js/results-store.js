/*! results-store.js — единый модуль без конфликтов */
(function () {
  'use strict';

  // ---------- Project scoping (изоляция БД и привязки папки) ----------
  const META_KEY = document.querySelector('meta[name="project-key"]')?.content?.trim();
  const PROJECT_KEY =
    META_KEY || location.hostname + location.pathname.split('/').slice(0, 2).join('/');
  const SAFE_KEY = String(PROJECT_KEY).replace(/[^a-z0-9_-]/gi, '-');

  // ---------- IndexedDB ----------
  const DB_NAME = 'storyhub_results_' + SAFE_KEY;
  const STORE_RESULTS = 'results';
  const STORE_FS = 'fsmeta';

  const idb = {
    open() {
      return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, 5);
        req.onupgradeneeded = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains(STORE_RESULTS)) {
            db.createObjectStore(STORE_RESULTS, { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains(STORE_FS)) {
            db.createObjectStore(STORE_FS, { keyPath: 'key' });
          }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    },
    put(store, value) {
      return this.open().then(
        (db) =>
          new Promise((resolve, reject) => {
            const tx = db.transaction(store, 'readwrite');
            tx.oncomplete = () => resolve(true);
            tx.onerror = () => reject(tx.error);
            tx.objectStore(store).put(value);
          })
      );
    },
    get(store, key) {
      return this.open().then(
        (db) =>
          new Promise((resolve, reject) => {
            const tx = db.transaction(store, 'readonly');
            const req = tx.objectStore(store).get(key);
            req.onsuccess = () => resolve(req.result || null);
            req.onerror = () => reject(req.error);
          })
      );
    },
    allByUsername(username) {
      const uname = normalizeUsername(username);
      return this.open().then(
        (db) =>
          new Promise((resolve, reject) => {
            const out = [];
            const tx = db.transaction(STORE_RESULTS, 'readonly');
            const req = tx.objectStore(STORE_RESULTS).openCursor();
            req.onsuccess = (e) => {
              const c = e.target.result;
              if (c) {
                if (typeof c.key === 'string' && c.key.startsWith(uname + '/')) {
                  out.push(c.value);
                }
                c.continue();
              } else resolve(out);
            };
            req.onerror = () => reject(req.error);
          })
      );
    },
    getByIds(ids) {
      return this.open().then(
        (db) =>
          new Promise((resolve) => {
            const tx = db.transaction(STORE_RESULTS, 'readonly');
            const st = tx.objectStore(STORE_RESULTS);
            const out = [];
            let left = ids.length || 0;
            if (!left) return resolve(out);
            ids.forEach((id) => {
              const r = st.get(id);
              r.onsuccess = () => {
                if (r.result) out.push(r.result);
                if (--left === 0) resolve(out);
              };
              r.onerror = () => {
                if (--left === 0) resolve(out);
              };
            });
          })
      );
    },
    delMany(ids) {
      return this.open().then(
        (db) =>
          new Promise((resolve) => {
            const tx = db.transaction(STORE_RESULTS, 'readwrite');
            const st = tx.objectStore(STORE_RESULTS);
            let left = ids.length || 0;
            if (!left) return resolve(0);
            ids.forEach((id) => {
              const r = st.delete(id);
              r.onsuccess = () => {
                if (--left === 0) resolve(ids.length);
              };
              r.onerror = () => {
                if (--left === 0) resolve(ids.length);
              };
            });
          })
      );
    },
  };

  // ---------- utils ----------
  function two(n) {
    return (n < 10 ? '0' : '') + n;
  }
  function normStamp(d) {
    const yy = d.getFullYear(),
      mm = two(d.getMonth() + 1),
      dd = two(d.getDate()),
      hh = two(d.getHours()),
      mi = two(d.getMinutes());
    return `${yy}${mm}${dd}-${hh}${mi}`;
  }
  function baseNameNoExt(name) {
    const s = String(name);
    const i = s.lastIndexOf('.');
    return i > 0 ? s.slice(0, i) : s;
  }
  function normalizeUsername(s) {
    return String(s || '')
      .trim()
      .replace(/^@+/, '')
      .replace(/["'`]/g, '')
      .toLowerCase();
  }
  function parseMetaFromName(filename) {
    const low = String(filename).toLowerCase();
    let lesson = 1;
    const m1 = low.match(/lesson[-_\s]?(\d+)/i);
    if (m1) lesson = parseInt(m1[1], 10) || 1;
    let stamp = '';
    const m2 = low.match(/(\d{8})[-_]?(\d{4})/);
    if (m2) stamp = `${m2[1]}-${m2[2]}`;
    if (!stamp) stamp = normStamp(new Date());
    return { lesson, stamp };
  }
  function guessUsername(filename) {
    const low = String(filename).toLowerCase();
    // строго после "results-"
    let m = low.match(/results-([a-z0-9_.-]+?)(?=-\d{4,}|[\s._(]|$)/i);
    if (m) return normalizeUsername(m[1]);
    // запасные варианты
    m = low.match(/^([a-z0-9_.-]+)[ _].+\.(xlsx|xls)$/i);
    if (m) return normalizeUsername(m[1]);
    m = low.match(/[\/\\]([^\/\\]+?)\.xlsx$/i);
    if (m) return normalizeUsername(m[1]);
    return '';
  }

  // ---------- File System Access ----------
  const fsSupported = 'showDirectoryPicker' in window;
  const FS_KEY = 'projectDir:' + SAFE_KEY;

  async function connectProjectDirectory() {
    if (!fsSupported) throw new Error('File System Access API не поддерживается');
    // В id только безопасные символы
    const dir = await window.showDirectoryPicker({
      id: 'storyhub-project-root--' + SAFE_KEY,
      mode: 'readwrite',
    });
    await idb.put(STORE_FS, { key: FS_KEY, handle: dir });
    return dir;
  }
  async function getProjectDirectory() {
    const rec = await idb.get(STORE_FS, FS_KEY);
    return rec ? rec.handle : null;
  }
  async function ensurePermission() {
    const dir = await getProjectDirectory();
    if (!dir) return 'none';
    const st = await dir.queryPermission({ mode: 'readwrite' });
    if (st === 'granted') return 'granted';
    if (st === 'prompt') return await dir.requestPermission({ mode: 'readwrite' });
    return st;
  }
  async function saveToProject(username, filename, arrayBuffer, meta) {
    const dir = await getProjectDirectory();
    if (!dir) return false;
    // test/result/<login>/lessonN/<basename>_<stamp>.xlsx
    const testDir = await dir.getDirectoryHandle('test', { create: true });
    const resultDir = await testDir.getDirectoryHandle('result', { create: true });
    const userDir = await resultDir.getDirectoryHandle(normalizeUsername(username), {
      create: true,
    });
    const lessonDir = await userDir.getDirectoryHandle('lesson' + (meta?.lesson || 1), {
      create: true,
    });
    const fileHandle = await lessonDir.getFileHandle(filename, { create: true });
    const ws = await fileHandle.createWritable();
    await ws.write(arrayBuffer);
    await ws.close();
    return true;
  }

  // ---------- ZIP (stored, без зависимостей) ----------
  function crc32(buf) {
    let t = crc32.table;
    if (!t) {
      t = new Uint32Array(256);
      for (let i = 0; i < 256; i++) {
        let c = i;
        for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
        t[i] = c >>> 0;
      }
      crc32.table = t;
    }
    let crc = 0xffffffff;
    const a = new Uint8Array(buf);
    for (let i = 0; i < a.length; i++) crc = crc32.table[(crc ^ a[i]) & 0xff] ^ (crc >>> 8);
    return (crc ^ 0xffffffff) >>> 0;
  }
  function s2u8(s) {
    const a = new Uint8Array(s.length);
    for (let i = 0; i < s.length; i++) a[i] = s.charCodeAt(i);
    return a;
  }
  function u16(n) {
    return new Uint8Array([n & 255, (n >>> 8) & 255]);
  }
  function u32(n) {
    return new Uint8Array([n & 255, (n >>> 8) & 255, (n >>> 16) & 255, (n >>> 24) & 255]);
  }
  async function makeZip(files) {
    // files: [{name, data: ArrayBuffer|Blob|File} | {name, blob} | {name, arrayBuffer():Promise<AB>}]
    async function toBuf(f) {
      if (!f) return new ArrayBuffer(0);
      if (typeof f.arrayBuffer === 'function') return await f.arrayBuffer();
      if (f.blob && typeof f.blob.arrayBuffer === 'function') return await f.blob.arrayBuffer();
      if (f.data instanceof ArrayBuffer) return f.data;
      if (f.data && typeof f.data.arrayBuffer === 'function') return await f.data.arrayBuffer();
      return f.arrayBuffer instanceof ArrayBuffer ? f.arrayBuffer : new ArrayBuffer(0);
    }

    const chunks = [];
    const centr = [];
    let off = 0;

    for (const f of files) {
      const buf = await toBuf(f);
      const nameU8 = s2u8(f.name);
      const size = buf.byteLength;
      const c = crc32(buf);

      // local header
      chunks.push(
        s2u8('PK\x03\x04'),
        u16(20),
        u16(0),
        u16(0),
        u16(0),
        u16(0),
        u32(c),
        u32(size),
        u32(size),
        u16(nameU8.length),
        u16(0),
        nameU8,
        new Uint8Array(buf)
      );

      const localLen = 30 + nameU8.length + size;

      // central header
      centr.push([
        s2u8('PK\x01\x02'),
        u16(20),
        u16(20),
        u16(0),
        u16(0),
        u16(0),
        u16(0),
        u32(c),
        u32(size),
        u32(size),
        u16(nameU8.length),
        u16(0),
        u16(0),
        u16(0),
        u16(0),
        u32(0),
        u32(off),
        nameU8,
      ]);

      off += localLen;
    }

    // central directory
    let centrSize = 0;
    for (const arr of centr) for (const p of arr) centrSize += p.length;

    const total = chunks.reduce((s, a) => s + a.length, 0) + centrSize + 22;
    const out = new Uint8Array(total);
    let pos = 0;

    for (const a of chunks) {
      out.set(a, pos);
      pos += a.length;
    }
    for (const arr of centr) {
      for (const p of arr) {
        out.set(p, pos);
        pos += p.length;
      }
    }

    out.set(s2u8('PK\x05\x06'), pos);
    pos += 4;
    out.set(u16(0), pos);
    pos += 2;
    out.set(u16(0), pos);
    pos += 2;
    out.set(u16(centr.length), pos);
    pos += 2;
    out.set(u16(centr.length), pos);
    pos += 2;
    out.set(u32(centrSize), pos);
    pos += 4;
    out.set(u32(chunks.reduce((s, a) => s + a.length, 0)), pos);
    pos += 4;
    out.set(u16(0), pos);

    return new Blob([out], { type: 'application/zip' });
  }

  // ---------- Core API ----------
  async function listByUsername(username) {
    return idb.allByUsername(username);
  }
  async function deleteAll(username) {
    const uname = normalizeUsername(username);
    const list = await idb.allByUsername(uname);
    if (!list.length) return 0;
    await idb.delMany(list.map((r) => r.id));
    return list.length;
  }
  async function clearUser(username) {
    return deleteAll(username);
  }
  async function clearAll() {
    await new Promise((res, rej) => {
      const r = indexedDB.deleteDatabase(DB_NAME);
      r.onsuccess = () => res(true);
      r.onerror = () => rej(r.error);
    });
  }

  async function importFile(file, usernameLike, opts) {
    let username = normalizeUsername(usernameLike || '') || guessUsername(file.name);
    if (!username)
      throw new Error(
        'Не удалось определить логин. Ожидаем имена вида: lesson-1-results-LOGIN-YYYYMMDD-HHMM.xlsx'
      );

    const ab = await file.arrayBuffer();
    const meta = parseMetaFromName(file.name);
    const norm = baseNameNoExt(file.name) + '_' + (meta.stamp || '') + '.xlsx';

    if (opts?.overwrite) {
      try {
        await deleteAll(username);
      } catch {}
    }

    // Пишем на диск, если папка подключена
    try {
      await saveToProject(username, norm, ab, meta);
    } catch {}

    const rec = {
      id: `${username}/${meta.stamp}/${norm}`,
      username,
      filename: file.name,
      normName: norm,
      size: file.size,
      type: file.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ts: Date.now(),
      blob: ab, // ArrayBuffer
      meta,
    };
    await idb.put(STORE_RESULTS, rec);
    return rec;
  }

  async function hasResult(username) {
    const list = await idb.allByUsername(username);
    return list.length > 0;
  }
  async function getLatest(username) {
    const list = await idb.allByUsername(username);
    if (!list.length) return null;
    list.sort((a, b) => (b.ts || 0) - (a.ts || 0));
    return list[0];
  }

  async function downloadById(id) {
    const recs = await idb.getByIds([id]);
    const rec = recs[0];
    if (!rec) throw new Error('Файл не найден');
    const blob = new Blob([rec.blob], {
      type: rec.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = rec.normName || rec.filename || 'result.xlsx';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 0);
  }

  async function downloadSelectedZipByIds(ids) {
    const recs = await idb.getByIds(ids);
    if (!recs.length) throw new Error('Нет файлов');
    const files = recs.map((r) => ({
      name: r.normName || r.filename || 'file.xlsx',
      data: r.blob,
    }));
    const zip = await makeZip(files);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(zip);
    a.download = 'tests.zip';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 0);
  }

  async function downloadAllZip(username) {
    const list = await idb.allByUsername(username);
    if (!list || !list.length) throw new Error('Нет файлов');
    const files = list
      .sort((a, b) => (b.ts || 0) - (a.ts || 0))
      .map((r) => ({
        name: r.normName || r.filename || 'file.xlsx',
        data: r.blob,
      }));
    const zip = await makeZip(files);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(zip);
    a.download = normalizeUsername(username) + '-all-tests.zip';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 0);
  }

  // Скан подключённой папки и массовый импорт
  async function scanAndImportAll() {
    const dir = await getProjectDirectory();
    if (!dir) throw new Error('Папка проекта не подключена');

    const testDir = await dir.getDirectoryHandle('test', { create: false }).catch(() => null);
    if (!testDir) throw new Error('Нет папки /test');

    const resDir =
      (await testDir.getDirectoryHandle('result', { create: false }).catch(() => null)) ||
      (await testDir.getDirectoryHandle('results', { create: false }).catch(() => null));
    if (!resDir) throw new Error('Нет папки /test/result[s]');

    let imported = 0;
    for await (const [login, userHandle] of resDir.entries()) {
      if (userHandle.kind !== 'directory') continue;
      const username = normalizeUsername(login);

      let hasLessonFolders = false;
      for await (const [n, h] of userHandle.entries()) {
        if (h.kind === 'directory' && /^lesson\d+$/i.test(n)) {
          hasLessonFolders = true;
          for await (const [fn, fh] of h.entries()) {
            if (fh.kind === 'file' && /\.xlsx?$/i.test(fn)) {
              const f = await fh.getFile();
              await importFile(f, username);
              imported++;
            }
          }
        }
      }
      if (!hasLessonFolders) {
        for await (const [fn, fh] of userHandle.entries()) {
          if (fh.kind === 'file' && /\.xlsx?$/i.test(fn)) {
            const f = await fh.getFile();
            await importFile(f, username);
            imported++;
          }
        }
      }
    }
    return imported;
  }

  // Экспорт в window
  window.ResultsStore = {
    // core
    importFile,
    hasResult,
    getLatest,
    listByUsername,
    deleteAll,
    clearUser,
    clearAll,
    // fs
    fsSupported,
    connectProjectDirectory,
    ensurePermission,
    getProjectDirectory,
    scanAndImportAll,
    // utils
    normalizeUsername,
    guessUsername,
    // download
    downloadById,
    downloadSelectedZipByIds,
    downloadAllZip,
  };
})();
