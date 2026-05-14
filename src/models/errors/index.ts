export class TransicaoInvalidaError extends Error {
  constructor(estadoAtual: string, tentativa: string) {
    super(`Transição inválida. Não é possível mudar de [${estadoAtual}] para [${tentativa}].`);
    this.name = 'TransicaoInvalidaError';
  }
}

export class OperacaoBloqueadaError extends Error {
  constructor(operacao: string, estado: string) {
    super(`A operação '${operacao}' está bloqueada porque a lista encontra-se no estado [${estado}].`);
    this.name = 'OperacaoBloqueadaError';
  }
}

export class ValidacaoItemError extends Error {
  constructor(mensagem: string) {
    super(mensagem);
    this.name = 'ValidacaoItemError';
  }
}
