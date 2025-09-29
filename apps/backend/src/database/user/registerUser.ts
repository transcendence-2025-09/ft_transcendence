import type { Database } from "sqlite";

export interface User {
  id: number;
  name: string;
  email: string;
  ft_id: number;
}

export type RegisterUserInput = Omit<User, "id">;

export async function registerUser(db: Database, user: RegisterUserInput): Promise<boolean> {
  const { name, email, ft_id } = user;
  if (!name || !email || !ft_id) {
    return false;
  }

  try {
    await db.run(
      "INSERT OR IGNORE INTO users (name, email, ft_id) VALUES (?, ?, ?)",
      [name, email, ft_id],
    );
    return true;
  } catch {
    return false;
  }
}
