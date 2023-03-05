// 02-05-2022 Версия для МК NodeMCU
// 20-07-2022 Загрузка архива прогнозов на страницу Архив
//var chartT, // 'chart-temperature'
//    chartClPr; // 'chart-clouds-precipitation'
function print_error_statistics(error_statistics) {
  //var statistics = last_statistics[0]; // Массив last_statistics имеет один единственный элемент
  //plotChart(statistics);
  plotError(error_statistics);
}

//Plot temperature in the temperature chart
function plotError(jsonValue) {
	return;
  //console.log(jsonValue);	
  var keys = Object.keys(jsonValue);
  //console.log("jsonValue.temp_max:",jsonValue.temp_max); // [7, 8, 13, 17, 13, 14, 12, 10]
  //console.log("jsonValue.today_utc:",jsonValue.today_utc); // ['2022-04-04T09:00:00.000Z', ..., '2022-04-11T09:00:00.000Z']
  //console.log("keys:",keys); // keys: Array(3) [ "today_utc", "temp_max", "temp_min" ]
  
  var data = [];
  // 0: 'today_utc', 1: 'temp_max', 2: 'temp_min', 3: 'pressure', 4: 'clouds', 5: 'precipitation',
  // 6: 'wind-speed', 7: 'wind-direct', 8: 'weather_icon_num'
  for (var key = 0; key < 1; key++){
	//console.log(key,keys[key]);
		//var date = jsonValue[keys[1]];
		// param, param1 - массивы 0..7
		//var param = jsonValue[keys[8]]; // wind_speed
		var param = jsonValue[keys[key]];
		//console.log("param:",param); // массив 14 строк х 11 столбцов (7 дней для tmin и 7 дней для tmax)
		// Таблица  распредеения ошибок
		let table = document.createElement('table');
		let thead = document.createElement('thead');
		let tbody = document.createElement('tbody');
		table.classList.add("table_err");
		table.appendChild(thead);
		table.appendChild(tbody);
		document.getElementById('div_table_statistic').appendChild(table);
		// Creating and adding data to first row of the table
		let row_1 = document.createElement('tr');
		let heading_1 = document.createElement('th');
		heading_1.innerHTML = "Day";
		let heading_2 = document.createElement('th');
		heading_2.innerHTML = "0";
		let heading_3 = document.createElement('th');
		heading_3.innerHTML = "1";
		let heading_4 = document.createElement('th');
		heading_4.innerHTML = "2";
		let heading_5 = document.createElement('th');
		heading_5.innerHTML = "3";
		let heading_6 = document.createElement('th');
		heading_6.innerHTML = "4";
		let heading_7 = document.createElement('th');
		heading_7.innerHTML = "5";
		let heading_8 = document.createElement('th');
		heading_8.innerHTML = "6";
		let heading_9 = document.createElement('th');
		heading_9.innerHTML = "7";
		let heading_10 = document.createElement('th');
		heading_10.innerHTML = "8";
		let heading_11 = document.createElement('th');
		heading_11.innerHTML = "9";
		let heading_12 = document.createElement('th');
		heading_12.innerHTML = "10";
		
		row_1.appendChild(heading_1);
		row_1.appendChild(heading_2);
		row_1.appendChild(heading_3);
		row_1.appendChild(heading_4);
		row_1.appendChild(heading_5);
		row_1.appendChild(heading_6);
		row_1.appendChild(heading_7);
		row_1.appendChild(heading_8);
		row_1.appendChild(heading_9);
		row_1.appendChild(heading_10);
		row_1.appendChild(heading_11);
		row_1.appendChild(heading_12);
		thead.appendChild(row_1);
		
		param.forEach((element, index) => {
          //console.log(element);
		  let row_2 = document.createElement('tr');
		  let row_2_data_1 = document.createElement('td');
		  if (index < 7) row_2_data_1.innerHTML = index;
		  else row_2_data_1.innerHTML = index-7;
		  row_2.appendChild(row_2_data_1);
		  element.forEach((element2, index2) => {
		    let row_2_data_1 = document.createElement('td');
		    row_2_data_1.innerHTML = element2;
		    row_2.appendChild(row_2_data_1);
		  })
		  tbody.appendChild(row_2);
		});
  }
}

var chartEr_mean, // 'chart-mean-error'
    chartEr_distr; // 'chart-distribution-errors'
var error_statistics_mem = [];

function print_error_statistics_graph(error_statistics) {
  // 28-9-2022
  // error_statistics:
  // Array(14) Каждый элемент массива - массив из 11 эл-тов.
  // [0]: количество ошибок прогноза tmin на один день в 0 градусов, в 1 градус,..., в 10 и более градусов.
  // [1]: количество ошибок прогноза tmin на два дня в 0 градусов, в 1 градус,..., в 10 и более градусов.
  // [13]: количество ошибок прогноза tmax на 7 днней в 0 градусов, в 1 градус,..., в 10 и более градусов.
  // Вычисляем средние значения ошибок
  var data_min = [], data_max = [];
  error_statistics.forEach((element, index) => {
	// element - это массив из 11 эл-тов, каждый из которых есть количество ошибок в 0,1,2,...,10 градусов
	var sum = 0; // сумма произведений (количество ошибок х величину ошибок)
	var sum2 = 0; // сумма количества ошибок (количества измерений)
	element.forEach((element2, index2) => {
	  // element2 - это количество ошибок в index2 градусов 
	  sum+= element2*index2;
	  sum2+= element2;
    })
	let mean_error = sum/sum2;
	//console.log(index, ": ", mean_error);
	if (index<=6) data_min.push(mean_error);
	else data_max.push(mean_error);
	if (index==0)
	  document.getElementById("stat_day").textContent = sum2;
  })
  
  // График средней ошибки по дням прогноза
  create_chart_error_mean('chart-mean-error');
  chartEr_mean.series[0].update({
    data: data_min //data.data
  })
  chartEr_mean.series[1].update({
    data: data_max //data.data
  })
  
  // График распределения ошибок по дням прогноза
  create_chart_error_distr('chart-distribution-errors');
  
  error_statistics_mem = error_statistics.map(elem => elem);
  // Копируем одну строку error_statistics_mem в одномерый массив
  var error_statistics_row = copy_one_row(error_statistics_mem,0);
  // Распределение ошибок tmin
  chartEr_distr.series[0].update({
    data: error_statistics_row
  })
  error_statistics_row = copy_one_row(error_statistics_mem,7);
  // Распределение ошибок tmax
  chartEr_distr.series[1].update({
    data: error_statistics_row
  })
}

