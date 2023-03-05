// 02-05-2022 Версия для МК NodeMCU
// 16-02-2023 Данные и LittleFS
var chartT, // 'chart-temperature'
    chartClPr; // 'chart-clouds-precipitation'
function plot_last_forecast(archive) {
  // Из архива всех прогнозов необходимо сформировать запись вида:
  // {"today_utc": 1676538000,"temp_max":[23,23,23,23,23,23,23,23],"temp_min":[12,12,12,23,23,23,23,23],
  //  "pressure"...,"clouds"...,"precipitation"...,"wind_speed"...,"wind_direct"...,"weather_icon_num"...}
  let last_forecast = {};
  
  console.log("archive:");
  console.log(archive);
  
  var keys = Object.keys(archive);
  for (var key = 0; key < keys.length; key++){
	var param = archive[keys[key]];
	console.log("typeof param:");
	console.log(typeof param);
	console.log("param:");
	console.log(param);
	//console.log(keys[key]);
	//console.log(param[0]);
	// param[i] - строка прогноза вида: 1676538000 -4 -3 2 2 0 2 2 4
	// Прогнозы идут в порядке: самый старый,..., самый новый.
	const myArray = param[param.length-1].split(" ");
	console.log("myArray:");
	console.log(myArray);
	last_forecast[keys[key]]=[];
	myArray.forEach((element, index) => {
	  if ((key==0) && (index==0)) last_forecast["today_utc"] = element;
	  let val = Number(element);
      if ((keys[key]=="precipitation") || (keys[key]=="wind_speed"))
		val = val/100.;
      if (index>0) last_forecast[keys[key]].push(val);	  
	})
  }
  //console.log("last_forecast:");
  //console.log(last_forecast);
  plotChart(last_forecast);
}

//Plot temperature in the temperature chart
function plotChart(jsonValue) {
  //console.log(jsonValue);	
  var keys = Object.keys(jsonValue);
  //console.log("jsonValue.temp_max:",jsonValue.temp_max); // [7, 8, 13, 17, 13, 14, 12, 10]
  //console.log("jsonValue.today_utc:",jsonValue.today_utc); // ['2022-04-04T09:00:00.000Z', ..., '2022-04-11T09:00:00.000Z']
  //console.log("keys:",keys); // keys: Array(3) [ "today_utc", "temp_max", "temp_min" ]
  
  // Преобразуем ко времени 00 часов
  var pointStart_curr = parseInt(jsonValue.today_utc/86400)*86400000;
  //console.log("pointStart_curr:",pointStart_curr); // 1649808000000
  var date = new Date(jsonValue.today_utc*1000);
  var day = date.getDate();
  var month = date.getMonth()+1;
  var year = date.getFullYear();
  document.getElementById("forecast_date").textContent = day + '-' + month + '-' + year;
  
  create_chart_temp('chart-temperature');
  create_chart_clouds_precipitation('chart-clouds-precipitation');
  
  var data = [];
  // 0: 'today_utc', 1: 'temp_max', 2: 'temp_min', 3: 'pressure', 4: 'clouds', 5: 'precipitation',
  // 6: 'wind-speed', 7: 'wind-direct', 8: 'weather_icon_num'
  //for (var key = 1; key < 8; key++){
  for (var key = 0; key < keys.length; key++){
	if (keys[key]=="today_utc") continue;
	if ((keys[key]=="wind_speed") || (keys[key]=="wind_direct")) {
	  var param = jsonValue["wind_speed"]; // wind_speed
	  var param1 = jsonValue["wind_direct"]; // wind_direct
	} else if (keys[key]=="clouds") {
	  var param = jsonValue["clouds"]; // clouds
	  var param1 = jsonValue["weather_icon_num"]; // weather_icon_num
	} else {
	  var param = jsonValue[keys[key]];
	}
	param.forEach((element, index) => {
	  if ((keys[key]=="wind_speed") || (keys[key]=="wind_direct")) { // ветер: сорость (м/с) и направление
	    data.push([param[index], param1[index]]);
	  }
	  else if (keys[key]=="clouds") {
		var y1 = param[index]; 
		var weather_icon_str = icon_num_to_str(param1[index]);
		var marker1 = {
		  fillColor: 'red',
          radius: 5,
          //symbol: 'url(http://openweathermap.org/img/wn/10d.png)'
		  symbol: 'url(http://openweathermap.org/img/w/' + weather_icon_str + '.png)'
        };
		var serie1 =  {
		  y: y1,         
		  marker: marker1
        };
		data.push(serie1);
	  }	else {
		data.push(param[index]);  
	  }
	});
				
	if (keys[key]=="temp_max") { // temp_max
	  chartT.series[1].update({
	    pointStart: pointStart_curr,
		data: data //data.data
	  })	
	} else if (keys[key]=="temp_min") { // temp_min
	  chartT.series[2].update({
		pointStart: pointStart_curr,
		data: data //data.data
	  })	
	} else if (keys[key]=="pressure") { // pressure
	  chartT.series[0].update({
		pointStart: pointStart_curr,
		data: data //data.data
	  })
	} else if (keys[key]=="clouds") { // clouds
	  chartClPr.series[1].update({
		pointStart: pointStart_curr,
		data: data //data.data
	  })
	} else if (keys[key]=="precipitation") { // precipitation
	  chartClPr.series[0].update({
		pointStart: pointStart_curr,
		data: data //data.data
	  })
	} else if (keys[key]=="wind_speed") {
	  chartT.series[3].update({
		pointStart: pointStart_curr,
		data: data //data.data
	  })
	} else if (keys[key]=="wind_direct") {
	  chartT.series[4].update({
		pointStart: pointStart_curr,
		data: data //data.data
	  })
	}
	data = [];
  }
  chartT.yAxis[0].setExtremes(chartT.yAxis[0].dataMin, chartT.yAxis[0].dataMax);
}

