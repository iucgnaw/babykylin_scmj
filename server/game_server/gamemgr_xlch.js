var m_mahjong = require("../../common/mahjong.js");
var m_roomMgr = require("./roommgr");
var m_userMgr = require("./usermgr");
var m_mjUtils = require("./mjutils");
var m_db = require("../utils/db");
var m_crypto = require("../utils/crypto");

var g_games = {};
var g_gamesIdBase = 0;
var g_gameSeatsOfUsers = {};

var MJ_ACTION_DISCARD_TILE = 1;
var MJ_ACTION_DRAW_TILE = 2;
var MJ_ACTION_PONG = 3;
var MJ_ACTION_KONG = 4;
var MJ_ACTION_WIN = 5;
var MJ_ACTION_WIN_SELFDRAW = 6;

function shuffleTiles(a_game) {

    var tilesWall = a_game.tilesWall;

    var tileIdx = 0;
    for (var tile = m_mahjong.MJ_TILE_DOT_1; tile <= m_mahjong.MJ_TILE_DOT_9; ++tile) {
        for (var i = 0; i < 4; ++i) {
            tilesWall[tileIdx] = tile;
            tileIdx++;
        }
    }

    for (var tile = m_mahjong.MJ_TILE_BAMBOO_1; tile <= m_mahjong.MJ_TILE_BAMBOO_9; ++tile) {
        for (var i = 0; i < 4; ++i) {
            tilesWall[tileIdx] = tile;
            tileIdx++;
        }
    }

    for (var tile = m_mahjong.MJ_TILE_CHARACTER_1; tile <= m_mahjong.MJ_TILE_CHARACTER_9; ++tile) {
        for (var i = 0; i < 4; ++i) {
            tilesWall[tileIdx] = tile;
            tileIdx++;
        }
    }

    for (var tile = m_mahjong.MJ_TILE_DRAGON_RED; tile <= m_mahjong.MJ_TILE_DRAGON_WHITE; ++tile) {
        for (var i = 0; i < 4; ++i) {
            tilesWall[tileIdx] = tile;
            tileIdx++;
        }
    }

    for (var tile = m_mahjong.MJ_TILE_WIND_EAST; tile <= m_mahjong.MJ_TILE_WIND_NORTH; ++tile) {
        for (var i = 0; i < 4; ++i) {
            tilesWall[tileIdx] = tile;
            tileIdx++;
        }
    }

    for (var tile = m_mahjong.MJ_TILE_SEASON_SPRING; tile <= m_mahjong.MJ_TILE_FLOWER_CHRYSANTHEMUM; ++tile) {
        tilesWall[tileIdx] = tile;
        tileIdx++;
    }

    // var swap;
    // swap = pool[51];
    // pool[51] = pool[52];
    // pool[52] = swap;
    tilesWall[36] = m_mahjong.MJ_TILE_BAMBOO_1;
    tilesWall[40] = m_mahjong.MJ_TILE_BAMBOO_1;
    tilesWall[44] = m_mahjong.MJ_TILE_BAMBOO_1;
    tilesWall[48] = m_mahjong.MJ_TILE_BAMBOO_5;

    tilesWall[37] = m_mahjong.MJ_TILE_BAMBOO_2;
    tilesWall[41] = m_mahjong.MJ_TILE_BAMBOO_2;
    tilesWall[45] = m_mahjong.MJ_TILE_BAMBOO_2;
    tilesWall[49] = m_mahjong.MJ_TILE_BAMBOO_5;

    tilesWall[38] = m_mahjong.MJ_TILE_BAMBOO_3;
    tilesWall[42] = m_mahjong.MJ_TILE_BAMBOO_3;
    tilesWall[46] = m_mahjong.MJ_TILE_BAMBOO_3;
    tilesWall[50] = m_mahjong.MJ_TILE_BAMBOO_5;

    tilesWall[39] = m_mahjong.MJ_TILE_BAMBOO_4;
    tilesWall[43] = m_mahjong.MJ_TILE_BAMBOO_4;
    tilesWall[47] = m_mahjong.MJ_TILE_BAMBOO_4;
    tilesWall[51] = m_mahjong.MJ_TILE_BAMBOO_5;

    tilesWall[52] = m_mahjong.MJ_TILE_BAMBOO_1;
    tilesWall[53] = m_mahjong.MJ_TILE_BAMBOO_2;
    tilesWall[54] = m_mahjong.MJ_TILE_BAMBOO_3;
    tilesWall[55] = m_mahjong.MJ_TILE_BAMBOO_4;

    /* 调试期间不洗牌
    for (var i = 0; i < pool.length; ++i) {
        var lastIndex = pool.length - 1 - i; // 选中倒数第X张牌
        var index = Math.floor(Math.random() * lastIndex); // 随机选中前面的一张牌

        var tileSwap = pool[index]; // 交换这两张牌
        pool[index] = tilesWall[lastIndex];
        pool[lastIndex] = tileSwap;
    }
*/
    a_game.tilesWallPtr = 0;
}

