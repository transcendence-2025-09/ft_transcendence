import type { Database } from "sqlite";
import type { User } from "./registerUser.js";

export async function getUserWithFtId(db: Database, ft_id: number): Promise<User | null> {
  const user = await db.get<User>("SELECT * FROM users WHERE ft_id = ?", [ft_id]);
  return user || null;
}
