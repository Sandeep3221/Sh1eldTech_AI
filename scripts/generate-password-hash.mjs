import bcrypt from "bcryptjs";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const rl = readline.createInterface({ input, output });
const password = await rl.question("Password: ");
rl.close();

if (!password) {
  console.error("Password is required.");
  process.exit(1);
}

console.log(await bcrypt.hash(password, 12));