function drawTile(a_game, a_seatIndex) {
    if (a_game.tilesWallPtr == a_game.tilesWall.length) { // No more tile in Tiles Wall
        return -1;
    }

    var tile = a_game.tilesWall[a_game.tilesWallPtr];
    a_game.tilesWallPtr++;
    var seat = a_game.gameSeats[a_seatIndex];
    seat.handTiles.push(tile);

    return tile;
}

function dealTiles(a_game) {
    //每人13张 一共 13*4 ＝ 52张 庄家多一张 53张
    // TODO Should each seat draw 4 tiles for 3 rounds, then draw 1 tile each
    var seatIndex = a_game.dealer;
    for (var i = 0; i < 52; ++i) {
        var handTiles = a_game.gameSeats[seatIndex].handTiles;
        if (handTiles == null) {
            handTiles = [];
            a_game.gameSeats[seatIndex].handTiles = handTiles;
        }
        drawTile(a_game, seatIndex);
        seatIndex++;
        seatIndex %= 4;
    }

    //庄家多摸最后一张
    drawTile(a_game, a_game.dealer);

    //当前轮设置为庄家
    a_game.turn = a_game.dealer;
}

// TODO ne need
function cleanSeatData(a_game, a_seat) {
    var fnClear = function (a_seatData) {}

    if (a_seat) {
        fnClear(a_seat);
    } else {
        a_game.qiangGangContext = null;
        for (var i = 0; i < a_game.gameSeats.length; ++i) {
            fnClear(a_game.gameSeats[i]);
        }
    }
}

function changeTurn(a_game, a_seatIndex) {
    //找到下一个没有和牌的玩家
    if (a_seatIndex == null) {
        a_game.turn++;
        a_game.turn %= 4;
        return;
    } else {
        a_game.turn = a_seatIndex;
    }
}

function doDrawTile(a_game) {
    a_game.discardingTile = -1;

    var turnSeat = a_game.gameSeats[a_game.turn];
    var tile = drawTile(a_game, a_game.turn);

    //牌摸完了，结束
    if (tile == -1) {
        doGameOver(a_game, turnSeat.userId);
        return;
    } else {
        m_userMgr.broadcastMsg("brc_tiles_wall_remaining",
            (a_game.tilesWall.length - a_game.tilesWallPtr),
            turnSeat.userId,
            true);
    }

    recordGameAction(a_game, a_game.turn, MJ_ACTION_DRAW_TILE, tile);

    m_userMgr.sendMsg(turnSeat.userId, "push_draw_tile", tile);

    m_userMgr.broadcastMsg("brc_change_turn", turnSeat.userId, turnSeat.userId, true);
}

