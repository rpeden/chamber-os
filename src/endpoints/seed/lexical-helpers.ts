/**
 * Lexical JSON helper functions for building rich text content programmatically.
 *
 * The Lexical editor stores content as a deeply nested JSON tree. Building this
 * by hand is soul-crushing, so these helpers exist to keep the seed data readable
 * and the structure correct. Every node type needs its exact properties or Payload
 * will silently eat your content and leave you staring at a blank page.
 */

// ---- Leaf nodes ----

interface LexicalTextNode {
  [k: string]: unknown
  type: 'text'
  detail: number
  format: number
  mode: 'normal'
  style: string
  text: string
  version: 1
}

/** Create a plain text node. */
export function text(content: string, format: number = 0): LexicalTextNode {
  return {
    type: 'text',
    detail: 0,
    format,
    mode: 'normal',
    style: '',
    text: content,
    version: 1,
  }
}

/** Bold text (format bit 1). */
export function bold(content: string): LexicalTextNode {
  return text(content, 1)
}

/** Italic text (format bit 2). */
export function italic(content: string): LexicalTextNode {
  return text(content, 2)
}

// ---- Block-level nodes ----

interface LexicalParagraphNode {
  [k: string]: unknown
  type: 'paragraph'
  children: LexicalTextNode[]
  direction: 'ltr'
  format: ''
  indent: 0
  textFormat: 0
  version: 1
}

/** Create a paragraph node from one or more text nodes. */
export function paragraph(...children: LexicalTextNode[]): LexicalParagraphNode {
  return {
    type: 'paragraph',
    children,
    direction: 'ltr',
    format: '',
    indent: 0,
    textFormat: 0,
    version: 1,
  }
}

/** Shorthand: paragraph with a single plain text string. */
export function p(content: string): LexicalParagraphNode {
  return paragraph(text(content))
}

type HeadingTag = 'h1' | 'h2' | 'h3' | 'h4'

interface LexicalHeadingNode {
  [k: string]: unknown
  type: 'heading'
  children: LexicalTextNode[]
  direction: 'ltr'
  format: ''
  indent: 0
  tag: HeadingTag
  version: 1
}

/** Create a heading node. */
export function heading(tag: HeadingTag, content: string): LexicalHeadingNode {
  return {
    type: 'heading',
    children: [text(content)],
    direction: 'ltr',
    format: '',
    indent: 0,
    tag,
    version: 1,
  }
}

export function h2(content: string): LexicalHeadingNode {
  return heading('h2', content)
}

export function h3(content: string): LexicalHeadingNode {
  return heading('h3', content)
}

export function h4(content: string): LexicalHeadingNode {
  return heading('h4', content)
}

// ---- Root wrapper ----

type LexicalBlockNode = LexicalParagraphNode | LexicalHeadingNode

interface LexicalRoot {
  [k: string]: unknown
  root: {
    [k: string]: unknown
    type: 'root'
    children: LexicalBlockNode[]
    direction: 'ltr'
    format: ''
    indent: 0
    version: 1
  }
}

/**
 * Wrap an array of block-level nodes into a complete Lexical root document.
 * This is the shape Payload expects for any richText field.
 */
export function lexicalRoot(...children: LexicalBlockNode[]): LexicalRoot {
  return {
    root: {
      type: 'root',
      children,
      direction: 'ltr',
      format: '',
      indent: 0,
      version: 1,
    },
  }
}

/**
 * Convert simple markdown-ish text into a Lexical document.
 * Handles: ## headings, **bold**, *italic*, and plain paragraphs.
 * Blank lines separate paragraphs. This is intentionally simple —
 * it doesn't handle lists, links, or nested formatting because we
 * don't need them for seed data.
 */
export function markdownToLexical(markdown: string): LexicalRoot {
  const lines = markdown.split('\n')
  const blocks: LexicalBlockNode[] = []
  let currentParagraphParts: string[] = []

  const flushParagraph = () => {
    if (currentParagraphParts.length > 0) {
      const fullText = currentParagraphParts.join(' ')
      blocks.push(...parseParagraphWithFormatting(fullText))
      currentParagraphParts = []
    }
  }

  for (const line of lines) {
    const trimmed = line.trim()

    // Blank line = paragraph break
    if (trimmed === '') {
      flushParagraph()
      continue
    }

    // Headings
    const headingMatch = trimmed.match(/^(#{1,4})\s+(.+)$/)
    if (headingMatch) {
      flushParagraph()
      const level = headingMatch[1].length as 1 | 2 | 3 | 4
      const tag = `h${level}` as HeadingTag
      blocks.push(heading(tag, headingMatch[2]))
      continue
    }

    // Regular text — accumulate into paragraph
    currentParagraphParts.push(trimmed)
  }

  flushParagraph()
  return lexicalRoot(...blocks)
}

/**
 * Parse a paragraph string that may contain **bold** and *italic* markers
 * into a proper Lexical paragraph with formatted text nodes.
 */
function parseParagraphWithFormatting(content: string): LexicalParagraphNode[] {
  const children: LexicalTextNode[] = []

  // Match **bold** and *italic* markers
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*)/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(content)) !== null) {
    // Text before the match
    if (match.index > lastIndex) {
      children.push(text(content.slice(lastIndex, match.index)))
    }

    if (match[2]) {
      // **bold**
      children.push(bold(match[2]))
    } else if (match[3]) {
      // *italic*
      children.push(italic(match[3]))
    }

    lastIndex = match.index + match[0].length
  }

  // Remaining text after last match
  if (lastIndex < content.length) {
    children.push(text(content.slice(lastIndex)))
  }

  // If nothing was parsed (empty string case), bail
  if (children.length === 0) {
    return []
  }

  return [paragraph(...children)]
}
