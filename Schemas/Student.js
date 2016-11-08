let mongoose = require('mongoose'),
	Schema = mongoose.Schema,

	StudentSchema = new Schema(
		{
			lastName: String,
			firstName: String,
			teacherId: String,
			class: String,
			hour: Array,
			comingFrom: String,
			studyHallRoom: Number,
			helpedWith: Array,
			helpedBy: Array,
			arcHour: String,
			comments: String,
		}
	);

module.exports = mongoose.model('Student', StudentSchema);