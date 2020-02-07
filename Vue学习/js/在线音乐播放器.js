//歌词转换成数组部分    
function parseLyricL(text) {
	//将文本分隔成一行一行，存入数组
	var lines = text.split('\n'),
		//用于匹配时间的正则表达式，匹配的结果类似[xx:xx.xx]    
		pattern = /^\[\d{2}:\d{2}.\d{1,3}\]/,
		//保存最终结果的数组    
		result = [];
	//去掉不含时间的行    
	while (!pattern.test(lines[0])) {
		lines = lines.slice(1);
	};
	lines[lines.length - 1].length === 0 && lines.pop();
	for (var i = 0; i < lines.length; i++) {
		//提取出时间[xx:xx.xx]
		let time = lines[i].match(pattern);
		//去掉时间里的中括号得到xx:xx.xx    
		let t = time[0].slice(1, 10).split(":");
		//提取歌词   
		let value = lines[i].replace(pattern, '');
		//将结果压入最终数组  
		result.push([parseInt(t[0], 10) * 60 + parseFloat(t[1]), value]);
	}
	return result;
}

//给所有歌曲列表添加的播放选择样式消除
function songRemove(){
	$("li").removeClass("song");
	
}

/*
	歌曲搜索接口
	请求地址: https://autumnfish.cn/search
	请求方法: get
	请求参数: keywords (查询的关键字)
	响应内容: 歌曲搜索结果
*/
/*
	歌曲url获取
	请求地址: https://autumnfish.cn/song/url
	请求方法: get
	请求参数: id (歌曲id)
	响应内容: 歌曲的url地址
*/
/*
	歌曲详情获取
	请求地址: https://autumnfish.cn/song/detail
	请求方法: get
	请求参数: ids (歌曲id)
	响应内容: 歌曲详情,包含封面信息
*/
/*
	热门评论获取
	请求地址: https://autumnfish.cn/comment/hot?type=0
	请求方法: get
	请求参数: id (歌曲id,type固定为0)
	响应内容: 歌曲的热门评论
*/
var app = new Vue({
	el: "#app",
	data: {
		sousuo: "", // 搜索内容
		songs: [], //歌曲信息(列表)
		MusicSrc: "", //歌曲播放地址
		imgUrl: "", //歌曲专辑图片地址
		rot: false, //碟片旋转控制
		zhenkai: true, //碟针动画控制
		userDis: [], //用户留言信息
		oLRC: [], //歌词信息
		mName: "", //正在播放的歌曲名
		artName: "" //正在播放歌曲的作者名
	},
	methods: {
		getMusic: function() {
			songRemove();
			let that = this;
			axios.get("https://autumnfish.cn/search?keywords=" +
					this.sousuo)
				.then(function(response) {
					// console.log(response);
					that.songs = response.data.result.songs;
				}, function(err) {

				})
		},
		getMusicURL: function(id, Mname, artName,event) {
			// 设置歌曲播放信息
			songRemove();
			let aa = event.currentTarget;
			aa.classList.add("song");
			this.mName = Mname;
			this.artName = artName;
			
			let that = this;
			// 歌曲url获取
			axios.get("https://autumnfish.cn/song/url?id=" + id)
				.then(function(response) {
					// console.log(response);
					that.MusicSrc = response.data.data[0].url;
				}, function(err) {
					alert(err);
				});
			// 歌曲详情获取
			axios.get("https://autumnfish.cn/song/detail?ids=" + id)
				.then(function(response) {
					// console.log(response);
					that.imgUrl = response.data.songs[0].al.picUrl;
				}, function(err) {

				});
			// 热门评论获取
			axios.get("https://autumnfish.cn/comment/hot?type=0&id=" + id)
				.then(function(response) {
					// console.log(response);
					that.userDis = response.data.hotComments;
				}, function(err) {

				});
			// 歌曲lyric获取
			axios.get("https://autumnfish.cn/lyric?id=" + id)
				.then(function(response) {
					// console.log(response.data.lrc.lyric);
					that.oLRC = parseLyricL(response.data.lrc.lyric);
				}, function(err) {
					console.log(err);
				});
		},
		playing: function() {
			this.rot = true;
			this.zhenkai = false;
		},
		pause: function() {
			this.zhenkai = true;
			setTimeout(() => {
				this.rot = false;
			}, 1000);
		}
	}
});

$(function() {
	$("#aud")[0].addEventListener("play", function() {
		//开始播放时触发
		app.playing();
		goback();
	});
	$("#aud")[0].addEventListener("pause", function() {
		// 暂停时会触发，当播放完一首歌曲时也会触发
		app.pause();
	});
	
	
	// 以下为歌词同步过程


	var lineNo = 0; //当前行
	var C_pos = 6; //C位
	var offset = -20; //滚动距离（应等于行高）
	var audio = $("#aud"); //播放器
	var ul = $("#lyric"); //歌词容器列表

	//高亮显示歌词当前行及文字滚动控制，行号为lineNo
	function lineHigh() {
		var lis = $(".lrcs"); //歌词数组
		if (lineNo > 0) {
			lis.removeClass("lineHigh"); //去掉上一行的高亮样式
		};
		lis.eq(lineNo).addClass("lineHigh"); //高亮显示当前行

		//文字滚动
		if (lineNo > C_pos) {
			ul.css("transform", "translateY(" + (lineNo - C_pos) * offset + "px)"); //整体向上滚动一行高度
		}
	}

	//滚回到开头，用于播放结束时
	function goback() {
		$(".lrcs").removeClass("lineHigh");
		ul.css("transform", "translateY(0)");
		lineNo = 0;
	}

	//监听播放器的timeupdate事件，实现文字与音频播放同步
	$("#aud").on("timeupdate", function() {
		if (lineNo == app.oLRC.length)
			return;
		var curTime = this.currentTime; //播放器时间
		for (var i = 0; i < app.oLRC.length; i++) {
			if (app.oLRC[i][0] <= curTime) {
				lineNo = i;
				lineHigh(); //高亮当前行
			}
		}
	});

	//监听播放器的ended事件，播放结束时回滚歌词
	$("#aud").on("ended", function() {
		goback(); //回滚歌词
	});

});
