import { server } from "./apiServer/server.js";

async function main(): Promise<void> {
  await server();
}

main();
