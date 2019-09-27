var g_crypto = require('../utils/crypto');
var g_db = require('../utils/db');
var g_express = require('express');

var g_tokenMgr = require('./tokenmgr');
var g_roomMgr = require('./roommgr');
var g_userMgr = require('./usermgr');
var g_http = require('../utils/http');
var g_io = null;

var g_app = g_express();

//设置跨域访问
g_app.all('*', function (req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "X-Requested-With");
	res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
	res.header("X-Powered-By", ' 3.2.1')
	res.header("Content-Type", "application/json;charset=utf-8");
	g_http.send(res, 0, "ok", {});
});

var g_config = null;

exports.start = function (a_config, a_mgr) {
	g_config = a_config;

	var httpServer = require('http').createServer(g_app);
	g_io = require('socket.io')(httpServer);
	httpServer.listen(g_config.CLIENT_PORT);

	g_io.sockets.on('connection', function (socket) {
		socket.on('login', function (data) {
			data = JSON.parse(data);
			if (socket.userId != null) {
				//已经登录过的就忽略
				return;
			}
			var token = data.token;
			var roomId = data.roomid;
			var time = data.time;
			var sign = data.sign;

			console.log(roomId);
			console.log(token);
			console.log(time);
			console.log(sign);


			//检查参数合法性
			if (token == null || roomId == null || sign == null || time == null) {
				console.log(1);
				socket.emit('login_result', {
					errcode: 1,
					errmsg: "invalid parameters"
				});
				return;
			}

			//检查参数是否被篡改
			var md5 = g_crypto.md5(roomId + token + time + g_config.ROOM_PRI_KEY);
			if (md5 != sign) {
				console.log(2);
				socket.emit('login_result', {
					errcode: 2,
					errmsg: "login failed. invalid sign!"
				});
				return;
			}

			//检查token是否有效
			if (g_tokenMgr.isTokenValid(token) == false) {
				console.log(3);
				socket.emit('login_result', {
					errcode: 3,
					errmsg: "token expired."
				});
				return;
			}

			//检查房间合法性
			var userId = g_tokenMgr.getUserID(token);
			var roomId = g_roomMgr.getUserRoom(userId);

			g_userMgr.bind(userId, socket);
			socket.userId = userId;

			//返回房间信息
			var roomInfo = g_roomMgr.getRoom(roomId);

			var seatIndex = g_roomMgr.getUserSeat(userId);
			roomInfo.seats[seatIndex].ip = socket.handshake.address;

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
					numofgames: roomInfo.numOfGames,
					seats: seats
				}
			};
			socket.emit('login_result', result);

			//通知其它客户端
			g_userMgr.broacastInRoom('new_user_comes_push', userData, userId);

			socket.gameMgr = roomInfo.gameMgr;

			//玩家上线，强制设置为TRUE
			socket.gameMgr.setReady(userId);

			socket.emit('login_finished');

			if (roomInfo.dr != null) {
				var dr = roomInfo.dr;
				var ramaingTime = (dr.endTime - Date.now()) / 1000;
				var data = {
					time: ramaingTime,
					states: dr.states
				}
				g_userMgr.sendMsg(userId, 'dissolve_notice_push', data);
			}
		});

		socket.on('ready', function (data) {
			var userId = socket.userId;
			if (userId == null) {
				return;
			}
			socket.gameMgr.setReady(userId);
			g_userMgr.broacastInRoom('user_ready_push', {
				userid: userId,
				ready: true
			}, userId, true);
		});

		//换牌
		socket.on('huanpai', function (data) {
			if (socket.userId == null) {
				return;
			}
			if (data == null) {
				return;
			}

			if (typeof (data) == "string") {
				data = JSON.parse(data);
			}

			var p1 = data.p1;
			var p2 = data.p2;
			var p3 = data.p3;
			if (p1 == null || p2 == null || p3 == null) {
				console.log("invalid data");
				return;
			}
			socket.gameMgr.huanSanZhang(socket.userId, p1, p2, p3);
		});

		//定缺
		socket.on('dingque', function (data) {
			if (socket.userId == null) {
				return;
			}
			var que = data;
			socket.gameMgr.dingQue(socket.userId, que);
		});

		//出牌
		socket.on('chupai', function (data) {
			if (socket.userId == null) {
				return;
			}
			var pai = data;
			socket.gameMgr.chuPai(socket.userId, pai);
		});

		//碰
		socket.on('peng', function (data) {
			if (socket.userId == null) {
				return;
			}
			socket.gameMgr.peng(socket.userId);
		});

		//杠
		socket.on('gang', function (data) {
			if (socket.userId == null || data == null) {
				return;
			}
			var pai = -1;
			if (typeof (data) == "number") {
				pai = data;
			} else if (typeof (data) == "string") {
				pai = parseInt(data);
			} else {
				console.log("gang:invalid param");
				return;
			}
			socket.gameMgr.gang(socket.userId, pai);
		});

		//胡
		socket.on('hu', function (data) {
			if (socket.userId == null) {
				return;
			}
			socket.gameMgr.hu(socket.userId);
		});

		//过  遇上胡，碰，杠的时候，可以选择过
		socket.on('guo', function (data) {
			if (socket.userId == null) {
				return;
			}
			socket.gameMgr.guo(socket.userId);
		});

		//聊天
		socket.on('chat', function (data) {
			if (socket.userId == null) {
				return;
			}
			var chatContent = data;
			g_userMgr.broacastInRoom('chat_push', {
				sender: socket.userId,
				content: chatContent
			}, socket.userId, true);
		});

		//快速聊天
		socket.on('quick_chat', function (data) {
			if (socket.userId == null) {
				return;
			}
			var chatId = data;
			g_userMgr.broacastInRoom('quick_chat_push', {
				sender: socket.userId,
				content: chatId
			}, socket.userId, true);
		});

		//语音聊天
		socket.on('voice_msg', function (data) {
			if (socket.userId == null) {
				return;
			}
			console.log(data.length);
			g_userMgr.broacastInRoom('voice_msg_push', {
				sender: socket.userId,
				content: data
			}, socket.userId, true);
		});

		//表情
		socket.on('emoji', function (data) {
			if (socket.userId == null) {
				return;
			}
			var phizId = data;
			g_userMgr.broacastInRoom('emoji_push', {
				sender: socket.userId,
				content: phizId
			}, socket.userId, true);
		});

		//语音使用SDK不出现在这里

		//退出房间
		socket.on('exit', function (data) {
			var userId = socket.userId;
			if (userId == null) {
				return;
			}

			var roomId = g_roomMgr.getUserRoom(userId);
			if (roomId == null) {
				return;
			}

			//如果游戏已经开始，则不可以
			if (socket.gameMgr.hasBegan(roomId)) {
				return;
			}

			//如果是房主，则只能走解散房间
			if (g_roomMgr.isCreator(userId)) {
				return;
			}

			//通知其它玩家，有人退出了房间
			g_userMgr.broacastInRoom('exit_notify_push', userId, userId, false);

			g_roomMgr.exitRoom(userId);
			g_userMgr.del(userId);

			socket.emit('exit_result');
			socket.disconnect();
		});

		//解散房间
		socket.on('dispress', function (data) {
			var userId = socket.userId;
			if (userId == null) {
				return;
			}

			var roomId = g_roomMgr.getUserRoom(userId);
			if (roomId == null) {
				return;
			}

			//如果游戏已经开始，则不可以
			if (socket.gameMgr.hasBegan(roomId)) {
				return;
			}

			//如果不是房主，则不能解散房间
			if (g_roomMgr.isCreator(roomId, userId) == false) {
				return;
			}

			g_userMgr.broacastInRoom('dispress_push', {}, userId, true);
			g_userMgr.kickAllInRoom(roomId);
			g_roomMgr.destroy(roomId);
			socket.disconnect();
		});

		//解散房间
		socket.on('dissolve_request', function (data) {
			var userId = socket.userId;
			console.log(1);
			if (userId == null) {
				console.log(2);
				return;
			}

			var roomId = g_roomMgr.getUserRoom(userId);
			if (roomId == null) {
				console.log(3);
				return;
			}

			//如果游戏未开始，则不可以
			if (socket.gameMgr.hasBegan(roomId) == false) {
				console.log(4);
				return;
			}

			var ret = socket.gameMgr.dissolveRequest(roomId, userId);
			if (ret != null) {
				var dr = ret.dr;
				var ramaingTime = (dr.endTime - Date.now()) / 1000;
				var data = {
					time: ramaingTime,
					states: dr.states
				}
				console.log(5);
				g_userMgr.broacastInRoom('dissolve_notice_push', data, userId, true);
			}
			console.log(6);
		});

		socket.on('dissolve_agree', function (data) {
			var userId = socket.userId;

			if (userId == null) {
				return;
			}

			var roomId = g_roomMgr.getUserRoom(userId);
			if (roomId == null) {
				return;
			}

			var ret = socket.gameMgr.dissolveAgree(roomId, userId, true);
			if (ret != null) {
				var dr = ret.dr;
				var ramaingTime = (dr.endTime - Date.now()) / 1000;
				var data = {
					time: ramaingTime,
					states: dr.states
				}
				g_userMgr.broacastInRoom('dissolve_notice_push', data, userId, true);

				var doAllAgree = true;
				for (var i = 0; i < dr.states.length; ++i) {
					if (dr.states[i] == false) {
						doAllAgree = false;
						break;
					}
				}

				if (doAllAgree) {
					socket.gameMgr.doDissolve(roomId);
				}
			}
		});

		socket.on('dissolve_reject', function (data) {
			var userId = socket.userId;

			if (userId == null) {
				return;
			}

			var roomId = g_roomMgr.getUserRoom(userId);
			if (roomId == null) {
				return;
			}

			var ret = socket.gameMgr.dissolveAgree(roomId, userId, false);
			if (ret != null) {
				g_userMgr.broacastInRoom('dissolve_cancel_push', {}, userId, true);
			}
		});

		//断开链接
		socket.on('disconnect', function (data) {
			var userId = socket.userId;
			if (!userId) {
				return;
			}

			//如果是旧链接断开，则不需要处理。
			if (g_userMgr.get(userId) != socket) {
				return;
			}

			var data = {
				userid: userId,
				online: false
			};

			//通知房间内其它玩家
			g_userMgr.broacastInRoom('user_state_push', data, userId);

			//清除玩家的在线信息
			g_userMgr.del(userId);
			socket.userId = null;
		});

		socket.on('game_ping', function (data) {
			var userId = socket.userId;
			if (!userId) {
				return;
			}
			//console.log('game_ping');
			socket.emit('game_pong');
		});
	});

	console.log("game server is listening on " + g_config.CLIENT_PORT);
};