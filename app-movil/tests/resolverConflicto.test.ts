import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ganaEntrante } from '../src/sync/resolverConflicto.ts';

const v = (actualizadoEn: string, editadoPor: string) => ({ actualizadoEn, editadoPor });

test('sin versión previa siempre se aplica', () => assert.equal(ganaEntrante(null, v('2026-01-01T00:00:00Z', 'A')), true));
test('gana el más reciente', () => {
  assert.equal(ganaEntrante(v('2026-01-01T10:00:00Z', 'A'), v('2026-01-01T10:00:01Z', 'B')), true);
  assert.equal(ganaEntrante(v('2026-01-01T10:00:01Z', 'A'), v('2026-01-01T10:00:00Z', 'B')), false);
});
test('empate: decide el id del dispositivo (todos concluyen lo mismo)', () => {
  const t = '2026-01-01T10:00:00Z';
  assert.equal(ganaEntrante(v(t, 'A'), v(t, 'B')), true);
  assert.equal(ganaEntrante(v(t, 'B'), v(t, 'A')), false);
});
