const PRHelper = require('./PRHelper');
const cp = require('child_process');

/**
 * Executes a command line command.
 *
 * @param {string} command
 */
function executeCommand(command) {
  console.log(`executing: ${command}`);
  return new Promise((resolve, reject) => {
    cp.exec(command, (error, stdout, stderr) => {
      if (error) {
        console.log(`Error executing : ${command}`);
        reject(error);
      } else if (stderr) {
        console.log(`Error executing : ${command}`);
        reject(stderr);
      } else {
        resolve(stdout);
      }
    });
  });
}

/**
 * @returns the current local commit sha.
 */
function getCurrentCommitSha() {
  return executeCommand('git rev-parse --verify HEAD')
    .then(sha => sha.trim());
}

const foo = new PRHelper('domoreexp', 'Teamspace', 'Teamspace-Web', 'miwestbr-foo', 'sv2seix5dacwl4w7l5xaarkrvpdlvu4ojoie2s3kzzepwpfogwta');
foo.createTargetBranch(getCurrentCommitSha())
  .then(console.log)
  .catch(e => console.log(JSON.stringify(e, null, 2)));