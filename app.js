/* TODO:
	- Change student file to point at shared folder
	- Email teachers on checkin/checkout
	- Allow users to edit DB's
	- Spruce up code for /checkin POST

	[Later tasks]
	- Trim up local modules
	- Remove modules from GitHub
	- Remove teachers from GitHub
	- Trim up public folder
*/

"use strict";

  // Packages and variable declaration
const async           = require('async'),
    // async allows us to easily use functions asynchronously

    base64            = require('js-base64').Base64,
    // Google requires that our emails' content be encoded in base-64

    mongo             = require('mongodb'), 
    // This is the DB - it is a non-relation DB called MongoDB

    mongoose          = require('mongoose'), 
    // This is the ORM - makes mongo calls simpler for me

    express           = require('express'),
    // express is a framework to simplify Node's HTTP package

    googleapi					= require('googleapis'),
    // google's framework for accesses to their apis

    path              = require('path'),
    // path allows us easier manipulation of local paths and what not

    util              = require('util'),  
    // util is a built-in package with better logging time stamps and such

    child_process     = require('child_process'), 
    // child_process is a built-in package made for spinning off children of a
    // main process

    file_system       = require('fs'),
    // fs is a built-in package that allows to do many different things with
    // the filesystem

    body_parser       = require('body-parser'), 
    // body-parser is a parser that makes POST's and such decrypted for us
  
    ejs               = require('ejs'),
    // ejs allows us to create dynamic web pages from the server side

    validator         = require('express-validator'),
    // express-validator will allow us easy validation of POST data

    user_argv         = require('minimist')(process.argv.slice(2)),
    // minimist allows us to parse command line args easier

    jsonFile 					= require('jsonfile'),
    // jsonfile reads json for us

    updateTeachers    = require('./teachers/updateTeachers.js'),
    generateTeachers	= require('./teachers/generateTeachers.js'),
    // Scripts for command-line arguments

    Schema = mongoose.Schema,
    // Schema allows you to create models for mongoose and the DB you're using

    STUDENT_FILE_SETTINGS = {
    	"path" 	: "S:/",
    	"ext"		: ".txt"
    },
    // Our student file settings

    COLLECTION_ACTIONS = {
      "edit": 1,
      "delete": 1,
      "add": 1
    },
    // All the actions we will allow on our collections

    GLOBAL_PORT = (typeof process.env.PORT !== 'undefined') 
                  ?  process.env.PORT
                  :  56500;
    // Global port to communicate with localhost on

	// Changing variables
let STUDENTS = {},
    // Students checked in

    studentFile = require('./studentWriter.js')
    							(STUDENT_FILE_SETTINGS.path + STUDENT_FILE_SETTINGS.ext),
    // Writes to our student file for us */

    // Schemas
		Student = require('./Schemas/Student.js'),
    Record  = require('./Schemas/Record.js'),
    Teacher = require('./Schemas/Teacher.js');

// Spinning off a child process to open up Mongo for communication
let mongoShell = child_process.exec('mongod', // Open the Mongo connection
	{
		// Relocate to the folder containing mongod.exe
		cwd: 'C:/Program Files/MongoDB/Server/3.2/bin/'
	}
);

// Command line args
if (user_argv.generate) {
  generateTeachers();
}

if (user_argv.teachers) {
  updateTeachers(user_argv.teachers === 'force');
}

// Connecting to the DB
mongoose.connect(
  'mongodb://localhost/app',
  (err) => {
    // Exponential backoff in case of total inability to connect
    if (err) {
    	console.log('');
      util.log('Error connecting to the DB.');

      // Try to use a local IP instead of localhost (usually works)
    	util.log('Retrying with local IP.');

    	setTimeout(
    		() => {
		      mongoose.connect(
		      	'mongodb://127.0.0.1/app',
		      	(err) => {
		      		if (err) {
		      			util.log('Failed with local IP.');
		      			throw err;
							}

							util.log('Succeeded in connecting to ' +
		                      mongoose.connection.host +
		                      '\n');
		      	}
		      );
		    },
		    5000
		  );
    }
    else
    	util.log(`Succeeded in connecting to ${mongoose.connection.host}.\n`);
  }
);

let db = mongoose.connection; // Initialize db with mongoose connection

// Try to connect locally instead incase of loss of connection
db.on(
	'error',
	(err) => {
		if (err) {
			console.log('');
			util.log(`DB encountered error, presumably with connection.`);

			setTimeout(
				() => {
				  mongoose.connect(
				  	'mongodb://127.0.0.1/app',
				  	(err) => {
				  		if (err) {
				  			util.log('Failed with local IP.');
				  			throw err;
							}

							util.log('Succeeded in connecting to ' +
				                  mongoose.connection.host +
				                  '\n');
				  	}
				  );
				},
				5000
			);
		}
		else
    	util.log(`Succeeded in recovering from connection error.\n`);
	}
);