function doGameOver(a_game, a_userId, a_forceEnd) {
    var roomId = m_roomMgr.getRoomIdByUserId(a_userId);
    if (roomId == null) {
        return;
    }
    var roomInfo = m_roomMgr.getRoomByRoomId(roomId);
    if (roomInfo == null) {
        return;
    }

    var results = [];
    var dbResult = [0, 0, 0, 0];

    var fnNotifyResult = function (a_isEnd) {
        var endInfo = null;
        if (a_isEnd) {
            endInfo = [];
            for (var i = 0; i < roomInfo.seats.length; ++i) {
                var seat = roomInfo.seats[i];
                endInfo.push({
                    numzimo: seat.numZiMo,
                    numjiepao: seat.numJiePao,
                    numdianpao: seat.numDianPao,
                    numangang: seat.numAnGang,
                    numminggang: seat.numMingGang,
                });
            }
        }

        m_userMgr.broadcastMsg("brc_game_finish", {
            results: results,
            endinfo: endInfo
        }, a_userId, true);

        //如果局数已够，则进行整体结算，并关闭房间
        if (a_isEnd) {
            setTimeout(function () {
                if (roomInfo.numOfGames > 1) {
                    store_history(roomInfo);
                }
                m_userMgr.kickAllInRoom(roomId);
                m_roomMgr.destroy(roomId);
                m_db.archive_games(roomInfo.uuid);
            }, 1500);
        }
    }

    if (a_game != null) {
        for (var i = 0; i < roomInfo.seats.length; ++i) {
            var roomSeat = roomInfo.seats[i];
            var gameSeat = a_game.gameSeats[i];

            roomSeat.ready = false;
            roomSeat.score += gameSeat.score
            roomSeat.numZiMo += gameSeat.numZiMo;
            roomSeat.numJiePao += gameSeat.numJiePao;
            roomSeat.numDianPao += gameSeat.numDianPao;
            roomSeat.numAnGang += gameSeat.numAnGang;
            roomSeat.numMingGang += gameSeat.numMingGang;

            var userResult = {
                userId: gameSeat.userId,
                actions: [],
                melds: gameSeat.melds,
                handTiles: gameSeat.handTiles,
                score: gameSeat.score,
                totalscore: roomSeat.score,
                qingyise: gameSeat.qingyise,
                jingouhu: gameSeat.isJinGouHu,
                huinfo: gameSeat.huInfo,
            }

            for (var key in gameSeat.actions) {
                userResult.actions[key] = {
                    type: gameSeat.actions[key].type,
                };
            }
            results.push(userResult);

            dbResult[i] = gameSeat.score;
            delete g_gameSeatsOfUsers[gameSeat.userId]; // TODO: ?
        }
        delete g_games[roomId]; // TODO: ?

        var dealer = roomInfo.nextDealer;
        roomInfo.nextDealer = (a_game.turn + 1) % 4;

        if (dealer != roomInfo.nextDealer) {
            m_db.update_next_dealer(roomId, roomInfo.nextDealer);
        }
    }

    if (a_forceEnd || a_game == null) {
        fnNotifyResult(true);
    } else {
        //保存游戏
        store_game(a_game, function (ret) {
            m_db.update_game_result(roomInfo.uuid, a_game.gameIndex, dbResult);

            //记录玩家操作
            var strActionList = JSON.stringify(a_game.actionList);
            m_db.update_game_action_records(roomInfo.uuid, a_game.gameIndex, strActionList);

            //保存游戏局数
            m_db.update_num_of_turns(roomId, roomInfo.numOfGames);

            //如果是第一次，则扣除房卡
            if (roomInfo.numOfGames == 1) {
                var cost = 2;
                if (roomInfo.conf.maxGames == 8) {
                    cost = 3;
                }
                m_db.cost_gems(a_game.gameSeats[0].userId, cost);
            }

            var isEnd = (roomInfo.numOfGames >= roomInfo.conf.maxGames);
            fnNotifyResult(isEnd);
        });
    }
}

