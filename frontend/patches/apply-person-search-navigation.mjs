import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const [appRoot] = process.argv.slice(2);
if (!appRoot) throw new Error('Usage: node apply-person-search-navigation.mjs <src/app>');

const patches = [
  ['item-page/item-page-routes.ts', [
    ["import { Route } from '@angular/router';", "import { Route } from '@angular/router';\nimport { shouldResolveItemPage } from '../person-search-navigation-policy';"],
    ["    runGuardsAndResolvers: 'always',", '    runGuardsAndResolvers: shouldResolveItemPage,'],
  ]],
  ['app.component.ts', [
    ["import { environment } from '../environments/environment';", "import { environment } from '../environments/environment';\nimport { PersonSearchNavigationService } from './person-search-navigation.service';"],
    ['    private router: Router,', '    private router: Router,\n    private personSearchNavigation: PersonSearchNavigationService,'],
    ['        distinctNext(this.isRouteLoading$, true);', '        distinctNext(this.isRouteLoading$, !this.personSearchNavigation.isLocalSearch(event.id));'],
  ]],
  ['app-routes.ts', [
    ["  scrollPositionRestoration: 'top',\n  anchorScrolling: 'enabled',", "  // PersonSearchNavigationService handles scroll while preserving the profile.\n  scrollPositionRestoration: 'disabled',\n  anchorScrolling: 'disabled',"],
  ]],
];

// Validate every source location before writing any file; fail on upstream drift.
const outputs = patches.map(([name, replacements]) => {
  const target = path.join(appRoot, name);
  let source = readFileSync(target, 'utf8');
  for (const [before, after] of replacements) {
    const count = source.split(before).length - 1;
    if (count !== 1) throw new Error(`Expected one source location in ${name}, found ${count}; review the DSpace patch.`);
    source = source.replace(before, after);
  }
  return [target, source];
});
outputs.forEach(([target, source]) => writeFileSync(target, source));
