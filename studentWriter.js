let file_system = require('fs'),

StudentWriter = function(filePath) {
  this.path = filePath;

  // Writes file
  // Kept local - no one needs to do straight writes to the system
  let write = (student) => {
    file_system.writeFile(
      this.path,
      `STUDENT NAME\t|\tHOUR\t|\tHELPED WITH\r\n\r\n`
      + (
        // Checking whether to write a student to the file
        (student) ?

          `${student.lastName}, ${student.firstName}\t|\t` 
          + `${student.arcHour}\t|\t`
          + ((student.comingFrom !== 'studyhall')
            ? student.comingFrom
            : student.studyHallRoom)
          + '\r\n'

        : ''
      ),
      (err) => {
        if (err) {
          // This is an actual error
          throw err;
        }
      }
    );
  }

  // Check if we are going to overwrite a file that exists
  // This is done so we don't do overwrites if the application fails somehow
  file_system.stat(
    this.path,
    (err) => {
      // Assuming that the error means the file does not exist
      if (err) {
        write();
      }
    }
  );

  // Does writes instead of appends because of the fact
  // that chmod only lets us append if we are the owner or
  // root user (which we aren't on this school's Linux server)
  this.add = (student) => {
    file_system.readFile(
      this.path,
      (err, data) => {
        if (err) {
          write(student); // Assume file doesn't exist
        }
        else {
          let studentsBuffer = Buffer.concat(
            [
              Buffer.from(
                `${student.lastName}, ${student.firstName}\t|\t` 
                + `${student.arcHour}\t|\t`
                + ((student.comingFrom !== 'studyhall')
                  ? student.comingFrom
                  : student.studyHallRoom)
                + '\r\n'),
              Buffer.from(data)
            ]
          );

          file_system.writeFile(
            this.path,
            studentsBuffer,
            (err) => {
              if (err)
                // Actual error
                throw err;
            }
          );
        }
      }
    );
  }

  // Make local function to check for need to rewrite
  let checkRewrite = () => {
    file_system.stat(
      this.path,
      (err, stats) => {
        if (err) {
          // Assume file doesn't exist
          write();
        }
        else {
          // Checking if it's been 12 hours since last modification
          if (Date.now() > 
              (new Date(stats.mtime)).getTime() + 1000 * 60 * 60 * 12) {
            write();
          }
        }
      }
    )
  }

  // Check need to rewrite on construction
  checkRewrite();

  // Set interval to check for rewrites every 6 hours
  setInterval(
    () => {
      checkRewrite();
    },
    1000 * 60 * 60 * 6
  );
}

module.exports = StudentWriter;
