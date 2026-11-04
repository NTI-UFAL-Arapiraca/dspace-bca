import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';

// Exercise the methods inserted into the pinned upstream component, with HTTP and UI doubles.
const patch = readFileSync('frontend/patches/apply-eperson-initial-password.mjs', 'utf8');
const replacements = runInNewContext(patch.split('const replacements = ')[1].split(';\nfor (const extension')[0]);
const methods = replacements.find(([, before]) => before === '  labelPrefix =')[2];
function method(name) {
  const body = methods.split(`  ${name}(): `)[1].split('\n  }')[0];
  return new Function(body.slice(body.indexOf('{') + 1));
}
function form() {
  const state = {
    initialPassword: 'example-password', initialPasswordConfirmation: 'example-password',
    canLogIn: { value: true }, initialPasswordBusy: false,
    createdWithoutConfirmedPassword: { self: '/api/eperson/epersons/uuid' },
    subs: [],
  };
  for (const name of ['clearInitialPassword', 'validateInitialPassword']) state[name] = method(name);
  return state;
}
test('requires matching nonempty values and an enabled account', () => {
  const state = form();
  assert.equal(state.validateInitialPassword(), true);
  for (const [password, confirmation, enabled] of [['', '', true], ['a', '', true], ['a', 'b', true], ['a', 'a', false]]) {
    Object.assign(state, { initialPassword: password, initialPasswordConfirmation: confirmation });
    state.canLogIn.value = enabled;
    assert.equal(state.validateInitialPassword(), false);
  }
});
test('clears both secret fields', () => {
  const state = form();
  state.clearInitialPassword();
  assert.equal(state.initialPassword, '');
  assert.equal(state.initialPasswordConfirmation, '');
});
test('PATCH uses the created account, clears fields and reports uncertain failure without navigation', () => {
  const state = form();
  let calls = 0;
  state.initialPasswordHttp = { patch(url, body) {
    calls++;
    assert.equal(url, state.createdWithoutConfirmedPassword.self);
    assert.deepEqual(body, [{ op: 'add', path: '/password', value: { new_password: 'example-password' } }]);
    return { pipe: () => ({ subscribe: handlers => { handlers.error(); return {}; } }) };
  } };
  // finalize is an RxJS operator; the HTTP double only needs its identity here.
  const source = methods.split('  setInitialPassword(): void {')[1].split('\n  }')[0];
  new Function('finalize', source).call(state, callback => callback);
  assert.equal(calls, 1);
  assert.equal(state.initialPassword, '');
  assert.equal(state.initialPasswordMessage, 'partial');
  assert.ok(state.createdWithoutConfirmedPassword);
});
test('success is announced only after PATCH confirmation', () => {
  const state = form();
  let notified = false;
  let emitted = false;
  let navigated = false;
  state.translateService = { get: key => key };
  state.notificationsService = { success: () => { notified = true; } };
  state.submitForm = { emit: account => { assert.equal(account, state.createdWithoutConfirmedPassword); emitted = true; } };
  state.router = { navigateByUrl: () => { navigated = true; } };
  state.initialPasswordHttp = { patch: () => ({ pipe: () => ({ subscribe: handlers => {
    assert.equal(notified, false);
    handlers.next();
    return {};
  } }) }) };
  const source = methods.split('  setInitialPassword(): void {')[1].split('\n  }')[0];
  new Function('finalize', 'getEPersonsRoute', source).call(state, callback => callback, () => '/epeople');
  assert.ok(notified && emitted && navigated);
});
test('prevents a second request while PATCH is pending', () => {
  const state = form();
  state.initialPasswordBusy = true;
  const source = methods.split('  setInitialPassword(): void {')[1].split('\n  }')[0];
  new Function('finalize', source).call(state, callback => callback);
  assert.equal(state.initialPassword, 'example-password');
});
test('rejects seven characters and accepts eight before sending the account', () => {
  const state = form();
  state.initialPassword = state.initialPasswordConfirmation = '1234567';
  assert.equal(state.validateInitialPassword(), false);
  assert.equal(state.initialPasswordMessage, 'too-short');
  state.initialPassword = state.initialPasswordConfirmation = '12345678';
  assert.equal(state.validateInitialPassword(), true);
});
test('distinguishes server rejection from an uncertain response without rendering its body', () => {
  for (const status of [422, 0, 500]) {
    const state = form();
    state.initialPasswordHttp = { patch: () => ({ pipe: () => ({ subscribe: handlers => {
      handlers.error({ status, error: { message: 'sensitive response' } });
      return {};
    } }) }) };
    const source = methods.split('  setInitialPassword(): void {')[1].split('\n  }')[0];
    new Function('finalize', source).call(state, callback => callback);
    assert.equal(state.initialPasswordMessage, status === 422 ? 'rejected' : 'partial');
    assert.equal(state.initialPassword, '');
  }
});
