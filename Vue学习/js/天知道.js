/*
	天气接口
	请求地址：http://wthrcdn.etouch.cn/weather_mini
	请求方法：get
	请求参数：city（查询的城市名）
	响应内容：天气信息
*/

var app = new Vue({
	el:"#app",
	data:{
		city:"",
		weatherList:[],
		ganmao:""
	},
	methods:{
		getWeather:function(){
			var that = this;
			axios.get("http://wthrcdn.etouch.cn/weather_mini?city="+that.city)
			.then(function(response){
				console.log(response);
				console.log(response.data.data.forecast);
				that.weatherList = response.data.data.forecast;
				that.ganmao = response.data.data.ganmao;
			},function(err){
				
			})
		},
		changeCity:function(city){
			this.city = city;
			this.getWeather();
		}
	}
})



