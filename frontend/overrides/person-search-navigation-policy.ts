import type { ActivatedRouteSnapshot } from '@angular/router';

const searchParameter = /^(tab|query|scope|configuration|view|spc\.[\w.]+|f\.[\w.]+|sort\.[\w.]+)$/;

/** Only the search within the same Person may reuse its resolved profile. */
export function isPersonSearchNavigation(fromUrl: string, toUrl: string): boolean {
  const from = new URL(fromUrl, 'http://router.local');
  const to = new URL(toUrl, 'http://router.local');
  if (from.origin !== to.origin || from.pathname !== to.pathname ||
      !/\/entities\/person\/[^/]+\/?$/.test(from.pathname)) {
    return false;
  }
  if (from.hash !== to.hash && to.hash && to.hash !== '#person-works') {
    return false;
  }
  const keys = new Set([...from.searchParams.keys(), ...to.searchParams.keys()]);
  const searchOnly = [...keys].every(key =>
    JSON.stringify(from.searchParams.getAll(key)) === JSON.stringify(to.searchParams.getAll(key)) ||
    searchParameter.test(key),
  );
  return searchOnly && (from.href !== to.href || to.hash === '#person-works');
}

function snapshotUrl(snapshot: ActivatedRouteSnapshot): string {
  const routes = [...snapshot.pathFromRoot];
  let child = snapshot.firstChild;
  while (child) {
    routes.push(child);
    child = child.firstChild;
  }
  const path = '/' + routes.flatMap(route => route.url.map(segment => segment.toString())).join('/');
  const query = new URLSearchParams();
  for (const key of snapshot.queryParamMap.keys) {
    snapshot.queryParamMap.getAll(key).forEach(value => query.append(key, value));
  }
  return `${path}?${query}${snapshot.fragment ? '#' + snapshot.fragment : ''}`;
}

export function shouldResolveItemPage(from: ActivatedRouteSnapshot, to: ActivatedRouteSnapshot): boolean {
  return !isPersonSearchNavigation(snapshotUrl(from), snapshotUrl(to));
}
