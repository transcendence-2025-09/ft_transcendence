export class TwoFactorRequiredError extends Error {
  constructor() {
    super("Two-factor authentication required");
    this.name = "TwoFactorRequiredError";
  }
}

export class OAuthConfigError extends Error {
  constructor() {
    super("OAuth configuration error");
    this.name = "OAuthConfigError";
  }
}

export class PopupBlockedError extends Error {
  constructor() {
    super("Popup was blocked");
    this.name = "PopupBlockedError";
  }
}

export class AuthCancelledError extends Error {
  constructor() {
    super("Authentication was cancelled");
    this.name = "AuthCancelledError";
  }
}

export class AuthTimeoutError extends Error {
  constructor() {
    super("Authentication timed out");
    this.name = "AuthTimeoutError";
  }
}

export class AuthFailedError extends Error {
  constructor() {
    super("Authentication failed");
    this.name = "AuthFailedError";
  }
}
