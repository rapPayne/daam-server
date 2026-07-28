import test from 'node:test';
import assert from 'node:assert/strict';
import { maskPan } from './order.router.mjs';
import { sanitizeUserForResponse } from '../middlewares/authentication-middleware.mjs';

test('maskPan hides all but the last four digits', () => {
  assert.equal(maskPan('4532-1234-5678-9010'), '**** **** **** 9010');
});

test('maskPan leaves short values intact', () => {
  assert.equal(maskPan('1234'), '1234');
});

test('sanitizeUserForResponse masks camelCase creditCard data', () => {
  const user = {
    id: 1,
    username: 'test',
    password: 'secret',
    creditCard: {
      pan: '4332-1234-1234-1234',
      expiryMonth: 6,
      expiryYear: 2025,
    },
  };

  const sanitized = sanitizeUserForResponse(user);
  assert.equal(sanitized.password, '****');
  assert.equal(sanitized.creditCard.pan, '**** **** **** 1234');
});

test('sanitizeUserForResponse masks snake_case credit_card data', () => {
  const user = {
    id: 1,
    username: 'test',
    password: 'secret',
    credit_card: {
      pan: '4332-1234-1234-1234',
      expiryMonth: 6,
      expiryYear: 2025,
    },
  };

  const sanitized = sanitizeUserForResponse(user);
  assert.equal(sanitized.password, '****');
  assert.equal(sanitized.creditCard.pan, '**** **** **** 1234');
  assert.equal(sanitized.credit_card, undefined);
});
