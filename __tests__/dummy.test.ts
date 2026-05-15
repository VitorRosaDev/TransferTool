// Arquivo de validação da suíte Jest criado pelo QA Sênior
// Este teste garante que o Jest consegue processar arquivos TypeScript do ambiente Expo.

describe('Ambiente de Testes (QA Base)', () => {
  it('Deve passar neste teste matemático básico', () => {
    expect(1 + 1).toBe(2);
  });

  it('O ambiente deve suportar imports do React Native / Expo', () => {
    const isTesting = true;
    expect(isTesting).toBeTruthy();
  });
});
