// Spec 001 — cobertura de RootLayout (app/src/app/_layout.tsx).
// expo-router se mockea en la frontera de routing: se demuestra que el layout
// ejecuta <Stack /> sin fingir integración nativa del router real.

/// <reference types="jest" />
import React from 'react';
import { render } from '@testing-library/react-native';
import { Stack } from 'expo-router';

// jest.mock es hoisted por babel-jest: aunque el import de Stack va arriba,
// el mock se aplica antes de la importación real.
jest.mock('expo-router', () => ({
  Stack: jest.fn(() => null),
  __esModule: true,
}));

describe('001: RootLayout', () => {
  test('AC-05: el layout raíz renderiza el Stack de expo-router', async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const RootLayout = require('../src/app/_layout').default as React.ComponentType;
    await render(<RootLayout />);
    expect(Stack).toHaveBeenCalled();
  });
});