function recordUserAction(a_game, a_seat, a_type, a_target) {
    var action = {
        type: a_type,
        targets: []
    };
    if (a_target != null) {
        if (typeof (a_target) == "number") {
            action.targets.push(a_target);
        } else {
            action.targets = a_target;
        }
    } else {
        for (var i = 0; i < a_game.gameSeats.length; ++i) {
            var seat = a_game.gameSeats[i];
            //血流成河，所有自摸，暗杠，弯杠，都算三家
            if (i != a_seat.seatIndex) {
                action.targets.push(i);
            }
        }
    }

    a_seat.actions.push(action);
    return action;
}

function recordGameAction(a_game, a_seatIndex, a_action, a_tileOrMeld) {
    console.assert(a_tileOrMeld != null);
    a_game.actionList.push(a_seatIndex);
    a_game.actionList.push(a_action);
    if (Array.isArray(a_tileOrMeld)) {
        a_game.actionList.push(a_tileOrMeld[0]); // TOFIX: Should record entire meld tiles
    } else {
        a_game.actionList.push(a_tileOrMeld);
    }
}

exports.setReady = function (a_userId, a_callback) {
    var roomId = m_roomMgr.getRoomIdByUserId(a_userId);
    if (roomId == null) {
        return;
    }
    var roomInfo = m_roomMgr.getRoomByRoomId(roomId);
    if (roomInfo == null) {
        return;
    }

    m_roomMgr.setReady(a_userId, true);

    var game = g_games[roomId];
    if (game == null) {
        if (roomInfo.seats.length == 4) {
            for (var i = 0; i < roomInfo.seats.length; ++i) {
                var seat = roomInfo.seats[i];
                if (seat.ready == false || m_userMgr.isOnline(seat.userId) == false) {
                    return;
                }
            }
            //4个人到齐了，并且都准备好了，则开始新的一局
            exports.begin(roomId);
        }
    } else {
        var msgData = {
            fsmGameState: game.fsmGameState,
            tilesWallRemaining: (game.tilesWall.length - game.tilesWallPtr),
            dealer: game.dealer,
            turn: game.turn,
            discardingTile: game.discardingTile,
        };

        msgData.seats = [];
        var seatData = null;
        for (var i = 0; i < 4; ++i) {
            var seat = game.gameSeats[i];

            if (seat.userId == a_userId) {
                seat.handTiles = seat.handTiles; // TOFIX: !!!
                seatData = seat;
            }
            msgData.seats.push(seat);
        }

        //同步整个信息给客户端
        m_userMgr.sendMsg(a_userId, "push_game_sync", msgData);
    }
}

function store_single_history(a_userId, a_history) {
    m_db.get_user_history(a_userId, function (data) {
        if (data == null) {
            data = [];
        }
        while (data.length >= 10) {
            data.shift();
        }
        data.push(a_history);
        m_db.update_user_history(a_userId, data);
    });
}

function store_history(a_roomInfo) {
    var seats = a_roomInfo.seats;
    var history = {
        uuid: a_roomInfo.uuid,
        id: a_roomInfo.id,
        time: a_roomInfo.createTime,
        seats: new Array(4)
    };

    for (var i = 0; i < seats.length; ++i) {
        var seat = seats[i];
        var historySeat = history.seats[i] = {};
        historySeat.userid = seat.userId;
        historySeat.name = m_crypto.toBase64(seat.name);
        historySeat.score = seat.score;
    }

    for (var i = 0; i < seats.length; ++i) {
        var seat = seats[i];
        store_single_history(seat.userId, history);
    }
}


function construct_game_base_info(a_game) {
    var baseInfo = {
        type: a_game.conf.type,
        dealer: a_game.dealer,
        index: a_game.gameIndex,
        tilesWall: a_game.tilesWall,
        gameSeats: new Array(4)
    }
    for (var i = 0; i < 4; ++i) {
        baseInfo.gameSeats[i] = a_game.gameSeats[i].handTiles;
    }
    a_game.baseInfoJson = JSON.stringify(baseInfo);
}

function store_game(a_game, a_callback) {
    m_db.create_game(a_game.roomInfo.uuid, a_game.gameIndex, a_game.baseInfoJson, a_callback);
}

