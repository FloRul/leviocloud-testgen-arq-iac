import AWS from "aws-sdk";
import {
  AuthenticationDetails,
  CognitoUser,
  CognitoUserPool,
} from "./amazon-cognito-identity-js";

const poolData = {
  UserPoolId: "ca-central-1_fuT9Uqhn9", // Your user pool id here
  ClientId: "4j9v08ni345r1masnlh8bnoik", // Your client id here
};

const userPool = new CognitoUserPool(poolData);

const identityPoolId = "ca-central-1:4bbae109-5083-4300-8368-a8905b92f0f7";

function authenticateUser(username, password) {
  const authenticationData = {
    Username: username,
    Password: password,
  };

  const authenticationDetails = new AuthenticationDetails(authenticationData);

  const userData = {
    Username: username,
    Pool: userPool,
  };

  const cognitoUser = new CognitoUser(userData);

  return new Promise((resolve, reject) => {
    cognitoUser.authenticateUser(authenticationDetails, {
      onSuccess: (result) => {
        const idToken = result.getIdToken().getJwtToken();

        AWS.config.region = "ca-central-1";

        AWS.config.credentials = new AWS.CognitoIdentityCredentials({
          IdentityPoolId: identityPoolId,
          Logins: {
            [`cognito-idp.ca-central-1.amazonaws.com/${poolData.UserPoolId}`]:
              idToken,
          },
        });

        AWS.config.credentials.refresh((error) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        });
      },
      onFailure: (err) => {
        reject(err);
      },
    });
  });
}

function listFiles() {
  const s3 = new AWS.S3();

  const params = {
    Bucket: "claude-invocation-bucket",
  };

  return s3.listObjectsV2(params).promise();
}

function getFile(fileName) {
  const s3 = new AWS.S3();

  const params = {
    Bucket: "claude-invocation-bucket",
    Key: fileName,
  };

  return s3.getObject(params).promise();
}

export { authenticateUser, getFile, listFiles };
