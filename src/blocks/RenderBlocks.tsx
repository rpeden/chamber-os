import React, { Fragment } from 'react'

import type { Page } from '@/payload-types'

import { ArchiveBlock } from '@/blocks/ArchiveBlock/Component'
import { CallToActionBlock } from '@/blocks/CallToAction/Component'
import { ContentBlock } from '@/blocks/Content/Component'
import { FormBlock } from '@/blocks/Form/Component'
import { MediaBlock } from '@/blocks/MediaBlock/Component'
import { TextColumnsBlock } from '@/blocks/TextColumns/Component'
import { CardGridBlock } from '@/blocks/CardGrid/Component'
import { IconGridBlock } from '@/blocks/IconGrid/Component'
import { ImageTextBlock } from '@/blocks/ImageText/Component'
import { CtaBannerBlock } from '@/blocks/CtaBanner/Component'
import { StatsBarBlock } from '@/blocks/StatsBar/Component'
import { MixedContentRowBlock } from '@/blocks/MixedContentRow/Component'
import { EventsListBlock } from '@/blocks/EventsList/Component'
import { NewsFeedBlock } from '@/blocks/NewsFeed/Component'
import { TestimonialsBlock } from '@/blocks/Testimonials/Component'
import { SponsorsGridBlock } from '@/blocks/SponsorsGrid/Component'
import { MembershipTiersBlock } from '@/blocks/MembershipTiers/Component'

const blockComponents = {
  archive: ArchiveBlock,
  content: ContentBlock,
  cta: CallToActionBlock,
  formBlock: FormBlock,
  mediaBlock: MediaBlock,
  textColumns: TextColumnsBlock,
  cardGrid: CardGridBlock,
  iconGrid: IconGridBlock,
  imageText: ImageTextBlock,
  ctaBanner: CtaBannerBlock,
  statsBar: StatsBarBlock,
  mixedContentRow: MixedContentRowBlock,
  eventsList: EventsListBlock,
  newsFeed: NewsFeedBlock,
  testimonials: TestimonialsBlock,
  sponsorsGrid: SponsorsGridBlock,
  membershipTiers: MembershipTiersBlock,
}

export const RenderBlocks: React.FC<{
  blocks: Page['layout'][0][]
}> = (props) => {
  const { blocks } = props

  const hasBlocks = blocks && Array.isArray(blocks) && blocks.length > 0

  if (hasBlocks) {
    return (
      <Fragment>
        {blocks.map((block, index) => {
          const { blockType } = block

          if (blockType && blockType in blockComponents) {
            const Block = blockComponents[blockType]

            if (Block) {
              return (
                <div key={index}>
                  {/* @ts-expect-error there may be some mismatch between the expected types here */}
                  <Block {...block} disableInnerContainer />
                </div>
              )
            }
          }
          return null
        })}
      </Fragment>
    )
  }

  return null
}