//开始新的一局
exports.begin = function (a_roomId) {
    var roomInfo = m_roomMgr.getRoomByRoomId(a_roomId);
    if (roomInfo == null) {
        return;
    }
    var seats = roomInfo.seats;

    var game = {
        conf: roomInfo.conf,
        roomInfo: roomInfo,
        gameIndex: roomInfo.numOfGames,

        dealer: roomInfo.nextDealer,
        tilesWall: new Array(144), // TODO: use constant
        tilesWallPtr: 0,
        gameSeats: new Array(4), // TODO: use constant

        turn: 0,
        discardingTile: -1,
        fsmGameState: "idle",
        actionList: [],
    };

    roomInfo.numOfGames++;

    for (var i = 0; i < 4; ++i) {
        var seat = game.gameSeats[i] = {};

        seat.game = game;

        seat.seatIndex = i;

        seat.userId = seats[i].userId;
        seat.handTiles = [];
        seat.discardedTiles = [];
        seat.melds = [];

        // TOFIX can delete?
        seat.actions = [];

        //是否是自摸
        seat.iszimo = false;
        seat.isGangHu = false;
        seat.fan = 0;
        seat.score = 0;
        seat.huInfo = [];

        //统计信息
        seat.numZiMo = 0;
        seat.numJiePao = 0;
        seat.numDianPao = 0;
        seat.numAnGang = 0;
        seat.numMingGang = 0;

        g_gameSeatsOfUsers[seat.userId] = seat;
    }
    g_games[a_roomId] = game;

    //洗牌
    shuffleTiles(game);

    //发牌
    dealTiles(game);

    for (var i = 0; i < seats.length; ++i) {
        var seat = seats[i];

        m_userMgr.sendMsg(seat.userId, "push_hand_tiles", game.gameSeats[i].handTiles);
        m_userMgr.sendMsg(seat.userId, "brc_tiles_wall_remaining", (game.tilesWall.length - game.tilesWallPtr));
        m_userMgr.sendMsg(seat.userId, "push_number_of_hands", roomInfo.numOfGames);
        m_userMgr.sendMsg(seat.userId, "push_game_begin", game.dealer);

        seat.fsmPlayerState = m_mahjong.MJ_PLAYER_STATE_IDLE;
    }
    construct_game_base_info(game);

    m_userMgr.broadcastMsg("brc_game_playing", null, seat.userId, true);

    game.fsmGameState = "playing";
    //通知玩家出牌方
    m_userMgr.broadcastMsg("brc_change_turn", game.gameSeats[game.turn].userId, game.gameSeats[game.turn].userId, true);
    game.gameSeats[game.turn].fsmPlayerState = m_mahjong.MJ_PLAYER_STATE_FULL_HAND;
};

exports.doDiscardTile = function (a_userId, a_tile) {
    a_tile = Number.parseInt(a_tile);
    var seatData = g_gameSeatsOfUsers[a_userId];
    if (seatData == null) {
        // console.log("Cannot find user game data.");
        m_userMgr.sendMsg(a_userId, "push_server_message", "Cannot find user game data.");
        return;
    }

    var game = seatData.game;
    var seatIndex = seatData.seatIndex;
    //如果不该他出，则忽略
    if (game.turn != seatData.seatIndex) {
        m_userMgr.sendMsg(a_userId, "push_server_message", "Not your turn.");
        return;
    }

    //从此人牌中扣除
    var index = seatData.handTiles.indexOf(a_tile);
    if (index == -1) {
        m_userMgr.sendMsg(a_userId, "push_server_message", "Cannot find tile: " + a_tile + " in hands: " + seatData.handTiles);
        return;
    }

    seatData.handTiles.splice(index, 1); // Remove tile from hands
    game.discardingTile = a_tile;
    recordGameAction(game, seatData.seatIndex, MJ_ACTION_DISCARD_TILE, a_tile);

    m_userMgr.broadcastMsg("brc_discard", {
        userId: seatData.userId,
        tile: a_tile
    }, seatData.userId, true);

    // TODO: Wait for all pass from users

    //如果没有人有操作，则向下一家发牌，并通知他出牌
    setTimeout(function () {
        m_userMgr.broadcastMsg("brc_pass", {
            userId: seatData.userId,
            tile: game.discardingTile
        }, seatData.userId, true);

        seatData.discardedTiles.push(game.discardingTile);
        game.discardingTile = -1;

        changeTurn(game);

        doDrawTile(game);
    }, 500);
};