var langWindDir = new Array("N", "NNE", "NE", "ENE","E", "ESE", "SE", "SSE","S", "SSW", "SW", "WSW","W", "WNW", "NW", "NNW", "N");
function windDirLang ($winddir){
  return langWindDir[Math.floor(((parseInt($winddir,10) + 11.25) / 22.5))];
}
function hexToRgb(hex) {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}
// Create Temperature Chart
function create_chart_temp(renderTo) {
  chartT = new Highcharts.chart(renderTo,{	
    //chart: {
    //  type: 'spline',
    //  inverted: false
	//},
	title: {
	  //text: "Temperature",
	  text: 'Температура, давление, ветер'
	  //align: 'left'
	},
	time: {
	  //useUTC: false, //timezone: 'Europe/Helsinki'
	},
	plotOptions: {
        series: {
            pointInterval: 24 * 3600 * 1000 // one day
        }
    },
	legend: {
      layout: "horizontal",
      align: "left",
      useHTML: true,
      maxHeight: 60,
      labelFormatter: function () {
        let color = hexToRgb(this.color);
        if (!this.visible) {
          color = { r: 204, g: 204, b: 204 };
        }
        var symbol = `<span class="chartSymbol" style="background: rgba(${color.r},${color.g},${color.b},0.1) 0% 0% no-repeat padding-box;border: 4px solid rgba(${color.r},${color.g},${color.b},.5);"></span>`;
        return `${symbol} ${this.name}`;
      },
    },
	series: [
	  {
		name: 'Давление',
		type: 'column',
		pointInterval: 86400000,
		yAxis: 0,
		tooltip: {
            valueSuffix: ' гПа',
        },
		//color: '#CCCCCC',
		color: 'rgba(0, 0, 0, 0.10)',
		borderColor: '#000000',
		marker: {
		  symbol: 'circle',
		  radius: 3,
		  fillColor: '#CCCCCC',
		},
		dataLabels: {
          enabled: true,
          style: {
            color: 'black',
            textOutline: 'none',
            fontWeight: 'normal',
          },
		},
	  },
	  {
		name: 'Tmax',
		type: 'line',
		pointInterval: 24 * 3600 * 1000, // one day
		yAxis: 1,
		color: '#FF0000',//Highcharts.getOptions().colors[3], //'#FF0000',
		marker: {
		  symbol: 'circle',
		  radius: 3,
		  fillColor: '#FF0000'//'#FF0000',
		},
		dataLabels: {
          enabled: true,
          style: {
            color: '#FF0000',
            textOutline: 'none',
            fontWeight: 'normal',
          },
		},
		tooltip: {
			//valueDecimals: 2,
			valueSuffix: ' °C'
		}
	  },
	  {
		name: 'Tmin',
		type: 'line',
		pointInterval: 86400000,
		yAxis: 1,
		color: '#0000FF', //Highcharts.getOptions().colors[0], //'#0000FF',
		marker: {
		  symbol: 'circle',
		  radius: 3,
		  fillColor: '#0000FF' //'#0000FF',
		},
		dataLabels: {
          enabled: true,
          style: {
            color: '#0000FF',
            textOutline: 'none',
            fontWeight: 'normal',
          },
		},
		tooltip: {
          valueSuffix: ' °C',
        }
	  },
	  {
		name: 'Направление ветра',
        type: 'windbarb',
		//onSeries: 'wind-speed',
        color: '#007F0E',
		pointInterval: 86400000,
        //showInLegend: false,
		tooltip: {
    	  pointFormatter: function() {
			return '<span style="color:' + this.color + '">● </span>' + 'Скорость ветра: <b>' + Highcharts.numberFormat(this.value, 1) + ' м/с</b> (' + this.beaufort + ')<br/>'
		  }
        },
		dataLabels: {
          enabled: true,
          style: {
            color: '#007F0E',
            textOutline: 'none',
            fontWeight: 'normal',
          }
		}
      },
	  { 
	    name: 'Скорость ветра',
        type: 'line',
		keys: ['y', 'rotation'],
		yAxis: 2,
        id: 'wind-speed',
        color: '#007F0E',
		pointInterval: 86400000,
		marker: {
		  symbol: 'circle',
		  radius: 3,
		  fillColor: '#007F0E'
		},
        tooltip: {
            valueSuffix: ' м/с',
			valueDecimals: 1,
			pointFormatter: function() {
			  return '<span style="color:' + this.color + '">● </span>' + 'Направление ветра: <b>' + this.rotation + '° (' + windDirLang(this.rotation) + ')</b>'
		  }
        },
		dataLabels: {
          enabled: true,
          style: {
            color: '#007F0E',
            textOutline: 'none',
            fontWeight: 'normal',
          },
		  formatter: function () {
			return Highcharts.numberFormat(this.y,1);
		  }
		}
      }
	],
	xAxis: {
	  type: 'datetime',
	  dateTimeLabelFormats: { day: '%d.%m' },
	  gridLineWidth: 1,
	},
	yAxis: [
	  { // Primary yAxis
	    title: {
          text: 'Давление, гПа',
          style: {
            color: Highcharts.getOptions().colors[1]
          }
        },
        labels: {
          //format: '{value}°C',
          style: {
            color: Highcharts.getOptions().colors[1]
          }
        },
		alignTicks: true,
        //tickInterval: 15,
		//opposite: true,
		visible: false,
		
      },
	  {
	    title: {
		  text: 'Температура, °C'
	    },
	    alignTicks: false,
        tickInterval: 5,
	  },
      {
	    title: {
          text: 'Скорость, м/с',
          style: {
            color: Highcharts.getOptions().colors[7]
          }
        },
        labels: {
          style: {
            color: Highcharts.getOptions().colors[7]
          }
        },
		min: 0,
		alignTicks: false,
		visible: false
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
	  //positioner: function () {
      //  return { x: 80, y: 50 };
      //},
      shadow: true,
      borderWidth: 0,
      backgroundColor: 'rgba(255,255,255,0.8)'
    }
  });
}

// Create Clouds - Precipitation
function create_chart_clouds_precipitation(renderTo) {
  chartClPr = new Highcharts.chart(renderTo,{	
    chart: {
      type: 'spline',
      inverted: false,
	},
	title: {
	  text: "Облачность, осадки",
	  //align: 'left'
	},
	series: [
	  {
		name: 'Осадки (дождь/снег)',
		type: 'column',
		yAxis: 0,
		pointInterval: 86400000,
		color: '#68CFE8',
		tooltip: {
            valueSuffix: ' мм',
			//valueDecimals: 1,
        },
		marker: {
		  symbol: 'circle',
		  radius: 3,
		  color: '#68CFE8',
		},
		dataLabels: {
          enabled: true,
          filter: {
            operator: '>',
            property: 'y',
            value: 0
          },
          style: {
            color: 'black',
            textOutline: 'none',
            fontWeight: 'normal',
          },
		  formatter: function () {
			return Highcharts.numberFormat(this.y,1);
		  }
		}
	  },
	  {
		name: 'Облачность',
		type: 'line',
		yAxis: 1,
		pointInterval: 86400000,
		color: Highcharts.getOptions().colors[0],//'#B200FF',
		tooltip: {
            valueSuffix: ' %',
        },
		marker: {
		  symbol: 'circle',
		  radius: 3,
		  fillColor: Highcharts.getOptions().colors[0]//'#B200FF',
		},
	  },
	],
	xAxis: {
	  type: 'datetime',
	  dateTimeLabelFormats: { day: '%d.%m' },
	  gridLineWidth: 1,
	},
	yAxis: [
	  { // Primary yAxis
	    title: {
            text: 'Осадки (дождь/снег), мм',
            style: {
                color: Highcharts.getOptions().colors[7]
            }
        },
        labels: {
            //format: '{value} mm',
            style: {
                color: Highcharts.getOptions().colors[7]
            }
        },
		min: 0,
		alignTicks: false,
        opposite: true,
		visible: false
      },
	  { // Secondary yAxis
	    title: {
          text: 'Облачность, %'
        },
		style: {
            color: Highcharts.getOptions().colors[1]
        },
		max: 100,
		min: 0,
		alignTicks: false,
        tickInterval: 20,
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
    }
  });
}

// Create Wind Chart
function create_chart_wind(renderTo) {
  chartW = new Highcharts.chart(renderTo,{	
    title: {
      text: 'Ветер'
    },
    xAxis: {
	  type: 'datetime',
	  dateTimeLabelFormats: { day: '%d.%m' },
	  gridLineWidth: 1,
	},
	yAxis: {
	    title: {
          text: 'Скорость, м/с',
          style: {
            color: Highcharts.getOptions().colors[7]
          }
        },
        labels: {
          style: {
            color: Highcharts.getOptions().colors[7]
          }
        },
		min: 0,
		alignTicks: false
    },
	tooltip: {
      valueSuffix: ' м/с'
    },
    series: [{
        type: 'line',
		keys: ['y', 'rotation'],
		name: 'Скорость ветра',
        id: 'wind-speed',
        color: Highcharts.getOptions().colors[0],
		pointInterval: 86400000,
		marker: {
		  symbol: 'circle',
		  radius: 3,
		  fillColor: Highcharts.getOptions().colors[0]
		},
        tooltip: {
            valueSuffix: ' м/с',
			pointFormatter(){
			  return this.series.name + ": " + this.y + " m/s " + this.rotation + " °"
			}
        }
    }, {
        type: 'windbarb',
		//keys: ['y', 'rotation'],
        onSeries: 'wind-speed',
        name: 'Направление ветра',
		color: Highcharts.getOptions().colors[1],
		pointInterval: 86400000,
        //showInLegend: false,
		//tooltip: {
    	  //pointFormatter(){
      	    //return this.series.name + ": " + this.y
          //}
        //}
    }],
	plotOptions: {
	  spline: {
		marker: {
		  enable: false
		}
	  }
	},
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
      //shared: true
    }
  });
}

function icon_num_to_str(icon_num) {
  var icon_str;
  switch (icon_num) {
  case 1:
    icon_str = "01d";
    break;
  case 2:
    icon_str = "02d";
    break;
  case 3:
    icon_str = "03d";
    break;
  case 4:
    icon_str = "04d";
    break;
  case 9:
    icon_str = "09d";
    break;
  case 10:
    icon_str = "10d";
    break;
  case 13:
    icon_str = "13d";
	break;
  case 50:
    icon_str = "50d";
  }
  return icon_str;
}