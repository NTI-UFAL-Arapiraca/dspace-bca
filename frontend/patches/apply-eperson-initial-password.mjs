import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
const [directory] = process.argv.slice(2);
if (!directory) { throw new Error('Usage: node apply-eperson-initial-password.mjs <eperson-form directory>'); }
const replacements = [
  [
    `ts`,
    `import { AsyncPipe } from '@angular/common';`,
    `import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';`
  ],
  [
    `ts`,
    `  labelPrefix =`,
    `  private initialPasswordHttp = inject(HttpClient);

  // Secrets stay in component memory and HttpClient, outside the NgRx request cache.
  initialPasswordEnabled = false;
  initialPassword = '';
  initialPasswordConfirmation = '';
  initialPasswordBusy = false;
  initialPasswordMessage = '';
  createdWithoutConfirmedPassword: EPerson;

  clearInitialPassword(): void {
    this.initialPassword = '';
    this.initialPasswordConfirmation = '';
  }

  validateInitialPassword(): boolean {
    if (!this.initialPassword || !this.initialPasswordConfirmation ||
        this.initialPassword !== this.initialPasswordConfirmation || !this.canLogIn.value) {
      this.initialPasswordMessage = 'invalid';
      return false;
    }
    if (this.initialPassword.length < 8) {
      this.initialPasswordMessage = 'too-short';
      return false;
    }
    this.initialPasswordMessage = '';
    return true;
  }

  setInitialPassword(): void {
    if (this.initialPasswordBusy || !this.createdWithoutConfirmedPassword || !this.validateInitialPassword()) {
      return;
    }
    this.initialPasswordBusy = true;
    const eperson = this.createdWithoutConfirmedPassword;
    const body = [{ op: 'add', path: '/password', value: { new_password: this.initialPassword } }];
    this.clearInitialPassword();
    // A failed response may mean the server committed the password. Never retry automatically.
    this.subs.push(this.initialPasswordHttp.patch(eperson.self, body).pipe(
      finalize(() => { this.initialPasswordBusy = false; }),
    ).subscribe({
      next: () => {
        this.initialPasswordMessage = '';
        this.notificationsService.success(this.translateService.get(this.labelPrefix + 'initial-password.success'));
        this.submitForm.emit(eperson);
        void this.router.navigateByUrl(getEPersonsRoute());
      },
      error: (error) => {
        // Never render the raw response: it could contain sensitive request data.
        this.initialPasswordMessage = error?.status === 422 ? 'rejected' : 'partial';
      },
    }));
  }

  labelPrefix =`
  ],
  [
    `ts`,
    `  onSubmit() {`,
    `  onSubmit() {
    if (this.initialPasswordBusy || this.createdWithoutConfirmedPassword) { return; }
    if (!this.route.snapshot.params.id && !this.epersonInitial && this.initialPasswordEnabled && !this.validateInitialPassword()) { return; }`
  ],
  [
    `ts`,
    `    const ePersonToCreate = Object.assign(new EPerson(), values);`,
    `    this.initialPasswordBusy = this.initialPasswordEnabled;
    const ePersonToCreate = Object.assign(new EPerson(), values);`
  ],
  [
    `ts`,
    `      if (rd.hasSucceeded) {
        this.notificationsService.success(this.translateService.get(this.labelPrefix + 'notification.created.success'`,
    `      this.initialPasswordBusy = false;
      if (rd.hasSucceeded && this.initialPasswordEnabled) {
        this.createdWithoutConfirmedPassword = rd.payload;
        this.epersonService.clearEPersonRequests();
        this.setInitialPassword();
        return;
      }
      if (rd.hasSucceeded) {
        this.notificationsService.success(this.translateService.get(this.labelPrefix + 'notification.created.success'`
  ],
  [
    `ts`,
    `  ngOnDestroy(): void {`,
    `  ngOnDestroy(): void {
    this.clearInitialPassword();`
  ],
  [
    `ts`,
    `  onCancel() {`,
    `  onCancel() {
    this.clearInitialPassword();`
  ],
  [
    `html`,
    `      <ds-form [formId]="formId"`,
    `
      @if (!route.snapshot.params.id && !epersonInitial) {
        <fieldset class="mb-3" [disabled]="initialPasswordBusy">
          @if (!createdWithoutConfirmedPassword) {
            <label for="initial-password-enabled">
              <input id="initial-password-enabled" type="checkbox" [checked]="initialPasswordEnabled"
                (change)="initialPasswordEnabled = $any($event.target).checked; clearInitialPassword()">
              {{messagePrefix + '.initial-password.enable' | translate}}
            </label>
          }
          @if (initialPasswordEnabled) {
            <p>{{messagePrefix + '.initial-password.policy' | translate}}</p>
            <label for="initial-password">{{messagePrefix + '.initial-password.password' | translate}}</label>
            <input id="initial-password" type="password" autocomplete="new-password" class="form-control"
              required minlength="8" [value]="initialPassword" (input)="initialPassword = $any($event.target).value">
            <label for="initial-password-confirmation">{{messagePrefix + '.initial-password.confirm' | translate}}</label>
            <input id="initial-password-confirmation" type="password" autocomplete="new-password" class="form-control"
              required [value]="initialPasswordConfirmation" (input)="initialPasswordConfirmation = $any($event.target).value">
          }
          @if (initialPasswordMessage) {
            <p role="alert" class="alert alert-warning mt-2">{{messagePrefix + '.initial-password.' + initialPasswordMessage | translate}}</p>
          }
          @if (createdWithoutConfirmedPassword) {
            <p>{{createdWithoutConfirmedPassword.email}} ({{createdWithoutConfirmedPassword.id}})</p>
            <button type="button" class="btn btn-primary" (click)="setInitialPassword()">
              {{messagePrefix + '.initial-password.retry' | translate}}
            </button>
          }
        </fieldset>
      }

      <ds-form [displaySubmit]="!initialPasswordBusy && !createdWithoutConfirmedPassword" [formId]="formId"`
  ]
];
for (const extension of ['ts', 'html']) {
  const file = path.join(directory, `eperson-form.component.${extension}`);
  let source = readFileSync(file, 'utf8');
  for (const [kind, before, after] of replacements) {
    if (kind !== extension) { continue; }
    if (source.split(before).length !== 2) { throw new Error(`Unexpected DSpace 10.1 source: ${file}: ${before}`); }
    source = source.replace(before, after);
  }
  writeFileSync(file, source);
}
