// 02-05-2022 Версия для МК NodeMCU
// 16-02-2023 Данные и LittleFS
var chartT, // 'chart-temperature'
    chartWC, //'div-chart-weather-clouds'
	chartHPP, // 'div-chart-humid-pop-precip'
	chartPW; // 'div-chart-wind-press'
	
function plot_last_forecast(archive) {
  // Из архива всех прогнозов необходимо сформировать запись вида:
  // {"today_utc": 1676538000,"temp_max":[23,23,23,23,23,23,23,23],"temp_min":[12,12,12,23,23,23,23,23],
  //  "pressure"...,"clouds"...,"precipitation"...,"wind_speed"...,"wind_direct"...,"weather_icon_num"...}
  
  /* Получаем объект вида:
  "forecast/clouds": "1678093200 30.00 76.00 100.00 100.00 100.00 36.00 100.00 52.00"
​  "forecast/humidity": "1678093200 35.00 69.00 76.00 68.00 85.00 35.00 57.00 46.00"
​  "forecast/pop": "1678093200 0.20 0.34 0.91 0.59 1.00 0.00 1.00 0.99"
​  "forecast/pressure": "1678093200 1007.00 1010.00 1010.00 1003.00 1002.00 1010.00 1001.00 1014.00"
​  "forecast/temp/max": "1678093200 3.62 5.22 10.82 14.04 8.30 8.66 8.70 7.37"
​  "forecast/temp/min": "1678093200 -1.09 -0.75 0.41 6.27 0.35 -0.61 3.14 1.09"
​  "forecast/weather/icon": "1678093200 10d 10d 10d 10d 10d 10d 10d 10d 10d 10d 03d 03d 13d 13d 13d 13d"
​  "forecast/wind_deg": "1678093200 263.00 185.00 197.00 226.00 301.00 195.00 206.00 286.00"
​  "forecast/wind_speed": "1678093200 5.17 5.67 6.30 6.97 6.66 8.27 7.16 4.94"
  */

  let last_forecast = {};
  
  //console.log("archive:",archive);
  
  var keys = Object.keys(archive);
  for (var key = 0; key < keys.length; key++){
	var param = archive[keys[key]];
	//console.log("typeof param:", typeof param);
	//console.log("param:", param);
	//console.log(keys[key]);
	//console.log(param[0]);
	// param - строка прогноза вида: 1676538000 -4 -3 2 2 0 2 2 4
	const myArray = param.split(" "); // [ "1678093200", "-1.09", "-0.75", "0.41", "6.27", "0.35", "-0.61", "3.14", "1.09" ]
	//console.log("myArray:", myArray);
	last_forecast[keys[key]]=[];
	myArray.forEach((element, index) => {
	  if ((key==0) && (index==0)) last_forecast["today_utc"] = element;
	  let val;
	  if (keys[key]=="forecast/weather/icon") val = element; 
	  else val = Number(element);
      //if ((keys[key]=="precipitation") || (keys[key]=="wind_speed")) val = val/100.;
      if (index>0) last_forecast[keys[key]].push(val);	  
	})
  }
  console.log("last_forecast:",last_forecast);
  /*
  Object { "forecast/temp/min": (8) […], today_utc: "1678093200", "forecast/temp/max": (8) […], "forecast/pressure": (8) […], "forecast/humidity": (8) […], "forecast/wind_speed": (8) […], "forecast/wind_deg": (8) […], "forecast/clouds": (8) […], "forecast/pop": (8) […], "forecast/weather/icon": (16) […] }
​	"forecast/clouds": Array(8) [ 30, 76, 100, … ]
​	"forecast/humidity": Array(8) [ 35, 69, 76, … ]
​	"forecast/pop": Array(8) [ 0.2, 0.34, 0.91, … ]
​	"forecast/pressure": Array(8) [ 1007, 1010, 1010, … ]
​	"forecast/temp/max": Array(8) [ 3.62, 5.22, 10.82, … ]
​	"forecast/temp/min": Array(8) [ -1.09, -0.75, 0.41, … ]
​	"forecast/weather/icon": Array(16) [ NaN, NaN, NaN, … ]
​	"forecast/wind_deg": Array(8) [ 263, 185, 197, … ]
​	"forecast/wind_speed": Array(8) [ 5.17, 5.67, 6.3, … ]
​	today_utc: "1678093200"
  */
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
  
  create_chart_temp('div-chart-temperature'); // chartT: 'div-chart-temperature'
  create_chart_weather_clouds('div-chart-weather-clouds'); // chartWC: 'div-chart-weather-clouds'
  create_chart_humid_pop_precip('div-chart-humid-pop-precip'); // chartHPP: 'div-chart-humid-pop-precip'
  create_chart_press_wind('div-chart-wind-press'); // chartWP: 'div-chart-wind-press'
  
  var data = [];
  // 0: 'today_utc', 1: 'temp_max', 2: 'temp_min', 3: 'pressure', 4: 'clouds', 5: 'precipitation',
  // 6: 'wind-speed', 7: 'wind-direct', 8: 'weather_icon_num'
  //for (var key = 1; key < 8; key++){
  for (var key = 0; key < keys.length; key++){
	if (keys[key]=="today_utc") continue;
	if ((keys[key]=="forecast/wind_speed") || (keys[key]=="forecast/wind_deg")) {
	  var param = jsonValue["forecast/wind_speed"]; // wind_speed
	  var param1 = jsonValue["forecast/wind_deg"]; // wind_direct
	} else if (keys[key]=="forecast/clouds") {
	  var param = jsonValue["forecast/clouds"]; // clouds
	  var param1 = jsonValue["forecast/weather/icon"]; // weather_icon_num
	} else {
	  var param = jsonValue[keys[key]];
	}
	param.forEach((element, index) => {
	  if ((keys[key]=="forecast/wind_speed") || (keys[key]=="forecast/wind_deg")) { // ветер: сорость (м/с) и направление
	    data.push([param[index], param1[index]]);
	  }
	  else if (keys[key]=="forecast/clouds") {
		var y = param[index]; 
		var weather_icon_str = param1[index];
		var marker = {
		  symbol: 'url(https://openweathermap.org/img/w/' + weather_icon_str + '.png)'
        };
		var serie1 =  {
		  y: y,         
		  marker: marker
        };
		data.push(serie1);
	  }	else {
		data.push(param[index]);  
	  }
	});
				
	if (keys[key]=="forecast/temp/max") { // temp_max
	  chartT.series[0].update({
	    pointStart: pointStart_curr,
		data: data //data.data
	  })	
	} else if (keys[key]=="forecast/temp/min") { // temp_min
	  chartT.series[1].update({
		pointStart: pointStart_curr,
		data: data //data.data
	  })	
	} 
	else if (keys[key]=="forecast/pressure") { // pressure
	  chartPW.series[0].update({
		pointStart: pointStart_curr,
		data: data //data.data
	  })
	}
	else if (keys[key]=="forecast/wind_speed") { // forecast/wind_speed
	  chartPW.series[1].update({
		pointStart: pointStart_curr,
		data: data //data.data
	  })
	} else if (keys[key]=="forecast/wind_deg") { // forecast/wind_deg
	  chartPW.series[2].update({
		pointStart: pointStart_curr,
		data: data //data.data
	  })
	}
	else if (keys[key]=="forecast/clouds") { // clouds
	  chartWC.series[0].update({
		pointStart: pointStart_curr,
		data: data //data.data
	  })
	} 
	else if (keys[key]=="forecast/pop") { // forecast/pop
	  chartHPP.series[0].update({
		pointStart: pointStart_curr,
		data: data //data.data
	  })
	}
	else if (keys[key]=="forecast/rain") { // forecast/rain
	  chartHPP.series[1].update({
		pointStart: pointStart_curr,
		data: data //data.data
	  })
	}
	else if (keys[key]=="forecast/snow") { // forecast/snow
	  chartHPP.series[2].update({
		pointStart: pointStart_curr,
		data: data //data.data
	  })
	}
	else if (keys[key]=="forecast/humidity") { // forecast/humidity
	  chartHPP.series[3].update({
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
	  text: 'Температура'
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
		name: 'Tmax',
		type: 'line',
		pointInterval: 24 * 3600 * 1000, // one day
		yAxis: 0,
		color: Highcharts.getOptions().colors[8],//'#FF0000',//Highcharts.getOptions().colors[3], //'#FF0000',
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
            fontWeight: 'normal'
          },
		  formatter: function () {
			return Highcharts.numberFormat(this.y,1);
		  }
		},
		tooltip: {
			//valueDecimals: 2,
			valueSuffix: ' °C'
			// pointFormat: 'Value: {point.y:.2f} mm' // Выводит 2 знака после запятой при наведении мыши: Value: 106.40 mm
		}
	  },
	  {
		name: 'Tmin',
		type: 'line',
		pointInterval: 86400000,
		yAxis: 0,
		color: Highcharts.getOptions().colors[4], //'#0000FF', //Highcharts.getOptions().colors[0], //'#0000FF',
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
		  formatter: function () {
			return Highcharts.numberFormat(this.y,1);
		  }
		},
		tooltip: {
          valueSuffix: ' °C',
        }
	  }
	],
	xAxis: {
	  type: 'datetime',
	  dateTimeLabelFormats: { day: '%d.%m' },
	  gridLineWidth: 1,
	},
	yAxis: [
	  {
	    title: {
		  text: 'Температура, °C'
	    },
	    alignTicks: false,
        tickInterval: 5,
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

// Create Weather - Clouds
function create_chart_weather_clouds(renderTo) {
  chartWC = new Highcharts.chart(renderTo,{	
    chart: {
      type: 'spline',
      inverted: false,
	},
	title: {
	  text: "Погода и облачность",
	  //align: 'left'
	},
	series: [
	  {
		name: 'Облачность',
		type: 'line',
		yAxis: 0,
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
		dataLabels: {
          enabled: true,
          style: {
            color: Highcharts.getOptions().colors[1],
            textOutline: 'none',
            fontWeight: 'normal',
          },
		  formatter: function () {
			return Highcharts.numberFormat(this.y,0);
		  }
		}
	  },
	],
	xAxis: {
	  type: 'datetime',
	  dateTimeLabelFormats: { day: '%d.%m' },
	  gridLineWidth: 1,
	},
	yAxis: [
	  { 
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

// Create Humidity - Pop - Precipitation
function create_chart_humid_pop_precip(renderTo) {
  chartHPP = new Highcharts.chart(renderTo,{
    title: {
	  text: "Вероятность осадков, количество осадков, влажность",
	  //align: 'left'
	},	  
    chart: {
      type: 'spline',
      inverted: false,
	},
	xAxis: {
	  type: 'datetime',
	  dateTimeLabelFormats: { day: '%d.%m' },
	  gridLineWidth: 1,
	},
	yAxis: [
	  { // 1 yAxis
	    title: {
          text: 'Вероятность, влажность, %'
        },
		style: {
            color: Highcharts.getOptions().colors[1]
        },
		max: 100,
		min: 0,
		alignTicks: false,
        tickInterval: 20,
      },
	  { // 2 Primary yAxis
	    title: {
            text: 'Осадки, мм',
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
	  },
	  column: {
		stacking: 'normal',  
        pointPlacement: 'on'
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
    },
	series: [
	  {
		name: 'Вероятность осадков',
		type: 'line',
		yAxis: 0,
		pointInterval: 86400000,
		color: Highcharts.getOptions().colors[5],//'#B200FF',
		tooltip: {
            valueSuffix: ' %',
        },
		marker: {
		  symbol: 'circle',
		  radius: 3,
		  fillColor: Highcharts.getOptions().colors[5]//'#B200FF',
		},
		dataLabels: {
          enabled: true,
          //filter: {
          //  operator: '>',
          //  property: 'y',
          //  value: 0
          //},
          style: {
            color: Highcharts.getOptions().colors[5],
            textOutline: 'none',
            fontWeight: 'normal',
          },
		  formatter: function () {
			return Highcharts.numberFormat(this.y,0);
		  }
		}
	  },
	  {
		name: 'Дождь',
		type: 'column', //'column', 'line'
		yAxis: 1,
		pointInterval: 86400000,
		color: Highcharts.getOptions().colors[2],
		stack: 'precipitation',
		tooltip: {
            valueSuffix: ' мм',
			//valueDecimals: 1,
        },
		marker: {
		  symbol: 'circle',
		  radius: 3,
		  color: Highcharts.getOptions().colors[2],
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
		name: 'Снег',
		type: 'column', //'column', 'line'
		yAxis: 1,
		pointInterval: 86400000,
		color: Highcharts.getOptions().colors[4],
		stack: 'precipitation',
		tooltip: {
            valueSuffix: ' мм',
			//valueDecimals: 1,
        },
		marker: {
		  symbol: 'circle',
		  radius: 3,
		  color: Highcharts.getOptions().colors[4],
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
		name: 'Влажность',
		type: 'line',
		yAxis: 0,
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
		dataLabels: {
          enabled: true,
          //filter: {
          //  operator: '>',
          //  property: 'y',
          //  value: 0
          //},
          style: {
            color: Highcharts.getOptions().colors[0],
            textOutline: 'none',
            fontWeight: 'normal',
          },
		  formatter: function () {
			return Highcharts.numberFormat(this.y,0);
		  }
		}
	  }
	]
  });
}

// Create Pressure - Wind Chart
function create_chart_press_wind(renderTo) {
  chartPW = new Highcharts.chart(renderTo,{	
	title: {
	  text: 'Давление, ветер'
	},
	time: {
	  //useUTC: false, //timezone: 'Europe/Helsinki'
	},
	plotOptions: {
	  spline: {
		marker: {
		  enable: false
		}
	  },
	  column: {
        pointPlacement: 'on'
      },
	  windbarb: {
        pointPlacement: 'on'
      }
    },
	legend: {
		/*
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
	  */
	  itemStyle: {
	    fontWeight: 'normal'
	  }
    },
	xAxis: {
	  type: 'datetime',
	  dateTimeLabelFormats: { day: '%d.%m' },
	  gridLineWidth: 1,
	},
	yAxis: [
	  { // 2 yAxis
	    title: {
          text: 'Скорость ветра, м/с',
          style: {
            color: Highcharts.getOptions().colors[1]
          }
        },
        labels: {
          style: {
            color: Highcharts.getOptions().colors[1]
          }
        },
		//min: 0,
		alignTicks: false,
		visible: true
      },
	  { // 1 yAxis
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
		//min: 900,
		alignTicks: false,
        //tickInterval: 15,
		opposite: true,
		visible: false,
      }
	],
	//credits: {
	//  enabled: false
	//},
	tooltip: {
      xDateFormat: '%d-%m-%Y',
      shared: true,
	  crosshairs: true,
    },
	series: [
	  {
		name: 'Давление',
		type: 'line',
		pointInterval: 86400000,
		yAxis: 1,
		tooltip: {
          valueSuffix: ' гПа',
        },
		color: Highcharts.getOptions().colors[6],
		//borderColor: '#000000',
		marker: {
		  symbol: 'circle',
		  radius: 3,
		  fillColor: Highcharts.getOptions().colors[6],
		},
		dataLabels: {
          enabled: true,
          style: {
            color: 'black',
            textOutline: 'none',
            fontWeight: 'normal',
          }
		}
	  },
	  { 
	    name: 'Скорость ветра',
        type: 'line',
		keys: ['y', 'rotation'],
		//yAxis: 1,
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
			  return '<span style="color:' + this.color + '">● </span>' + 'Направление ветра: <b>' + this.rotation + '° (' + windDirLang(this.rotation) + ')</b><br/>'
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
      },
	  {
		name: 'Направление ветра',
        type: 'windbarb',
		//onSeries: 'wind-speed',
        color: Highcharts.getOptions().colors[1],
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
            color: Highcharts.getOptions().colors[1],
            textOutline: 'none',
            fontWeight: 'normal',
          }
		}
      }
	]
  });
}