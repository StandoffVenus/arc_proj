sendAttendenceConfirm = () => {
	let confirmed = confirm('Are you sure you want to send attendence? Doing so will clear all records.');

	if (confirmed)
		window.location = "/sendattendence";
}