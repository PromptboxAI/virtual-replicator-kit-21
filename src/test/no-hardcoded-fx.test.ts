import { describe, it, expect } from 'vitest';
import { readFile } from 'node:fs/promises';
import { glob } from 'glob';

describe('FX Rate Hardcoding Prevention', () => {
  it('should not contain hardcoded 0.10 FX rate in src/', async () => {
    // Find all TypeScript/JavaScript files in src
    const files = await glob('src/**/*.{ts,tsx,js,jsx}', { 
      ignore: ['**/node_modules/**', '**/dist/**', '**/*.test.ts', '**/*.test.tsx']
    });
    
    const violations: Array<{ file: string; line: number; content: string }> = [];

    // Check each file
    for (const file of files) {
      const content = await readFile(file, 'utf-8');
      const lines = content.split('\n');
      
      lines.forEach((line, index) => {
        // Match 0.10 that's not part of a larger number
        // Allows: 10.10, 0.100, etc.
        // Blocks: = 0.10, (0.10), 0.10;, 0.10,
        if (/(^|[^0-9])0\.10([^0-9]|$)/.test(line) && !line.includes('//')) {
          violations.push({
            file,
            line: index + 1,
            content: line.trim()
          });
        }
      });
    }

    if (violations.length > 0) {
      const message = violations
        .map(v => `${v.file}:${v.line}\n  ${v.content}`)
        .join('\n\n');
      
      throw new Error(
        `❌ Found ${violations.length} hardcoded 0.10 FX rate(s):\n\n${message}\n\n` +
        `Use live FX from metrics.price.fx or fetch from prompt_fx table.`
      );
    }

    expect(violations).toHaveLength(0);
  });

  it('should not contain PROMPT_USD_RATE constant', async () => {
    const files = await glob('src/**/*.{ts,tsx,js,jsx}', { 
      ignore: ['**/node_modules/**', '**/dist/**', '**/*.test.ts', '**/*.test.tsx']
    });
    
    const violations: Array<{ file: string; line: number }> = [];

    for (const file of files) {
      const content = await readFile(file, 'utf-8');
      const lines = content.split('\n');
      
      lines.forEach((line, index) => {
        if (/PROMPT_USD_RATE/.test(line) && !line.includes('//') && !line.includes('prompt_usd_rate')) {
          violations.push({
            file,
            line: index + 1
          });
        }
      });
    }

    if (violations.length > 0) {
      const message = violations
        .map(v => `${v.file}:${v.line}`)
        .join('\n');
      
      throw new Error(
        `❌ Found PROMPT_USD_RATE constant in:\n${message}\n\n` +
        `Remove this constant and use live FX instead.`
      );
    }

    expect(violations).toHaveLength(0);
  });
});
