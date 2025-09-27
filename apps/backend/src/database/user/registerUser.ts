import type { Database } from "sqlite";

export interface User {
  name: string;
  email: string;
  ft_id: number;
}

export async function registerUser(db: Database, user: User): Promise<boolean> {
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