// Getting all previously logged-in students
Student.find(
  {

  },
  (err, students) => {
    if (err)
      throw err;

    async.each(
      students,
      (student, callback) => {
        STUDENTS[student.id] = student;
      },
      (err) => {
        if (err) {
          util.log(`Encountered error adding student(s).`);
          util.log(`${err}`);
        }
      }
    );
  }
);

// Setting up Gmail and Google's OAuth2
let OAuth2 = googleapi.auth.OAuth2,
    OAuth2Client,
    gmail;

/* file_system.readFile(
  // Read in our project's OAuth2 information from a file
	`${__dirname}/credentials/client_secret.json`,
	(err, data) => {
		if (err)
			throw err;

    // Parse the resultant JSON
		let client = JSON.parse(data);

    // Create a new OAuth2 client from our information
		OAuth2Client = new OAuth2(
											client.web.client_id,
											client.web.client_secret,
											client.web.redirect_uris
										);

		file_system.readFile(
      // Read in our credentials from a file
			`${__dirname}/credentials/gmail-nodejs-quickstart.json`,
			(err, data) => {
				if (err)
					throw err;

        // Parse our credentials
				let credentials = JSON.parse(data);

        // Set up our credentials in our OAuth2 client
				OAuth2Client.setCredentials(
					{
						access_token 	: credentials.access_token,
						refresh_token : credentials.refresh_token,
						expiry_date		: credentials.expiry_date
					}
				);

        // Set up Gmail with our newly created auth
        gmail = new googleapi.gmail(
          {
            'version' : 'v1',
            'auth'    : OAuth2Client
          }
        );
			}
		);
	}
); */

// Creating the "server" object
let app = express();


  // This sets up our "view engine." Express uses something called a view
  // engine to handle dynamically rendering pages. Views are the more accurate
  // names for webpages in MVC design.

app.set('view engine', 'ejs');
app.set('views', 'views');


  // This section is called middleware - if you don't know what that is you can
  // read about it here: https://expressjs.com/en/guide/using-middleware.html

// This serves our public folder without having to specify in our ejs
app.use('/static', express.static(__dirname + '/public'));

// This parses and validates POST's for us
app.use(body_parser.json( { extended : true } ));
app.use(body_parser.urlencoded( { extended : true } ));
app.use(
  validator(
    {
      errorFormatter: function(param, msg, value) {
          var namespace = param.split('.')
          , root    = namespace.shift()
          , formParam = root;

        while(namespace.length) {
          formParam += '[' + namespace.shift() + ']';
        }
        return {
          param : formParam,
          msg   : msg,
          value : value
        };
      }
    }
  )
);

  // This section is also technically middleware, but it will handle the pages
  // in my own manner. You'll see me use redefinitions a lot, but in JSON
  // passed to our views. This is because our views exist in somewhat 
  // different contexts from our main thread, and thus don't know about
  // all the packages and what not that we're using without being passed 
  // references to them.

// This method will do res.render with the template page
let renderPage = (model, req, res) => {
  // Passing the fs package to the template page
  model.file_system = file_system;

  // If we don't have any errors
  if (typeof model.errors === 'undefined')
    model.errors = {};

  // Redirects for a forced url
  if (typeof model.forcedUrl !== 'undefined'
      && model.forcedUrl !== req.originalUrl)
    res.redirect(model.forcedUrl);

  // Checks to see if a specific page should be sent over the requested url
  if (typeof model.page === 'undefined')
    model.page = __dirname + '\\views' + req.path;
  else
    model.page = __dirname + '\\views' + model.page;

  // Render 'template.ejs' with our new model.
  res.render(`${__dirname}\\views\\template.ejs`, model);
}

// For every single request
app.use( (req, res, next) => {
  // Giving pages the context of the path module
  res.locals.path = path;
  // Giving pages mongoose models
  res.locals.mongoose = mongoose;
  
  // This logs all requests a user makes
  util.log(`Request to ${req.url} via ${req.method.toUpperCase()}`);
  next();
});

// Redirect from 'localhost' or 'localhost/' to index page
app.get('/', (req, res) => {
  res.redirect('/index');
});

// Index page
app.get('/index', (req, res) => {
  renderPage(
    {
      students: STUDENTS,
    },
    req,
    res
  );
});

// Redirect to collections
app.get('/collections/', (req, res) => {
  res.redirect('/collections/show');
});

