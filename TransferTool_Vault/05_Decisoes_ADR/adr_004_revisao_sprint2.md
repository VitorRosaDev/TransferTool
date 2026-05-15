# ADR-004: Revisão de Código e Encerramento do Sprint 2

**Status:** Aceito  
**Data:** 2026-05-15  
**Responsável:** PM Orquestrador + Equipe Completa

---

## Contexto

Encerramento do Sprint 2, que entregou o Tema Global "All Black" e correções de UX no fluxo de listas. Antes de iniciar o módulo de Catálogo (Sprint 3), foi realizada uma rodada de auditoria completa por toda a equipe especializada.

---

## Auditoria Realizada

### Arquiteto — Análise Estrutural
- **Padrão MVC:** Confirmado. Models (`ListaModel`, `ItemModel`) isolados de Views e Controllers.
- **Context-Driven UI:** `ThemeContext` centraliza o estado visual. Todas as 5 telas consomem `useTheme()`.
- **Padrão State:** `ListaRancho` com estados `Rascunho`, `Consolidada`, `Exportada` — intacto e testado.
- **Separação de responsabilidades:** `schema.ts` (DDL), `seedData.ts` (fixtures), `models/*.ts` (BLL), `screens/*.tsx` (UI).

### Segurança — Auditoria SQL
- Todas as queries usam parâmetros vinculados (`?`) — protegidos contra SQL Injection.
- `PRAGMA foreign_keys = ON` ativo — integridade referencial garantida.
- `PRAGMA journal_mode = WAL` — performance e consistência em escrita.
- Deleção em cascata explícita no `ListaModel.deletar()` como fallback ao `ON DELETE CASCADE`.

### QA — Suíte de Testes
- **10/10 testes passando** (`npm test`)
- Suíte cobre: criação de lista, adição de item, bloqueio por validação, transição de estados, payload RPA.
- TypeScript strict: **0 erros** (`npx tsc --noEmit`)

### Interface — Revisão Visual
- Todas as 5 telas consomem `useTheme()` — 100% cobertura temática.
- Modo Dark "All Black": `#000000` fundo, `#16181C` cards, `#E7E9EA` texto.
- `StatusBar` corrigida para exibir ícones visíveis em ambos os modos.

---

## Correções Aplicadas

| # | Arquivo | Problema | Correção |
|---|---------|----------|----------|
| 1 | `App.tsx` | `StatusBar style="light"` no modo claro | Corrigido para `isDark ? "light" : "dark"` |
| 2 | `Drawer.tsx` | Import morto: `useState` | Removido |
| 3 | `NovaLista.tsx` | Imports mortos: `FlatList`, `KeyboardAvoidingView`, `Platform` | Removidos |
| 4 | `GerenciarCatalogo.tsx` | Fundo fixo `#F3F4F6` quebrava dark mode | Aplicado `useTheme()` |
| 5 | `NovaLista.tsx` | Card "Origem Selecionada" ausente no passo 1 | Removida condição `step === 2` |
| 6 | `ScannerLista.tsx` | Variável `isConsolidadaCheck` duplicada | Removida |

---

## Estado do Repositório

- **Branch:** `main` — atualizada e estável
- **Commits:** semânticos rastreáveis (`feat:`, `fix:`, `refactor:`)
- **Próximo Sprint:** Módulo de Gestão de Catálogos
