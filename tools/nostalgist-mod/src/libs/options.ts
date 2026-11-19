import type { NostalgistOptions, NostalgistOptionsPartial } from '../types/nostalgist-options.ts'
import type { RetroArchConfig } from '../types/retroarch-config'
import { isAbsoluteUrl, merge } from './utils.ts'
import { vendors } from './vendors.ts'

const { path } = vendors

function getDefaultRetroarchConfig() {
  const defaultRetroarchConfig: RetroArchConfig = {
    menu_driver: 'rgui',
    menu_navigation_browser_filter_supported_extensions_enable: false,
    notification_show_cheats_applied: false,
    notification_show_when_menu_is_alive: true,
    savestate_auto_load: true,
    savestate_thumbnail_enable: true,
    stdin_cmd_enable: true,
    video_shader_enable: true,

    input_audio_mute: 'nul', // override default 'f9'
    input_cheat_index_minus: 'nul', // override default 't',
    input_cheat_index_plus: 'nul', // override default 'y',
    input_cheat_toggle: 'nul', // override default 'u',
    input_desktop_menu_toggle: 'nul', // override default 'f5'
    input_exit_emulator: 'nul', // override default 'esc',
    input_fps_toggle: 'nul', // override default 'f3'
    input_frame_advance: 'nul', // override default 'k',
    input_game_focus_toggle: 'nul', // override default 'scroll_lock'
    input_grab_mouse_toggle: 'nul', // override default 'f11'
    input_hold_fast_forward: 'nul', // override default 'l',
    input_hold_slowmotion: 'nul', // override default 'e',
    input_load_state: 'nul', // override default 'f4'
    input_netplay_game_watch: 'nul', // override default 'i',
    input_netplay_player_chat: 'nul', // override default 'tilde'
    input_pause_toggle: 'nul', // override default 'p',
    input_reset: 'nul', // override default 'h',
    input_rewind: 'nul', // override default 'r',
    input_save_state: 'nul', // override default 'f2'
    input_screenshot: 'nul', // override default 'f8'
    input_shader_next: 'nul', // override default 'm',
    input_shader_prev: 'nul', // override default 'n',
    input_shader_toggle: 'nul', // override default 'comma'
    input_state_slot_decrease: 'nul', // override default 'f6'
    input_state_slot_increase: 'nul', // override default 'f7'
    input_toggle_fast_forward: 'nul', // override default 'space'
    input_toggle_fullscreen: 'nul', // override default 'f',
    input_volume_down: 'nul', // override default 'subtract'
    input_volume_up: 'nul', // override default 'add'

    input_player1_analog_dpad_mode: 1,
    input_player2_analog_dpad_mode: 1,
    input_player3_analog_dpad_mode: 1,
    input_player4_analog_dpad_mode: 1,
  }
  return defaultRetroarchConfig
}

// NostalgistMod: cores come from this site's data/cores folder (the EmulatorJS .7z builds), never from a CDN.
// Override with globalThis.NOSTALGIST_MOD = { coresPath, workerPath, manifest } before launching.
interface ModSettings {
  coresPath: string
  manifest?: { files?: Record<string, number> } | null
  workerPath: string
}
function modSettings(): ModSettings {
  const custom = (globalThis as any).NOSTALGIST_MOD || {}
  return {
    coresPath: custom.coresPath || 'data/cores/',
    manifest: custom.manifest ?? (globalThis as any).EJS_coreManifest ?? null,
    workerPath: custom.workerPath || 'data/compression/extract7z.js',
  }
}

/** Archive names to try for a core, best first. Single-threaded builds only: Nostalgist does not set up pthreads. */
export function coreArchiveCandidates(core: string) {
  const { manifest } = modSettings()
  const supportsWebgl2 = (() => {
    try {
      const gl = document.createElement('canvas').getContext('webgl2')
      gl?.getExtension('WEBGL_lose_context')?.loseContext()
      return Boolean(gl)
    } catch {
      return false
    }
  })()
  const order = supportsWebgl2 ? [`${core}-wasm.7z`, `${core}-legacy-wasm.7z`] : [`${core}-legacy-wasm.7z`]
  if (manifest?.files) {
    const present = order.filter((name) => manifest.files && name in manifest.files)
    return present
  }
  return order
}

