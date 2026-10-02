export class ErroNegocio extends Error {
  constructor(mensagem, status = 409) {
    super(mensagem);
    this.status = status;
  }
}
