/** Scrolls a field into view and moves keyboard/screen-reader focus to it. */
export function focusField(key: string) {
  const el = document.querySelector<HTMLElement>(`[data-field="${key}"]`)
  if (!el) return
  el.scrollIntoView({ block: 'center', behavior: 'smooth' })
  el.querySelector<HTMLElement>('input, button')?.focus({ preventScroll: true })
}
