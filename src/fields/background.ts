import type { Field } from 'payload'

/**
 * Reusable background variant field for page blocks.
 *
 * Maps to the `BackgroundVariant` type in `BlockWrapper` — both must stay in sync.
 * When adding a new variant here, add a matching CSS class in `BlockWrapper`.
 */
export const backgroundField: Field = {
  name: 'background',
  type: 'select',
  defaultValue: 'default',
  options: [
    { label: 'Default', value: 'default' },
    { label: 'Light', value: 'light' },
    { label: 'Dark', value: 'dark' },
    { label: 'Brand', value: 'brand' },
    { label: 'Accent', value: 'accent' },
  ],
  admin: {
    description: 'Background color for this section',
  },
}

/**
 * Optional section heading field — most blocks support an optional heading above the content.
 */
export const sectionHeadingField: Field = {
  name: 'sectionHeading',
  type: 'text',
  admin: {
    description: 'Optional heading displayed above this section',
  },
}
