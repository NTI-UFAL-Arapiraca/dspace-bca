import { isPersonSearchNavigation, shouldResolveItemPage } from './person-search-navigation-policy';

describe('Person search navigation', () => {
  const profile = '/entities/person/person-uuid';

  it('reuses the same Person for tabs, repeated links and course/subject/pagination filters', () => {
    expect(isPersonSearchNavigation(profile, profile + '?tab=RELATION.Person.authored')).toBeTrue();
    expect(isPersonSearchNavigation(profile + '?tab=RELATION.Person.works', profile + '?tab=RELATION.Person.works&f.course=Computação,equals#person-works')).toBeTrue();
    expect(isPersonSearchNavigation(profile + '?f.subject=Java,equals', profile + '?spc.page=2&spc.rpp=10')).toBeTrue();
    expect(isPersonSearchNavigation(profile + '#person-works', profile + '#person-works')).toBeTrue();
    expect(isPersonSearchNavigation('/dspace' + profile, '/dspace' + profile + '?tab=RELATION.Person.works')).toBeTrue();
  });

  it('resolves other people, pages, access-token changes and unknown parameters normally', () => {
    for (const target of [profile + '-other?tab=x', profile + '/full?tab=x', '/items/person-uuid?tab=x', profile + '?accessToken=changed', profile + '?unknown=changed', profile + '#other-section']) {
      expect(isPersonSearchNavigation(profile, target)).withContext(target).toBeFalse();
    }
    expect(isPersonSearchNavigation(profile + '?accessToken=old', profile + '?accessToken=new&tab=x')).toBeFalse();
    expect(isPersonSearchNavigation(profile, profile)).toBeFalse();
    expect(isPersonSearchNavigation('/items/work?tab=old', '/items/work?tab=new')).toBeFalse();
  });

  it('includes child paths and repeated filter values when deciding whether to run resolvers', () => {
    const snapshot = (query: Record<string, string[]>, childPath = ''): any => ({
      pathFromRoot: [{ url: ['entities', 'person', 'person-uuid'] }],
      firstChild: childPath ? { url: [childPath], firstChild: null } : null,
      queryParamMap: { keys: Object.keys(query), getAll: key => query[key] },
      fragment: null,
    });
    const from = snapshot({ tab: ['RELATION.Person.works'], 'f.course': ['A,equals', 'B,equals'] });
    expect(shouldResolveItemPage(from, snapshot({ tab: ['RELATION.Person.advised'] }))).toBeFalse();
    expect(shouldResolveItemPage(from, snapshot({ tab: ['RELATION.Person.advised'] }, 'full'))).toBeTrue();
    expect(shouldResolveItemPage(from, snapshot({ accessToken: ['new'] }))).toBeTrue();
  });
});
