﻿var HALL_IP = "game.iucgnaw.com"; //如果非本机访问，这里要变
var HALL_CLIENT_PORT = 11110;
var HALL_ROOM_PORT = 11111;

var ACCOUNT_PRI_KEY = "^&*#$%()@";
var ROOM_PRI_KEY = "~!@#$(*&^%$&";

var LOCAL_IP = "localhost";

exports.mysql = function () {
	return {
		HOST: "127.0.0.1",
		USER: "root",
		PSWD: "Qwer!234", //如果连接失败，请检查这里
		DB: "Mahjong", //如果连接失败，请检查这里
		PORT: 3306,
	}
}

//账号服配置
exports.account_server = function () {
	return {
		CLIENT_PORT: 11114,
		HALL_IP: HALL_IP,
		HALL_CLIENT_PORT: HALL_CLIENT_PORT,
		ACCOUNT_PRI_KEY: ACCOUNT_PRI_KEY,

		//
		DEALDER_API_IP: LOCAL_IP,
		DEALDER_API_PORT: 11115,
		VERSION: "20161227",
		APP_WEB: "http://fir.im/2f17",
	};
};

//大厅服配置
exports.hall_server = function () {
	return {
		HALL_IP: HALL_IP,
		CLEINT_PORT: HALL_CLIENT_PORT,
		FOR_ROOM_IP: LOCAL_IP,
		ROOM_PORT: HALL_ROOM_PORT,
		ACCOUNT_PRI_KEY: ACCOUNT_PRI_KEY,
		ROOM_PRI_KEY: ROOM_PRI_KEY
	};
};

//游戏服配置
exports.game_server = function () {
	return {
		SERVER_ID: "001",

		//暴露给大厅服的HTTP端口号
		HTTP_PORT: 11113,
		//HTTP TICK的间隔时间，用于向大厅服汇报情况
		HTTP_TICK_TIME: 5000,
		//大厅服IP
		HALL_IP: LOCAL_IP,
		FOR_HALL_IP: LOCAL_IP,
		//大厅服端口
		HALL_PORT: HALL_ROOM_PORT,
		//与大厅服协商好的通信加密KEY
		ROOM_PRI_KEY: ROOM_PRI_KEY,

		//暴露给客户端的接口
		CLIENT_IP: HALL_IP,
		CLIENT_PORT: 11112,
	};
};