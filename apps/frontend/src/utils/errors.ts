export class TwoFactorRequiredError extends Error {
  constructor() {
    super("Two-factor authentication required");
    this.name = "TwoFactorRequiredError";
  }
}
