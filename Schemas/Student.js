let mongoose = require('mongoose'),
	Schema = mongoose.Schema,

	StudentSchema = new Schema({
		name: String,
		teacher: String,
		class: String,
		hours: Array,
		comingFrom: String,
		helpedWith: Array,
		helpedBy: String,
		arcHour: String
	});

module.exports = mongoose.model('Student', StudentSchema);