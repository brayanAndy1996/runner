// Spec 001 — AC-05: la app compila y la pantalla raíz renderiza (smoke).
// Contrato: app/src/app/index.tsx es la ruta raíz (expo-router) y muestra el
// texto "Runner". Se importa dentro del test para que un archivo faltante sea
// una falla de este AC y no de carga de la suite.

/// <reference types="jest" />
import React from 'react';
import { render, screen } from '@testing-library/react-native';

describe('001: pantalla raíz de la app', () => {
  test('AC-05: la pantalla raíz renderiza el texto "Runner"', async () => {
    let Root: React.ComponentType;
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      Root = require('../src/app/index').default as React.ComponentType;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`app/src/app/index.tsx no existe o no se puede importar: ${msg}`);
    }
    await render(<Root />);
    await screen.findByText('Runner');
  });
});
