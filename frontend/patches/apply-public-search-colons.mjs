import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const [app] = process.argv.slice(2);
if (!app) throw new Error('Usage: node apply-public-search-colons.mjs <app directory>');

const patches = [
  ['core/shared/search/models/search-options.model.ts', [
    ["import { SearchFilter } from './search-filter.model';",
      "import { escapeSearchColons } from './escape-search-colons';\nimport { SearchFilter } from './search-filter.model';"],
    ['  query?: string;', '  query?: string;\n  escapeQueryColons?: boolean;'],
    ['      fixedFilter?: string', '      fixedFilter?: string, escapeQueryColons?: boolean'],
    ['    this.query = options.query;',
      '    this.query = options.query;\n    this.escapeQueryColons = options.escapeQueryColons;'],
    ['      args.push(`query=${encodeURIComponent(this.query)}`);',
      '      const query = this.escapeQueryColons ? escapeSearchColons(this.query) : this.query;\n      args.push(`query=${encodeURIComponent(query)}`);'],
  ]],
  ['core/shared/search/models/paginated-search-options.model.ts', [
    ['query?: string, dsoTypes?', 'query?: string, escapeQueryColons?: boolean, dsoTypes?'],
  ]],
  ['shared/search/search-configuration.service.ts', [
    ['  protected defaultQuery = \'\';',
      `  protected defaultQuery = '';

  protected get escapeQueryColons(): boolean {
    return false;
  }`],
    ['        query: this.defaultQuery,',
      '        query: this.defaultQuery,\n        escapeQueryColons: this.escapeQueryColons,'],
  ]],
];

const outputs = patches.map(([file, replacements]) => {
  const target = path.join(app, file);
  let source = readFileSync(target, 'utf8');
  for (const [before, after] of replacements) {
    const count = source.split(before).length - 1;
    if (count !== 1) throw new Error(`Expected one source location in ${file}, found ${count}. Review the DSpace patch.`);
    source = source.replace(before, after);
  }
  return [target, source];
});
outputs.forEach(([target, source]) => writeFileSync(target, source));
