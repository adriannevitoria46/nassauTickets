import test from 'node:test';
import assert from 'node:assert/strict';
import { escolherTipo } from './prioridade.js';

const todas = { SP: true, SG: true, SE: true };

test('ciclo completo com todas as filas', () => {
  assert.equal(escolherTipo(null, todas), 'SP');
  assert.equal(escolherTipo('SP', todas), 'SE');
  assert.equal(escolherTipo('SE', todas), 'SP');
  assert.equal(escolherTipo('SG', todas), 'SP');
});

test('após SP sem SE, chama SG', () => {
  assert.equal(escolherTipo('SP', { SP: true, SG: true, SE: false }), 'SG');
});

test('sem SP, alterna SE e SG', () => {
  const semSP = { SP: false, SG: true, SE: true };
  assert.equal(escolherTipo('SE', semSP), 'SG');
  assert.equal(escolherTipo('SG', semSP), 'SE');
});

test('fila vazia cai na prioridade; tudo vazio devolve null', () => {
  assert.equal(escolherTipo('SG', { SP: false, SG: true, SE: false }), 'SG');
  assert.equal(escolherTipo('SP', { SP: true, SG: false, SE: false }), 'SP');
  assert.equal(escolherTipo('SP', { SP: false, SG: false, SE: false }), null);
});
