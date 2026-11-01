import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TIPOS_OBRA, calcularPorcentaje, tipoPorId } from '../src/config/tiposObra.ts';

test('el porcentaje es pasos completados sobre pasos del tipo', () => {
  const gas = tipoPorId('gas_domiciliario');
  assert.equal(calcularPorcentaje(gas, []), 0);
  assert.equal(calcularPorcentaje(gas, [gas.pasos[0].id]), Math.round(100 / gas.pasos.length));
  assert.equal(calcularPorcentaje(gas, gas.pasos.map((p) => p.id)), 100);
});

test('ignora pasos que ya no existen y duplicados', () => {
  const t = tipoPorId('antena_satelital');
  assert.equal(calcularPorcentaje(t, ['paso-borrado', t.pasos[0].id, t.pasos[0].id]), Math.round(100 / t.pasos.length));
});

test('un tipo desconocido cae en "otro" y todos los tipos son válidos', () => {
  assert.equal(tipoPorId('inexistente').id, 'otro');
  const ids = new Set<string>();
  for (const t of TIPOS_OBRA) {
    assert.ok(!ids.has(t.id), `id repetido: ${t.id}`);
    ids.add(t.id);
    assert.equal(new Set(t.pasos.map((p) => p.id)).size, t.pasos.length, `pasos repetidos en ${t.id}`);
    assert.match(t.color, /^#[0-9A-Fa-f]{6}$/);
  }
});
