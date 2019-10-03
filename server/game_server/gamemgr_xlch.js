var g_roomMgr = require("./roommgr");
var g_userMgr = require("./usermgr");
var g_mjutils = require("./mjutils");
var g_db = require("../utils/db");
var g_crypto = require("../utils/crypto");
var g_games = {};
var g_gamesIdBase = 0;

var ACTION_CHUPAI = 1;
var ACTION_MOPAI = 2;
var ACTION_PENG = 3;
var ACTION_GANG = 4;
var ACTION_HU = 5;
var ACTION_ZIMO = 6;

var g_gameSeatsOfUsers = {};

function getTileType(a_Tile) {
    if (a_Tile >= 0 && a_Tile < 9) {
        //筒 0 - 8
        return 0;
    } else if (a_Tile >= 9 && a_Tile < 18) {
        //条 9 - 17
        return 1;
    } else if (a_Tile >= 18 && a_Tile < 27) {
        //万 18 - 26
        return 2;
    } else if (a_Tile == 27) {
        //中
        return 3;
    } else if (a_Tile == 28) {
        //发
        return 4;
    } else if (a_Tile == 29) {
        //白
        return 4;
    } else if (a_Tile == 30) {
        //东
        return 6;
    } else if (a_Tile == 31) {
        //西
        return 7;
    } else if (a_Tile == 32) {
        //南
        return 8;
    } else if (a_Tile == 33) {
        //北
        return 9;
    } else if (a_Tile == 34) {
        //春
        return 10;
    } else if (a_Tile == 35) {
        //夏
        return 11;
    } else if (a_Tile == 36) {
        //秋
        return 12;
    } else if (a_Tile == 37) {
        //冬
        return 13;
    } else if (a_Tile == 38) {
        //梅
        return 14;
    } else if (a_Tile == 39) {
        //兰
        return 15;
    } else if (a_Tile == 40) {
        //竹
        return 16;
    } else if (a_Tile == 41) {
        //菊
        return 17;
    }
}

function shuffle(a_game) {

    var pool = a_game.mahjongs;

    //筒 (0 ~ 8 表示筒子
    var tileIdx = 0;
    for (var tile = 0; tile < 9; ++tile) {
        for (var i = 0; i < 4; ++i) {
            pool[tileIdx] = tile;
            tileIdx++;
        }
    }

    //条 9 ~ 17表示条子
    for (var tile = 9; tile < 18; ++tile) {
        for (var i = 0; i < 4; ++i) {
            pool[tileIdx] = tile;
            tileIdx++;
        }
    }

    //万 18 ~ 26表示万
    for (var tile = 18; tile < 27; ++tile) {
        for (var i = 0; i < 4; ++i) {
            pool[tileIdx] = tile;
            tileIdx++;
        }
    }

    //中发白 27 ~ 29表示箭
    for (var tile = 27; tile < 30; ++tile) {
        for (var i = 0; i < 4; ++i) {
            pool[tileIdx] = tile;
            tileIdx++;
        }
    }

    //东西南北 30 ~ 33表示风
    for (var tile = 30; tile < 34; ++tile) {
        for (var i = 0; i < 4; ++i) {
            pool[tileIdx] = tile;
            tileIdx++;
        }
    }

    //春夏秋冬梅兰竹菊 34 ~ 41表示花
    for (var i = 0; i < 8; ++i) {
        pool[tileIdx] = tile;
        tileIdx++;
        tile++;
    }

    // var swap;
    // swap = pool[51];
    // pool[51] = pool[52];
    // pool[52] = swap;
    pool[36] = 9;
    pool[40] = 9;
    pool[44] = 9;
    pool[48] = 13;

    pool[37] = 10;
    pool[41] = 10;
    pool[45] = 10;
    pool[49] = 13;

    pool[38] = 11;
    pool[42] = 11;
    pool[46] = 11;
    pool[50] = 13;

    pool[39] = 12;
    pool[43] = 12;
    pool[47] = 12;
    pool[51] = 13;

    pool[52] = 9;
    pool[53] = 10;
    pool[54] = 11;
    pool[55] = 12;

    /* 调试期间不洗牌
    for (var i = 0; i < pool.length; ++i) {
        var lastIndex = pool.length - 1 - i;
        var index = Math.floor(Math.random() * lastIndex);
        var tileSwap = pool[index];
        pool[index] = mahjongs[lastIndex];
        pool[lastIndex] = tileSwap;
    }
*/
}

function drawTile(a_game, a_seatIndex) {
    if (a_game.currentIndex == a_game.mahjongs.length) {
        return -1;
    }

    var seat = a_game.gameSeats[a_seatIndex];
    var hands = seat.holds;
    var tile = a_game.mahjongs[a_game.currentIndex];
    hands.push(tile);

    //统计牌的数目 ，用于快速判定（空间换时间）
    var count = seat.countMap[tile];
    if (count == null) {
        count = 0;
    }
    seat.countMap[tile] = count + 1;
    a_game.currentIndex++;
    return tile;
}

function deal(a_game) {
    //强制清0
    a_game.currentIndex = 0;

    //每人13张 一共 13*4 ＝ 52张 庄家多一张 53张
    var seatIndex = a_game.button;
    for (var i = 0; i < 52; ++i) {
        var hands = a_game.gameSeats[seatIndex].holds;
        if (hands == null) {
            hands = [];
            a_game.gameSeats[seatIndex].holds = hands;
        }
        drawTile(a_game, seatIndex);
        seatIndex++;
        seatIndex %= 4;
    }

    //庄家多摸最后一张
    drawTile(a_game, a_game.button);
    //当前轮设置为庄家
    a_game.turn = a_game.button;
}

//检查是否可以碰
function checkCanPeng(a_game, a_seat, a_targetTile) {
    //    if(getTileType(targetPai) == seatData.que){
    //       return;
    //    }
    var count = a_seat.countMap[a_targetTile];
    if (count != null && count >= 2) {
        a_seat.canPeng = true;
    }
}

//检查是否可以点杠
function checkCanDianGang(a_game, a_seat, a_targetTile) {
    //检查玩家手上的牌
    //如果没有牌了，则不能再杠
    if (a_game.mahjongs.length <= a_game.currentIndex) {
        return;
    }
    //    if(getTileType(targetPai) == seatData.que){
    //        return;
    //    }
    var count = a_seat.countMap[a_targetTile];
    if (count != null && count >= 3) {
        a_seat.canGang = true;
        a_seat.gangPai.push(a_targetTile);
        return;
    }
}

//检查是否可以暗杠
function checkCanAnGang(a_game, a_seat) {
    //如果没有牌了，则不能再杠
    if (a_game.mahjongs.length <= a_game.currentIndex) {
        return;
    }

    for (var key in a_seat.countMap) {
        var tile = parseInt(key);
        //if (getTileType(pai) != seatData.que) {
            var count = a_seat.countMap[key];
            if (count != null && count == 4) {
                a_seat.canGang = true;
                a_seat.gangPai.push(tile);
            }
        //}
    }
}

//检查是否可以弯杠(自己摸起来的时候)
function checkCanWanGang(a_game, a_seat) {
    //如果没有牌了，则不能再杠
    if (a_game.mahjongs.length <= a_game.currentIndex) {
        return;
    }

    //从碰过的牌中选
    for (var i = 0; i < a_seat.pengs.length; ++i) {
        var tile = a_seat.pengs[i];
        if (a_seat.countMap[tile] == 1) {
            a_seat.canGang = true;
            a_seat.gangPai.push(tile);
        }
    }
}

function checkCanHu(a_game, a_seat, a_targetTile) {
    a_game.lastHuPaiSeat = -1;
    //    if(getTileType(targetPai) == seatData.que){
    //        return;
    //    }
    a_seat.canHu = false;
    for (var key in a_seat.tingMap) {
        if (a_targetTile == key) {
            a_seat.canHu = true;
        }
    }
}

function clearAllOptions(a_game, a_seat) {
    var fnClear = function (a_fn_seat) {
        a_fn_seat.canPeng = false;
        a_fn_seat.canGang = false;
        a_fn_seat.gangPai = [];
        a_fn_seat.canHu = false;
        a_fn_seat.lastFangGangSeat = -1;
    }
    if (a_seat) {
        fnClear(a_seat);
    } else {
        a_game.qiangGangContext = null;
        for (var i = 0; i < a_game.gameSeats.length; ++i) {
            fnClear(a_game.gameSeats[i]);
        }
    }
}