function extract7z(data: ArrayBuffer, workerPath: string) {
  return new Promise<Record<string, Uint8Array>>((resolve, reject) => {
    const worker = new Worker(workerPath)
    const files: Record<string, Uint8Array> = {}
    worker.onerror = (event) => {
      worker.terminate()
      reject(new Error(`could not unpack core archive: ${event.message || 'worker error'}`))
    }
    worker.onmessage = ({ data: message }) => {
      if (message?.t === 2) files[message.file] = message.data
      if (message?.t === 1) {
        worker.terminate()
        resolve(files)
      }
    }
    worker.postMessage(new Uint8Array(data))
  })
}

const extractCache = new Map<string, ReturnType<typeof extractCore>>()

async function extractCore(core: string) {
  const { coresPath, workerPath } = modSettings()
  const candidates = coreArchiveCandidates(core)
  if (!candidates.length) {
    throw new Error(`no single-threaded build of the "${core}" core in ${coresPath}`)
  }
  let lastError: unknown
  for (const name of candidates) {
    try {
      // Same ?v= query as EmulatorJSMod, so both engines (and prefetching) share one cached download
      const size = modSettings().manifest?.files?.[name]
      const response = await fetch(coresPath + name + (size === undefined ? '' : '?v=' + encodeURIComponent(size)))
      if (!response.ok) throw new Error(`HTTP ${response.status} for ${name}`)
      const files = await extract7z(await response.arrayBuffer(), workerPath)
      const result: { js?: Blob; wasm?: Blob } = {}
      for (const [fileName, bytes] of Object.entries(files)) {
        if (fileName.endsWith('.wasm')) result.wasm = new Blob([bytes as BlobPart], { type: 'application/wasm' })
        else if (fileName.endsWith('.js') && !fileName.endsWith('.worker.js')) result.js = new Blob([bytes as BlobPart], { type: 'application/javascript' })
      }
      if (result.js && result.wasm) return result as { js: Blob; wasm: Blob }
      lastError = new Error(`${name} has no .js/.wasm pair`)
    } catch (error) {
      lastError = error
    }
  }
  throw lastError instanceof Error ? lastError : new Error(`failed to load core ${core}`)
}

async function extractCoreWithCache(core: string) {
  if (!extractCache.has(core)) {
    const promise = extractCore(core)
    extractCache.set(core, promise)
    promise.catch(() => extractCache.delete(core))
  }
  return await (extractCache.get(core) as ReturnType<typeof extractCore>)
}

export function getDefaultOptions() {
  const defaultOptions: Omit<NostalgistOptions, 'core'> = {
    element: '',
    retroarchConfig: getDefaultRetroarchConfig(),
    retroarchCoreConfig: {},
    runEmulatorManually: false,
    setupEmulatorManually: false,

    async resolveCoreJs(core) {
      if (typeof core !== 'string') {
        throw new TypeError('the core name must be a string')
      }
      const { js } = await extractCoreWithCache(core)
      if (!js) {
        throw new Error(`Failed to load core JS for ${core}`)
      }
      return js
    },

    async resolveCoreWasm(core) {
      if (typeof core !== 'string') {
        throw new TypeError('the core name must be a string')
      }
      const { wasm } = await extractCoreWithCache(core)
      if (!wasm) {
        throw new Error(`failed to load core WASM for ${core}`)
      }
      return wasm
    },

    resolveRom(file) {
      if (typeof file !== 'string') {
        return file || []
      }
      return file
    },

    resolveBios(file) {
      return file
    },

    resolveShader() {
      // NostalgistMod ships no shader packs and never downloads them
      return []
    },
  }
  return defaultOptions
}

let globalOptions: NostalgistOptionsPartial = getDefaultOptions()
export function getGlobalOptions() {
  return globalOptions
}

export function updateGlobalOptions(options: NostalgistOptionsPartial) {
  merge(globalOptions, options)
}

export function resetGlobalOptions() {
  globalOptions = getDefaultOptions()
}
