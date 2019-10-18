var m_db = require("../utils/db");

var rooms = {};
var creatingRooms = {};

var userLocation = {};
var totalRooms = 0;

var g_basePoint = [1, 2, 5];
var g_maxFaan = [3, 4, 5];
var g_totalHands = [4, 8];
var g_roomCost = [2, 3];

function generateRoomId() {
	var roomId = "";
	for (var i = 0; i < 6; ++i) {
		roomId += Math.floor(Math.random() * 10);
	}
	return roomId;
}

function constructRoomFromDb(dbdata) {
	var roomInfo = {
		uuid: dbdata.uuid,
		id: dbdata.id,
		numOfGames: dbdata.num_of_turns,
		createTime: dbdata.create_time,
		nextDealer: dbdata.next_dealer,
		seats: new Array(4),
		conf: JSON.parse(dbdata.base_info)
	};


	roomInfo.gameMgr = require("./gamemgr_xlch");

	var roomId = roomInfo.id;

	for (var i = 0; i < 4; ++i) {
		var seat = roomInfo.seats[i] = {};
		seat.userId = dbdata["user_id" + i];
		seat.score = dbdata["user_score" + i];
		seat.name = dbdata["user_name" + i];
		seat.ready = false;
		seat.seatIndex = i;
		seat.numZiMo = 0;
		seat.numJiePao = 0;
		seat.numDianPao = 0;
		seat.numAnGang = 0;
		seat.numMingGang = 0;

		if (seat.userId > 0) {
			userLocation[seat.userId] = {
				roomId: roomId,
				seatIndex: i
			};
		}
	}
	rooms[roomId] = roomInfo;
	totalRooms++;
	return roomInfo;
}

exports.createRoom = function (creator, roomConf, gems, ip, port, callback) {
	if (
		roomConf.type == null ||
		roomConf.difen == null ||
		roomConf.zimo == null ||
		roomConf.jiangdui == null ||
		roomConf.huansanzhang == null ||
		roomConf.zuidafanshu == null ||
		roomConf.jushuxuanze == null ||
		roomConf.dianganghua == null ||
		roomConf.menqing == null ||
		roomConf.tiandihu == null) {
		callback(1, null);
		return;
	}

	if (roomConf.difen < 0 || roomConf.difen > g_basePoint.length) {
		callback(1, null);
		return;
	}

	if (roomConf.zimo < 0 || roomConf.zimo > 2) {
		callback(1, null);
		return;
	}

	if (roomConf.zuidafanshu < 0 || roomConf.zuidafanshu > g_maxFaan.length) {
		callback(1, null);
		return;
	}

	if (roomConf.jushuxuanze < 0 || roomConf.jushuxuanze > g_totalHands.length) {
		callback(1, null);
		return;
	}

	var cost = g_roomCost[roomConf.jushuxuanze];
	if (cost > gems) {
		callback(2222, null);
		return;
	}

	var fnCreate = function () {
		var roomId = generateRoomId();
		if (rooms[roomId] != null || creatingRooms[roomId] != null) {
			fnCreate();
		} else {
			creatingRooms[roomId] = true;
			m_db.is_room_exist(roomId, function (ret) {

				if (ret) {
					delete creatingRooms[roomId];
					fnCreate();
				} else {
					var createTime = Math.ceil(Date.now() / 1000);
					var roomInfo = {
						uuid: "",
						id: roomId,
						numOfGames: 0,
						createTime: createTime,
						nextDealer: 0,
						seats: [],
						conf: {
							type: roomConf.type,
							baseScore: g_basePoint[roomConf.difen],
							zimo: roomConf.zimo,
							jiangdui: roomConf.jiangdui,
							hsz: roomConf.huansanzhang,
							dianganghua: parseInt(roomConf.dianganghua),
							menqing: roomConf.menqing,
							tiandihu: roomConf.tiandihu,
							maxFan: g_maxFaan[roomConf.zuidafanshu],
							maxGames: g_totalHands[roomConf.jushuxuanze],
							creator: creator,
						}
					};

					roomInfo.gameMgr = require("./gamemgr_xlch");
					console.log(roomInfo.conf);

					for (var i = 0; i < 4; ++i) {
						roomInfo.seats.push({
							userId: 0,
							score: 0,
							name: "",
							ready: false,
							seatIndex: i,
							numZiMo: 0,
							numJiePao: 0,
							numDianPao: 0,
							numAnGang: 0,
							numMingGang: 0,
						});
					}


					//写入数据库
					var conf = roomInfo.conf;
					m_db.create_room(roomInfo.id, roomInfo.conf, ip, port, createTime, function (uuid) {
						delete creatingRooms[roomId];
						if (uuid != null) {
							roomInfo.uuid = uuid;
							console.log(uuid);
							rooms[roomId] = roomInfo;
							totalRooms++;
							callback(0, roomId);
						} else {
							callback(3, null);
						}
					});
				}
			});
		}
	}

	fnCreate();
};

