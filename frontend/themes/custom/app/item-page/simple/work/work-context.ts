import type { MetadataMap } from '@dspace/core/shared/metadata.models';

/** Public search used by the links of course, campus and keywords. */
export const WORKS_SEARCH_CONFIGURATION = 'academic_works_search';

export type WorkFilter = 'course' | 'campus' | 'cnpq' | 'subject';

/** Query parameters of the public works search filtered by one exact value. */
export function workFilterParams(filter: WorkFilter, value: string): Record<string, string> {
  return {
    configuration: WORKS_SEARCH_CONFIGURATION,
    [`f.${filter}`]: `${value},equals`,
  };
}

export interface WorkContext {
  types: string[];
  courses: string[];
  campuses: string[];
  year?: string;
}

function values(metadata: MetadataMap | undefined, field: string): string[] {
  return (metadata?.[field] ?? [])
    .map((entry) => entry?.value?.trim())
    .filter((value): value is string => !!value);
}

/**
 * The "title page" line of a work: what it is, where it comes from and when.
 * The year is the first four digits of dc.date.issued (RFC 0020); the defense
 * date stays in the work data, never here.
 */
export function workContext(metadata: MetadataMap | undefined): WorkContext {
  const issued = values(metadata, 'dc.date.issued')[0];
  const year = issued?.match(/^\d{4}/)?.[0];
  return {
    types: values(metadata, 'dc.type'),
    courses: values(metadata, 'local.course.name'),
    campuses: values(metadata, 'local.campus.name'),
    year,
  };
}
