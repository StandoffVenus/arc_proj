let mongoose = require('mongoose'),
	Schema = mongoose.Schema,

	StudentSchema = new Schema({
		name: String,
		teacher: String,
		class: String,
		hour: Array,
		comingFrom: String,
		studyHallRoom: Number,
		helpedWith: Array,
		helpedBy: Array,
		arcHour: String
	});

module.exports = mongoose.model('Student', StudentSchema);