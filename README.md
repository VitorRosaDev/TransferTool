# 📦 TransferTool

O **TransferTool** é um aplicativo mobile focado na operação logística de almoxarifados centrais. Desenvolvido para atuar de forma **100% offline**, ele permite a criação, gerenciamento e validação de transferências de suprimentos (listas de rancho) diretamente do chão do depósito, garantindo alta confiabilidade e integridade de dados.

## 🚀 Principais Funcionalidades

- **Coleta Offline-First:** Arquitetura construída inteiramente sobre SQLite local, garantindo zero dependência de conexão de internet durante a separação de carga.
- **Gestão de Catálogos Embutida:** Catálogo local de itens (perecíveis e não perecíveis), depósitos de origem e escolas de destino com suporte a exclusão lógica (Soft Delete) para manter o histórico de transferências intacto.
- **Ciclo de Vida Rigoroso (State Pattern):**
  - 🟡 **Rascunho:** Lista livre para adição e edição.
  - 🟢 **Consolidada:** Lista bloqueada para edição após separação física.
  - 🔵 **Exportada:** Geração do payload (JSON) para integração RPA.
- **Limpeza Automática:** Mecanismo integrado de descarte automático para listas consolidadas antigas (Garbage Collection).

## 🛠️ Tecnologias Utilizadas

- **Framework:** React Native / Expo
- **Linguagem:** TypeScript
- **Banco de Dados:** SQLite (`expo-sqlite`) com `PRAGMA foreign_keys = ON` e modo `WAL` para performance máxima.
- **Arquitetura:** Strict MVC (Model-View-Controller)

## 📋 Pré-requisitos

Para executar o projeto localmente, você precisará ter instalado:

- Node.js (v18+)
- npm ou yarn
- Expo CLI

## ⚙️ Instalação e Execução

1. Clone o repositório.
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Inicie o servidor de desenvolvimento para dispositivo físico (LAN):
   ```powershell
   $env:EXPO_OFFLINE=1; npx expo start --lan -c
   ```
   *Nota: O uso de `-c` e `EXPO_OFFLINE` é recomendado para evitar conflitos de cache no SDK 54.*

## 📂 Fluxo de Exportação RPA
O app gera arquivos JSON padronizados para o agente robótico:
1. Finalize a conferência dos itens na tela de **Scanner**.
2. Clique em **Consolidar Carga**.
3. Use o botão **Gerar JSON** (disponível no Histórico ou no Scanner) para abrir a caixa de compartilhamento nativa.
4. O arquivo será nomeado como `transferencia_[ID]_[DESTINO].json`.

## 🗄️ Estrutura de Dados (Seed)

No primeiro carregamento, o aplicativo inicializa o banco de dados e insere automaticamente a relação oficial de itens, origens e destinos. Não é necessária configuração manual de banco de dados por parte do desenvolvedor frontend.

---

*Projeto arquitetado e mantido sob versionamento estrito de qualidade e padronização.*
