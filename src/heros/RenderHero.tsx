import React from 'react'

import type { Page } from '@/payload-types'

import { FullBleedHero } from '@/heros/FullBleed'
import { MinimalHero } from '@/heros/Minimal'

const heroes = {
  fullBleed: FullBleedHero,
  minimal: MinimalHero,
}

export const RenderHero: React.FC<Page['hero']> = (props) => {
  const { type } = props || {}

  if (!type || type === 'none') return null

  const HeroToRender = heroes[type]

  if (!HeroToRender) return null

  return <HeroToRender {...props} />
}
