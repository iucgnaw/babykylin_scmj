var m_roomMgr = require("./roommgr");
var g_userSockets = {};
var g_userOnline = 0;
exports.bind = function (a_userId, a_socket) {
    g_userSockets[a_userId] = a_socket;
    g_userOnline++;
};

exports.del = function (a_userId, socket) {
    delete g_userSockets[a_userId];
    g_userOnline--;
};

exports.get = function (a_userId) {
    return g_userSockets[a_userId];
};

exports.isOnline = function (a_userId) {
    var data = g_userSockets[a_userId];
    if (data != null) {
        return true;
    }
    return false;
};

exports.getOnlineCount = function () {
    return g_userOnline;
}

exports.sendMsg = function (a_userId, a_event, a_data) {
    console.log("socket.emit(), a_event: " + a_event + ", a_data: " + a_data);
    var userInfo = g_userSockets[a_userId];
    if (userInfo == null) {
        return;
    }
    var socket = userInfo;
    if (socket == null) {
        return;
    }

    socket.emit(a_event, a_data);
};

exports.kickAllInRoom = function (a_roomId) {
    if (a_roomId == null) {
        return;
    }
    var roomInfo = m_roomMgr.getRoomByRoomId(a_roomId);
    if (roomInfo == null) {
        return;
    }

    for (var i = 0; i < roomInfo.seats.length; ++i) {
        var rs = roomInfo.seats[i];

        //如果不需要发给发送方，则跳过
        if (rs.userId > 0) {
            var socket = g_userSockets[rs.userId];
            if (socket != null) {
                exports.del(rs.userId);
                socket.disconnect();
            }
        }
    }
};

exports.broadcastInRoom = function (a_event, a_data, a_senderUserId, a_includeSender) {
    var roomId = m_roomMgr.getRoomIdByUserId(a_senderUserId);
    if (roomId == null) {
        return;
    }
    var roomInfo = m_roomMgr.getRoomByRoomId(roomId);
    if (roomInfo == null) {
        return;
    }

    for (var i = 0; i < roomInfo.seats.length; ++i) {
        var seat = roomInfo.seats[i];

        //如果不需要发给发送方，则跳过
        if (seat.userId == a_senderUserId && a_includeSender != true) {
            continue;
        }
        var socket = g_userSockets[seat.userId];
        if (socket != null) {
            socket.emit(a_event, a_data);
        }
    }
};