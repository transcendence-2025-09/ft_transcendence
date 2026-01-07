export const SignInButtonStyles = {
  initial:
    "bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200",
  loading:
    "bg-gray-400 text-white font-semibold py-3 px-8 rounded-lg cursor-not-allowed opacity-50",
} as const;

export const ErrorMessages = {
  systemError: "システムエラーが発生しました。管理者に連絡してください。",
  popupBlocked: "ポップアップがブロックされました。設定を確認してください。",
  authCancelled: "認証がキャンセルされました。",
  authTimeout: "認証がタイムアウトしました。",
  authFailed: "認証に失敗しました。",
  unknownError: "不明なエラーが発生しました。もう一度お試しください。",
} as const;

export const ProgressSignInText = "サインイン中...";
