let toggleStudyHallBox = (bool) => {
	if (bool)
		document.getElementById('studyhallBox').style.display = 'inline-block';
	else
		document.getElementById('studyhallBox').style.display = 'none';
}