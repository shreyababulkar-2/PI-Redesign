import { Block, Segment } from '../../data/types';

const WORD = /\S+/g;

/** The answer's words in reading order (used to pace the streaming and to find sentence ends). */
export function wordsOf(blocks: Block[]): string[] {
  const words: string[] = [];
  for (const block of blocks) {
    if (block.kind === 'spacer') continue;
    for (const seg of block.segments) words.push(...(seg.text.match(WORD) ?? []));
  }
  return words;
}

/** The first `limit` words of the blocks, cutting the last block mid-text if needed. */
export function truncateBlocks(blocks: Block[], limit: number): Block[] {
  const out: Block[] = [];
  let left = limit;
  for (const block of blocks) {
    if (left <= 0) break;
    if (block.kind === 'spacer') {
      out.push(block);
      continue;
    }
    const segments: Segment[] = [];
    for (const seg of block.segments) {
      if (left <= 0) break;
      const matches = [...seg.text.matchAll(WORD)];
      if (matches.length <= left) {
        segments.push(seg);
        left -= matches.length;
      } else {
        const end = matches[left - 1];
        segments.push({ ...seg, text: seg.text.slice(0, end.index + end[0].length) });
        left = 0;
      }
    }
    if (segments.length) out.push({ ...block, segments });
  }
  return out;
}

/** Plain text of the blocks, for copying. */
export function plainText(blocks: Block[]): string {
  return blocks
    .map((b) => (b.kind === 'spacer' ? '' : (b.kind === 'bullet' ? '• ' : '') + b.segments.map((s) => s.text).join('')))
    .join('\n');
}
