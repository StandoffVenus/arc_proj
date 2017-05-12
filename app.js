/* TODO:
	- Email teachers on checkout
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

    mongo             = require('mongodb'), 
    // This is the DB - it is a non-relation DB called MongoDB

    mongoose          = require('mongoose'), 
    // This is the ORM - makes mongo calls simpler for me

    express           = require('express'),
    // express is a framework to simplify Node's HTTP package

    Email             = require('./email.js'),
    // Wrapper class that lets us compose and send gmail emails more easily

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

    generateTeachers	= require('./teachers/generateTeachers.js'),
    updateTeachers = require('./teachers/updateTeachers.js'),
    // Scripts for command-line arguments

    Schema = mongoose.Schema,
    // Schema allows you to create models for mongoose and the DB you're using

    STUDENT_FILE_SETTINGS = {
    	"path" 	: path.join('S:', 'mhs', 'teachers'),
      "name"  : "/students",
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

    studentFileConstructor = require('./studentWriter.js'),
    // Writes to our student file for us
    // This is a constructor

    studentFile = new studentFileConstructor(
                    STUDENT_FILE_SETTINGS.path
                    + STUDENT_FILE_SETTINGS.name
                    + STUDENT_FILE_SETTINGS.ext
                  ),
    // Our actual student file

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

// Removing promise deprecation warning
mongoose.Promise = global.Promise;

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

							util.log('Succeeded in connecting to '
                        + mongoose.connection.host);
		      	}
		      );
		    },
		    5000
		  );
    }
    else
    	util.log(`Succeeded in connecting to ${mongoose.connection.host}.`);
  }
);

let db = mongoose.connection; // Initialize db with mongoose connection

// Try to connect locally instead incase of loss of connection
db.on(
	'error',
	(err) => {
    db.close();
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

            db = mongoose.connection;
			  	}
			  );
			},
			5000
		);
	}
);

// Getting all previously logged-in students
Student.find(
  {

  },
  (err, students) => {
    if (err) {
      util.log(`Encountered error when adding student(s).\n`);
      util.log(err);
    }
    else {
      async.each(
        students,
        (student, callback) => {
          STUDENTS[student.id] = student;
        },
        (err) => {
          if (err) {
            util.log(`Encountered error adding student(s).`);
            util.log(err);
          }
        }
      );
    }
  }
);

let email = new Email(
  `${__dirname}/credentials/client_secret.json`,
  `${__dirname}/credentials/gmail-nodejs-quickstart.json`,
  (err) => {
    if (err)
      throw err;
  }
);


			
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
  util.log(`Request to ${req.url} via ${req.method.toUpperCase()}\n`);
  next();
});

// Redirect from 'localhost' or 'localhost/' to index page
app.get('/', (req, res) => {
  res.redirect('/index');
});

// Index page
app.get('/index', (req, res) => {
  Student.find(
    {

    },
    (err, students) => {
      if (err) {
        util.log('Encountered an error when loading students.');
        util.log(err);

        renderPage(
          {
            students: []
          },
          req,
          res
        );
      }

      renderPage(
        {
          students: students,
        },
        req,
        res
      );
    }
  )
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
	
      }
    ).sort(
      {
	time: -1
      }
    ).exec(
      (err, entries) => {
        if (err) {
          util.log(`Encountered an error when indexing with ${schemaName} schema.`);
          res.redirect('/collections/show');
        }
        else {
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
      if (err) {
        util.log('Encountered error when looking for teachers.');
        util.log(err);
        res.redirect('/');
      }
      else {
        renderPage(
          {
            teachers: teachers
          },
          req,
          res
        );
      }
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
    .checkBody('teacherId', 'No teacher was chosen.')
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
          if (err)
            throw err;

          let teachers = {};

          _teachers.forEach(
            (teacher, index) => {
              teachers[teacher.id] = index;
            }
          );

            // Checks for valid data
          // Checking if the teacher chosen is a valid teacher
          if (typeof teachers[req.body.teacherId] === 'undefined') {
            renderPage(
              {
                errors: {
                  'teacherIdError' : 'Selected teacher does not exist.'
                },
                teachers: teachers
              },
              req,
              res
            );
          }
          // Checking if class is valid
          else if (!_teachers[
                      teachers[req.body.teacherId]
                    ]
                      .classes
                      .includes(req.body.teacherClass)) {
            renderPage(
              {
                errors: {
                  'teacherClassError' : 'Invalid class chosen for teacher.'
                },
                teachers: teachers
              },
              req,
              res
            );
          }
          // Checking if student chose a valid hour
          else if (!_teachers[
                      teachers[req.body.teacherId]
                    ]
                      .hours[req
                              .body
                              .teacherClass]
                        .includes(req.body.teacherHour)) {
            renderPage(
              {
                errors: {
                  'teacherHourError' : 'Invalid hour chosen for class.'
                },
                teachers: teachers
              },
              req,
              res
            );
          }
          else {
            console.log(req.body);

            // Save student
            Student.create(
              new Student(
                {
                  lastName      : req.body.studentLastName,
                  firstName     : req.body.studentFirstName,
                  teacherId     : req.body.teacherId,
                  class         : req.body.teacherClass,
                  hour          : req.body.teacherHour,
                  comingFrom    : req.body.comingFrom,
                  studyHallRoom	: comingFromRoom,
                  helpedWith    : req.body.helpedWith,
                  helpedBy      : req.body.teacherThatHelped,
                  arcHour       : req.body.hourInArc,
                  comments      : ''
                }
              ),
              (err, resultantStudent) => {
                if (err)
                  throw err;

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
          if (err)
            throw err;

          let teachers = {};

          _teachers.forEach(
            (teacher, index) => {
              teachers[teacher.id] = index;
            }
          );

            // Checks for valid data
          // Checking if the teacher chosen is a valid teacher
          if (typeof teachers[req.body.teacherId] === 'undefined') {
            renderPage(
              {
                errors: {
                  'teacherIdError' : 'Selected teacher does not exist.'
                },
                teachers: teachers
              },
              req,
              res
            );
          }
          // Checking if class is valid
          else if (!_teachers[
                      teachers[req.body.teacherId]
                    ]
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
                teachers: teachers
              },
              req,
              res
            );
          }
          // Checking if student chose a valid hour
          else if (typeof _teachers[
                            teachers[req.body.teacherId]
                          ]
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
                teachers: teachers
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
                  teacherId   : req.body.teacherId,
                  class       : req.body.teacherClass,
                  hour        : req.body.teacherHour,
                  comingFrom  : req.body.comingFrom,
                  helpedWith  : req.body.helpedWith,
                  helpedBy    : req.body.teacherThatHelped,
                  arcHour     : req.body.hourInArc,
                  comments    : ''
                }
              ),
              (err, resultantStudent) => {
                console.log(req.body);

                if (err)
                  throw err;

               	// Updating real time students
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

// setComment - POST
app.post('/setComment', (req, res) => {
  // Comment and student id
  let comment = req.body.comment,
      id      = req.body.id;

  // Don't run anything but redirect if empty POST body
  if (comment === '' || id === '') {
    res.redirect('/');
  }

  Student.findById(
    id,
    (err, student) => {
      if (err) {
        util.log('Encountered error finding student.');
        util.log(err);
        res.redirect('/');
      }

      student.comments = comment;

      student.save(
        (err, updateStudent) => {
          if (err) {
            util.log(`There was an error saving student ${id}.`);
            util.log(err);
          }

          res.redirect('/');
        }
      );
    }
  );
});

// checkout - POST
app.post('/checkout', (req, res) => {
  // Find specific student
  Student.findById(
    req.body.id,
    (err, student) => {
      // Attempt to delete student
      try {
        if (err)
          throw err;

        // Remove students from the DB
        Student.remove(
          {
            _id: req.body.id
          },
          (err) => {
            if (err) {
              util.log(`Error removing student ${req.body.id}.`);
              throw err;
            }
			
            Teacher.findById(
              student.teacherId,
              (err, teacher) => {
				if (err)
				  throw err;
					
                // Create and send an email under this email
                email.create(
                  teacher.email,
                  `${student.firstName} ${student.lastName} in MHS ARC`,
                  `${(student.comments !== '') ? '"' + student.comments + '"' : ''} ~${student.helpedBy}`,
                  (err, response) => {
                    if (err)
                      throw err;
						
                    email.send(
                      response.id,
                      (err, response) => {
                        if (err)
                          throw err;
                      }
                    );
                  }
                );
              }
            );
          }
        );
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