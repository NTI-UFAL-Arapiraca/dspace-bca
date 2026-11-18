import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const [tagDirectory] = process.argv.slice(2);
if (!tagDirectory) throw new Error('Usage: node apply-subject-suggestions.mjs <dynamic tag directory>');

const patches = [
  ['dynamic-tag.component.ts', [
    ['  Input,', '  inject,\n  Injector,\n  Input,'],
    ['  Observable,\n  of,', '  merge as mergeStreams,\n  Observable,\n  of,\n  Subject,\n  timer,'],
    ['  switchMap,', '  startWith,\n  switchMap,'],
    ["import { DynamicTagModel } from './dynamic-tag.model';",
      "import { DynamicTagModel } from './dynamic-tag.model';\nimport { SubjectSuggestionsService } from './subject-suggestions.service';"],
    ['  hasAuthority: boolean;', `  hasAuthority: boolean;
  private readonly injector = inject(Injector);
  private readonly clearSubjectSearch$ = new Subject<string>();

  get suggestSubjects(): boolean {
    return this.model.metadataFields?.length === 1
      && this.model.metadataFields[0] === 'dc.subject'
      && !this.model.vocabularyOptions?.closed;
  }

  searchSubjects = (text$: Observable<string>) =>
    mergeStreams(text$, this.clearSubjectSearch$).pipe(
      map(text => text.trim()),
      distinctUntilChanged(),
      switchMap(prefix => {
        if (prefix.length < 3) {
          return of([]);
        }
        return timer(300).pipe(
          switchMap(() => this.injector.get(SubjectSuggestionsService).findByPrefix(prefix)),
          map(values => values
            .filter(value => !this.chips.getChips().some(chip => chip.display === value))
            .map(display => ({ display }))),
          startWith([]),
        );
      }),
    );`],
    ['    if (isNotEmpty(this.currentValue) && (!this.model.hasAuthority || !this.instance.isPopupOpen())) {',
      '    if (isNotEmpty(this.currentValue) && (this.suggestSubjects || !this.model.hasAuthority || !this.instance.isPopupOpen())) {'],
    ['    this.chips.add(event.item);', `    if (this.suggestSubjects) {
      event.preventDefault();
      this.setCurrentValue(null);
      this.chips.add(event.item.display);
      return;
    }
    this.chips.add(event.item);`],
    ["    if (event.key === 'Enter' || event.key === ',') {",
      "    if (event.key === 'Enter' || event.key === ',' || (this.suggestSubjects && event.key === ';')) {"],
    ['  private addTagsToChips() {', `  private addTagsToChips() {
    if (this.suggestSubjects) {
      const value: string = this.currentValue ?? '';
      this.setCurrentValue(null);
      this.clearSubjectSearch$.next('');
      for (const part of value.split(/[,;]/)) {
        const keyword = part.trim();
        if (keyword && !this.chips.getChips().some(chip => chip.display === keyword)) {
          this.chips.add(keyword);
        }
      }
      return;
    }`],
  ]],
  ['dynamic-tag.component.html', [
    ['[showIcons]="model.hasAuthority"', '[showIcons]="model.hasAuthority && !suggestSubjects"'],
    ['@if (!model.hasAuthority)', '@if (!model.hasAuthority && !suggestSubjects)'],
    ['@if (model.hasAuthority)', '@if (model.hasAuthority || suggestSubjects)'],
    ['[ngbTypeahead]="search"', '[ngbTypeahead]="suggestSubjects ? searchSubjects : search"\n        [focusFirst]="!suggestSubjects"'],
  ]],
];

const outputs = patches.map(([name, replacements]) => {
  const target = path.join(tagDirectory, name);
  let source = readFileSync(target, 'utf8');
  for (const [before, after] of replacements) {
    const count = source.split(before).length - 1;
    if (count !== 1) throw new Error(`Expected one source location in ${name}, found ${count}. Review the DSpace patch.`);
    source = source.replace(before, after);
  }
  return [target, source];
});
outputs.forEach(([target, source]) => writeFileSync(target, source));