exports.on_req_pong = function (a_userId, a_meld) {
    console.log("enter on_req_pong(), a_userId: " + a_userId + ", a_meld: " + a_meld);

    var seatData = g_gameSeatsOfUsers[a_userId];
    console.assert(seatData != null);

    var game = seatData.game;

    //如果是他出的牌，则忽略
    if (game.turn == seatData.seatIndex) {
        m_userMgr.sendMsg(a_userId, "push_server_message", "Can't Pong the tile discarded by yourself.");
        return;
    }

    cleanSeatData(game);

    //扣掉手上的牌
    for (var i = 0; i < a_meld.tiles.length; ++i) {
        var tileIndex = seatData.handTiles.indexOf(a_meld.tiles[i]);
        console.assert(tileIndex != -1);

        seatData.handTiles.splice(tileIndex, 1);
    }
    seatData.melds.push(a_meld);
    game.discardingTile = -1;

    recordGameAction(game, seatData.seatIndex, MJ_ACTION_PONG, tile);

    //广播通知其它玩家
    m_userMgr.broadcastMsg("brc_pong", {
        userid: seatData.userId,
        tile: tile
    }, seatData.userId, true);

    //碰的玩家打牌
    changeTurn(game, seatData.seatIndex);

    //广播通知玩家出牌方
    m_userMgr.broadcastMsg("brc_change_turn", seatData.userId, seatData.userId, true);
};

exports.isPlaying = function (a_userId) {
    var seatData = g_gameSeatsOfUsers[a_userId];
    if (seatData == null) {
        return false;
    }

    var game = seatData.game;

    if (game.fsmGameState == "idle") {
        return false;
    }

    return true;
}

function checkCanQiangGang(a_game, a_turnSeat, a_seat, a_tile) {
    var actionsPendingInRoom = false;
    for (var i = 0; i < a_game.gameSeats.length; ++i) {
        //杠牌者不检查
        if (a_seat.seatIndex == i) {
            continue;
        }

        var seat = a_game.gameSeats[i];
    }

    if (actionsPendingInRoom) {
        a_game.qiangGangContext = {
            turnSeat: a_turnSeat,
            seatData: a_seat,
            tile: a_tile,
            isValid: true,
        }
    } else {
        a_game.qiangGangContext = null;
    }
    return a_game.qiangGangContext != null;
}

function doGang(a_game, a_turnSeat, a_seat, a_meld) {
    var seatIndex = a_seat.seatIndex;
    var turnSeatIndex = a_turnSeat.seatIndex;

    //从手牌中扣除
    for (var i = 0; i < a_meld.tiles.length; ++i) {
        var tileIndex = a_seat.handTiles.indexOf(a_meld.tiles[i]);
        console.assert(tileIndex != -1);

        a_seat.handTiles.splice(tileIndex, 1);
    }

    recordGameAction(a_game, a_seat.seatIndex, MJ_ACTION_KONG, a_meld.tiles);

    //记录下玩家的杠牌
    a_seat.melds.push(a_meld);
    if (a_meld.type == "meld_concealed_kong") {
        var action = recordUserAction(a_game, a_seat, "meld_concealed_kong");
    } else if (a_meld.type == "meld_exposed_kong") {
        var action = recordUserAction(a_game, a_seat, "meld_exposed_kong", turnSeatIndex);
        recordUserAction(a_game, a_turnSeat, "loss_kong", seatIndex);
    } else if (a_meld.type == "meld_pong_to_kong") {
        var action = recordUserAction(a_game, a_seat, "meld_pong_to_kong");
    }

    //通知其他玩家，有人杠了牌
    m_userMgr.broadcastMsg("brc_kong", {
        userId: a_seat.userId,
        meld: a_meld,
    }, a_seat.userId, true);

    //变成自己的轮子
    changeTurn(a_game, seatIndex);
    //再次摸牌
    doDrawTile(a_game);
}

