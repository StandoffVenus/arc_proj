let file_system = require('fs'),

StudentWriter = function(filePath) {
  this.path = filePath;

  this.write = (student) => {
    file_system.writeFile(
      this.path,
      `STUDENT NAME\t|\tHOUR\t|\tHELPED WITH\r\n\r\n`,
      (err) => {
        if (err) {
          // This is an actual error
          throw err;
        }
      }
    );

    // If rewriting with a student
    if (student) {
      file_system.appendFile(
        this.path,
        `${student.lastName}, ${student.firstName}\t|\t` 
          + `${student.arcHour}\t|\t`
          + (student.comingFrom !== 'studyhall')
            ? student.comingFrom
            : student.comingFromHour
          + '\r\n',
        (err) => {
          if (err) {
            // This is an actual error as well
            throw err;
          }
        }
      );
    }
  }

  // Check if we are going to overwrite a file that exists
  // This is done so we don't do overwrites if the application fails somehow
  file_system.stat(
    this.path,
    (err) => {
      // Assuming that the error means the file does not exist
      if (err) {
        this.write();
      }
    }
  );

  this.add = (student) => {
    file_system.appendFile(
      this.path,
      `${student.lastName}, ${student.firstName}\t|\t` 
          + `${student.arcHour}\t|\t`
          + (student.comingFrom !== 'studyhall')
            ? student.comingFrom
            : student.comingFromHour
          + '\r\n',
      (err) => {
        if (err) {
          // Assume file doesn't exist
          this.write(student);
        }
      }
    )
  };

  // Check if we should rewrite the file.
  file_system.stat(
    this.path,
    (err, stats) => {
      if (err) {
        // Assume file doesn't exist
        this.write();
      }
      else {
        // Checking if it's been 12 hours since last modification
        if (Date.now() > 
            (new Date(stats.mtime)).getTime() + 1000 * 60 * 60 * 12) {
          this.write();
        }
      }
    }
  )
}

module.exports = StudentWriter;