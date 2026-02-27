import React from 'react'

import { BlockWrapper } from '@/components/BlockWrapper'

import type { MapEmbedBlock as MapEmbedBlockProps } from '@/payload-types'

/**
 * Map Embed block — responsive iframe map with address and optional overlay text.
 */
export const MapEmbedBlock: React.FC<MapEmbedBlockProps> = ({
  sectionHeading,
  address,
  latitude,
  longitude,
  zoom,
  overlayText,
  height,
  background,
}) => {
  const mapSrc = `https://maps.google.com/maps?q=${encodeURIComponent(`${latitude},${longitude}`)}&z=${zoom}&output=embed`

  return (
    <BlockWrapper background={background}>
      {sectionHeading && <h2 className="text-3xl md:text-4xl font-bold mb-6">{sectionHeading}</h2>}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        <div className="lg:col-span-3 overflow-hidden rounded-lg border border-border bg-card">
          <iframe
            title={sectionHeading || 'Location map'}
            src={mapSrc}
            width="100%"
            height={height || '420'}
            style={{ border: 0 }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>

        <div className="lg:col-span-2 rounded-lg border border-border bg-card p-5">
          <h3 className="text-lg font-semibold mb-3">Address</h3>
          <p className="text-sm whitespace-pre-line text-muted-foreground">{address}</p>

          {overlayText && (
            <>
              <hr className="my-4 border-border" />
              <p className="text-sm text-muted-foreground whitespace-pre-line">{overlayText}</p>
            </>
          )}

          <a
            className="inline-block mt-5 text-sm font-medium underline"
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open in Google Maps
          </a>
        </div>
      </div>
    </BlockWrapper>
  )
}
