let mongoose = require('mongoose'),
	Schema = mongoose.Schema,
	
	TeacherSchema = new Schema({
		lastName: String,
		classes: Array,
		hours: Object,
		email: String,
		homeroom: Number,
		extension: Number
	});

module.exports = mongoose.model('Teacher', TeacherSchema);