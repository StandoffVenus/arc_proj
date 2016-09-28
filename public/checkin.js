let ALL_TEACHERS = [];

let Teacher = function(name, classes, hours) {
	this.name = name;
	this.classes = classes;
	this.hours = hours;
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
		label.innerHTML = teacher.name.substring(0, 1).toUpperCase() + teacher.name.substring(1) + '&nbsp';

		input.type = 'radio';
		input.setAttribute('id', `mathTeacher${index}`);
		input.setAttribute('name', 'teacherName');
		input.setAttribute('value', teacher.name);

		input.addEventListener('click', () => {
			updateClassChoice(index);
		});

		item.appendChild(input);
		item.appendChild(label);

		list.appendChild(item);
	})
}

let toggleStudyHallBox = (bool) => {
	if (bool)
		document.getElementById('studyhallBox').style.display = 'inline-block';
	else
		document.getElementById('studyhallBox').style.display = 'none';
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
			eliminateInvalidPeriods(ALL_TEACHERS[index].hours[_class])
		});

		item.appendChild(input);
		item.appendChild(label);

		list.appendChild(item);
	});
}

let eliminateInvalidPeriods = (hours) => {
	document.getElementById('yourTeacherHourPlaceholder').innerHTML = 'Choose hour&nbsp<span class="caret"></span>';
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
		input.setAttribute('name', 'hour');
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

		label.setAttribute('for', `teacherHelped${teacher.name}`);
		label.innerHTML = teacher.name;

		input.type = 'radio';
		input.setAttribute('id', `teacherHelped${teacher.name}`);
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