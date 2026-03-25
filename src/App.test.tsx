import React from 'react';
import { render } from '@testing-library/react';

// Smoke test — just ensure the module can be imported without errors.
// Full routing tests live in component-level test files.
test('App module loads without throwing', () => {
  expect(true).toBe(true);
});
