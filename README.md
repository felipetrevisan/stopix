# Stopix

**Stop (adedonha) que o chat da live joga.** O overlay sorteia uma categoria e uma letra,
o chat do TikTok/Twitch manda as respostas e quem acerta aparece na tela com a foto e
ganha pontos. Integrado ao **Neon Live Labs** do mesmo jeito que o modo live do Sentrix:
o overlay lê o chat em `channels/{código}/events` no Realtime Database do Neon.

## Como funciona uma rodada

1. **Sorteando a letra…** (3 s): categoria no selo do topo e as letras girando.
2. **Valendo** (30 s por padrão): “MANDA NO CHAT UMA FRUTA COM A LETRA G”. O anel do tempo
   vai de verde para laranja e vermelho; tique-taque nos últimos 5 s.
3. **STOP!**: placa vermelha e “Conferindo N respostas…”.
4. **Vencedor da rodada**: foto com raios e confete, 2º e 3º, e o que **também valia**.
5. **A próxima rodada já vai começar** (6 s) e volta para o passo 1.

Depois da última rodada (10 por padrão) aparece o **campeão da partida** com pódio, e
uma partida nova começa sozinha.

### Pontos

| Resposta | Pontos |
|---|---|
| Primeira resposta certa da rodada | **+150** |
| Palavra que ninguém tinha mandado | **+100** |
| Palavra repetida | **+50** |

Cada pessoa vale **uma resposta certa por rodada** (errar não tira ponto, pode tentar de
novo). A resposta é conferida na lista da categoria (`packages/game-core/src/categories`):
acento, maiúscula, hífen ou espaço, plural (“goiabas”, “limões”), artigo na frente (“uma
goiaba”) e um erro de digitação em palavras de 6+ letras passam. Quando alguém sobe no
top 5, aparece “🔥 fulano passou beltrano! 3º lugar”.

### Comandos (moderadores da live e os @ liberados no painel)

| Chat | O que faz |
|---|---|
| `!stop` | STOP agora (encerra a rodada antes do tempo) |
| `!stop pular` | troca categoria/letra da rodada (e devolve os pontos dela) |
| `!stop zerar` | começa uma partida nova |

No OBS/Streamlabs, “Interagir” na fonte mostra os mesmos botões (passe o mouse no rodapé).

## Páginas

- `/`: painel do streamer. Cola um link de overlay do Neon, escolhe tempo, rodadas,
  categorias, sons e fundo, e copia o link do overlay. Tem prévia com chat simulado.
- `/live/{código do canal}`: o overlay (fonte de navegador **1080 × 1920**, vertical).
  O palco tem 540 × 960 e escala para caber na fonte.
- `/live/demo`: overlay com chat simulado, para testar sem live.

Opções na URL do overlay: `tempo`, `rodadas`, `intervalo`, `categorias=frutas,animais`,
`dificeis=1`, `admins=@a,@b`, `som=0`, `volume=0-100`, `fundo=transparente`.

O estado da partida fica no `localStorage` do navegador da live, então recarregar a fonte
retoma a mesma partida.

## Versão mobile?

**Não vale a pena agora.** No Sentrix o app faz sentido porque cada pessoa joga sozinha
no celular. No Stopix quem joga é o chat: o espectador só comenta na live pelo próprio app
do TikTok, e quem roda o jogo é o streamer, no LIVE Studio/OBS do PC. Um app nativo não
acrescentaria nada para nenhum dos dois.

O que já cobre o celular: o painel funciona no navegador do celular, e o overlay também
(quem faz live pelo celular pode abrir `/live/{código}` no navegador e transmitir a tela).
Se um dia tiver modo solo (jogar Stop contra o relógio) ou multiplayer entre amigos, aí um
app no estilo do Sentrix volta a fazer sentido.

## Stack

- `bun` workspaces + `turbo` + `biome` (igual ao Sentrix)
- `apps/web`: `next@16`, `react@19`, `tailwindcss@4`, `motion`, Firebase (só o Realtime
  Database do Neon, no navegador). Fontes Lilita One e Nunito (`@fontsource`).
- `packages/game-core`: regras puras e testadas: listas de palavras, conferência das
  respostas, sorteio, pontos, fases e comandos.
- Sons sintetizados com Web Audio (sem arquivos).

Não tem servidor nem banco próprio: o jogo inteiro roda no overlay.

## Rodar local

```bash
bun install
cp apps/web/.env.example apps/web/.env.local   # NEXT_PUBLIC_NEON_FIREBASE_* (os mesmos do Sentrix)
bun run dev                                     # http://localhost:3000 e /live/demo
```

```bash
bun run check   # typecheck + testes + lint
bun run build
bun run format
```

Para pôr palavras novas, edite os arquivos de `packages/game-core/src/categories`. Uma
letra só é sorteada numa categoria se tiver pelo menos 5 palavras com ela.
