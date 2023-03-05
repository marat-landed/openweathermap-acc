// 02-05-2022 Версия для МК NodeMCU
// 20-07-2022 Загрузка архива прогнозов на страницу Архив
// 15-02-2023 Усовершенствование создания таблиц

function plotArch(jsonValue) {
  var keys = Object.keys(jsonValue);
  for (var key = 0; key < keys.length; key++){
	var param = jsonValue[keys[key]];
	console.log(keys[key]);
	console.log(param);
	// Создаем интерфейсный элемент
	var parag = document.createElement('p');
	parag.innerText = "Архив " + keys[key];
	document.getElementById('div_table_archive').appendChild(parag);
	let table = document.createElement('table');
	let thead = document.createElement('thead');
	let tbody = document.createElement('tbody');
	table.classList.add("table_arch");
	table.appendChild(thead);
	table.appendChild(tbody);
	document.getElementById('div_table_archive').appendChild(table);
	// Цикл по дням для одного параметра
	param.slice().reverse().forEach((element, index) => {	
	  console.log(element);
	  // Строку превращаем в массив: один прогноз по одному параметру (дата и 8 значений)
	  const myArray = element.split(" ");
	  console.log(myArray);
	  let row = document.createElement('tr');
	  tbody.appendChild(row);
	  myArray.forEach((element2, index2) => {
		let td = document.createElement('td');
		td.innerHTML = element2;
		row.appendChild(td);
		// Если это время UTC, преобразуем в дату
		if (index2==0) {
		  var date = new Date(element2*1000);
		  var day = date.getDate();
		  var month = date.getMonth()+1;
		  var year = date.getFullYear();
		  //document.getElementById("forecast_date").textContent = day + '-' + month + '-' + year;
		  var today_utc_txt = day + '-' + month + '-' + year;
		  let td = document.createElement('td');
		  td.innerHTML = today_utc_txt;
		  row.appendChild(td);
		}
	  })
	})
  }
}