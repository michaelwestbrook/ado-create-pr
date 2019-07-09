const https = require('https');
const host = 'dev.azure.com';

class PRHelper {
  constructor(organization, project, repository, targetBranch, token) {
    this.organization = organization;
    this.project = project;
    this.repository = repository;
    this.targetBranch = targetBranch;
    this.token = token;
  }

  /**
   * @returns the commit sha of head of the existing branch. Otherwise returns null if does not exist.
   */
  checkTargetBranchExists() {
    const apiPath = `/${this.organization}/${this.project}/_apis/git/repositories/${this.repository}/refs/heads/${this.targetBranch}?api-version=1.0`;
    console.log(`Checking if ${this.targetBranch} exists in remote repository.`);
    console.log(`https://${host}${apiPath}`);
    return new Promise((resolve, reject) => {
      https.get({
        host: host,
        path: apiPath,
        headers: {
          Authorization: `Basic ${Buffer.from(`:${this.token}`).toString("base64")}`
        }
      }, res => {
        let json = '';
        if (res.statusCode >= 300) {
          reject(res.statusMessage);
        }
        res.setEncoding('utf8');
        res.on('data', chunk => json += chunk);
        res.on('error', chunk => reject(chunk));
        res.on('end', () => resolve(JSON.parse(json)));
      });
    })
      .then(json => {
        if (!json) {
          throw 'No response while checking for remote branch.';
        }

        if (!json.value) {
          throw `Unexpected response\n${JSON.stringify(json, null, 2)}`;
        }

        for (let i = 0; i < json.value.length; i++) {
          if (json.value[i].name === `refs/heads/${this.targetBranch}`) {
            return json.value[i].objectId;
          }
        }

        return null;
      })
  }

  /**
 * Creates 'touchdownbuild-localization'in ADO
 *
 * @returns commitSha of the created branch.
 */
  createTargetBranch(newSha) {
    console.log('Creating localization branch.');
    const postData = [{
      "name": `refs/heads/${this.targetBranch}`,
      "oldObjectId": "0000000000000000000000000000000000000000",
      "newObjectId": newSha
    }];
    console.log(`https://${host}/${this.organization}/${this.project}/_apis/git/repositories/${this.repository}/refs?api-version=5.0`);

    // See https://docs.microsoft.com/en-us/rest/api/azure/devops/git/pull%20requests/create?view=azure-devops-rest-5.0 for API details
    const postOptions = {
      host: host,
      path: `/${this.organization}/${this.project}/_apis/git/repositories/${this.repository}/refs?api-version=5.0`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`:${this.token}`).toString('base64')}`
      }
    };


    return new Promise((resolve, reject) => {
      const post_req = https.request(postOptions, function (res) {
        let json = '';
        console.log('Status: ' + res.statusCode);
        if (res.statusCode >= 300) {
          reject(res.statusMessage);
        }
        res.setEncoding('utf8');
        res.on('data', chunk => json += chunk);
        res.on('error', chunk => reject(chunk));
        res.on('end', () => resolve(JSON.parse(json)));
      });

      post_req.end(JSON.stringify(postData));
    })
      .then(response => {
        if (!response || !response.value || response.value.length !== 1) {
          throw `Unexpected response while creating remote localization branch\n${JSON.stringify(response, null, 2)}`;
        }

        if (response.value[0].success) {
          console.log(`Created branch: ${this.targetBranch} with commit: ${sha}`);
          return Promise.resolve(sha);
        } else {
          throw `Did not successfully create localization branch\n${JSON.stringify(response, null, 2)}`;
        }
      });
  }
}

module.exports = PRHelper;