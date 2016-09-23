/*
	Process:
		1. 	Boot up a persistent clock. Something like
				var globalClock = new Clock(DateTime.Now);
			Note: This step should only happen once when the computer starts so that time can be kept well.

		2. 	Look at today's schedule. Something like
				globalClock.Schedule = new Schedule(DateTime.Now);
			Note: Clock will handle this by either raising events and listening for them when the day changes by doing checks with 1 hours between or
				marking the time when the day will change and checking if it has entered that time yet.

		3. 	Look at DB to select classroom specific schedule.
				var studentsInClass = Student.Get.ExpectedIn(roomNumber);
				// Make this handle figuring out the hours when and such.
				// AttendenceHandler is supposed to listen for the events raised by
				// the global clock and check which students are supposed to be in the class
				// at the time the clock raises the ClassStart event. 
				attendenceHandler.AddStudents(studentsInClass);

		4.	Open browser on every ClassStart event.
				// Open default browser
				process.exec("chrome.exe", `localhost:${PORT}`);
				// These pathways will be served a page that has all the students that should be in the class

		5.	
*/