// For all requests for collections
app.get('/collections/:collection', (req, res) => {
  if (req.params.collection !== 'show'
      && typeof db.collections[req.params.collection] !== 'undefined') {
    let schemaName = req
                      .params
                      .collection
                      .substring(0, 1)
                      .toUpperCase() +

                    req
                      .params
                      .collection
                      .substring(
                        1,
                        req
                          .params
                          .collection
                          .length
                          - 1
                      )
                      .toLowerCase();

    mongoose.model(
      schemaName
    ).find(
      {

      },
      (err, entries) => {
        if (err)
          throw err;

        renderPage(
          {
            schemaName: schemaName,
            page: '/collections',
            entries: entries,
            paths: Object.keys(
              mongoose.model(
                schemaName
              ).schema.obj
            )
          },
          req,
          res
        );
      }
    );
  }
  else {
    renderPage(
      {
        collections: Object.keys(db.collections),
        page: '/collections'
      },
      req,
      res
    );
  }
});

// Check-in page - GET
app.get('/checkin', (req, res) => {
  Teacher.find(
    {

    },
    (err, teachers) => {
      if (err)
        throw err;

      renderPage(
        {
          teachers: teachers
        },
        req,
        res
      );
    }
  );
});

// Check-in page - POST 
app.post('/checkin', (req, res) => {
  // Student information section
  req
    .checkBody('studentFirstName', 'You must include a first name.')
    .notEmpty();
  req
    .checkBody('studentLastName', 'You must include a last name.')
    .notEmpty();
  req
    .checkBody('teacherName', 'No teacher was chosen.')
    .notEmpty();
  req
    .checkBody('teacherClass', 'No class was chosen.')
    .notEmpty();
  req
    .checkBody('teacherHour', 'No hour was chosen.')
    .notEmpty();
  req
    .checkBody('comingFrom', 'Invalid hour chosen.')
    .notEmpty();
  
  // ARC information section
  req
    .checkBody('helpedWith', 'Invalid selection for \"Helped with\" field.')
    .notEmpty();
  req
    .checkBody('hourInArc', 'Invalid hour in arc room.')
    .notEmpty();
  req
    .checkBody('teacherThatHelped', 'Invalid teacher to be helped by.')
    .notEmpty();

  if (req.validationErrors()) {
    Teacher.find(
      {

      },
      (err, teachers) => {
        renderPage(
          {
            errors: req.validationErrors(),
            teachers: teachers
          },
          req,
          res
        );
      }
    );
  }
  else {
    if (req.body.comingFrom === 'studyhall') {
      // Less repetition.
      let comingFromRoom = req.body.comingFromRoom;

      // Checking validity of the comingFromRoom field
      if (typeof comingFromRoom === 'undefined'
          || isNaN(Number(comingFromRoom))
          || comingFromRoom < 0) {
        Teacher.find(
          {

          },
          (err, teachers) => {
            renderPage(
              {
                errors: {
                  'comingFromRoomError' : 'Coming from invalid room number.'
                },
                teachers: teachers
              },
              req,
              res
            );
          }
        );
      }

      Teacher.find(
        {

        },
        (err, _teachers) => {
          let teachers = {};

          Object.keys(_teachers).forEach( (key) => {
            teachers[_teachers[key].lastName] = _teachers[key];
          });

          if (err)
            throw err;

            // Checks for valid data
          // Checking if the teacher chosen is a valid teacher
          if (typeof teachers[req.body.teacherName] === 'undefined') {
            renderPage(
              {
                errors: {
                  'teacherNameError' : 'Selected teacher does not exist.'
                },
                teachers: _teachers
              },
              req,
              res
            );
          }
          // Checking if class is valid
          else if (!teachers[req.body.teacherName]
                      .classes
                      .includes(req.body.teacherClass)) {
            renderPage(
              {
                errors: {
                  'teacherClassError' : 'Invalid class chosen for teacher.'
                },
                teachers: _teachers
              },
              req,
              res
            );
          }
          // Checking if student chose a valid hour
          else if (!teachers[req
                              .body
                              .teacherName]
                      .hours[req
                              .body
                              .teacherClass]
                        .includes(req.body.teacherHour)) {
            renderPage(
              {
                errors: {
                  'teacherHourError' : 'Invalid hour chosen for class.'
                },
                teachers: _teachers
              },
              req,
              res
            );
          }
          else {
            // Save student
            Student.create(
              new Student(
                {
                  lastName      : req.body.studentLastName,
                  firstName     : req.body.studentFirstName,
                  teacher       : req.body.teacherName,
                  class         : req.body.teacherClass,
                  hour          : req.body.teacherHour,
                  comingFrom    : req.body.comingFrom,
                  studyHallRoom	: comingFromRoom,
                  helpedWith    : req.body.helpedWith,
                  helpedBy      : req.body.teacherThatHelped,
                  arcHour       : req.body.hourInArc,
                  comments      : req.body.comments
                }
              ),
              (err, resultantStudent) => {
                if (err)
                  throw err;

                STUDENTS[resultantStudent.id] = resultantStudent;
                util.log('Added ' +
                          resultantStudent.firstName +
                          ' ' +
                          resultantStudent.lastName
                        );

                // Add student to file
                studentFile.add(resultantStudent);

                // Save the check in
                Record.create(
                  new Record(
                    {
                      time: Date.now(),
                      student: resultantStudent
                    }
                  ),
                  (err, resultantRecord) => {
                    if (err)
                      throw err;

                    util.log('Successively saved check in to records.');
                  }
                );

                res.redirect('/');
              }
            );
          }
        }
      );
    }
    else {
      Teacher.find(
        {

        },
        (err, _teachers) => {
          let teachers = {};

          Object
            .keys(_teachers)
            .forEach(
              (key) => {
                teachers[_teachers[key].lastName] = _teachers[key];
              }
            );

          if (err)
            throw err;

            // Checks for valid data
          // Checking if the teacher chosen is a valid teacher
          if (typeof teachers[req
                                .body
                                .teacherName]
              === 'undefined') {
            renderPage(
              {
                errors: {
                  'teacherNameError' : 'Selected teacher does not exist.'
                },
                teachers: _teachers
              },
              req,
              res
            );
          }
          // Checking if class is valid
          else if (!teachers[req
                              .body
                              .teacherName]
                      .classes
                      .includes(req
                                  .body
                                  .teacherClass
                  )) {
            renderPage(
              {
                errors: {
                  'teacherClassError' : 'Invalid class chosen for teacher.'
                },
                teachers: _teachers
              },
              req,
              res
            );
          }
          // Checking if student chose a valid hour
          else if (typeof teachers[req
                                    .body
                                    .teacherName]
                            .hours[req
                                    .body
                                    .teacherClass]
                            .includes(
                              req
                                .body
                                .teacherHour
                            )
                    === 'undefined') {
            renderPage(
              {
                errors: {
                  'teacherHourError' : 'Invalid hour chosen for class.'
                },
                teachers: _teachers
              },
              req,
              res
            );
          }
          else {
            // Save student
            Student.create(
              new Student(
                {
                  lastName    : req.body.studentLastName,
                  firstName   : req.body.studentFirstName,
                  teacher     : req.body.teacherName,
                  class       : req.body.teacherClass,
                  hour        : req.body.teacherHour,
                  comingFrom  : req.body.comingFrom,
                  helpedWith  : req.body.helpedWith,
                  helpedBy    : req.body.teacherThatHelped,
                  arcHour     : req.body.hourInArc,
                  comments    : req.body.comments
                }
              ),
              (err, resultantStudent) => {
                if (err)
                  throw err;

               	// Updating real time students
                STUDENTS[resultantStudent.id] = resultantStudent;
                util.log('Added ' +
                          resultantStudent.firstName +
                          ' ' +
                          resultantStudent.lastName
                        );

                // Add student to file
                studentFile.add(resultantStudent);

                // Save the check in
                Record.create(
                  new Record(
                    {
                      time: Date.now(),
                      student: resultantStudent
                    }
                  ),
                  (err, resultantRecord) => {
                    if (err)
                      throw err;

                    util.log('Successively saved check in to records.');
                  }
                );

                res.redirect('/');
              }
            );
          }
        }
      );
    }
  }
});

// checkout
app.get('/checkout/:id', (req, res) => {
  // Find specific student
  Student.find(
    {
      id: req.params.id
    },
    (err, student) => {
      // Attempt to delete student
      try {
        if (err)
          throw err;

        // If the student exists in the user-presented students
        // and the student exists in the DB
        if (typeof STUDENTS[req.params.id] !== 'undefined'
            && typeof student !== 'undefined') {
          // Delete from user students
          delete STUDENTS[req.params.id];
          util.log(`Deleted student at id ${req.params.id}.`);
        }
        else
          throw new Error(`Invalid student id ${req.params.id}.`);
      }
      catch (err) {
        util.log(`Failed to remove student ${req.body.id}.`);
        util.log(`${err}`);
      }

      res.redirect('/');
    }
  );
});

// 404
app.use( (req, res) => {
    res.status(404);
    res.render(
      '404.ejs'
    );
});


// Beginning running the server and log it to console
app.listen(GLOBAL_PORT, (err) => {
  if (!err)
    util.log(`Server running on ${GLOBAL_PORT}.`);
  else
    throw new Error(err);
});