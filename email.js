let googleapis = require('googleapis'),
  // Google's framework for accesses to their apis

  base64 = require('js-base64').Base64,
  // Google requires that our emails' content be encoded in base-64

  jsonFile = require('jsonfile'),
  // File system reading, but we only need JSON

  OAuth2 = googleapis.auth.OAuth2,
  // Creating an OAuth2 object

  gmail,
  // Gmail object

  OAuth2Client,
  // OAuth2 client object

  // Constructor for our Gmail helper
  Email = function(
    OAuth2Path, // Where we are keeping our OAuth2 secrets
    credentialsPath, // Where we keep our OAuth2's credentials
    initialCallback // Callback for initiation of object
    // Defined as ([error], [Email object])
  ) {
    // this will fall out of scope occasionally
    let self = this;

    // Grabbing secrets
    jsonFile.readFile(
      OAuth2Path,
      (err, obj) => {
        if (err)
          initialCallback(err);
        else {
          // We're only looking for web's contents
          let client = obj.web;

          // Create OAuth2 client
          OAuth2Client = new OAuth2(
            client.client_id,
            client.client_secret,
            client.redirect_uris
          );

          // Getting our OAuth2 credentials
          jsonFile.readFile(
            credentialsPath,
            (err, obj) => {
              if (err)
                initialCallback(err);
              else {
                OAuth2Client.setCredentials(
                  {
                    access_token  : obj.access_token,
                    refresh_token : obj.refresh_token,
                    expiry_date   : obj.expiry_date
                  }
                );

                gmail = googleapis.gmail(
                  {
                    'version' : 'v1',
                    'auth'    : OAuth2Client
                  }
                );

                initialCallback(null);
              }
            }
          );
        }
      }
    );

    // Create draft
    this.create = (toAddress, subject, content, callback) => {
      gmail.users.drafts.create(
        {
          'userId'  : 'me',
          'resource' : {
            'message' : {
              'raw' : base64.encodeURI(
                        `To:${toAddress}\r\n` + // Who were are sending to
                        `Subject:${subject}\r\n` + // Subject
                        `Date:\r\n` + // Removing timestamp
                        `Message-Id:\r\n` + // Removing message id
                        `From:\r\n` + // Removing from
                        `${content}\r\n` // Adding our actual message
                      )
            }
          }
        },
        (err, response) => {
          callback(err, response);
        }
      );
    }

    // Send a draft
    this.send = (id, callback) => {
      gmail.users.drafts.send(
        {
          'userId' : 'me',
          'resource' : {
            'id' : id
          }
        },
        (err, response) => {
          callback(err, response);
        }
      );
    }

    // Get a single draft
    this.get = (id, callback) => {
      gmail.users.drafts.get(
        {
          'userId'  : 'me',
          'id'      : id,
          'format'  : 'raw'
        },
        (err, response) => {
          callback(err, response.message.raw);
        }
      )
    }

    // Get all drafts
    this.list = (callback) => {
      gmail.users.drafts.list(
        {
          'userId' : 'me'
        },
        (err, resp) => {
          callback(err, resp.drafts);
        }
      );
    }

    // Gets our OAuth2 object
    this.getOAuth2Client = () => {
      return OAuth2Client;
    }

    // Gets our gmail object
    this.getGmail = () => {
      return gmail;
    }
  };

module.exports = Email;