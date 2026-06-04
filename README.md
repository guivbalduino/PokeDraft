# PokeDraft: Max Stats

Um jogo web de Draft de Pokémon onde o objetivo é montar o maior somatório de atributos (stats) possível, escolhendo slots sem saber os valores exatos de cada Pokémon gerado aleatoriamente.

## 🎮 Como Jogar

1. Um Pokémon aleatório (ID 1–1025) aparece na tela com seu nome e imagem.
2. Os valores reais dos 6 atributos (HP, Attack, Defense, Sp. Attack, Sp. Defense, Speed) ficam **ocultos**.
3. Você deve escolher em qual slot de atributo **acha** que aquele Pokémon se destaca.
4. Ao clicar em "Choose", o valor real é **revelado e fixado** permanentemente naquele slot.
5. Um novo Pokémon aparece **imediatamente** (com um efeito de "roleta" mostrando vários Pokémon em ~1 segundo).
6. Após 6 rodadas, todos os slots estarão preenchidos e sua **pontuação final** é calculada.
7. O jogo também mostra qual seria a **maior pontuação possível** com os Pokémon que você recebeu.

## 🛠️ Stack Tecnológica

- **Framework:** Vite + React (TypeScript)
- **Estilização:** Tailwind CSS v4
- **Ícones:** Lucide React
- **API:** PokéAPI (pública, sem necessidade de chave)
- **Persistência:** localStorage (recorde global)

## 🚀 Como Executar

```bash
# Instalar dependências
npm install

# Desenvolvimento
npm run dev

# Build de produção
npm run build

# Preview do build
npm run preview
```

## 📁 Estrutura do Projeto

```
src/
├── components/
│   ├── PokemonCard.tsx   # Card do Pokémon atual (imagem, nome, loading/spin)
│   ├── StatsPanel.tsx    # Painel com os 6 slots de atributos
│   └── GameOver.tsx      # Modal de fim de jogo com resultado e histórico
├── App.tsx               # Lógica principal do jogo (estado, API, localStorage)
├── types.ts              # Tipagens TypeScript, labels e constantes
├── index.css             # Estilos globais + animação customizada
└── main.tsx              # Entry point
```

## 🧠 Regras de Negócio

- 6 slots de atributos: HP, Attack, Defense, Sp. Attack, Sp. Defense, Speed
- Cada rodada sorteia um Pokémon aleatório (ID 1–1025) via PokéAPI
- O jogador escolhe 1 slot por rodada; o valor é fixado permanentemente
- Após 6 rodadas, calcula-se a soma total
- Recorde salvo no `localStorage` é comparado e atualizado se superado
- A pontuação máxima possível (melhor stat de cada Pokémon) é exibida no fim

## 🎨 Funcionalidades

- Efeito de "roleta" ao sortear novo Pokémon (8 sprites em ~1 segundo)
- Skeleton loading enquanto a PokéAPI responde
- Layout responsivo (side-by-side em desktop, empilhado em mobile)
- Modal de Game Over com histórico detalhado dos 6 Pokémon draftados
- High Score persistido no navegador
- Tema escuro com gradientes e transições suaves
