	// Packages and variable declaration
let mongo = require('mongodb'), // This is the DB - it is a non-relation DB called MongoDB
	mongoose = require('mongoose'), // This is the ORM - makes mongo calls simpler for me
	express = require('express'), // Express is a framework to simplify Node's HTTP package
	util = require('util'), // util is a built-in package with better logging time stamps and such
	child_process = require('child_process'), // child_process is a built-in package made for spinning off children of a main process
	file_system = require('fs'), // fs is a built-in package that allows to do many different things with the filesystem
	body_parser = require('body-parser'), // body-parser is a parser that makes POST's and such decrypted for us
	ejs = require('ejs'), // ejs allows us to create dynamic web pages from the server side
	validator = require('express-validator'), // express-validator will allow us easy validation of POST data
	flash = require('connect-flash'), // Flash allows us to keep messages in our locals so we can present them across pages
	session = require('express-session'), // Flash requires sessions to be kept across pages

	Schema = mongoose.Schema, // Schema allows you to create models for mongoose and the DB you're using

	// All the actions we will allow on our collections 
	COLLECTION_ACTIONS = {
		"edit": 1,
		"delete": 1,
		"add": 1
	},

	GLOBAL_PORT = 3000, // Global port to communicate with localhost on

	STUDENTS = [], // Students checked in

	// Spinning off a child process to open up Mongo for communication
	mongoShell = child_process.exec('mongod', // Start the Mongo connection application
		{
			// Relocate to the folder containing mongod.exe
			cwd: 'C:/Program Files/MongoDB/Server/3.2/bin/'
		}
	);

mongoose.connect('mongodb://localhost/app'); // Connecting to the DB in mongoose
let db = mongoose.connection; // Initialize a variable with said connection

db.on('error', (err) => {
	mongoose.disconnect();
	mongoose.connect('mongodb://localhost/app');
});

let Student = require('./Schemas/Student.js'), 	// Student schema
	Teacher = require('./Schemas/Teacher.js'); 	// Teacher schema

// Getting all previously logged-in students
Student.find(
	{

	},
	(err, students) => {
		if (err)
			throw err;

		STUDENTS = students;

		// After we grab all the students, clear the DB for later
		students.forEach( (student) => {
			student.remove();
		});
	}
);

let app = express(); // Creating the "server" object


	// This sets up our "view engine." Express uses something called a view engine
	// to handle dynamically rendering pages (hence, why there is a method called
	// response.render) and here we are setting it a simple engine I use called ejs.
	// The setting of "views" is just to tell Express to look in the "views" directory
	// for all the views (that's what webpages are more accurately called in MVC design)
app.set('view engine', 'ejs');
app.set('views', 'views');


	// This section is called middleware - if you don't know what that is
	// you can read about it here: https://expressjs.com/en/guide/using-middleware.html
// This serves our public folder without having to specify in our ejs
app.use('/static', express.static(__dirname + '/public'));

// This parses and validates POST's for us
app.use(body_parser.json( { extended: true } ));
app.use(body_parser.urlencoded( { extended: true } ));
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

// Adding sessions
app.use(session({
	secret: 'ahwzXmEAShpD9BZlRIQz',
	saveUninitialized: true,
	resave: true
}));

// Adding flash messaging
app.use(flash());

	// This section is also technically middleware, but it will handle the pages in my own manner.
	// You'll see me use redefinitions a lot, but in JSON passed to our views. This is because our
	// views exist in somewhat different contexts from our main thread, and thus don't know about
	// all the packages and what not that we're using without being passed references to them.

// This method will do res.render with the template page so I don't have to repeat myself
let renderPage = (model, req, res) => {
	if (typeof model.errors === 'undefined')
		model.errors = {};

	// Redirects for a forced url
	if (typeof model.forcedUrl !== 'undefined' && model.forcedUrl !== req.originalUrl)
		res.redirect(model.forcedUrl);

	// Checks to see if a specific page should be sent over the requested url
	if (typeof model.page === 'undefined')
		model.page = process.cwd() + '\\views' + req.path;
	else
		model.page = process.cwd() + '\\views' + model.page;

	// Render 'template.ejs' with our new model.
	res.render('template', model);
}

// For every single page
app.use('*', (req, res, next) => {
	// After every request, we will check if flash has a message for us to display
	res.locals.success_msg = req.flash('success_msg');
	res.locals.error_msg = req.flash('error_msg');
	res.locals.error = req.flash('error');

	// This logs all requests a user makes
	util.log(`Request to ${req.path} via ${req.method.toUpperCase()}`);
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
			students: STUDENTS
		},
		req,
		res
	);
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

app.post('/checkin', (req, res) => {
	req.checkBody('studentName', 'The name field is required.').notEmpty();
	req.checkBody('teacherName', 'No teacher was chosen.').notEmpty();
	req.checkBody('')
	req.check()

	if (req.validationErrors()) {
		Teacher.find(
			{

			},
			(err, teachers) => {
				if (err)
					throw err;

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
		res.redirect('/');
		req.flash('success_msg', `Successfully logged ${req.body.name} in.`);
	}
});

// All teachers
app.get('/teachers', (req, res) => {
	// Look for all the entries in the teachers collection
	Teacher.find( 
		{
			
		}, 
		(err, teachers) => {
			if (err)
				throw err;

			renderPage(
				{
					teachers: teachers,
					// This gets all the fields of Teacher schema
					teacherPaths: Object.keys(
						Teacher.schema.obj
					)
				},
				req,
				res
			);
		}
	);
});

app.get('/teachers/:action', (req, res) => {
	// Look for the specific teacher
	Teacher.find(
	{
		_id: req.params.id
	},
	(err, teacher) => {
		if (err || teacher === null)
			res.redirect('/404');

		renderPage(
			{
				teachers: teacher,
				// Gets the fields of Teacher schema
				teacherPaths: Object.keys(
					Teacher.schema.obj
				)
			},
			req,
			res
		)
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

// Windows doesn't support any exit signals, but this works well enough
// On some crash-worthy error
process.once('unhandledException', (exception) => {
	util.log('\t[EXCEPTION]\n\n' + exception);

	// Close the program - will raise an async event, too, because of process.on('exit')'s listener
	util.log('Encountered exception. Saving checked-in students...');
	process.exit(0);
});


// On an exit
process.once('exit', () => {
	// Save students that are checked-in
	STUDENTS.forEach( (student, index) => {
		student.save( (err) => {
			if (err)
				util.log(`Error saving student (${student.name}):\n\n${err}`);

			if (index + 1 === STUDENTS.length)
				// Close the program
				process.exit(0);
		});
	});
});

// On a console exit (Ctrl + C, which is known a "SIGINT")
process.once('SIGINT', () => {
	// Save students that are checked-in
	STUDENTS.forEach( (student) => {
		student.save( (err) => {
			if (err)
				util.log(`Error saving student (${student.name}):\n\n${err}`);
		});
	});
});