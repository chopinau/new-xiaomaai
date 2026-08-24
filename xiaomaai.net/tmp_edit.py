with open('public/index.html', 'r', encoding='utf-8', errors='replace') as f:
    c = f.read()

card = '''
                {
                    id: 'remover-converter',
                    name: 'AI 智能抠图',
                    description: '基于Transformer.js，一键去除背景，保留主体',
                    icon: '\U0001f5bc\ufe0f',
                    color: '#8B5CF6',
                    url: '/remover',
                    tags: ['抠图', '去背景', 'AI', '免费']
                },'''

idx = c.find("tags: ['切图', '分割', '网格', '免费']\n                }\n            ],")
if idx != -1:
    end = idx + len("tags: ['切图', '分割', '网格', '免费']\n                }")
    c = c[:end] + ',' + card + c[end:]
    with open('public/index.html', 'w', encoding='utf-8') as f:
        f.write(c)
    print('Added')
else:
    print('Not found')
