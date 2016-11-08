"use strict";

let setComment = (id) => {
  let xhr = new XMLHttpRequest();

  xhr.open('POST', '/setComment');
  xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

  let comment = document.getElementById(`comment${id}`).value;
  xhr.send(`id=${id}&comment=${comment}`);
}