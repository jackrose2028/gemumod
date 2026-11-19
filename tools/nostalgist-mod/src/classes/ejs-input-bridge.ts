// NostalgistMod: EmulatorJS core builds do not read RetroArch's keyboard joypad driver; they take input through
// the exported simulate_input(player, index, value). This bridge feeds keyboard and gamepad state into it,
// using Nostalgist's own input_playerN_* key bindings, so Nostalgist's controls and press() API keep working.

/** RetroPad button order used by EmulatorJS builds. */
export const ejsButtonIndex: Record<string, number> = {
  b: 0, y: 1, select: 2, start: 3, up: 4, down: 5, left: 6, right: 7,
  a: 8, x: 9, l: 10, r: 11, l2: 12, r2: 13, l3: 14, r3: 15,
}
// W3C "standard" gamepad layout -> RetroPad index (bottom face button is RetroPad B, right is A …)
const standardPadToRetro = [0, 8, 1, 9, 10, 11, 12, 13, 2, 3, 14, 15, 4, 5, 6, 7]
const ANALOG = 0x7fff
const isInteractable = (target: EventTarget | null) =>
  target instanceof HTMLInputElement || target instanceof HTMLSelectElement || target instanceof HTMLTextAreaElement ||
  target instanceof HTMLButtonElement || target instanceof HTMLAnchorElement || (target instanceof HTMLElement && target.isContentEditable)

type KeyCodeLookup = (button: string, player: number) => string | undefined

export class EjsInputBridge {
  private readonly held = new Set<string>()
  private keyMap = new Map<string, [number, number][]>()
  private frame = 0
  private readonly padState = new Map<number, number[]>()
  private readonly listeners: [EventTarget, string, EventListener][] = []
  private stopped = false

  constructor(
    private readonly simulate: (player: number, index: number, value: number) => void,
    private readonly lookup: KeyCodeLookup,
    private readonly target: EventTarget,
    private readonly element: HTMLElement,
    private readonly global: boolean,
  ) {
    this.rebuildKeyMap()
    const onKey = (event: Event) => this.onKey(event as KeyboardEvent)
    this.listen(this.target, 'keydown', onKey)
    this.listen(this.target, 'keyup', onKey)
    this.listen(globalThis, 'blur', () => this.releaseAll())
    this.listen(document, 'visibilitychange', () => document.hidden && this.releaseAll())
    this.pollGamepads = this.pollGamepads.bind(this)
    this.frame = requestAnimationFrame(this.pollGamepads)
  }

  /** Sets a RetroPad button by Nostalgist name ("a", "start", "up" …) for a 1-based player. */
  setButton(button: string, player: number, pressed: boolean) {
    const index = ejsButtonIndex[button.toLowerCase()]
    if (index === undefined) return false
    this.send(player - 1, index, pressed ? 1 : 0)
    return true
  }

  rebuildKeyMap() {
    this.keyMap = new Map()
    for (let player = 1; player <= 4; player++) {
      for (const button of Object.keys(ejsButtonIndex)) {
        const code = this.lookup(button, player)
        if (!code) continue
        const list = this.keyMap.get(code) || []
        list.push([player - 1, ejsButtonIndex[button]])
        this.keyMap.set(code, list)
      }
    }
  }

  destroy() {
    this.stopped = true
    cancelAnimationFrame(this.frame)
    this.releaseAll()
    for (const [target, type, listener] of this.listeners) target.removeEventListener(type, listener)
    this.listeners.length = 0
  }

  private listen(target: EventTarget, type: string, listener: EventListener) {
    target.addEventListener(type, listener)
    this.listeners.push([target, type, listener])
  }

  private send(player: number, index: number, value: number) {
    const key = `${player}:${index}`
    if (value) this.held.add(key)
    else this.held.delete(key)
    this.simulate(player, index, value)
  }

  private releaseAll() {
    for (const key of Array.from(this.held)) {
      const [player, index] = key.split(':').map(Number)
      this.held.delete(key)
      this.simulate(player, index, 0)
    }
    this.padState.clear()
  }

  private onKey(event: KeyboardEvent) {
    if (this.global ? isInteractable(event.target) : event.target !== this.element) return
    const targets = this.keyMap.get(event.code)
    if (!targets) return
    event.preventDefault()
    if (event.repeat) return
    for (const [player, index] of targets) this.send(player, index, event.type === 'keydown' ? 1 : 0)
  }

  private pollGamepads() {
    if (this.stopped) return
    const pads = (navigator.getGamepads?.() ?? []).filter(Boolean) as Gamepad[]
    pads.forEach((pad, slot) => {
      if (slot > 3) return
      const previous = this.padState.get(pad.index) || []
      const next: number[] = []
      for (let i = 0; i < standardPadToRetro.length; i++) {
        const button = pad.buttons[i]
        next[standardPadToRetro[i]] = button && (button.pressed || button.value > 0.5) ? 1 : 0
      }
      // Left stick also drives the d-pad, so 8/16-bit games that only read digital input still respond
      const [lx = 0, ly = 0, rx = 0, ry = 0] = pad.axes
      if (lx < -0.5) next[6] = 1
      if (lx > 0.5) next[7] = 1
      if (ly < -0.5) next[4] = 1
      if (ly > 0.5) next[5] = 1
      const analog = (value: number) => (Math.abs(value) < 0.1 ? 0 : Math.round(Math.abs(value) * ANALOG))
      next[16] = lx > 0 ? analog(lx) : 0
      next[17] = lx < 0 ? analog(lx) : 0
      next[18] = ly > 0 ? analog(ly) : 0
      next[19] = ly < 0 ? analog(ly) : 0
      next[20] = rx > 0 ? analog(rx) : 0
      next[21] = rx < 0 ? analog(rx) : 0
      next[22] = ry > 0 ? analog(ry) : 0
      next[23] = ry < 0 ? analog(ry) : 0
      for (let index = 0; index < 24; index++) {
        const value = next[index] || 0
        if ((previous[index] || 0) !== value) this.send(slot, index, value)
      }
      this.padState.set(pad.index, next)
    })
    this.frame = requestAnimationFrame(this.pollGamepads)
  }
}