exports.on_req_kong = function (a_userId, a_meld) {
    console.log("enter on_req_kong(), a_userId: " + a_userId + ", a_meld: " + a_meld);

    var seatData = g_gameSeatsOfUsers[a_userId];
    console.assert(seatData != null);

    var seatIndex = seatData.seatIndex;
    var game = seatData.game;

    game.discardingTile = -1;
    cleanSeatData(game);

    m_userMgr.broadcastMsg("brc_call_kong", seatIndex, seatData.userId, true);

    //如果是弯杠，则需要检查是否可以抢杠
    var turnSeat = game.gameSeats[game.turn];
    if (a_meld.type == "meld_pong_to_kong") {
        var canQiangGang = checkCanQiangGang(game, turnSeat, seatData, a_meld);
        if (canQiangGang) {
            return;
            // TODO: Send message to client.
        }
    }

    doGang(game, turnSeat, seatData, a_meld);
};

exports.hu = function (a_userId) {
    var seatData = g_gameSeatsOfUsers[a_userId];
    console.assert(seatData != null);

    var seatIndex = seatData.seatIndex;
    var game = seatData.game;

    //标记为和牌
    var winTile = game.discardingTile;
    var isSelfDraw = false;

    var turnSeat = game.gameSeats[game.turn];

    var winData = {
        ishupai: true,
        tile: -1,
        action: null,
        isGangHu: false,
        isQiangGangHu: false,
        iszimo: false,
        target: -1,
        fan: 0,
        pattern: null,
        isHaiDiHu: false,
        isTianHu: false,
        isDiHu: false,
    };

    seatData.huInfo.push(winData);

    var tile = -1;

    if (game.qiangGangContext != null) { // Means Robbing Kong Win, handle the seat being Rob Kong Win
    } else if (game.discardingTile == -1) { // No discarding tile, means Self Draw Win
        winTile = seatData.handTiles.pop();
        tile = winTile;
        winData.tile = winTile;
        winData.action = "zimo";
        winData.iszimo = true;

        isSelfDraw = true;
        recordGameAction(game, seatIndex, MJ_ACTION_WIN_SELFDRAW, winTile);
    } else { // Means Fired Win
        tile = game.discardingTile;
        winData.tile = winTile;

        var action = "hu";

        winData.action = action;
        winData.iszimo = false;
        winData.target = game.turn;

        recordGameAction(game, seatIndex, MJ_ACTION_WIN, winTile);
    }

    cleanSeatData(game, seatData);

    //通知前端，有人和牌了
    m_userMgr.broadcastMsg("brc_win", {
        seatIndex: seatIndex,
        iszimo: isSelfDraw,
        hupai: tile
    }, seatData.userId, true);

    doGameOver(game, turnSeat.userId);
};