function create_chart_error_mean(renderTo) {
  chartEr_mean = new Highcharts.chart(renderTo,{	
	title: {
	  text: 'Средняя ошибка прогноза температуры'
	},
	plotOptions: {
      series: {
            pointStart: 1
      }  
    },
	series: [
	  {
		name: 'Tmin',
		type: 'line',
		tooltip: {
          valueDecimals: 2,
        },
		color: Highcharts.getOptions().colors[0],
		marker: {
		  symbol: 'circle',
		  radius: 3,
		  fillColor: Highcharts.getOptions().colors[0]
		},
		dataLabels: {
          enabled: true,
		  format: '{point.y:.1f}',
          style: {
            color: 'black',
            textOutline: 'none',
            fontWeight: 'normal',
          },
		}
	  },
	  {
		name: 'Tmax',
		type: 'line',
		tooltip: {
          valueDecimals: 2,
        },
		color: Highcharts.getOptions().colors[3], //'#FF0000',
		marker: {
		  symbol: 'circle',
		  radius: 3,
		  fillColor: Highcharts.getOptions().colors[3]//'#FF0000',
		},
		dataLabels: {
          enabled: true,
		  format: '{point.y:.1f}',
          style: {
            color: 'black',
            textOutline: 'none',
            fontWeight: 'normal',
          },
		}
	  }
	],
	xAxis: {
	  title: {
		text: 'Глубина прогноза, дней'
	  },
	  gridLineWidth: 1,
	},
	yAxis: [
	  {
	    title: {
		  text: 'Средняя ошибка, °C'
	    },
	    alignTicks: false,
        tickInterval: 1,
	  }
	 ],
	credits: {
	  enabled: false
	},
	legend: {
	  itemStyle: {
	    fontWeight: 'normal'
	  }
    },
	tooltip: {
      xDateFormat: '%d-%m-%Y',
      shared: true,
	  crosshairs: true,
	  shadow: true,
      borderWidth: 0,
      backgroundColor: 'rgba(255,255,255,0.8)'
    }
  });
}

function create_chart_error_distr(renderTo) {
  chartEr_distr = new Highcharts.chart(renderTo,{	
	title: {
	  text: 'Распределение ошибок прогноза температуры'
	},
	plotOptions: {
        
    },
	series: [
	  {
		name: 'Tmin',
		type: 'line',
		color: Highcharts.getOptions().colors[0],
		marker: {
		  symbol: 'circle',
		  radius: 3,
		  fillColor: Highcharts.getOptions().colors[0],
		},
		tooltip: {
          //  valueSuffix: ' hPa',
        },
		dataLabels: {
          enabled: true,
          style: {
            color: 'black',
            textOutline: 'none',
            fontWeight: 'normal',
          },
		}
	  },
	  {
		name: 'Tmax',
		type: 'line',
		color: Highcharts.getOptions().colors[3],
		marker: {
		  symbol: 'circle',
		  radius: 3,
		  fillColor: Highcharts.getOptions().colors[3]
		},
		tooltip: {
			//valueDecimals: 2,
			//valueSuffix: ' °C'
		},
		dataLabels: {
          enabled: true,
          style: {
            color: 'black',
            textOutline: 'none',
            fontWeight: 'normal',
          },
		}
	  }
	],
	xAxis: {
	  title: {
          text: 'Ошибка, °C',
          style: {
            color: Highcharts.getOptions().colors[1]
          }
        },
	  gridLineWidth: 1,
	},
	yAxis: [
	  { 
	    title: {
          text: 'Количество ошибок',
          style: {
            color: Highcharts.getOptions().colors[1]
          }
        },
        labels: {
          style: {
            color: Highcharts.getOptions().colors[1]
          }
        },
		alignTicks: true,
      }
	 ],
	credits: {
	  enabled: false
	},
	plotOptions: {
	  spline: {
		marker: {
		  enable: false
		}
	  }
	},
	legend: {
	  itemStyle: {
	    fontWeight: 'normal'
	  }
    },
	tooltip: {
      xDateFormat: '%d-%m-%Y',
      shared: true,
	  crosshairs: true,
	  shadow: true,
      borderWidth: 0,
      backgroundColor: 'rgba(255,255,255,0.8)'
    }
  });
}

function day_forecastRadio(value) {
  var value_int = parseInt(value);
  //console.log(value_int);
  //console.log(error_statistics_mem);
  
  var error_statistics_row = copy_one_row(error_statistics_mem,value_int-1);
  //console.log(error_statistics_row);
  chartEr_distr.series[0].setData(error_statistics_row);
  
  error_statistics_row = copy_one_row(error_statistics_mem,value_int+6);
  //console.log(error_statistics_row);
  chartEr_distr.series[1].setData(error_statistics_row);
}

function copy_one_row(arr,row_num) {
  let row1 = [];
  arr[row_num].forEach(elem => {
    row1.push(elem)
  })
  return row1;
}