exports.destroy = function (roomId) {
	var roomInfo = rooms[roomId];
	if (roomInfo == null) {
		return;
	}

	for (var i = 0; i < 4; ++i) {
		var userId = roomInfo.seats[i].userId;
		if (userId > 0) {
			delete userLocation[userId];
			m_db.set_room_id_of_user(userId, null);
		}
	}

	delete rooms[roomId];
	totalRooms--;
	m_db.delete_room(roomId);
}

exports.getTotalRooms = function () {
	return totalRooms;
}

exports.getRoomByRoomId = function (roomId) {
	return rooms[roomId];
};

exports.isCreator = function (roomId, userId) {
	var roomInfo = rooms[roomId];
	if (roomInfo == null) {
		return false;
	}
	return roomInfo.conf.creator == userId;
};

exports.enterRoom = function (roomId, userId, userName, callback) {
	var fnTakeSeat = function (room) {
		if (exports.getRoomIdByUserId(userId) == roomId) {
			//已存在
			return 0;
		}

		for (var i = 0; i < 4; ++i) {
			var seat = room.seats[i];
			if (seat.userId <= 0) {
				seat.userId = userId;
				seat.name = userName;
				userLocation[userId] = {
					roomId: roomId,
					seatIndex: i
				};
				//console.log(userLocation[userId]);
				m_db.update_seat_info(roomId, i, seat.userId, "", seat.name);
				//正常
				return 0;
			}
		}
		//房间已满
		return 1;
	}
	var room = rooms[roomId];
	if (room) {
		var ret = fnTakeSeat(room);
		callback(ret);
	} else {
		m_db.get_room_data(roomId, function (dbdata) {
			if (dbdata == null) {
				//找不到房间
				callback(2);
			} else {
				//construct room.
				room = constructRoomFromDb(dbdata);
				//
				var ret = fnTakeSeat(room);
				callback(ret);
			}
		});
	}
};

exports.setReady = function (a_userId, a_ready) {
	var roomId = exports.getRoomIdByUserId(a_userId);
	if (roomId == null) {
		return;
	}
	var room = exports.getRoomByRoomId(roomId);
	if (room == null) {
		return;
	}
	var seatIndex = exports.getSeatIndexByUserId(a_userId);
	if (seatIndex == null) {
		return;
	}

	room.seats[seatIndex].ready = a_ready;
}

exports.isReady = function (userId) {
	var roomId = exports.getRoomIdByUserId(userId);
	if (roomId == null) {
		return;
	}
	var room = exports.getRoomByRoomId(roomId);
	if (room == null) {
		return;
	}
	var seatIndex = exports.getSeatIndexByUserId(userId);
	if (seatIndex == null) {
		return;
	}

	return room.seats[seatIndex].ready;
}


exports.getRoomIdByUserId = function (userId) {
	var location = userLocation[userId];
	if (location != null) {
		return location.roomId;
	}
	return null;
};

exports.getSeatIndexByUserId = function (userId) {
	var location = userLocation[userId];
	//console.log(userLocation[userId]);
	if (location != null) {
		return location.seatIndex;
	}
	return null;
};

exports.getUserLocations = function () {
	return userLocation;
};

exports.exitRoom = function (userId) {
	var location = userLocation[userId];
	if (location == null)
		return;

	var roomId = location.roomId;
	var seatIndex = location.seatIndex;
	var room = rooms[roomId];
	delete userLocation[userId];
	if (room == null || seatIndex == null) {
		return;
	}

	var seat = room.seats[seatIndex];
	seat.userId = 0;
	seat.name = "";

	var numOfPlayers = 0;
	for (var i = 0; i < room.seats.length; ++i) {
		if (room.seats[i].userId > 0) {
			numOfPlayers++;
		}
	}

	m_db.set_room_id_of_user(userId, null);

	if (numOfPlayers == 0) {
		exports.destroy(roomId);
	}
};