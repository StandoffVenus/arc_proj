	// Packages and variable declaration
let mongo = require('mongodb'); // This is the DB - it is a non-relation DB called MongoDB
let mongoose = require('mongoose'); // This is the ORM - makes mongo calls simpler for me
let express = require('express'); // Express is a framework to simplify Node's HTTP package
let util = require('util'); // util is a built-in package with better logging time stamps and such
let child_process = require('child_process'); // child_process is a built-in package made for spinning off children of a main process
let file_system = require('fs'); // fs is a built-in package that allows to do many different things with the filesystem
let body_parser = require('body-parser'); // body-parser is a parser that makes POST's and such decrypted for us
let ejs = require('ejs'); // ejs allows us to create dynamic web pages from the server side

let Schema = mongoose.Schema; // Schema allows you to create models for mongoose and the DB you're using

let GLOBAL_PORT = 3000; // Global port to communicate with localhost on

// Spinning off a child process to open up Mongo for communication
let mongoShell = child_process.exec('mongod', // Start the Mongo connection application
	{
		// Relocate to the folder containing mongod.exe
		cwd: 'C:/Program Files/MongoDB/Server/3.2/bin/'
	}
);

mongoose.connect('mongodb://localhost/app'); // Connecting to the DB in mongoose
let db = mongoose.connection; // Initialize a variable with said connection

db.on('error', (err) => {
	util.log(err.substring(0, err.toString().indexOf('\n')));
});

let Teacher = require('./Schemas/Teacher.js'); // Requiring a model I already created called teacher

let app = express(); // Creating the "server" object

// This serves files that don't need to be worried about (our css and what not)
app.use(express.static('./public'));

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

// This method will do res.render with the template page so I don't have to repeat myself
let renderPage = (model, req, res) => {
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

// Redirect from 'localhost' or 'localhost/' to index page
app.get('/', (req, res) => {
	res.redirect('/index');
});

// The index page
app.get('/index', (req, res) => {
	// Look for all the entries in the teachers collection
	Teacher.find( 
		{
			
		}, 
		(err, teachers) => {
			// Present the user with all of our teachers
			renderPage(
				{
					teachers: teachers,
					// This gets all the fields of a model/schema
					teacherPaths: Object.keys(
						mongoose.model(
							'Teacher'
						).schema.paths
					)
				},
				req,
				res
			);
		}
	);
});

app.get('/alter', (req, res) => {
	res.redirect('/alter/show');
});

// The alter page
app.get('/alter/:collection', (req, res, next) => {
	// The client is looking for the base page
	if (req.params.collection === 'show') {
		// Send them the base page (since the url is succeeded by 'show'
		// our application will attempt to serve them 'show.ejs'; we don't 
		// have that view, so we serve them 'alter.ejs' instead)
		renderPage(
			{
				collections: db.collections,
				page: '/alter'
			},
			req,
			res
		);
	}
	// The client is looking for a collection and we have it
	else if (typeof db.collections[req.params.collection] !== 'undefined') {
		// There should be an s at the end of the collection name in the DB,
		// thus, we cut of the s and capitalize the first letter, and we
		// should have our model/schema.
		let collection = mongoose.model(
									req
									  .params
									  .collection
									  .substring(0, 1)
									  .toUpperCase()
									  +
									req
									  .params
									  .collection
									  .substring(1, req.params.collection.length - 1)
									  .toLowerCase()
								);

		// Send them the collection, but use alter.ejs for the view since we
		// don't want to have a specific page built for every collection.
		// Too much work! Lets be a lazy, efficient programmer rather than
		// a meticulous, anti-user-input-for-collections-and-DB one.

		// If they requested a specific entry
		if (typeof req.query.id !== 'undefined') {
			// id has to be 12 bytes
			if (Buffer.byteLength(req.query.id, 'utf8') !== 12)
				res.redirect('/404');

			collection.find( 
				{
					'_id': mongo.ObjectId(req.query.id)
				},
				(err, entries) => {
					renderPage(
						{
							collection: db.collections[req.params.collection],
							collectionEntries: entries,
							collectionPaths: Object.keys(
								collection.schema.paths
							),
							page: '/alter'
						},
						req,
						res
					);
				}
			);
		}
		else {
			collection.find( (err, entries) => {
				renderPage(
					{
						collection: db.collections[req.params.collection],
						collectionEntries: entries,
						collectionPaths: Object.keys(
							collection.schema.paths
						),
						page: '/alter'
					},
					req,
					res
				);
			});
		}
	}
	// We can't find the collection the client is looking for, so... 404.
	else {
		res.redirect('/404');
	}
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