//检查听牌
function checkCanTingPai(a_game, a_seat) {
    a_seat.tingMap = {};

    //检查手上的牌是不是已打缺，如果未打缺，则不进行判定
    //    for(var i = 0; i < seatData.holds.length; ++i){
    //        var pai = seatData.holds[i];
    //        if(getTileType(pai) == seatData.que){
    //            return;
    //        }   
    //    }

    //检查是否是七对 前提是没有碰，也没有杠 ，即手上拥有13张牌
    if (a_seat.holds.length == 13) {
        //有5对牌
        var canWin = false;
        var single = -1;
        var cntPair = 0;
        for (var key in a_seat.countMap) {
            var count = a_seat.countMap[key];
            if (count == 2 || count == 3) {
                cntPair++;
            } else if (count == 4) {
                cntPair += 2;
            }

            if (count == 1 || count == 3) {
                //如果已经有单牌了，表示不止一张单牌，并没有下叫。直接闪
                if (single >= 0) {
                    break;
                }
                single = key;
            }
        }

        //检查是否有6对 并且单牌是不是目标牌
        if (cntPair == 6) {
            //七对只能和一张，就是手上那张单牌
            //七对的番数＝ 2番+N个4个牌（即龙七对）
            a_seat.tingMap[single] = {
                fan: 2,
                pattern: "7pairs"
            };
            //如果是，则直接返回咯
        }
    }

    //检查是否是对对胡  由于四川麻将没有吃，所以只需要检查手上的牌
    //对对胡叫牌有两种情况
    //1、N坎 + 1张单牌
    //2、N-1坎 + 两对牌
    var cntSingle = 0;
    var cntTriplet = 0;
    var cntPair = 0;
    var readyTiles = [];
    for (var key in a_seat.countMap) {
        var count = a_seat.countMap[key];
        if (count == 1) {
            cntSingle++;
            readyTiles.push(key);
        } else if (count == 2) {
            cntPair++;
            readyTiles.push(key);
        } else if (count == 3) {
            cntTriplet++;
        } else if (count == 4) {
            //手上有4个一样的牌，在四川麻将中是和不了对对胡的 随便加点东西
            cntSingle++;
            cntPair += 2;
        }
    }

    if ((cntPair == 2 && cntSingle == 0) || (cntPair == 0 && cntSingle == 1)) {
        for (var i = 0; i < readyTiles.length; ++i) {
            //对对胡1番
            var tile = readyTiles[i];
            if (a_seat.tingMap[tile] == null) {
                a_seat.tingMap[tile] = {
                    pattern: "duidui",
                    fan: 1
                };
            }
        }
    }

    //console.log(seatData.holds);
    //console.log(seatData.countMap);
    //console.log("singleCount:" + singleCount + ",colCount:" + colCount + ",pairCount:" + pairCount);
    //检查是不是平胡
//    if (seatData.que != 0) {
        g_mjutils.checkTingPai(a_seat, 0, 9);
//    }

//    if (seatData.que != 1) {
        g_mjutils.checkTingPai(a_seat, 9, 18);
//    }

//    if (seatData.que != 2) {
        g_mjutils.checkTingPai(a_seat, 18, 27);
//    }
}

function getSeatIndex(a_userId) {
    var seatIndex = g_roomMgr.getUserSeat(a_userId);
    if (seatIndex == null) {
        return null;
    }
    return seatIndex;
}

function getGameByUserID(a_userId) {
    var roomId = g_roomMgr.getUserRoom(a_userId);
    if (roomId == null) {
        return null;
    }
    var game = g_games[roomId];
    return game;
}

function hasOperations(a_seat) {
    if (a_seat.canGang || a_seat.canPeng || a_seat.canHu) {
        return true;
    }
    return false;
}

function sendOperations(a_game, a_seat, a_tile) {
    if (hasOperations(a_seat)) {
        if (a_tile == -1) {
            a_tile = a_seat.holds[a_seat.holds.length - 1];
        }

        var msgData = {
            pai: a_tile,
            hu: a_seat.canHu,
            peng: a_seat.canPeng,
            gang: a_seat.canGang,
            gangpai: a_seat.gangPai
        };

        //如果可以有操作，则进行操作
        g_userMgr.sendMsg(a_seat.userId, "push_game_actions", msgData);

        msgData.si = a_seat.seatIndex;
    } else {
        g_userMgr.sendMsg(a_seat.userId, "push_game_actions");
    }
}

function moveToNextUser(a_game, a_nextSeat) {
    a_game.fangpaoshumu = 0;
    //找到下一个没有和牌的玩家
    if (a_nextSeat == null) {
        a_game.turn++;
        a_game.turn %= 4;
        return;
    } else {
        a_game.turn = a_nextSeat;
    }
}

function doUserMoPai(a_game) {
    a_game.chuPai = -1;
    var turnSeat = a_game.gameSeats[a_game.turn];
    turnSeat.lastFangGangSeat = -1;
    turnSeat.guoHuFan = -1;
    var tile = drawTile(a_game, a_game.turn);
    //牌摸完了，结束
    if (tile == -1) {
        doGameOver(a_game, turnSeat.userId);
        return;
    } else {
        var poolRemaining = a_game.mahjongs.length - a_game.currentIndex;
        g_userMgr.broacastInRoom("push_remaining_tiles", poolRemaining, turnSeat.userId, true);
    }

    recordGameAction(a_game, a_game.turn, ACTION_MOPAI, tile);

    //通知前端新摸的牌
    g_userMgr.sendMsg(turnSeat.userId, "push_game_draw_tile", tile);
    //检查是否可以暗杠或者胡
    //检查胡，直杠，弯杠
    if (!turnSeat.hued) {
        checkCanAnGang(a_game, turnSeat);
    }

    //如果未胡牌，或者摸起来的牌可以杠，才检查弯杠
    if (!turnSeat.hued || turnSeat.holds[turnSeat.holds.length - 1] == tile) {
        checkCanWanGang(a_game, turnSeat, tile);
    }


    //检查看是否可以和
    checkCanHu(a_game, turnSeat, tile);

    //广播通知玩家出牌方
    //console.log("--doUserMoPai");
    turnSeat.canChuPai = true;
    g_userMgr.broacastInRoom("push_game_turn", turnSeat.userId, turnSeat.userId, true);

    //通知玩家做对应操作
    sendOperations(a_game, turnSeat, a_game.chuPai);
}

function isSameType(a_type, a_Tiles) {
    for (var i = 0; i < a_Tiles.length; ++i) {
        var type = getTileType(a_Tiles[i]);
        if (a_type != -1 && a_type != type) {
            return false;
        }
        a_type = type;
    }
    return true;
}

function isQingYiSe(a_seat) {
    var type = getTileType(a_seat.holds[0]);

    //检查手上的牌
    if (isSameType(type, a_seat.holds) == false) {
        return false;
    }

    //检查杠下的牌
    if (isSameType(type, a_seat.angangs) == false) {
        return false;
    }
    if (isSameType(type, a_seat.wangangs) == false) {
        return false;
    }
    if (isSameType(type, a_seat.diangangs) == false) {
        return false;
    }

    //检查碰牌
    if (isSameType(type, a_seat.pengs) == false) {
        return false;
    }

    return true;
}

function isMenQing(a_seat) {
    return (a_seat.pengs.length + a_seat.wangangs.length + a_seat.diangangs.length) == 0;
}

function isZhongZhang(a_seat) {
    var fnAllZhongZhang = function (a_fn_tiles) {
        for (var i = 0; i < a_fn_tiles.length; ++i) {
            var tile = a_fn_tiles[i];
            if (tile == 0 || tile == 8 || tile == 9 || tile == 17 || tile == 18 || tile == 26) {
                return false;
            }
        }
        return true;
    }

    if (fnAllZhongZhang(a_seat.pengs) == false) {
        return false;
    }
    if (fnAllZhongZhang(a_seat.angangs) == false) {
        return false;
    }
    if (fnAllZhongZhang(a_seat.diangangs) == false) {
        return false;
    }
    if (fnAllZhongZhang(a_seat.wangangs) == false) {
        return false;
    }
    if (fnAllZhongZhang(a_seat.holds) == false) {
        return false;
    }

    return true;
}

