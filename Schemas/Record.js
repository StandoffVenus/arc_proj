let mongoose = require('mongoose'),
    Schema = mongoose.Schema,

    RecordSchema = new Schema(
      {
        time: Date,
        student: Object         
      }
    );

module.exports = mongoose.model('Record', RecordSchema);