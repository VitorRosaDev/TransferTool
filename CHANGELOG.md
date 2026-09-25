# Changelog

Todas as mudanças relevantes deste projeto são documentadas neste arquivo.

O formato segue o [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/)
e o projeto adota o [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [Unreleased] - 2026-09-25

### Adicionado
- Campo `descricao` (nome do item) nos itens do payload de exportação.
- Normalização de `codigos` do payload para array limpo de strings (códigos agrupados por vírgula são expandidos).
- Nome do arquivo de exportação no formato `Carga_<depósito>_<DD-MM-YYYY>_<HHhsMMmin>.json`.
- Coluna `deposito_id` (FK nullable) na tabela `itens` prevendo "depósito vinculado" (feature futura, sem lógica).
- Seed de itens atualizado a partir do `Itens.xlsx`.
- Validação de caracteres suspeitos e tamanho máximo em códigos de catálogo (alinhada ao TransferToolRPA).
- Splash nativo mantido até a inicialização do banco local (`expo-splash-screen`).
- Relatório de contexto `PROJECT_REPORT.md` (não versionado) com catálogo de skills.

### Alterado
- Ordem de exibição dos itens da lista criada: primeiro item adicionado no topo.

### Corrigido
- Busca do Hub de Transferência que parava de exibir sugestões após seleção/dismiss (pre-load ao focar).
- Teclado cobrindo o campo de quantidade no modal de inserção (`KeyboardAvoidingView`).

### Segurança
- Validação de caracteres suspeitos em códigos (evita gerar payloads rejeitados pelo RPA).
- Nenhum segredo/credencial identificado no código-fonte.
