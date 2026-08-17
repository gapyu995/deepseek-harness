/** `pet` namespace dictionaries (the desktop pet's control and quote copy). */

/** Dictionary namespace owned by this plugin. */
export const NS = 'pet'

/** Simplified Chinese dictionary (the key-set source of truth). */
export const zh = {
  'pet.close': '关闭桌宠',
  'pet.restore': '显示桌宠',
  'pet.restoreLabel': '桌宠',
  'pet.quote.1': '今天也辛苦啦，要不要歇一歇？',
  'pet.quote.2': '别摸我尾巴……除非是让我继续干活。',
  'pet.quote.3': '维多利亚家政，为您效劳。',
  'pet.quote.4': '深海里可没这么多 bug。',
  'pet.quote.5': '鲨鱼也要偶尔浮上来换口气。',
  'pet.quote.6': '看什么看，没见过海洋生物吗？',
} satisfies Record<string, string>

/** The pet namespace key union. */
export type PetKey = keyof typeof zh

/** English dictionary, checked complete against the zh key set. */
export const en = {
  'pet.close': 'Hide pet',
  'pet.restore': 'Show pet',
  'pet.restoreLabel': 'Pet',
  'pet.quote.1': 'Hard at work again? Take a breather.',
  'pet.quote.2': "Don't touch the tail… unless it's more work.",
  'pet.quote.3': 'Victoria Housekeeping, at your service.',
  'pet.quote.4': 'The deep sea has far fewer bugs.',
  'pet.quote.5': 'Even sharks surface for air now and then.',
  'pet.quote.6': "What are you staring at? Never seen a sea creature?",
} satisfies Record<PetKey, string>
