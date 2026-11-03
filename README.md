# Stopix

Stop (adedonha) em dois modos:

- **`/` — com os amigos, online.** Cria uma sala, manda o código de 4 letras e cada um
  joga no seu celular. É o Stop clássico: sai uma letra, todo mundo preenche as
  categorias, quem terminar primeiro pede **STOP!**, a turma vota nas palavras que não
  estão nas listas e os pontos saem.
- **`/live` — com o chat da live.** Overlay para TikTok LIVE Studio/OBS integrado ao
  **Neon Live Labs** (o chat responde, quem acerta aparece com a foto). Veja
  [Modo live](#modo-live).

## Modo amigos

1. O anfitrião cria a sala em `/` e escolhe categorias (3 a 10), rodadas e tempo.
2. Os amigos entram com o código ou pelo link `/room/{código}`.
3. **Sorteio** da letra → **folha** com uma casa por categoria (o botão STOP só libera
   com tudo preenchido; dá para ver quantas casas cada um já preencheu, não o que escreveu).
4. **STOP!** (ou acaba o tempo) → **conferência**: palavra que está nas listas do Stopix
   vale direto (acento, plural e um errinho passam); palavra fora da lista vai para
   votação 👍/👎 e vale, a não ser que a maioria vote contra.
5. **Pontos**: 10 se só você respondeu aquilo, 5 se repetiu, 20 se ninguém mais acertou
   a categoria. Depois da última rodada, o campeão.

Quem roda o relógio é o aparelho do anfitrião (não tem servidor próprio). Se ele sair, o
jogador mais antigo que está online vira anfitrião em 5 segundos.

### Firebase do modo amigos

O modo amigos usa um projeto Firebase próprio do Stopix (não é o do Neon):

1. No [console do Firebase](https://console.firebase.google.com), crie um projeto (ou use
   um que já tenha).
2. **Realtime Database** → Criar banco de dados.
3. **Authentication** → Método de login → ative **Anônimo**.
4. Publique as regras de `firebase/database.rules.json` (cole em Realtime Database →
   Regras, ou `bunx firebase deploy --only database --project SEU_PROJETO`).
5. Configurações do projeto → Seus apps → app da Web → copie a configuração para as
   variáveis `NEXT_PUBLIC_FIREBASE_API_KEY`, `_AUTH_DOMAIN`, `_DATABASE_URL`, `_PROJECT_ID`
   e `_APP_ID` (na Vercel e no `apps/web/.env.local`).

As salas ficam em `rooms/{código}`; as regras só deixam cada um escrever o próprio
nome, as próprias respostas (durante a rodada) e os próprios votos, e só o anfitrião
mexe no estado do jogo.

Local, sem projeto: `bun run emulators` (precisa de Java) e, no `.env.local`,
`NEXT_PUBLIC_FIREBASE_EMULATOR=1`, `NEXT_PUBLIC_FIREBASE_DATABASE_URL="http://127.0.0.1:9000?ns=demo-stopix"`
e `NEXT_PUBLIC_FIREBASE_PROJECT_ID="demo-stopix"` (as outras podem ser qualquer coisa).

## Modo live

### Como funciona uma rodada

1. **Sorteando** (3 s): a categoria aparece no cartão principal e as letras correm na caixa.
2. **Valendo** (30 s por padrão): “Mande no chat uma fruta que comece com G”. A barra do
   tempo esvazia (verde-água → azul → roxo, rosa nos últimos 25%); tique-taque nos últimos 5 s.
3. **STOP!**: mão de “pare” com ondas e “Conferindo N respostas…”.
4. **Quem levou**: cartão do vencedor com anel em degradê, a palavra, os pontos, 2º e 3º e
   o que **também valia**.
5. **Próxima rodada em N s** (6 s) e volta para o passo 1.

Depois da última rodada (10 por padrão) aparece o **campeão da partida** com o placar
final, e uma partida nova começa sozinha.

Visual: fundo azul-escuro com brilhos verde-água e roxo, painéis de vidro, fonte Rubik.
Nada de pódio de coroa ou placa de trânsito: a identidade é o cronômetro em degradê.

#### Pontos

| Resposta | Pontos |
|---|---|
| Primeira resposta certa da rodada | **+150** |
| Palavra que ninguém tinha mandado | **+100** |
| Palavra repetida | **+50** |

Cada pessoa vale **uma resposta certa por rodada** (errar não tira ponto, pode tentar de
novo). A resposta é conferida na lista da categoria (`packages/game-core/src/categories`):
acento, maiúscula, hífen ou espaço, plural (“goiabas”, “limões”), artigo na frente (“uma
goiaba”) e um erro de digitação em palavras de 6+ letras passam. Quando alguém sobe no
top 5, entra um aviso “fulano passou beltrano · 3º”.

#### Comandos (moderadores da live e os @ liberados no painel)

| Chat | O que faz |
|---|---|
| `!stop` | STOP agora (encerra a rodada antes do tempo) |
| `!stop pular` | troca categoria/letra da rodada (e devolve os pontos dela) |
| `!stop zerar` | começa uma partida nova |

No OBS/Streamlabs, “Interagir” na fonte mostra os mesmos botões (passe o mouse no rodapé).

### Presentes mexendo no jogo

Ao lado da letra fica a lista de presentes da rodada (ícone, quantos chegaram e o efeito).
Cada efeito é ligado a um presente pelo nome, no painel `/live`:

| Efeito | Padrão | O que faz |
|---|---|---|
| Mais tempo | Rose | +3 s por presente (combo de 5 = +15 s), até 2 min no relógio |
| Congelar | Perfume | para o relógio 5 s por presente (até 30 s de uma vez) |
| Troca letra | Doughnut | sorteia outra letra na mesma categoria; quem já respondeu pode responder de novo |
| Troca categoria | Forever Rosa | sorteia outra categoria e letra |
| Dobro de pontos | Galaxy | respostas valem o dobro até o fim da rodada |

Os pontos já ganhos ficam. Depois de uma troca sobram pelo menos 15 s para responder.
Presente que chega fora da rodada (sorteio, resultado, intervalo) vale quando a próxima
começa. No combo do TikTok cada presente conta na hora, sem esperar o combo acabar; troca
de letra e categoria valem uma vez por combo. As imagens dos presentes ficam em `apps/web/public/gifts` (85 presentes do TikTok,
lista em `features/live/gift-catalog.ts`); no painel o streamer escolhe pela imagem. Um
presente fora dessa lista pode ser escrito pelo nome e usa a imagem que o Neon já viu na
live (`channels/{código}/gifts`).

Opções na URL: `gifts=0` desliga; `gift_time`, `gift_freeze`, `gift_letter`,
`gift_category`, `gift_double` trocam o presente; `time_bonus` e `freeze_time` mudam os
segundos.

### Páginas

- `/live`: painel do streamer. Cola um link de overlay do Neon, escolhe tempo, rodadas,
  categorias, sons e fundo, e copia o link do overlay. Tem prévia com chat simulado.
- `/live/{código do canal}`: o overlay (fonte de navegador **1080 × 1920**, vertical).
  O palco tem 540 × 960 e é ampliado com `zoom` (não `transform: scale`), para o navegador
  desenhar tudo no tamanho final e o texto ficar nítido.
- `/live/demo`: overlay com chat simulado, para testar sem live.

Opções na URL do overlay: `round_time`, `rounds`, `break`, `categories=fruits,animals`,
`hard_letters=1`, `admins=@a,@b`, `sound=0`, `volume=0-100`, `background=transparent`,
`waves=0` (fundo parado).
Os ids das categorias estão em `packages/game-core/src/categories` (campo `id`).

O estado da partida fica no `localStorage` do navegador da live, então recarregar a fonte
retoma a mesma partida.

## Versão mobile?

O modo amigos já foi feito para o navegador do celular (uma coluna, teclado, botão de
STOP fixo embaixo), então dá para jogar sem instalar nada: basta mandar o link. Um app
nativo (Expo, como o do Sentrix) passa a valer a pena se quiserem notificação de
"sua vez"/convite, presença nas lojas ou jogar com a tela bloqueando menos.

## Stack

- `bun` workspaces + `turbo` + `biome` (igual ao Sentrix)
- `apps/web`: `next@16`, `react@19`, `tailwindcss@4`, `motion`, Firebase (Realtime
  Database do Stopix para as salas e o do Neon para o chat da live). Fonte Rubik (`@fontsource-variable/rubik`).
- `packages/game-core`: regras puras e testadas: listas de palavras, conferência das
  respostas, sorteio, pontos, fases e comandos.
- Sons sintetizados com Web Audio (sem arquivos).

Sem servidor próprio: o modo live roda no overlay e o modo amigos no aparelho do
anfitrião, com o Firebase só guardando a sala.

## Rodar local

```bash
bun install
cp apps/web/.env.example apps/web/.env.local   # NEXT_PUBLIC_FIREBASE_* e NEXT_PUBLIC_NEON_FIREBASE_*
bun run dev                                     # http://localhost:3000, /live e /live/demo
```

```bash
bun run check   # typecheck + testes + lint
bun run build
bun run format
```

Categorias (33): frutas, animais, nomes, países, profissões, doces e sobremesas, comidas,
bebidas, objetos, partes do corpo, cores, cidades do Brasil, legumes e verduras, flores e
plantas, esportes, instrumentos musicais, roupas e acessórios, jogos, filmes, séries,
desenhos, heróis e vilões, times de futebol, marcas, cantores e bandas, novelas,
personagens, youtubers e streamers, jogadores de futebol, famosos, Pokémon, animes e
personagens de anime. Em títulos, o artigo do começo não conta para a letra ("O Rei Leão" vale no R) e
número na resposta é ignorado ("GTA 5" vale como GTA).

Para pôr palavras novas, edite os arquivos de `packages/game-core/src/categories`. Uma
letra só é sorteada numa categoria se tiver pelo menos 5 palavras com ela.
