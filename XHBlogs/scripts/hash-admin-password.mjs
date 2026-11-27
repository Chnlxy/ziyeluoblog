import { createHash } from "node:crypto";
import process from "node:process";

if (!process.stdin.isTTY || !process.stdout.isTTY) {
  console.error("请在交互式终端中运行。");
  process.exit(1);
}

process.stdout.write("管理员密码（至少 20 个字符）: ");
process.stdin.setRawMode(true);
process.stdin.resume();
process.stdin.setEncoding("utf8");

let password = "";

for await (const chunk of process.stdin) {
  for (const character of chunk) {
    if (character === "\u0003") {
      process.stdin.setRawMode(false);
      process.stdout.write("\n");
      process.exit(130);
    }
    if (character === "\r" || character === "\n") {
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdout.write("\n");
      if ([...password].length < 20) {
        console.error("密码短于 20 个字符，未生成摘要。");
        process.exit(1);
      }
      console.log(createHash("sha256").update(password, "utf8").digest("hex"));
      process.exit(0);
    }
    if (character === "\u007f" || character === "\b") {
      password = [...password].slice(0, -1).join("");
      continue;
    }
    password += character;
  }
}
