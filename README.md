# Heroes Tactics Arena

> Projeto feito de brincadeira para fins de estudos, com uso de IA como ferramenta de auxílio no desenvolvimento.

Simulador web de um RPG de táticas no estilo gacha mobile. O objetivo foi explorar arquitetura de domínio, gerenciamento de estado e modelagem de sistemas de jogo — sem nenhuma pretensão de virar um produto real.

---

## O que tem no jogo

- **Personagens** com raridades (Comum, Raro, Épico, Lendário), elementos e classes
- **Sistema de invocação (Gacha)** com Banner Comum e Banner Especial (com pity)
- **Formação** de equipe para batalhas
- **Batalhas** contra bosses com mecânicas de turno
- **Progressão** — níveis, estrelas, habilidades, armas e pets
- **Skins** cosméticas por personagem
- **Evento sazonal** — Festival da Fortuna com milestones, pacotes e Dado da Sorte

---

## Stack

| Camada | Tecnologia |
|---|---|
| UI | React 19 + Ant Design 5 |
| Estado | Zustand |
| Linguagem | TypeScript |
| Build | Vite |
| Testes | Vitest |
| Persistência | localStorage |

---

## Como rodar

```bash
npm install
npm run dev
```

Testes:

```bash
npm test
```

---

## Estrutura

```
src/
  domain/       # Entidades e regras de negócio (puro TS, sem UI)
  data/         # Repositórios (localStorage)
  presentation/ # Componentes, páginas e hooks React
  shared/       # Constantes, utilitários e formatadores
```

A camada `domain/` não importa nada de React — todas as regras de gacha, batalha e progressão vivem ali e têm cobertura de testes.

---

## Contexto

Projeto de estudo pessoal. A IA (Claude) foi usada para auxiliar na geração de código, revisão de lógica e criação de conteúdo do jogo (nomes de personagens, habilidades, eventos). Nada aqui é afiliado a nenhum jogo ou empresa real.
