import { compile } from 'svelte/compiler';
import { mkdir } from 'node:fs/promises';

await mkdir('dist', { recursive: true });
const result = await Bun.build({
  entrypoints: ['./src/main.ts'],
  outdir: './dist',
  target: 'browser',
  conditions: ['browser'],
  minify: true,
  plugins: [{
    name: 'svelte',
    setup(build) {
      build.onLoad({ filter: /\.svelte$/ }, async ({ path }) => {
        const source = await Bun.file(path).text();
        const { js, warnings } = compile(source, { filename: path, generate: 'client', css: 'injected', dev: false });
        for (const warning of warnings) console.warn(`${path}: ${warning.message}`);
        return { contents: js.code, loader: 'js' };
      });
    },
  }],
});
if (!result.success) throw new AggregateError(result.logs, 'Svelte build failed');
await Bun.write('dist/index.html', Bun.file('index.html'));
console.log('Svelte compiled → dist/');
