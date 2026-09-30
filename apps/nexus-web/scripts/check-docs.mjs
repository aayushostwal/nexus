import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import { compileMDX } from 'next-mdx-remote/rsc';
import remarkGfm from 'remark-gfm';
import rehypePrettyCode from 'rehype-pretty-code';

// Dynamic docs routes are not rendered by next build. Compile them explicitly.
const root = fileURLToPath(new URL('../content/docs/', import.meta.url));
async function walk(directory) {
  let count = 0;
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) count += await walk(file);
    else if (entry.name.endsWith('.mdx')) {
      const { content } = matter(await fs.readFile(file, 'utf8'));
      try {
        await compileMDX({ source: content, options: { mdxOptions: {
          remarkPlugins: [remarkGfm], rehypePlugins: [[rehypePrettyCode, { theme: 'github-dark' }]]
        } } });
      } catch (error) {
        throw new Error(`Unable to compile ${path.relative(root, file)}`, { cause: error });
      }
      count++;
    }
  }
  return count;
}
console.log(`Compiled ${await walk(root)} documentation pages.`);
