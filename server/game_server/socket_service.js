var g_crypto = require("../utils/crypto");
var g_db = require("../utils/db");
var g_express = require("express");

var g_tokenMgr = require("./tokenmgr");
var g_roomMgr = require("./roommgr");
var g_userMgr = require("./usermgr");
var g_http = require("../utils/http");
var g_io = null;

var g_app = g_express();

//设置跨域访问
g_app.all("*", function (a_req, a_res, a_next) {
	a_res.header("Access-Control-Allow-Origin", "*");
	a_res.header("Access-Control-Allow-Headers", "X-Requested-With");
	a_res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
	a_res.header("X-Powered-By", " 3.2.1")
	a_res.header("Content-Type", "application/json;charset=utf-8");
	g_http.send(a_res, 0, "ok", {});
});

var g_config = null;

exports.start = function (a_config, a_mgr) {
	g_config = a_config;

	var httpServer = require("http").createServer(g_app);
	g_io = require("socket.io")(httpServer);
	httpServer.listen(g_config.CLIENT_PORT);

	g_io.sockets.on("connection", function (a_socket) {
		a_socket.on("login", function (a_data) {
			a_data = JSON.parse(a_data);
			if (a_socket.userId != null) {
				//已经登录过的就忽略
				return;
			}
			var token = a_data.token;
			var roomId = a_data.roomid;
			var time = a_data.time;
			var sign = a_data.sign;

			console.log(roomId);
			console.log(token);
			console.log(time);
			console.log(sign);


			//检查参数合法性
			if (token == null || roomId == null || sign == null || time == null) {
				console.log("errcode: 1, invalid parameters.");
				a_socket.emit("res_login_result", {
					errcode: 1,
					errmsg: "invalid parameters."
				});
				return;
			}

			//检查参数是否被篡改
			var md5 = g_crypto.md5(roomId + token + time + g_config.ROOM_PRI_KEY);
			if (md5 != sign) {
				console.log("errcode: 2, login failed. invalid sign!");
				a_socket.emit("res_login_result", {
					errcode: 2,
					errmsg: "login failed. invalid sign!"
				});
				return;
			}

			//检查token是否有效
			if (g_tokenMgr.isTokenValid(token) == false) {
				console.log("errcode: 3, token expired.");
				a_socket.emit("res_login_result", {
					errcode: 3,
					errmsg: "token expired."
				});
				return;
			}

			//检查房间合法性
			var userId = g_tokenMgr.getUserID(token);
			var roomId = g_roomMgr.getRoomIdByUserId(userId);

			g_userMgr.bind(userId, a_socket);
			a_socket.userId = userId;

			//返回房间信息
			var roomInfo = g_roomMgr.getRoom(roomId);

			var seatIndex = g_roomMgr.getUserSeat(userId);
			roomInfo.seats[seatIndex].ip = a_socket.handshake.address;

			var userData = null;
			var seats = [];
			for (var i = 0; i < roomInfo.seats.length; ++i) {
				var seat = roomInfo.seats[i];
				var online = false;
				if (seat.userId > 0) {
					online = g_userMgr.isOnline(seat.userId);
				}

				seats.push({
					userid: seat.userId,
					ip: seat.ip,
					score: seat.score,
					name: seat.name,
					online: online,
					ready: seat.ready,
					seatindex: i
				});

				if (userId == seat.userId) {
					userData = seats[i];
				}
			}

			//通知前端
			var result = {
				errcode: 0,
				errmsg: "ok",
				data: {
					roomid: roomInfo.id,
					conf: roomInfo.conf,
					numOfGames: roomInfo.numOfGames,
					seats: seats
				}
			};
			a_socket.emit("res_login_result", result);

			//通知其它客户端
			g_userMgr.broadcastInRoom("brc_player_join", userData, userId);

			a_socket.gameMgr = roomInfo.gameMgr;

			//玩家上线，强制设置为TRUE
			a_socket.gameMgr.setReady(userId);

			a_socket.emit("push_login_finished");

			if (roomInfo.dismissRequest != null) {
				var dismissRequest = roomInfo.dismissRequest;
				var ramaingTime = (dismissRequest.endTime - Date.now()) / 1000;
				var a_data = {
					time: ramaingTime,
					states: dismissRequest.states
				}
				g_userMgr.sendMsg(userId, "brc_propose_dismiss_room", a_data);
			}
		});

		a_socket.on("req_seat_ready", function (a_data) {
			var userId = a_socket.userId;
			if (userId == null) {
				return;
			}
			a_socket.gameMgr.setReady(userId);
			g_userMgr.broadcastInRoom("brc_player_ready", {
				userid: userId,
				ready: true
			}, userId, true);
		});

		//换牌
		a_socket.on("req_huanpai", function (a_data) {
			if (a_socket.userId == null) {
				return;
			}
			if (a_data == null) {
				return;
			}

			if (typeof (a_data) == "string") {
				a_data = JSON.parse(a_data);
			}

			var p1 = a_data.p1;
			var p2 = a_data.p2;
			var p3 = a_data.p3;
			if (p1 == null || p2 == null || p3 == null) {
				console.log("invalid data");
				return;
			}
			a_socket.gameMgr.huanSanZhang(a_socket.userId, p1, p2, p3);
		});

		//定缺
		a_socket.on("req_dingque", function (a_data) {
			if (a_socket.userId == null) {
				return;
			}
			var que = a_data;
			a_socket.gameMgr.dingQue(a_socket.userId, que);
		});

		//出牌
		a_socket.on("req_discard", function (a_data) {
			if (a_socket.userId == null) {
				return;
			}
			var tile = a_data;
			a_socket.gameMgr.doDiscardTile(a_socket.userId, tile);
		});

		//碰
		a_socket.on("req_pong", function (a_data) {
			console.assert(a_socket.userId != null);
			console.assert(a_data != null);

			var meld;
			if (typeof (a_data) == "string") {
				meld = JSON.parse(a_data);
			}

			a_socket.gameMgr.on_req_pong(a_socket.userId, meld);
		});

		//杠
		a_socket.on("req_kong", function (a_data) {
			console.assert(a_socket.userId != null);
			console.assert(a_data != null);

			var meld;
			if (typeof (a_data) == "string") {
				meld = JSON.parse(a_data);
			}

			a_socket.gameMgr.on_req_kong(a_socket.userId, meld);
		});

		//胡
		a_socket.on("req_win", function (a_data) {
			if (a_socket.userId == null) {
				return;
			}
			a_socket.gameMgr.hu(a_socket.userId);
		});

		//过  遇上胡，碰，杠的时候，可以选择过
		a_socket.on("req_pass", function (a_data) {
			if (a_socket.userId == null) {
				return;
			}
			a_socket.gameMgr.doPass(a_socket.userId);
		});

		//聊天
		a_socket.on("req_chat", function (a_data) {
			if (a_socket.userId == null) {
				return;
			}
			var chatContent = a_data;
			g_userMgr.broadcastInRoom("brc_chat", {
				sender: a_socket.userId,
				content: chatContent
			}, a_socket.userId, true);
		});

		//快速聊天
		a_socket.on("req_quick_chat", function (a_data) {
			if (a_socket.userId == null) {
				return;
			}
			var chatId = a_data;
			g_userMgr.broadcastInRoom("brc_quick_chat", {
				sender: a_socket.userId,
				content: chatId
			}, a_socket.userId, true);
		});

		//语音聊天
		a_socket.on("req_voice_msg", function (a_data) {
			if (a_socket.userId == null) {
				return;
			}
			console.log(a_data.length);
			g_userMgr.broadcastInRoom("brc_voice_message", {
				sender: a_socket.userId,
				content: a_data
			}, a_socket.userId, true);
		});

		//表情
		a_socket.on("req_emoji", function (a_data) {
			if (a_socket.userId == null) {
				return;
			}
			var phizId = a_data;
			g_userMgr.broadcastInRoom("brc_emoji", {
				sender: a_socket.userId,
				content: phizId
			}, a_socket.userId, true);
		});

		//语音使用SDK不出现在这里

		//退出房间
		a_socket.on("req_exit", function (a_data) {
			var userId = a_socket.userId;
			if (userId == null) {
				return;
			}

			var roomId = g_roomMgr.getRoomIdByUserId(userId);
			if (roomId == null) {
				return;
			}

			//如果游戏已经开始，则不可以
			if (a_socket.gameMgr.hasBegan(roomId)) {
				return;
			}

			//如果是房主，则只能走解散房间
			if (g_roomMgr.isCreator(userId)) {
				return;
			}

			//通知其它玩家，有人退出了房间
			g_userMgr.broadcastInRoom("brc_player_exit", userId, userId, false);

			g_roomMgr.exitRoom(userId);
			g_userMgr.del(userId);

			a_socket.emit("push_exit_result");
			a_socket.disconnect();
		});

		//解散房间
		a_socket.on("req_dismiss_room", function (a_data) {
			var userId = a_socket.userId;
			if (userId == null) {
				return;
			}

			var roomId = g_roomMgr.getRoomIdByUserId(userId);
			if (roomId == null) {
				return;
			}

			//如果游戏已经开始，则不可以
			if (a_socket.gameMgr.hasBegan(roomId)) {
				return;
			}

			//如果不是房主，则不能解散房间
			if (g_roomMgr.isCreator(roomId, userId) == false) {
				return;
			}

			g_userMgr.broadcastInRoom("brc_dismiss_room", {}, userId, true);
			g_userMgr.kickAllInRoom(roomId);
			g_roomMgr.destroy(roomId);
			a_socket.disconnect();
		});

		//解散房间
		a_socket.on("req_propose_dismiss_room", function (a_data) {
			var userId = a_socket.userId;
			console.log(1);
			if (userId == null) {
				console.log(2);
				return;
			}

			var roomId = g_roomMgr.getRoomIdByUserId(userId);
			if (roomId == null) {
				console.log(3);
				return;
			}

			//如果游戏未开始，则不可以
			if (a_socket.gameMgr.hasBegan(roomId) == false) {
				console.log(4);
				return;
			}

			var ret = a_socket.gameMgr.dissolveRequest(roomId, userId);
			if (ret != null) {
				var dismissRequest = ret.dismissRequest;
				var ramaingTime = (dismissRequest.endTime - Date.now()) / 1000;
				var a_data = {
					time: ramaingTime,
					states: dismissRequest.states
				}
				console.log(5);
				g_userMgr.broadcastInRoom("brc_propose_dismiss_room", a_data, userId, true);
			}
			console.log(6);
		});

		a_socket.on("req_accept_dismiss_room", function (a_data) {
			var userId = a_socket.userId;

			if (userId == null) {
				return;
			}

			var roomId = g_roomMgr.getRoomIdByUserId(userId);
			if (roomId == null) {
				return;
			}

			var ret = a_socket.gameMgr.dissolveAgree(roomId, userId, true);
			if (ret != null) {
				var dismissRequest = ret.dismissRequest;
				var ramaingTime = (dismissRequest.endTime - Date.now()) / 1000;
				var a_data = {
					time: ramaingTime,
					states: dismissRequest.states
				}
				g_userMgr.broadcastInRoom("brc_propose_dismiss_room", a_data, userId, true);

				var doAllAgree = true;
				for (var i = 0; i < dismissRequest.states.length; ++i) {
					if (dismissRequest.states[i] == false) {
						doAllAgree = false;
						break;
					}
				}

				if (doAllAgree) {
					a_socket.gameMgr.doDissolve(roomId);
				}
			}
		});

		a_socket.on("req_reject_dismiss_room", function (a_data) {
			var userId = a_socket.userId;

			if (userId == null) {
				return;
			}

			var roomId = g_roomMgr.getRoomIdByUserId(userId);
			if (roomId == null) {
				return;
			}

			var ret = a_socket.gameMgr.dissolveAgree(roomId, userId, false);
			if (ret != null) {
				g_userMgr.broadcastInRoom("brc_reject_dismiss_room", {}, userId, true);
			}
		});

		//断开链接
		a_socket.on("disconnect", function (a_data) {
			var userId = a_socket.userId;
			if (!userId) {
				return;
			}

			//如果是旧链接断开，则不需要处理。
			if (g_userMgr.get(userId) != a_socket) {
				return;
			}

			var a_data = {
				userid: userId,
				online: false
			};

			//通知房间内其它玩家
			g_userMgr.broadcastInRoom("brc_player_status_change", a_data, userId);

			//清除玩家的在线信息
			g_userMgr.del(userId);
			a_socket.userId = null;
		});

		a_socket.on("heartbeat_ping", function (a_data) {
			var userId = a_socket.userId;
			if (!userId) {
				return;
			}
			//console.log("heartbeat_ping");
			a_socket.emit("heartbeat_pong");
		});
	});

	console.log("game server is listening on " + g_config.CLIENT_PORT);
};