/** `pet` namespace dictionaries (the desktop pet's control copy). */

/** Dictionary namespace owned by this plugin. */
export const NS = 'pet'

/** Simplified Chinese dictionary (the key-set source of truth). */
export const zh = {
  'pet.close': '关闭桌宠',
  'pet.restore': '显示桌宠',
  'pet.restoreLabel': '桌宠',
} satisfies Record<string, string>

/** The pet namespace key union. */
export type PetKey = keyof typeof zh

/** English dictionary, checked complete against the zh key set. */
export const en = {
  'pet.close': 'Hide pet',
  'pet.restore': 'Show pet',
  'pet.restoreLabel': 'Pet',
} satisfies Record<PetKey, string>
