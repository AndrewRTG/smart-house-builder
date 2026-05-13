const { execSync } = require("child_process");

let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => (input += chunk));
process.stdin.on("end", () => {
  const { command, ...env } = JSON.parse(input);

  Object.assign(process.env, env);

  execSync(command, { stdio: ["ignore", process.stderr, process.stderr] });

  console.log(JSON.stringify({ status: "ok" }));
});