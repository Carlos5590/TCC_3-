import json
import js2py

script_path = r"c:\Users\Usuário\OneDrive\Desktop\TCC de manha\Aplicativo Estudos\script.js"
with open(script_path, encoding='utf-8') as f:
    script = f.read()

store = {
    "usuarios": json.dumps({
        "ana": {
            "email": "ana@email.com",
            "senha": "1234",
            "nivel": 1,
            "pontos": 0,
            "badges": [],
            "tarefas": [],
            "perguntaAtual": 0,
            "materias": {},
            "materiaSelecionada": None,
            "customizacao": {"genero": "feminino", "pele": "clara", "cabelo": "preto", "olhos": "castanhos"},
            "quizDiario": None,
        }
    })
}

js = js2py.EvalJs({
    'window': {'addEventListener': lambda *args, **kwargs: None},
    'document': {
        'getElementById': lambda *args, **kwargs: type('El', (), {
            'classList': type('CL', (), {'add': lambda *a, **k: None, 'remove': lambda *a, **k: None, 'toggle': lambda *a, **k: None})(),
            'style': {},
            'innerHTML': '',
            'innerText': '',
            'value': '',
            'appendChild': lambda *a, **k: None,
            'querySelectorAll': lambda *a, **k: [],
            'querySelector': lambda *a, **k: None,
            'addEventListener': lambda *a, **k: None,
        })(),
        'querySelector': lambda *args, **kwargs: None,
        'querySelectorAll': lambda *args, **kwargs: [],
        'createElement': lambda *args, **kwargs: type('El', (), {
            'classList': type('CL', (), {'add': lambda *a, **k: None, 'remove': lambda *a, **k: None, 'toggle': lambda *a, **k: None})(),
            'style': {},
            'innerHTML': '',
            'appendChild': lambda *a, **k: None,
            'setAttribute': lambda *a, **k: None,
            'addEventListener': lambda *a, **k: None,
        })(),
        'body': {'classList': {'add': lambda *a, **k: None, 'remove': lambda *a, **k: None}},
    },
    'localStorage': {
        'getItem': lambda key: store.get(key),
        'setItem': lambda key, value: store.__setitem__(key, value),
        'removeItem': lambda key: store.pop(key, None),
    },
    'alert': lambda *args, **kwargs: None,
    'console': {'log': lambda *args, **kwargs: None},
})

js.execute(script)
js.eval('usuarioAtual = "ana";')
quiz = js.eval('atualizarQuizDiarioParaUsuario();')
print('perguntas:', len(quiz['perguntas']))
print('materias:', sorted({item['materia'] for item in quiz['perguntas']}))

usuarios = json.loads(store['usuarios'])
usuarios['ana']['quizDiario']['concluido'] = True
store['usuarios'] = json.dumps(usuarios)
print('concluido_hoje:', js.eval('quizDiarioJaConcluidoHoje();'))
