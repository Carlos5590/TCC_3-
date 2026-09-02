const assert = require('assert');

global.window = { addEventListener: () => {} };
global.document = {
  getElementById: () => ({
    classList: { add() {}, remove() {}, toggle() {} },
    style: {},
    innerHTML: '',
    innerText: '',
    value: '',
    appendChild() {},
    querySelectorAll() { return []; },
    querySelector() { return null; },
    addEventListener() {},
  }),
  querySelector: () => null,
  querySelectorAll: () => [],
  createElement: () => ({
    classList: { add() {}, remove() {}, toggle() {} },
    style: {},
    innerHTML: '',
    appendChild() {},
    setAttribute() {},
    addEventListener() {},
  }),
  body: { classList: { add() {}, remove() {} } },
};

global.localStorage = {
  store: {
    usuarios: JSON.stringify({
      ana: {
        email: 'ana@email.com',
        senha: '1234',
        nivel: 1,
        pontos: 0,
        badges: [],
        tarefas: [],
        perguntaAtual: 0,
        materias: {},
        materiaSelecionada: null,
        customizacao: { genero: 'feminino', pele: 'clara', cabelo: 'preto', olhos: 'castanhos' },
        quizDiario: null,
      }
    })
  },
  getItem(key) {
    return this.store[key] ?? null;
  },
  setItem(key, value) {
    this.store[key] = value;
  },
  removeItem() {},
};

require('./script.js');

usuarioAtual = 'ana';

assert.strictEqual(typeof atualizarQuizDiarioParaUsuario, 'function');
const quiz = atualizarQuizDiarioParaUsuario();
assert.strictEqual(Array.isArray(quiz.perguntas), true);
assert.strictEqual(quiz.perguntas.length, 5);
assert.strictEqual(new Set(quiz.perguntas.map((item) => item.materia)).size, 5);

const usuarios = JSON.parse(localStorage.getItem('usuarios'));
usuarios.ana.quizDiario.concluido = true;
localStorage.setItem('usuarios', JSON.stringify(usuarios));
assert.strictEqual(quizDiarioJaConcluidoHoje(), true);

console.log('Teste do quiz diário passou.');