function isJiangDui(a_seat) {
    var fnAllJiangDui = function (a_fn_tiles) {
        for (var i = 0; i < a_fn_tiles.length; ++i) {
            var tile = a_fn_tiles[i];
            if (tile != 1 && tile != 4 && tile != 7 &&
                tile != 9 && tile != 13 && tile != 16 &&
                tile != 18 && tile != 21 && tile != 25
            ) {
                return false;
            }
        }
        return true;
    }

    if (fnAllJiangDui(a_seat.pengs) == false) {
        return false;
    }
    if (fnAllJiangDui(a_seat.angangs) == false) {
        return false;
    }
    if (fnAllJiangDui(a_seat.diangangs) == false) {
        return false;
    }
    if (fnAllJiangDui(a_seat.wangangs) == false) {
        return false;
    }
    if (fnAllJiangDui(a_seat.holds) == false) {
        return false;
    }

    return true;
}

function isTinged(a_seat) {
    for (var key in a_seat.tingMap) {
        return true;
    }
    return false;
}

function computeFanScore(a_game, a_points) {
    if (a_points > a_game.conf.maxFan) {
        a_points = a_game.conf.maxFan;
    }
    return (1 << a_points) * a_game.conf.baseScore;
}

//是否需要查大叫(有人没有下叫)
function needChaDaJiao(a_game) {
    //查叫
    var cntOfWon = 0;
    var cntOfReady = 0;
    var cntOfNotReady = 0;
    for (var i = 0; i < a_game.gameSeats.length; ++i) {
        var seat = a_game.gameSeats[i];
        if (seat.hued) {
            cntOfWon++;
            cntOfReady++;
        } else if (isTinged(seat)) {
            cntOfReady++;
        } else {
            cntOfNotReady++;
        }
    }

    //如果没有任何一个人叫牌，则不需要查叫
    if (cntOfReady == 0) {
        return false;
    }

    //如果都听牌了，也不需要查叫
    if (cntOfNotReady == 0) {
        return false;
    }

    return true;
}

function findMaxFanTingPai(a_seat) {
    //找出最大番
    var ready = null;
    for (var key in a_seat.tingMap) {
        var readyTile = a_seat.tingMap[key];
        if (ready == null || readyTile.fan > ready.fan) {
            ready = readyTile;
            ready.pai = parseInt(key);
        }
    }
    return ready;
}

function findUnTingedPlayers(a_game) {
    var seatIndexes = [];
    for (var i = 0; i < a_game.gameSeats.length; ++i) {
        var seat = a_game.gameSeats[i];
        //如果没有胡，且没有听牌
        if (!seat.hued && !isTinged(seat)) {
            seatIndexes.push(i);
        }
    }
    return seatIndexes;
}

function getNumOfGen(a_seat) {
    var numOfGangs = a_seat.diangangs.length + a_seat.wangangs.length + a_seat.angangs.length;
    for (var i = 0; i < a_seat.pengs.length; ++i) {
        var tile = a_seat.pengs[i];
        if (a_seat.countMap[tile] == 1) {
            numOfGangs++;
        }
    }
    for (var key in a_seat.countMap) {
        if (a_seat.countMap[key] == 4) {
            numOfGangs++;
        }
    }
    return numOfGangs;
}

function chaJiao(a_game) {
    var notreadySeatIndexes = findUnTingedPlayers(a_game);
    if (notreadySeatIndexes.length == 0) {
        return;
    }
    for (var i = 0; i < a_game.gameSeats.length; ++i) {
        var seat = a_game.gameSeats[i];
        //如果听牌了，则未叫牌的人要给钱
        if (isTinged(seat)) {
            var ready = findMaxFanTingPai(seat);
            seat.huInfo.push({
                ishupai: true,
                action: "chadajiao",
                fan: ready.fan,
                pattern: ready.pattern,
                pai: ready.pai,
                numofgen: getNumOfGen(seat),
            });

            for (var j = 0; j < notreadySeatIndexes.length; ++j) {
                a_game.gameSeats[notreadySeatIndexes[j]].huInfo.push({
                    action: "beichadajiao",
                    target: i,
                    index: seat.huInfo.length - 1,
                });
            }
        }
    }
}

function calculateResult(a_game, a_roomInfo) {

    var isNeedChaDaJiao = needChaDaJiao(a_game);
    if (isNeedChaDaJiao) {
        chaJiao(a_game);
    }

    var baseChip = a_game.conf.baseScore;

    for (var i = 0; i < a_game.gameSeats.length; ++i) {
        var seat = a_game.gameSeats[i];
        //对所有胡牌的玩家进行统计
        if (isTinged(seat)) {
            //收杠钱
            var additonalPoints = 0;
            for (var j = 0; j < seat.actions.length; ++j) {
                var action = seat.actions[j];
                if (action.type == "fanggang") {
                    var target = a_game.gameSeats[action.targets[0]];
                    //检查放杠的情况，如果目标没有和牌，且没有叫牌，则不算 用于优化前端显示
                    if (isNeedChaDaJiao && (target.hued) == false && (isTinged(target) == false)) {
                        action.state = "nop";
                    }
                } else if (action.type == "angang" || action.type == "wangang" || action.type == "diangang") {
                    if (action.state != "nop") {
                        var points = action.score;
                        additonalPoints += action.targets.length * points * baseChip;
                        //扣掉目标方的分
                        for (var k = 0; k < action.targets.length; ++k) {
                            var target = action.targets[k];
                            a_game.gameSeats[target].score -= points * baseChip;
                        }
                    }
                } else if (action.type == "maozhuanyu") {
                    //对于呼叫转移，如果对方没有叫牌，表示不得行
                    if (isTinged(action.owner)) {
                        //如果
                        var ref = action.ref;
                        var points = ref.score;
                        var totalPoints = ref.targets.length * points * baseChip;
                        additonalPoints += totalPoints;
                        //扣掉目标方的分
                        if (ref.payTimes == 0) {
                            for (var k = 0; k < ref.targets.length; ++k) {
                                var target = ref.targets[k];
                                a_game.gameSeats[target].score -= points * baseChip;
                            }
                        } else {
                            //如果已经被扣过一次了，则由杠牌这家赔
                            action.owner.score -= totalPoints;
                        }
                        ref.payTimes++;
                        action.owner = null;
                        action.ref = null;
                    }
                }
            }

            if (isQingYiSe(seat)) {
                seat.qingyise = true;
            }

            if (a_game.conf.menqing) {
                seat.isMenQing = isMenQing(seat);
            }

            //金钩胡
            if (seat.holds.length == 1 || seat.holds.length == 2) {
                seat.isJinGouHu = true;
            }

            seat.numAnGang = seat.angangs.length;
            seat.numMingGang = seat.wangangs.length + seat.diangangs.length;

            //进行胡牌结算
            for (var j = 0; j < seat.huInfo.length; ++j) {
                var winInfo = seat.huInfo[j];
                if (!winInfo.ishupai) {
                    seat.numDianPao++;
                    continue;
                }
                //统计自己的番子和分数
                //基础番(平胡0番，对对胡1番、七对2番) + 清一色2番 + 杠+1番
                //杠上花+1番，杠上炮+1番 抢杠胡+1番，金钩胡+1番，海底胡+1番
                var points = winInfo.fan;
                seat.holds.push(winInfo.pai);
                if (seat.countMap[winInfo.pai] != null) {
                    seat.countMap[winInfo.pai]++;
                } else {
                    seat.countMap[winInfo.pai] = 1;
                }

                if (seat.qingyise) {
                    points += 2;
                }

                //金钩胡
                if (seat.isJinGouHu) {
                    points += 1;
                }

                if (winInfo.isHaiDiHu) {
                    points += 1;
                }

                if (a_game.conf.tiandihu) {
                    if (winInfo.isTianHu) {
                        points += 3;
                    } else if (winInfo.isDiHu) {
                        points += 2;
                    }
                }

                var isJiangDui = false;
                if (a_game.conf.jiangdui) {
                    if (winInfo.pattern == "7pairs") {
                        if (winInfo.numofgen > 0) {
                            winInfo.numofgen -= 1;
                            winInfo.pattern == "l7pairs";
                            isJiangDui = isJiangDui(seat);
                            if (isJiangDui) {
                                winInfo.pattern == "j7paris";
                                points += 2;
                            } else {
                                points += 1;
                            }
                        }
                    } else if (winInfo.pattern == "duidui") {
                        isJiangDui = isJiangDui(seat);
                        if (isJiangDui) {
                            winInfo.pattern = "jiangdui";
                            points += 2;
                        }
                    }
                }

                if (a_game.conf.menqing) {
                    //不是将对，才检查中张
                    if (!isJiangDui) {
                        seat.isZhongZhang = isZhongZhang(seat);
                        if (seat.isZhongZhang) {
                            points += 1;
                        }
                    }

                    if (seat.isMenQing) {
                        points += 1;
                    }
                }

                points += winInfo.numofgen;

                if (winInfo.action == "ganghua" || winInfo.action == "dianganghua" || winInfo.action == "gangpaohu" || winInfo.action == "qiangganghu") {
                    points += 1;
                }

                var extraScore = 0;
                if (winInfo.iszimo) {
                    if (a_game.conf.zimo == 0) {
                        //自摸加底
                        extraScore = baseChip;
                    } else if (a_game.conf.zimo == 1) {
                        points += 1;
                    } else {
                        //nothing.
                    }
                }
                //和牌的玩家才加这个分
                var score = computeFanScore(a_game, points) + extraScore;
                if (winInfo.action == "chadajiao") {
                    //收所有没有叫牌的人的钱
                    for (var k = 0; k < a_game.gameSeats.length; ++k) {
                        if (!isTinged(a_game.gameSeats[k])) {
                            a_game.gameSeats[k].score -= score;
                            seat.score += score;
                            //被查叫次数
                            if (a_game.gameSeats[k] != seat) {
                                a_game.gameSeats[k].numChaJiao++;
                            }
                        }
                    }
                } else if (winInfo.iszimo) {
                    //收所有人的钱
                    seat.score += score * a_game.gameSeats.length;
                    for (var k = 0; k < a_game.gameSeats.length; ++k) {
                        a_game.gameSeats[k].score -= score;
                    }
                    seat.numZiMo++;
                } else {
                    //收放炮者的钱
                    seat.score += score;
                    a_game.gameSeats[winInfo.target].score -= score;
                    seat.numJiePao++;
                }

                //撤除胡的那张牌
                seat.holds.pop();
                seat.countMap[winInfo.pai]--;

                if (points > a_game.conf.maxFan) {
                    points = a_game.conf.maxFan;
                }
                winInfo.fan = points;
            }
            //一定要用 += 。 因为此时的sd.score可能是负的
            seat.score += additonalPoints;
        } else {
            for (var k = seat.actions.length - 1; k >= 0; --k) {
                var action = seat.actions[k];
                if (action.type == "angang" || action.type == "wangang" || action.type == "diangang") {
                    //如果3家都胡牌，则需要结算。否则认为是查叫
                    if (isNeedChaDaJiao) {
                        seat.actions.splice(k, 1);
                    } else {
                        if (action.state != "nop") {
                            var points = action.score;
                            seat.score += action.targets.length * points * baseChip;
                            //扣掉目标方的分
                            for (var k = 0; k < action.targets.length; ++k) {
                                var target = action.targets[k];
                                a_game.gameSeats[target].score -= points * baseChip;
                            }
                        }
                    }
                }
            }
        }
    }
}

