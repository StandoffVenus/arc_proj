"use strict";

	// Packages and variable declaration
let mongo = require('mongodb'); // This is the DB - it is a non-relation DB called MongoDB
let mongoose = require('mongoose'); // This is the ORM - makes mongo calls simpler for me
let express = require('express'); // Express is a framework to simplify Node's HTTP package
let util = require('util'); // util is a built-in package with better logging time stamps and such
let child_process = require('child_process'); // child_process is a package made for spinning off children of a main process
let body_parser = require('body-parser'); // body-parser is a parser that makes POST's and such decrypted for us
let ejs = require('ejs'); // ejs allows us to create dynamic web pages from the server side

let Schema = mongoose.Schema; // Schema allows you to create models for mongoose and the DB you're using

let GLOBAL_PORT = 3000; // Global port to communicate with localhost on

// Spinning off a child process to open up mongo for communication
let mongoShell = child_process.exec(
	// Start the Mongo connection application
	'mongod',
	{
		cwd: 'C:/Program Files/MongoDB/Server/3.2/bin/'
	}
);

mongoose.connect('mongodb://localhost/app'); // Connecting to the DB in mongoose
let db = mongoose.connection; // Grab said connection

let Teacher = require('./Schemas/Teacher.js'); // Requiring a model I already created called teacher

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

// This parses POST's for us
app.use(body_parser.json( { extended: true } ));
app.use(body_parser.urlencoded( { extended: true } ));


	// This section is also technically middleware, but it will handle the pages in my own manner.
	// You'll see me use redefinitions a lot, but in JSON passed to our views. This is because our
	// views exist in somewhat different contexts from our main thread, and thus don't know about
	// all the packages and what not that we're using without being passed references to them.

// The index page, aka, "localhost" or "localhost/"
app.get('/', (req, res, next) => {
	Teacher.find( (err, teachers) => {
		res.render('index', 
			{
				teachers: teachers
			}
		)
	})
});


	// Beginning running the server and log it to console
app.listen(GLOBAL_PORT, (err) => {
	if (!err)
		util.log(`Server running on ${GLOBAL_PORT}.`);
	else
		throw new Error(err);
});