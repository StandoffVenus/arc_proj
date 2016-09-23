let mongoose = require('mongoose');
let Schema = mongoose.Schema;

let TeacherSchema = new Schema({
	lastName: String,
	classes: Array,
	hours: Array,
	gender: Number,
	email: String,
	homeroom: Number,
	extension: Number
});

module.exports = mongoose.model('Teacher', TeacherSchema);