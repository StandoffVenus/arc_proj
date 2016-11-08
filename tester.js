// Teacher email
// Subject - ARC report for <student> 
// - Student name
// - Hour
// - What they came in for
// - Comments

let googleapi = require('googleapis'),
    file_system = require('fs'),
    base64 = require('js-base64').Base64;

// Google's authentication method for OAuth2
let OAuth2 = googleapi.auth.OAuth2,
    OAuth2Client,
    gmail;

file_system.readFile(
  `${__dirname}/credentials/client_secret.json`,
  (err, data) => {
    if (err)
      throw err;

    let client = JSON.parse(data);

    OAuth2Client = new OAuth2(
                      client.web.client_id,
                      client.web.client_secret,
                      client.web.redirect_uris
                    );

    file_system.readFile(
      `${__dirname}/credentials/gmail-nodejs-quickstart.json`,
      (err, data) => {
        if (err)
          throw err;

        let credentials = JSON.parse(data);

        OAuth2Client.setCredentials(
          {
            access_token  : credentials.access_token,
            refresh_token : credentials.refresh_token,
            expiry_date   : credentials.expiry_date
          }
        );

        gmail = googleapi.gmail(
          {
            'version' : 'v1',
            'auth' : OAuth2Client
          }
        );

        let base64String = base64.encode('Hello, world!');

        gmail.users.drafts.list(
          {
            'userId' : 'me',
          },
          (err, response) => {
            response.drafts.forEach(
              (draft) => {
                setTimeout(
                  () => {
                    gmail.users.drafts.delete(
                      {
                        'userId'  : 'me',
                        'id'      : draft.id
                      }
                    );
                  },
                  5000
                );
              }
            );
          }
        );
      }
    );
  }
);