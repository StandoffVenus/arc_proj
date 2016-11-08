const mongoose 	= require('mongoose'),
			Teacher 	= require('../Schemas/Teacher.js'),
			file_system = require('fs'),
			path 		= require('path'),
			async 		= require('async'),
			json_file 	= require('jsonfile'),
			util 		= require('util'),

			// The dir we're going to write to
			TEACHER_DIR	= path.join(__dirname, '/');

module.exports = (force) => {

Teacher.find(
	(err, teachers) => {
		if (err)
			throw err;
		
		// Read all the teachers in this directory
		file_system.readdir(
			TEACHER_DIR,
			(err, files) => {
				// Run an async loop on them all
				async.forEachOf(
					files, // Files array,
					(file, index, callback) => {
						// If it is a .json file
						if (path.extname(file) === '.json') {
							file_system.readFile(
								path.join(TEACHER_DIR, file),
								(err, data) => {
									util.log(`Reading file '${file}'`);
									
									if (err)
										throw err;

									try {
										// Attempt to parse file
										var teacherJSON = JSON.parse(data);
									}
									catch (err) {
										util.log(`Error reading ${file}...\n`);
										throw err;
									}

									if (!force
											&& teacherJSON._id) {

										// Look for requested teacher by id
										Teacher.findById(
											teacherJSON._id,
											(err, teacher) => {
												// If this teacher actually exists
												if (typeof teacher !== 'null') {
													// Query
													Teacher.update(
														{
															_id : teacherJSON._id
														},
														// JSON to update with
														teacherJSON,
														(err, resultantTeacher) => {
															util.log(`Updating entry ${teacher.lastName}`);	
															if (err)
																throw err;
														}
													);
												}
												else
													util.log(`${teacherJSON._id} doesn't exist.`);
											}
										);
									}
									else {
										// Save new teacher
										Teacher.create(
											new Teacher(teacherJSON),
											(err, resultantTeacher) => {
												if (err)
													throw err;

												// Resulting file name.id.json
												util.log('Writing ' +
																	teacherJSON
																		.lastName
																		.toLowerCase() +
																	'.' +
																	resultantTeacher._id +
																	'.json');

												// Writing the new JSON into our file
												json_file.writeFile(
													// Writing to our directory each teacher
													path.join(TEACHER_DIR, file),
													// Specifying our JSON is indented by two
													// spaces for readable output.
													resultantTeacher,
													{
														spaces: 2
													},
													(err) => {
														if (err)
															throw err;

														file_system.rename(
															path.join(TEACHER_DIR, file),
															TEACHER_DIR +
																teacherJSON
																	.lastName
																	.toLowerCase() +
																'.' +
																resultantTeacher._id +
																'.json'
														);
													}
												);
											}
										);
									}
								}
							);
						}
					}
				);
			}
		);
	}
);

}