let ALL_TEACHERS = [];

let Teacher = function(name, classes, hours, id) {
	this.name 		= name;
	this.classes 	= classes;
	this.hours 		= hours;
	this.id 			= id;
}

let addTeacher = (teacher) => {
	ALL_TEACHERS.push(teacher);
}

let buildTeachersBox = () => {
	let list = document.getElementById('yourTeacher');

	ALL_TEACHERS.forEach( (teacher, index) => {
		let item = document.createElement('li');
		let input = document.createElement('input');
		let label = document.createElement('label');

		label.setAttribute('for', `mathTeacher${index}`);
		label.innerHTML = teacher
												.name
													.substring(0, 1)
												.toUpperCase() +
											teacher
												.name
													.substring(1) +
											'&nbsp';

		input.type = 'radio';
		input.setAttribute('id', `mathTeacher${index}`);
		input.setAttribute('name', 'teacherId');
		input.setAttribute('value', teacher.id);

		input.addEventListener('click', () => {
			document
				.getElementById('yourTeacherClassesPlaceholder')
					.innerHTML = 'Choose class&nbsp';
			document
				.getElementById('yourTeacherHourPlaceholder')
					.innerHTML = 'Choose hour(s)&nbsp';

			updateClassChoice(index);
		});

		item.appendChild(input);
		item.appendChild(label);

		list.appendChild(item);
	})
}

let toggleStudyHallBox = (bool) => {
	if (bool)
		document
			.getElementById('studyhallBox')
				.style
			.display = 'inline-block';
	else
		document
			.getElementById('studyhallBox')
				.style
			.display = 'none';
}

let updateClassChoice = (index) => {
	let list = document.getElementById('yourTeacherClasses');
	list.innerHTML = '';

	ALL_TEACHERS[index].classes.forEach( (_class) => {
		let item = document.createElement('li');
		let input = document.createElement('input');
		let label = document.createElement('label');

		label.setAttribute('for', `class_${_class}`);
		label.innerHTML = _class;

		input.type = 'radio';
		input.setAttribute('id', `class_${_class}`);
		input.setAttribute('name', 'teacherClass');
		input.setAttribute('value', _class);

		input.addEventListener('click', () => {
			document.getElementById('yourTeacherHourPlaceholder').innerHTML = 'Choose hour(s)&nbsp';
			eliminateInvalidPeriods(ALL_TEACHERS[index].hours[_class])
		});

		item.appendChild(input);
		item.appendChild(label);

		list.appendChild(item);
	});
}

let eliminateInvalidPeriods = (hours) => {
	let list = document.getElementById('yourTeacherHour');
	list.innerHTML = '';

	hours.forEach( (hour) => {
		let item = document.createElement('li');
		let input = document.createElement('input');
		let label = document.createElement('label');

		label.setAttribute('for', `hour${hour}`);
		label.innerHTML = hour;

		input.type = 'radio';
		input.setAttribute('id', `hour${hour}`);
		input.setAttribute('name', 'teacherHour');
		input.setAttribute('value', hour);

		item.appendChild(input);
		item.appendChild(label);

		list.appendChild(item);
	});
}

let buildTeacherThatHelped = () => {
	let list = document.getElementById('arcTeacherThatHelped');

	ALL_TEACHERS.forEach( (teacher) => {
		let item = document.createElement('li');
		let input = document.createElement('input');
		let label = document.createElement('label');

		label.setAttribute('for', `teacherHelped${teacher.id}`);
		label.innerHTML = teacher.name;

		input.type = 'checkbox';
		input.setAttribute('id', `teacherHelped${teacher.id}`);
		input.setAttribute('name', 'teacherThatHelped');
		input.setAttribute('value', teacher.name);

		item.appendChild(input);
		item.appendChild(label);

		list.appendChild(item);
	})
}

$( () => {
	buildTeachersBox();
	buildTeacherThatHelped();
});