exports.on_req_pass = function (a_userId) {
    var seatData = g_gameSeatsOfUsers[a_userId];
    if (seatData == null) {
        console.error("cannot find user game data.");
        return;
    }

    var seatIndex = seatData.seatIndex;
    var game = seatData.game;

    // //如果是玩家自己的轮子，不是接牌，则不需要额外操作
    // var doNothing = game.discardingTile == -1 && game.turn == seatIndex;

    // m_userMgr.sendMsg(seatData.userId, "push_pass_result");
    // cleanSeatData(game, seatData);

    // if (doNothing) {
    //     return;
    // }

    if (seatData.fsmPlayerState == m_mahjong.MJ_PLAYER_STATE_THINKING) {
        m_userMgr.broadcastMsg("brc_pass", {
            userId: seatData.userId,
            tile: game.discardingTile
        }, seatData.userId, true);

        seatData.fsmPlayerState = m_mahjong.MJ_PLAYER_STATE_IDLE;
    }

    //如果是已打出的牌，则需要通知。
    // if (game.discardingTile >= 0) {
    //     m_userMgr.broadcastMsg("brc_pass", {
    //         userId: game.gameSeats[game.turn].userId,
    //         tile: game.discardingTile
    //     }, seatData.userId, true);

    //     seatData.discardedTiles.push(game.discardingTile);

    //     game.discardingTile = -1;
    // }

    // var robGangContext = game.qiangGangContext;
    //清除所有的操作
    // cleanSeatData(game);

    // if (robGangContext != null && robGangContext.isValid) {
    //     doGang(game, robGangContext.turnSeat, robGangContext.seatData, "meld_pong_to_kong", 1, robGangContext.tile);
    // } else {
    //下家摸牌
    // var allPass = false;
    // if (allpass) {
    //     changeTurn(game);

    //     doDrawTile(game);
    // }
    // }
};

exports.hasBegan = function (a_roomId) {
    var game = g_games[a_roomId];
    if (game != null) {
        return true;
    }
    var roomInfo = m_roomMgr.getRoomByRoomId(a_roomId);
    if (roomInfo != null) {
        return roomInfo.numOfGames > 0;
    }
    return false;
};


var g_dismissList = [];

exports.doDissolve = function (a_roomId) {
    var roomInfo = m_roomMgr.getRoomByRoomId(a_roomId);
    if (roomInfo == null) {
        return null;
    }

    var game = g_games[a_roomId];
    doGameOver(game, roomInfo.seats[0].userId, true);
};

exports.dissolveRequest = function (a_roomId, a_userId) {
    var roomInfo = m_roomMgr.getRoomByRoomId(a_roomId);
    if (roomInfo == null) {
        return null;
    }

    if (roomInfo.dismissRequest != null) {
        return null;
    }

    var seatIndex = m_roomMgr.getSeatIndexByUserId(a_userId);
    if (seatIndex == null) {
        return null;
    }

    roomInfo.dismissRequest = {
        // endTime: Date.now() + 30000,
        endTime: Date.now() + 2000, // TOFIX: Temporarily change it to 2 seconds
        states: [false, false, false, false]
    };
    roomInfo.dismissRequest.states[seatIndex] = true;

    g_dismissList.push(a_roomId);

    return roomInfo;
};

exports.dissolveAgree = function (a_roomId, a_userId, a_agree) {
    var roomInfo = m_roomMgr.getRoomByRoomId(a_roomId);
    if (roomInfo == null) {
        return null;
    }

    if (roomInfo.dismissRequest == null) {
        return null;
    }

    var seatIndex = m_roomMgr.getSeatIndexByUserId(a_userId);
    if (seatIndex == null) {
        return null;
    }

    if (a_agree) {
        roomInfo.dismissRequest.states[seatIndex] = true;
    } else {
        roomInfo.dismissRequest = null;
        var idx = g_dismissList.indexOf(a_roomId);
        if (idx != -1) {
            g_dismissList.splice(idx, 1);
        }
    }
    return roomInfo;
};

function update() {
    for (var i = g_dismissList.length - 1; i >= 0; --i) {
        var roomId = g_dismissList[i];

        var roomInfo = m_roomMgr.getRoomByRoomId(roomId);
        if (roomInfo != null && roomInfo.dismissRequest != null) {
            if (Date.now() > roomInfo.dismissRequest.endTime) {
                console.log("delete room and games");
                exports.doDissolve(roomId);
                g_dismissList.splice(i, 1);
            }
        } else {
            g_dismissList.splice(i, 1);
        }
    }
}

// Let client update with this interval
setInterval(update, 1000);