/** Task-oriented public entries shown before the DSpace menu sections. */
export interface PrimaryNavLink {
  id: string;
  label: string;
  link: string;
  queryParams: Record<string, string>;
}

export const PRIMARY_NAV_LINKS: readonly PrimaryNavLink[] = [
  {
    id: 'works',
    label: 'repository.nav.works',
    link: '/search',
    queryParams: { configuration: 'academic_works_search' },
  },
  {
    id: 'people',
    label: 'repository.nav.people',
    link: '/search',
    queryParams: { configuration: 'person' },
  },
];
