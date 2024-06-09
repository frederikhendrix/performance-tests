require("dotenv").config();
const { exec } = require("child_process");

const jwtToken = process.env.JWT_TOKEN;
const userRole = process.env.USER_ROLE;

if (!jwtToken || !userRole) {
  console.error("JWT_TOKEN or USER_ROLE is not defined in the .env file");
  process.exit(1);
}

// Specify the path to your K6 test script here
const k6TestScriptPath = "./k6/scripts/stress-test.js";

const k6Command = `k6 run --env JWT_TOKEN=${jwtToken} --env USER_ROLE=${userRole} ${k6TestScriptPath}`;

console.log("Running command:", k6Command);

exec(k6Command, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error executing K6 test: ${error}`);
    return;
  }
  console.log(stdout);
  console.error(stderr);
});