function doGameOver(a_game, a_userId, a_forceEnd) {
    var roomId = g_roomMgr.getUserRoom(a_userId);
    if (roomId == null) {
        return;
    }
    var roomInfo = g_roomMgr.getRoom(roomId);
    if (roomInfo == null) {
        return;
    }

    var results = [];
    var dbResult = [0, 0, 0, 0];

    var fnNotifyResult = function (a_fn_isEnd) {
        var endInfo = null;
        if (a_fn_isEnd) {
            endInfo = [];
            for (var i = 0; i < roomInfo.seats.length; ++i) {
                var seat = roomInfo.seats[i];
                endInfo.push({
                    numzimo: seat.numZiMo,
                    numjiepao: seat.numJiePao,
                    numdianpao: seat.numDianPao,
                    numangang: seat.numAnGang,
                    numminggang: seat.numMingGang,
                    numchadajiao: seat.numChaJiao,
                });
            }
        }

        g_userMgr.broacastInRoom("push_hand_finish", {
            results: results,
            endinfo: endInfo
        }, a_userId, true);
        //如果局数已够，则进行整体结算，并关闭房间
        if (a_fn_isEnd) {
            setTimeout(function () {
                if (roomInfo.numOfGames > 1) {
                    store_history(roomInfo);
                }
                g_userMgr.kickAllInRoom(roomId);
                g_roomMgr.destroy(roomId);
                g_db.archive_games(roomInfo.uuid);
            }, 1500);
        }
    }

    if (a_game != null) {
        if (!a_forceEnd) {
            calculateResult(a_game, roomInfo);
        }

        for (var i = 0; i < roomInfo.seats.length; ++i) {
            var rootSeat = roomInfo.seats[i];
            var gameSeat = a_game.gameSeats[i];

            rootSeat.ready = false;
            rootSeat.score += gameSeat.score
            rootSeat.numZiMo += gameSeat.numZiMo;
            rootSeat.numJiePao += gameSeat.numJiePao;
            rootSeat.numDianPao += gameSeat.numDianPao;
            rootSeat.numAnGang += gameSeat.numAnGang;
            rootSeat.numMingGang += gameSeat.numMingGang;
            rootSeat.numChaJiao += gameSeat.numChaJiao;

            var userResult = {
                userId: gameSeat.userId,
                actions: [],
                pengs: gameSeat.pengs,
                wangangs: gameSeat.wangangs,
                diangangs: gameSeat.diangangs,
                angangs: gameSeat.angangs,
                holds: gameSeat.holds,
                score: gameSeat.score,
                totalscore: rootSeat.score,
                qingyise: gameSeat.qingyise,
                menqing: gameSeat.isMenQing,
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
            delete g_gameSeatsOfUsers[gameSeat.userId];
        }
        delete g_games[roomId];

        var dealer = roomInfo.nextButton;
        if (a_game.yipaoduoxiang >= 0) {
            roomInfo.nextButton = a_game.yipaoduoxiang;
        } else if (a_game.firstHupai >= 0) {
            roomInfo.nextButton = a_game.firstHupai;
        } else {
            roomInfo.nextButton = (a_game.turn + 1) % 4;
        }

        if (dealer != roomInfo.nextButton) {
            g_db.update_next_button(roomId, roomInfo.nextButton);
        }
    }

    if (a_forceEnd || a_game == null) {
        fnNotifyResult(true);
    } else {
        //保存游戏
        store_game(a_game, function (ret) {
            g_db.update_game_result(roomInfo.uuid, a_game.gameIndex, dbResult);

            //记录玩家操作
            var strActionList = JSON.stringify(a_game.actionList);
            g_db.update_game_action_records(roomInfo.uuid, a_game.gameIndex, strActionList);

            //保存游戏局数
            g_db.update_num_of_turns(roomId, roomInfo.numOfGames);

            //如果是第一次，则扣除房卡
            if (roomInfo.numOfGames == 1) {
                var cost = 2;
                if (roomInfo.conf.maxGames == 8) {
                    cost = 3;
                }
                g_db.cost_gems(a_game.gameSeats[0].userId, cost);
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
            if (i != a_seat.seatIndex /* && s.hued == false*/ ) {
                action.targets.push(i);
            }
        }
    }

    a_seat.actions.push(action);
    return action;
}

function recordGameAction(a_game, a_si, a_action, a_tile) {
    a_game.actionList.push(a_si);
    a_game.actionList.push(a_action);
    if (a_tile != null) {
        a_game.actionList.push(a_tile);
    }
}

exports.setReady = function (a_userId, a_callback) {
    var roomId = g_roomMgr.getUserRoom(a_userId);
    if (roomId == null) {
        return;
    }
    var roomInfo = g_roomMgr.getRoom(roomId);
    if (roomInfo == null) {
        return;
    }

    g_roomMgr.setReady(a_userId, true);

    var game = g_games[roomId];
    if (game == null) {
        if (roomInfo.seats.length == 4) {
            for (var i = 0; i < roomInfo.seats.length; ++i) {
                var seat = roomInfo.seats[i];
                if (seat.ready == false || g_userMgr.isOnline(seat.userId) == false) {
                    return;
                }
            }
            //4个人到齐了，并且都准备好了，则开始新的一局
            exports.begin(roomId);
        }
    } else {
        var poolRemaining = game.mahjongs.length - game.currentIndex;
        var gameRemaining = roomInfo.conf.maxGames - roomInfo.numOfGames;

        var msgData = {
            state: game.state,
            numofmj: poolRemaining,
            button: game.button,
            turn: game.turn,
            chuPai: game.chuPai,
        };

        msgData.seats = [];
        var seatData = null;
        for (var i = 0; i < 4; ++i) {
            var seat = game.gameSeats[i];

            var s = {
                userid: seat.userId,
                folds: seat.folds,
                angangs: seat.angangs,
                diangangs: seat.diangangs,
                wangangs: seat.wangangs,
                pengs: seat.pengs,
                que: seat.que,
                hued: seat.hued,
                huinfo: seat.huInfo,
                iszimo: seat.iszimo,
            }
            if (seat.userId == a_userId) {
                seat.holds = seat.holds;
                seat.huanpais = seat.huanpais;
                seatData = seat;
            } else {
                seat.huanpais = seat.huanpais ? [] : null;
            }
            msgData.seats.push(seat);
        }

        //同步整个信息给客户端
        g_userMgr.sendMsg(a_userId, "push_game_sync", msgData);
        sendOperations(game, seat, game.chuPai);
    }
}

function store_single_history(a_userId, a_history) {
    g_db.get_user_history(a_userId, function (data) {
        if (data == null) {
            data = [];
        }
        while (data.length >= 10) {
            data.shift();
        }
        data.push(a_history);
        g_db.update_user_history(a_userId, data);
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
        historySeat.name = g_crypto.toBase64(seat.name);
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
        button: a_game.button,
        index: a_game.gameIndex,
        mahjongs: a_game.mahjongs,
        game_seats: new Array(4)
    }
    for (var i = 0; i < 4; ++i) {
        baseInfo.game_seats[i] = a_game.gameSeats[i].holds;
    }
    a_game.baseInfoJson = JSON.stringify(baseInfo);
}

function store_game(a_game, a_callback) {
    g_db.create_game(a_game.roomInfo.uuid, a_game.gameIndex, a_game.baseInfoJson, a_callback);
}

function doDingque(a_userId, a_type) {
    var seatData = g_gameSeatsOfUsers[a_userId];
    if (seatData == null) {
        console.log("cannot find user game data.");
        return;
    }

    var game = seatData.game;
    //if (game.state != "dingque") {
    //    console.log("cannot recv dingQue when game.state == " + game.state);
    //    return;
    //}

    //if (seatData.que < 0) {
    //    game.numOfQue++;
    //}

    //seatData.que = a_type;

    //检查玩家可以做的动作
    //如果4个人都定缺了，通知庄家出牌
    //if (game.numOfQue == 4) {
        construct_game_base_info(game);

        var queArr = [1, 1, 1, 1];
        for (var i = 0; i < game.gameSeats.length; ++i) {
            queArr[i] = game.gameSeats[i].que;
        }
        //userMgr.broacastInRoom("push_game_dingque_finish", arr, seatData.userId, true);
        g_userMgr.broacastInRoom("push_game_playing", null, seatData.userId, true);

        //进行听牌检查
        for (var i = 0; i < game.gameSeats.length; ++i) {
            var dealerTile = -1;
            var gameSeat = game.gameSeats[i];
            if (gameSeat.holds.length == 14) {
                dealerTile = gameSeat.holds.pop();
                gameSeat.countMap[dealerTile] -= 1;
            }
            checkCanTingPai(game, gameSeat);
            if (dealerTile >= 0) {
                gameSeat.holds.push(dealerTile);
                gameSeat.countMap[dealerTile]++;
            }
        }

        var turnSeat = game.gameSeats[game.turn];
        game.state = "playing";
        //通知玩家出牌方
        //console.log("--dingQue");
        turnSeat.canChuPai = true;
        g_userMgr.broacastInRoom("push_game_turn", turnSeat.userId, turnSeat.userId, true);
        //检查是否可以暗杠或者胡
        //直杠
        checkCanAnGang(game, turnSeat);
        //检查胡 用最后一张来检查
        checkCanHu(game, turnSeat, turnSeat.holds[turnSeat.holds.length - 1]);
        //通知前端
        sendOperations(game, turnSeat, game.chuPai);
    //} else {
    //    userMgr.broacastInRoom("push_game_dingque", seatData.userId, seatData.userId, true);
    //}
}

//开始新的一局
exports.begin = function (a_roomId) {
    var roomInfo = g_roomMgr.getRoom(a_roomId);
    if (roomInfo == null) {
        return;
    }
    var seats = roomInfo.seats;

    var game = {
        conf: roomInfo.conf,
        roomInfo: roomInfo,
        gameIndex: roomInfo.numOfGames,

        button: roomInfo.nextButton,
        mahjongs: new Array(144),
        currentIndex: 0,
        gameSeats: new Array(4),

        numOfQue: 0,
        turn: 0,
        chuPai: -1,
        state: "idle",
        firstHupai: -1,
        yipaoduoxiang: -1,
        fangpaoshumu: -1,
        actionList: [],
        chupaiCnt: 0,
    };

    roomInfo.numOfGames++;

    for (var i = 0; i < 4; ++i) {
        var seat = game.gameSeats[i] = {};

        seat.game = game;

        seat.seatIndex = i;

        seat.userId = seats[i].userId;
        //持有的牌
        seat.holds = [];
        //打出的牌
        seat.folds = [];
        //暗杠的牌
        seat.angangs = [];
        //点杠的牌
        seat.diangangs = [];
        //弯杠的牌
        seat.wangangs = [];
        //碰了的牌
        seat.pengs = [];
        //缺一门
        seat.que = -1;

        //换三张的牌
        seat.huanpais = null;

        //玩家手上的牌的数目，用于快速判定碰杠
        seat.countMap = {};
        //玩家听牌，用于快速判定胡了的番数
        seat.tingMap = {};
        seat.pattern = "";

        //是否可以杠
        seat.canGang = false;
        //用于记录玩家可以杠的牌
        seat.gangPai = [];

        //是否可以碰
        seat.canPeng = false;
        //是否可以胡
        seat.canHu = false;
        //是否可以出牌
        //console.log("--begin");
        seat.canChuPai = true;

        //如果guoHuFan >=0 表示处于过胡状态，
        //如果过胡状态，那么只能胡大于过胡番数的牌
        seat.guoHuFan = -1;

        //是否胡了
        seat.hued = false;
        //
        seat.actions = [];

        //是否是自摸
        seat.iszimo = false;
        seat.isGangHu = false;
        seat.fan = 0;
        seat.score = 0;
        seat.huInfo = [];


        seat.lastFangGangSeat = -1;

        //统计信息
        seat.numZiMo = 0;
        seat.numJiePao = 0;
        seat.numDianPao = 0;
        seat.numAnGang = 0;
        seat.numMingGang = 0;
        seat.numChaJiao = 0;

        g_gameSeatsOfUsers[seat.userId] = seat;
    }
    g_games[a_roomId] = game;

    //洗牌
    shuffle(game);

    //发牌
    deal(game);

    var poolRemaining = game.mahjongs.length - game.currentIndex;
    var isHuanSanZhang = roomInfo.conf.hsz;

    for (var i = 0; i < seats.length; ++i) {
        //开局时，通知前端必要的数据
        var seat = seats[i];

        //通知玩家手牌
        g_userMgr.sendMsg(seat.userId, "push_hands", game.gameSeats[i].holds);
        //通知还剩多少张牌
        g_userMgr.sendMsg(seat.userId, "push_remaining_tiles", poolRemaining);
        //通知还剩多少局
        g_userMgr.sendMsg(seat.userId, "push_remaining_hands", roomInfo.numOfGames);
        //通知游戏开始
        g_userMgr.sendMsg(seat.userId, "push_game_begin", game.button);

        if (isHuanSanZhang == true) {
            game.state = "huanpai";
            //通知准备换牌
            g_userMgr.sendMsg(seat.userId, "push_game_huanpai");
        }// else {
        //    game.state = "dingque";
        //    //通知准备定缺
        //    userMgr.sendMsg(s.userId, "push_game_dingque");
        //}

        doDingque(seat.userId, 0);
    }
};

exports.huanSanZhang = function (a_fn_userId, a_tile1, a_tile2, a_tile3) {
    var seatData = g_gameSeatsOfUsers[a_fn_userId];
    if (seatData == null) {
        console.log("cannot find user game data.");
        return;
    }

    var game = seatData.game;
    if (game.state != "huanpai") {
        console.log("cannot recv huansanzhang when game.state == " + game.state);
        return;
    }

    if (seatData.huanpais != null) {
        console.log("player has done this action.");
        return;
    }

    if (seatData.countMap[a_tile1] == null || seatData.countMap[a_tile1] == 0) {
        return;
    }
    seatData.countMap[a_tile1]--;

    if (seatData.countMap[a_tile2] == null || seatData.countMap[a_tile2] == 0) {
        seatData.countMap[a_tile1]++;
        return;
    }
    seatData.countMap[a_tile2]--;

    if (seatData.countMap[a_tile3] == null || seatData.countMap[a_tile3] == 0) {
        seatData.countMap[a_tile1]++;
        seatData.countMap[a_tile2]++;
        return;
    }

    seatData.countMap[a_tile1]++;
    seatData.countMap[a_tile2]++;

    seatData.huanpais = [a_tile1, a_tile2, a_tile3];

    for (var i = 0; i < seatData.huanpais.length; ++i) {
        var tile = seatData.huanpais[i];
        var index = seatData.holds.indexOf(tile);
        seatData.holds.splice(index, 1);
        seatData.countMap[tile]--;
    }
    g_userMgr.sendMsg(seatData.userId, "push_hands", seatData.holds);

    for (var i = 0; i < game.gameSeats.length; ++i) {
        var seat = game.gameSeats[i];
        if (seat == seatData) {
            var msgData = {
                si: seatData.userId,
                huanpais: seatData.huanpais
            };
            g_userMgr.sendMsg(seat.userId, "push_huanpai", msgData);
        } else {
            var msgData = {
                si: seatData.userId,
                huanpais: []
            };
            g_userMgr.sendMsg(seat.userId, "push_huanpai", msgData);
        }
    }

    //如果还有未换牌的玩家，则继承等待
    for (var i = 0; i < game.gameSeats.length; ++i) {
        if (game.gameSeats[i].huanpais == null) {
            return;
        }
    }

    //换牌函数
    var fnChange3Tiles = function (a_seat, a_tiles) {
        for (var i = 0; i < a_tiles.length; ++i) {
            var p = a_tiles[i];
            a_seat.holds.push(p);
            if (a_seat.countMap[p] == null) {
                a_seat.countMap[p] = 0;
            }
            a_seat.countMap[p]++;
        }
    }

    //开始换牌
    var randomNum = Math.random();
    var seat = game.gameSeats;
    var huanpaiMethod = 0;
    //对家换牌
    if (randomNum < 0.33) {
        fnChange3Tiles(seat[0], seat[2].huanpais);
        fnChange3Tiles(seat[1], seat[3].huanpais);
        fnChange3Tiles(seat[2], seat[0].huanpais);
        fnChange3Tiles(seat[3], seat[1].huanpais);
        huanpaiMethod = 0;
    }
    //换下家的牌
    else if (randomNum < 0.66) {
        fnChange3Tiles(seat[0], seat[1].huanpais);
        fnChange3Tiles(seat[1], seat[2].huanpais);
        fnChange3Tiles(seat[2], seat[3].huanpais);
        fnChange3Tiles(seat[3], seat[0].huanpais);
        huanpaiMethod = 1;
    }
    //换上家的牌
    else {
        fnChange3Tiles(seat[0], seat[3].huanpais);
        fnChange3Tiles(seat[1], seat[0].huanpais);
        fnChange3Tiles(seat[2], seat[1].huanpais);
        fnChange3Tiles(seat[3], seat[2].huanpais);
        huanpaiMethod = 2;
    }

    var msgData = {
        method: huanpaiMethod,
    }
    game.huanpaiMethod = huanpaiMethod;

    //game.state = "dingque";
    for (var i = 0; i < seat.length; ++i) {
        var a_fn_userId = seat[i].userId;
        g_userMgr.sendMsg(a_fn_userId, "push_huanpai_finish", msgData);

        g_userMgr.sendMsg(a_fn_userId, "push_hands", seat[i].holds);
        //通知准备定缺
    //    userMgr.sendMsg(userId, "push_game_dingque");
    }
};

exports.dingQue = function (a_userId, a_type) {
    doDingque(a_userId, a_type);
};

exports.chuPai = function (a_userId, a_tile) {
    a_tile = Number.parseInt(a_tile);
    var seatData = g_gameSeatsOfUsers[a_userId];
    if (seatData == null) {
        console.log("cannot find user game data.");
        return;
    }

    var game = seatData.game;
    var seatIndex = seatData.seatIndex;
    //如果不该他出，则忽略
    if (game.turn != seatData.seatIndex) {
        console.log("not your turn.");
        return;
    }

    //console.log("--chuPai 1");
    if (seatData.canChuPai == false) {
        console.log("Cannot discard.");
        return;
    }

    if (hasOperations(seatData)) {
        console.log("Please pass before you discard.");
        return;
    }

    //如果是胡了的人，则只能打最后一张牌
    if (seatData.hued) {
        if (seatData.holds[seatData.holds.length - 1] != a_tile) {
            console.log("only deal last one when hued.");
            return;
        }
    }

    //从此人牌中扣除
    var index = seatData.holds.indexOf(a_tile);
    if (index == -1) {
        console.log("holds:" + seatData.holds);
        console.log("cannot find tile." + a_tile);
        return;
    }

    //console.log("--chuPai 2");
    seatData.canChuPai = false;
    game.chupaiCnt++;
    seatData.guoHuFan = -1;

    seatData.holds.splice(index, 1);
    seatData.countMap[a_tile]--;
    game.chuPai = a_tile;
    recordGameAction(game, seatData.seatIndex, ACTION_CHUPAI, a_tile);
    checkCanTingPai(game, seatData);
    g_userMgr.broacastInRoom("push_game_discard_tile", {
        userId: seatData.userId,
        pai: a_tile
    }, seatData.userId, true);

    //如果出的牌可以胡，则算过胡
    if (seatData.tingMap[game.chuPai]) {
        seatData.guoHuFan = seatData.tingMap[game.chuPai].fan;
    }

    //检查是否有人要胡，要碰 要杠
    var hasActions = false;
    for (var i = 0; i < game.gameSeats.length; ++i) {
        //玩家自己不检查
        if (game.turn == i) {
            continue;
        }
        var seat = game.gameSeats[i];
        //未胡牌的才检查杠和碰
        if (!seat.hued) {
            checkCanPeng(game, seat, a_tile);
            checkCanDianGang(game, seat, a_tile);
        }

        checkCanHu(game, seat, a_tile);
        if (seatData.lastFangGangSeat == -1) {
            if (seat.canHu && seat.guoHuFan >= 0 && seat.tingMap[a_tile].fan <= seat.guoHuFan) {
                console.log("ddd.guoHuFan:" + seat.guoHuFan);
                seat.canHu = false;
                g_userMgr.sendMsg(seat.userId, "push_player_pass_win");
            }
        }

        if (hasOperations(seat)) {
            sendOperations(game, seat, game.chuPai);
            hasActions = true;
        }
    }

    //如果没有人有操作，则向下一家发牌，并通知他出牌
    if (!hasActions) {
        setTimeout(function () {
            g_userMgr.broacastInRoom("push_player_pass", {
                userId: seatData.userId,
                pai: game.chuPai
            }, seatData.userId, true);
            seatData.folds.push(game.chuPai);
            game.chuPai = -1;
            moveToNextUser(game);
            doUserMoPai(game);
        }, 500);
    }
};

exports.peng = function (a_userId) {
    var seatData = g_gameSeatsOfUsers[a_userId];
    if (seatData == null) {
        console.log("cannot find user game data.");
        return;
    }

    var game = seatData.game;

    //如果是他出的牌，则忽略
    if (game.turn == seatData.seatIndex) {
        console.log("it is your turn.");
        return;
    }

    //如果没有碰的机会，则不能再碰
    if (seatData.canPeng == false) {
        console.log("seatData.peng == false");
        return;
    }

    //和的了，就不要再来了
    if (seatData.hued) {
        console.log("you have already hued. no kidding plz.");
        return;
    }

    //如果有人可以胡牌，则需要等待
    var i = game.turn;
    while (true) {
        var i = (i + 1) % 4;
        if (i == game.turn) {
            break;
        } else {
            var seat = game.gameSeats[i];
            if (seat.canHu && i != seatData.seatIndex) {
                return;
            }
        }
    }

    clearAllOptions(game);

    //验证手上的牌的数目
    var tile = game.chuPai;
    var count = seatData.countMap[tile];
    if (count == null || count < 2) {
        console.log("pai:" + tile + ",count:" + count);
        console.log(seatData.holds);
        console.log("lack of mj.");
        return;
    }

    //进行碰牌处理
    //扣掉手上的牌
    //从此人牌中扣除
    for (var i = 0; i < 2; ++i) {
        var index = seatData.holds.indexOf(tile);
        if (index == -1) {
            console.log("cannot find mj.");
            return;
        }
        seatData.holds.splice(index, 1);
        seatData.countMap[tile]--;
    }
    seatData.pengs.push(tile);
    game.chuPai = -1;

    recordGameAction(game, seatData.seatIndex, ACTION_PENG, tile);

    //广播通知其它玩家
    g_userMgr.broacastInRoom("push_pong", {
        userid: seatData.userId,
        pai: tile
    }, seatData.userId, true);

    //碰的玩家打牌
    moveToNextUser(game, seatData.seatIndex);

    //广播通知玩家出牌方
    //console.log("--peng");
    seatData.canChuPai = true;
    g_userMgr.broacastInRoom("push_game_turn", seatData.userId, seatData.userId, true);
};

exports.isPlaying = function (a_userId) {
    var seatData = g_gameSeatsOfUsers[a_userId];
    if (seatData == null) {
        return false;
    }

    var game = seatData.game;

    if (game.state == "idle") {
        return false;
    }

    return true;
}

function checkCanQiangGang(a_game, a_turnSeat, a_seat, a_tile) {
    var hasActions = false;
    for (var i = 0; i < a_game.gameSeats.length; ++i) {
        //杠牌者不检查
        if (a_seat.seatIndex == i) {
            continue;
        }

        var seat = a_game.gameSeats[i];
        checkCanHu(a_game, seat, a_tile);
        if (seat.canHu) {
            sendOperations(a_game, seat, a_tile);
            hasActions = true;
        }
    }

    if (hasActions) {
        a_game.qiangGangContext = {
            turnSeat: a_turnSeat,
            seatData: a_seat,
            pai: a_tile,
            isValid: true,
        }
    } else {
        a_game.qiangGangContext = null;
    }
    return a_game.qiangGangContext != null;
}

function doGang(a_game, a_turnSeat, a_seat, a_gangType, a_tileCount, a_tile) {
    var seatIndex = a_seat.seatIndex;
    var turnSeatIndex = a_turnSeat.seatIndex;

    var isZhuanShouGang = false;
    if (a_gangType == "wangang") {
        var index = a_seat.pengs.indexOf(a_tile);
        if (index >= 0) {
            a_seat.pengs.splice(index, 1);
        }

        //如果最后一张牌不是杠的牌，则认为是转手杠
        if (a_seat.holds[a_seat.holds.length - 1] != a_tile) {
            isZhuanShouGang = true;
        }
    }
    //进行碰牌处理
    //扣掉手上的牌
    //从此人牌中扣除
    for (var i = 0; i < a_tileCount; ++i) {
        var index = a_seat.holds.indexOf(a_tile);
        if (index == -1) {
            console.log(a_seat.holds);
            console.log("cannot find mj.");
            return;
        }
        a_seat.holds.splice(index, 1);
        a_seat.countMap[a_tile]--;
    }

    recordGameAction(a_game, a_seat.seatIndex, ACTION_GANG, a_tile);

    //记录下玩家的杠牌
    if (a_gangType == "angang") {
        a_seat.angangs.push(a_tile);
        var action = recordUserAction(a_game, a_seat, "angang");
        action.score = a_game.conf.baseScore * 2;
    } else if (a_gangType == "diangang") {
        a_seat.diangangs.push(a_tile);
        var action = recordUserAction(a_game, a_seat, "diangang", turnSeatIndex);
        action.score = a_game.conf.baseScore * 2;
        var turnSeat = a_turnSeat;
        recordUserAction(a_game, turnSeat, "fanggang", seatIndex);
    } else if (a_gangType == "wangang") {
        a_seat.wangangs.push(a_tile);
        if (isZhuanShouGang == false) {
            var action = recordUserAction(a_game, a_seat, "wangang");
            action.score = a_game.conf.baseScore;
        } else {
            recordUserAction(a_game, a_seat, "zhuanshougang");
        }

    }

    checkCanTingPai(a_game, a_seat);
    //通知其他玩家，有人杠了牌
    g_userMgr.broacastInRoom("push_kong", {
        userid: a_seat.userId,
        pai: a_tile,
        gangtype: a_gangType
    }, a_seat.userId, true);

    //变成自己的轮子
    moveToNextUser(a_game, seatIndex);
    //再次摸牌
    doUserMoPai(a_game);

    //只能放在这里。因为过手就会清除杠牌标记
    a_seat.lastFangGangSeat = turnSeatIndex;
}

exports.gang = function (a_userId, a_tile) {
    console.log("enter exports.gang(), a_userId: " + a_userId +", a_tile: " + a_tile);

    var seatData = g_gameSeatsOfUsers[a_userId];
    if (seatData == null) {
        console.log("cannot find user game data.");
        return;
    }

    var seatIndex = seatData.seatIndex;
    var game = seatData.game;

    //如果没有杠的机会，则不能再杠
    if (seatData.canGang == false) {
        console.log("seatData.canGang == false");
        return;
    }

    var count = seatData.countMap[a_tile];

    //胡了的，只能直杠
    if (count != 1 && seatData.hued) {
        console.log("you have already hued. no kidding plz.");
        return;
    }

    if (seatData.gangPai.indexOf(a_tile) == -1) {
        console.log("the given pai cannot be ganged.");
        return;
    }

    //如果有人可以胡牌，则需要等待
    var i = game.turn;
    while (true) {
        var i = (i + 1) % 4;
        if (i == game.turn) {
            break;
        } else {
            var seat = game.gameSeats[i];
            if (seat.canHu && i != seatData.seatIndex) {
                return;
            }
        }
    }

    var gangType = ""
    //弯杠 去掉碰牌
    if (count == 1) {
        gangType = "wangang"
    } else if (count == 3) {
        gangType = "diangang"
    } else if (count == 4) {
        gangType = "angang";
    } else {
        console.log("invalid pai count.");
        return;
    }

    game.chuPai = -1;
    clearAllOptions(game);
    //console.log("--gang");
    seatData.canChuPai = false;

    g_userMgr.broacastInRoom("push_call_kong", seatIndex, seatData.userId, true);

    //如果是弯杠，则需要检查是否可以抢杠
    var turnSeat = game.gameSeats[game.turn];
    if (count == 1) {
        var canQiangGang = checkCanQiangGang(game, turnSeat, seatData, a_tile);
        if (canQiangGang) {
            return;
        }
    }

    doGang(game, turnSeat, seatData, gangType, count, a_tile);
};

exports.hu = function (a_userId) {
    var seatData = g_gameSeatsOfUsers[a_userId];
    if (seatData == null) {
        console.log("cannot find user game data.");
        return;
    }

    var seatIndex = seatData.seatIndex;
    var game = seatData.game;

    //如果他不能和牌，那和个啥啊
    if (seatData.canHu == false) {
        console.log("invalid request.");
        return;
    }

    //标记为和牌
    seatData.hued = true;
    var winTile = game.chuPai;
    var isSelfDraw = false;

    var turnSeat = game.gameSeats[game.turn];

    var winData = {
        ishupai: true,
        pai: -1,
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

    winData.numofgen = getNumOfGen(seatData);

    seatData.huInfo.push(winData);

    winData.isGangHu = turnSeat.lastFangGangSeat >= 0;
    var tile = -1;

    if (game.qiangGangContext != null) {
        winTile = game.qiangGangContext.pai;
        var gangSeat = game.qiangGangContext.seatData;
        tile = winTile;
        winData.iszimo = false;
        winData.action = "qiangganghu";
        winData.isQiangGangHu = true;
        winData.target = gangSeat.seatIndex;
        winData.pai = winTile;

        recordGameAction(game, seatIndex, ACTION_HU, winTile);
        game.qiangGangContext.isValid = false;

        var index = gangSeat.holds.indexOf(winTile);
        if (index != -1) {
            gangSeat.holds.splice(index, 1);
            gangSeat.countMap[winTile]--;
            g_userMgr.sendMsg(gangSeat.userId, "push_hands", gangSeat.holds);
        }

        gangSeat.huInfo.push({
            action: "beiqianggang",
            target: seatData.seatIndex,
            index: seatData.huInfo.length - 1,
        });
    } else if (game.chuPai == -1) {
        winTile = seatData.holds.pop();
        seatData.countMap[winTile]--;
        tile = winTile;
        winData.pai = winTile;
        if (winData.isGangHu) {
            if (turnSeat.lastFangGangSeat == seatIndex) {
                winData.action = "ganghua";
                winData.iszimo = true;
            } else {
                var dianGangHua_selfDraw = game.conf.dianganghua == 1;
                winData.action = "dianganghua";
                winData.iszimo = dianGangHua_selfDraw;
                winData.target = turnSeat.lastFangGangSeat;
            }
        } else {
            winData.action = "zimo";
            winData.iszimo = true;
        }

        isSelfDraw = true;
        recordGameAction(game, seatIndex, ACTION_ZIMO, winTile);
    } else {
        tile = game.chuPai;
        winData.pai = winTile;

        var action = "hu";
        //炮胡
        if (turnSeat.lastFangGangSeat >= 0) {
            action = "gangpaohu";
        }

        winData.action = action;
        winData.iszimo = false;
        winData.target = game.turn;

        //毛转雨
        if (turnSeat.lastFangGangSeat >= 0) {
            for (var i = turnSeat.actions.length - 1; i >= 0; --i) {
                var action = turnSeat.actions[i];
                if (action.type == "diangang" || action.type == "wangang" || action.type == "angang") {
                    action.state = "nop";
                    action.payTimes = 0;

                    var action2 = {
                        type: "maozhuanyu",
                        owner: turnSeat,
                        ref: action
                    }
                    seatData.actions.push(action2);
                    break;
                }
            }
        }

        //记录玩家放炮信息
        var turnSeat2 = game.gameSeats[game.turn];
        if (action == "gangpaohu") {
            action = "gangpao";
        } else {
            action = "fangpao";
        }
        turnSeat2.huInfo.push({
            action: action,
            target: seatData.seatIndex,
            index: seatData.huInfo.length - 1,
        });

        recordGameAction(game, seatIndex, ACTION_HU, winTile);

        game.fangpaoshumu++;

        if (game.fangpaoshumu > 1) {
            game.yipaoduoxiang = seatIndex;
        }
    }

    if (game.firstHupai < 0) {
        game.firstHupai = seatIndex;
    }

    //保存番数
    var readyInfo = seatData.tingMap[winTile];
    winData.fan = readyInfo.fan;
    winData.pattern = readyInfo.pattern;
    winData.iszimo = isSelfDraw;
    //如果是最后一张牌，则认为是海底胡
    winData.isHaiDiHu = game.currentIndex == game.mahjongs.length;

    if (game.conf.tiandihu) {
        if (game.chupaiCnt == 0 && game.button == seatData.seatIndex && game.chuPai == -1) {
            winData.isTianHu = true;
        } else if (game.chupaiCnt == 1 && game.turn == game.button && game.button != seatData.seatIndex && game.chuPai != -1) {
            winData.isDiHu = true;
        }
    }

    clearAllOptions(game, seatData);

    //通知前端，有人和牌了
    g_userMgr.broacastInRoom("push_player_win", {
        seatindex: seatIndex,
        iszimo: isSelfDraw,
        hupai: tile
    }, seatData.userId, true);

    //
    if (game.lastHuPaiSeat == -1) {
        game.lastHuPaiSeat = seatIndex;
    } else {
        var lp = (game.lastFangGangSeat - game.turn + 4) % 4;
        var cur = (seatData.seatIndex - game.turn + 4) % 4;
        if (cur > lp) {
            game.lastHuPaiSeat = seatData.seatIndex;
        }
    }

    //清空所有非胡牌操作
    for (var i = 0; i < game.gameSeats.length; ++i) {
        var seat = game.gameSeats[i];
        seat.canPeng = false;
        seat.canGang = false;
        //console.log("--hu");
        seat.canChuPai = false;
        sendOperations(game, seat, winTile);
    }

    //如果还有人可以胡牌，则等待
//    for (var i = 0; i < game.gameSeats.length; ++i) {
//        var seat = game.gameSeats[i];
//        if (seat.canHu) {
//            return;
//        }
//    }

    //和牌的下家继续打
//    clearAllOptions(game);
//    game.turn = game.lastHuPaiSeat;
//    moveToNextUser(game);
//    doUserMoPai(game);

    doGameOver(game, turnSeat.userId);
};

exports.guo = function (a_userId) {
    var seatData = g_gameSeatsOfUsers[a_userId];
    if (seatData == null) {
        console.log("cannot find user game data.");
        return;
    }

    var seatIndex = seatData.seatIndex;
    var game = seatData.game;

    //如果玩家没有对应的操作，则也认为是非法消息
    if ((seatData.canGang || seatData.canPeng || seatData.canHu) == false) {
        console.log("no need guo.");
        return;
    }

    //如果是玩家自己的轮子，不是接牌，则不需要额外操作
    var doNothing = game.chuPai == -1 && game.turn == seatIndex;

    g_userMgr.sendMsg(seatData.userId, "push_pass_result");
    clearAllOptions(game, seatData);

    //这里还要处理过胡的情况
    if (game.chuPai >= 0 && seatData.canHu) {
        seatData.guoHuFan = seatData.tingMap[game.chuPai].fan;
    }

    if (doNothing) {
        return;
    }

    //如果还有人可以操作，则等待
    for (var i = 0; i < game.gameSeats.length; ++i) {
        var seat = game.gameSeats[i];
        if (hasOperations(seat)) {
            return;
        }
    }

    //如果是已打出的牌，则需要通知。
    if (game.chuPai >= 0) {
        var userId = game.gameSeats[game.turn].userId;
        g_userMgr.broacastInRoom("push_player_pass", {
            userId: userId,
            pai: game.chuPai
        }, seatData.userId, true);
        seatData.folds.push(game.chuPai);
        game.chuPai = -1;
    }


    var robGangContext = game.qiangGangContext;
    //清除所有的操作
    clearAllOptions(game);

    if (robGangContext != null && robGangContext.isValid) {
        doGang(game, robGangContext.turnSeat, robGangContext.seatData, "wangang", 1, robGangContext.pai);
    } else {
        //下家摸牌
        moveToNextUser(game);
        doUserMoPai(game);
    }
};

exports.hasBegan = function (a_roomId) {
    var game = g_games[a_roomId];
    if (game != null) {
        return true;
    }
    var roomInfo = g_roomMgr.getRoom(a_roomId);
    if (roomInfo != null) {
        return roomInfo.numOfGames > 0;
    }
    return false;
};


var g_dismissList = [];

exports.doDissolve = function (a_roomId) {
    var roomInfo = g_roomMgr.getRoom(a_roomId);
    if (roomInfo == null) {
        return null;
    }

    var game = g_games[a_roomId];
    doGameOver(game, roomInfo.seats[0].userId, true);
};

exports.dissolveRequest = function (a_roomId, a_userId) {
    var roomInfo = g_roomMgr.getRoom(a_roomId);
    if (roomInfo == null) {
        return null;
    }

    if (roomInfo.dr != null) {
        return null;
    }

    var seatIndex = g_roomMgr.getUserSeat(a_userId);
    if (seatIndex == null) {
        return null;
    }

    roomInfo.dr = {
        endTime: Date.now() + 30000,
        states: [false, false, false, false]
    };
    roomInfo.dr.states[seatIndex] = true;

    g_dismissList.push(a_roomId);

    return roomInfo;
};

exports.dissolveAgree = function (a_roomId, a_userId, a_agree) {
    var roomInfo = g_roomMgr.getRoom(a_roomId);
    if (roomInfo == null) {
        return null;
    }

    if (roomInfo.dr == null) {
        return null;
    }

    var seatIndex = g_roomMgr.getUserSeat(a_userId);
    if (seatIndex == null) {
        return null;
    }

    if (a_agree) {
        roomInfo.dr.states[seatIndex] = true;
    } else {
        roomInfo.dr = null;
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

        var roomInfo = g_roomMgr.getRoom(roomId);
        if (roomInfo != null && roomInfo.dr != null) {
            if (Date.now() > roomInfo.dr.endTime) {
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