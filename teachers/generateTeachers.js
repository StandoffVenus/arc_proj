const mongoose 		= require('mongoose'),
			Teacher 		= require('../Schemas/Teacher.js'),
    	file_system = require('fs'),
    	path 				= require('path'),
    	util 				= require('util'),
    	json_file 	= require('jsonfile');

module.exports = () => {

Teacher.find(
	{

	},
	(err, teachers) => {
		teachers.forEach( (teacher) => {
			util.log(`Teacher: ${teacher.lastName}`);
			json_file.writeFile(
				// Creating file names
				// Result: name.id.json
				path.join(
					'teachers',
					'/',
					teacher
						.lastName
						.toLowerCase() +
					'.' +
					teacher
					 	._id
					 	.toString() +
					'.json'
				),
				// Writing our teacher object to the file
				teacher,
				// Spacing for readability
				{
					spaces: 2
				},
				(err) => {
					if (err)
						throw err;
				}
			)
		})
	}
);

}