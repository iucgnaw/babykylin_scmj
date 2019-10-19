cc.Class({
    extends: cc.Component,

    properties: {
        dataEventHandler: null,
        roomId: null,
        maxNumOfGames: 0,
        numOfGames: 0,
        tilesWallRemaining: 0,
        seatIndex: -1,
        seats: null,
        turn: -1,
        dealer: -1,
        dingque: -1,
        _discardingTile: -1,
        isDingQueing: false,
        isHuanSanZhang: false,
        fsmGameState: "",
        isOver: false,
        dissoveData: null,
        // foo: {
        //    default: null,
        //    url: cc.Texture2D,  // optional, default is typeof default
        //    serializable: true, // optional, default is true
        //    visible: true,      // optional, default is true
        //    displayName: 'Foo', // optional
        //    readonly: false,    // optional, default is false
        // },
        // ...
    },

    reset: function () {
        this.turn = -1;
        this._discardingTile = -1;
        this.dingque = -1;
        this.dealer = -1;
        this.fsmGameState = "";
        this.dingque = -1;
        this.isDingQueing = false;
        this.isHuanSanZhang = false;
        this.curaction = null;
        for (var i = 0; i < this.seats.length; ++i) {
            this.seats[i].handTiles = [];
            this.seats[i].discardedTiles = [];
            this.seats[i].melds = [];
            this.seats[i].dingque = -1;
            this.seats[i].ready = false;
            this.huanpaimethod = -1;
        }
    },

    clear: function () {
        this.dataEventHandler = null;
        if (this.isOver == null) {
            this.seats = null;
            this.roomId = null;
            this.maxNumOfGames = 0;
            this.numOfGames = 0;
        }
    },

    dispatchEvent(event, data) {
        if (this.dataEventHandler) {
            this.dataEventHandler.emit(event, data);
        }
    },

    getSeatIndexByUserId: function (userId) {
        for (var i = 0; i < this.seats.length; ++i) {
            var s = this.seats[i];
            if (s.userid == userId) {
                return i;
            }
        }
        return -1;
    },

    isOwner: function () {
        return this.seatIndex == 0;
    },

    getSeatByID: function (userId) {
        var seatIndex = this.getSeatIndexByUserId(userId);
        var seat = this.seats[seatIndex];
        return seat;
    },

    getSelfData: function () {
        return this.seats[this.seatIndex];
    },

    getLocalIndex: function (index) {
        var ret = (index - this.seatIndex + 4) % 4;
        return ret;
    },

    prepareReplay: function (roomInfo, detailOfGame) {
        this.roomId = roomInfo.id;
        this.seats = roomInfo.seats;
        this.turn = detailOfGame.base_info.dealer;
        var baseInfo = detailOfGame.base_info;
        for (var i = 0; i < this.seats.length; ++i) {
            var seat = this.seats[i];
            seat.seatIndex = i;
            seat.score = null;
            seat.handTiles = baseInfo.gameSeats[i];
            seat.melds = [];
            seat.discardedTiles = [];
            if (cc.vv.userMgr.userId == seat.userid) {
                this.seatIndex = i;
            }
        }
        this.conf = {
            type: baseInfo.type,
        }
        if (this.conf.type == null) {
            this.conf.type == "xlch";
        }
    },

    initHandlers: function () {
        var self = this;
        cc.vv.net.addHandler("res_login_result", function (data) {
            if (data.errcode === 0) {
                var data = data.data;
                self.roomId = data.roomid;
                self.conf = data.conf;
                self.maxNumOfGames = data.conf.maxGames;
                self.numOfGames = data.numOfGames;
                self.seats = data.seats;
                self.seatIndex = self.getSeatIndexByUserId(cc.vv.userMgr.userId);
                self.isOver = false;
            } else {
                console.error(data.errmsg);
            }
            self.dispatchEvent("event_login_result");
        });

        cc.vv.net.addHandler("push_login_finished", function (data) {
            cc.director.loadScene("mjgame", function () {
                cc.vv.net.ping();
                cc.vv.wc.hide();
            });
            self.dispatchEvent("event_login_finished");
        });

        cc.vv.net.addHandler("push_exit_result", function (data) {
            self.roomId = null;
            self.turn = -1;
            self.dingque = -1;
            self.isDingQueing = false;
            self.seats = null;
        });

        cc.vv.net.addHandler("brc_player_exit", function (data) {
            var userId = data;
            var seat = self.getSeatByID(userId);
            if (seat != null) {
                seat.userid = 0;
                seat.name = "";
                self.dispatchEvent("event_seat_update", seat);
            }
        });

        cc.vv.net.addHandler("brc_dismiss_room", function (data) {
            self.roomId = null;
            self.turn = -1;
            self.dingque = -1;
            self.isDingQueing = false;
            self.seats = null;
        });

        cc.vv.net.addHandler("disconnect", function (data) {
            if (self.roomId == null) {
                cc.vv.wc.show("正在返回游戏大厅");
                cc.director.loadScene("hall");
            } else {
                if (self.isOver == false) {
                    cc.vv.userMgr.oldRoomId = self.roomId;
                    self.dispatchEvent("disconnect");
                } else {
                    self.roomId = null;
                }
            }
        });

        cc.vv.net.addHandler("brc_player_join", function (data) {
            var seatIndex = data.seatIndex;
            var needCheckIp = false;
            if (self.seats[seatIndex].userid > 0) {
                self.seats[seatIndex].online = true;
                if (self.seats[seatIndex].ip != data.ip) {
                    self.seats[seatIndex].ip = data.ip;
                    needCheckIp = true;
                }
            } else {
                data.online = true;
                self.seats[seatIndex] = data;
                needCheckIp = true;
            }
            self.dispatchEvent("event_player_join", self.seats[seatIndex]);

            if (needCheckIp) {
                self.dispatchEvent("event_check_ip", self.seats[seatIndex]);
            }
        });

        cc.vv.net.addHandler("brc_player_status_change", function (data) {
            var userId = data.userid;
            var seat = self.getSeatByID(userId);
            seat.online = data.online;
            self.dispatchEvent("event_seat_update", seat);
        });

        cc.vv.net.addHandler("brc_player_ready", function (data) {
            var userId = data.userid;
            var seat = self.getSeatByID(userId);
            seat.ready = data.ready;
            self.dispatchEvent("event_seat_update", seat);
        });

        cc.vv.net.addHandler("push_hand_tiles", function (data) {
            var seat = self.seats[self.seatIndex];
            seat.handTiles = data;

            for (var i = 0; i < self.seats.length; ++i) {
                var s = self.seats[i];
                if (s.discardedTiles == null) {
                    s.discardedTiles = [];
                }
                if (s.melds == null) {
                    s.melds = [];
                }
                s.ready = false;
            }
            self.dispatchEvent("event_hands");
        });

        cc.vv.net.addHandler("push_game_begin", function (data) {
            self.dealer = data;
            self.turn = self.dealer;
            self.fsmGameState = "begin";
            self.dispatchEvent("event_game_begin");
        });

        cc.vv.net.addHandler("brc_game_playing", function (data) {
            self.fsmGameState = "playing";
            self.dispatchEvent("event_game_playing");
        });

        cc.vv.net.addHandler("push_game_sync", function (data) {
            self.tilesWallRemaining = data.tilesWallRemaining;
            self.fsmGameState = data.fsmGameState;
            if (self.fsmGameState == "dingque") {
                self.isDingQueing = true;
            } else if (self.fsmGameState == "huanpai") {
                self.isHuanSanZhang = true;
            }
            self.turn = data.turn;
            self.dealer = data.dealer;
            self._discardingTile = data.discardingTile;
            self.huanpaimethod = data.huanpaimethod;
            for (var i = 0; i < 4; ++i) {
                var seat = self.seats[i];
                var seatData = data.seats[i];
                seat.handTiles = seatData.handTiles;
                seat.discardedTiles = seatData.discardedTiles;
                seat.melds = seatData.melds;
                seat.iszimo = seatData.iszimo;
                seat.huinfo = seatData.huinfo;
            }
            self.dispatchEvent("event_game_sync");
        });

        cc.vv.net.addHandler("brc_game_dingque", function (data) {
            self.isDingQueing = true;
            self.isHuanSanZhang = false;
            self.fsmGameState = "dingque";
            self.dispatchEvent("event_game_dingque");
        });

        cc.vv.net.addHandler("push_exchange_3_tiles", function (data) {
            self.isHuanSanZhang = true;
            self.dispatchEvent("event_game_huanpai");
        });

        cc.vv.net.addHandler("brc_call_kong", function (data) {
            self.dispatchEvent("event_call_kong", data);
        });

        cc.vv.net.addHandler("push_game_actions", function (data) {
            self.curaction = data;
            self.dispatchEvent("event_game_actions", data);
        });

        cc.vv.net.addHandler("push_server_message", function (data) {
            self.dispatchEvent("event_server_message", data);
        });

        cc.vv.net.addHandler("brc_change_turn", function (data) {
            var turnUserID = data;
            var si = self.getSeatIndexByUserId(turnUserID);
            self.doTurnChange(si);
        });

        cc.vv.net.addHandler("push_number_of_hands", function (data) {
            self.numOfGames = data;
            self.dispatchEvent("event_number_of_hands", data);
        });

        cc.vv.net.addHandler("brc_game_finish", function (data) {
            var results = data.results;
            for (var i = 0; i < self.seats.length; ++i) {
                self.seats[i].score = results.length == 0 ? 0 : results[i].totalscore;
            }
            self.dispatchEvent("event_hand_finish", results);
            if (data.endinfo) {
                self.isOver = true;
                self.dispatchEvent("event_match_finish", data.endinfo);
            }
            self.reset();
            for (var i = 0; i < self.seats.length; ++i) {
                self.dispatchEvent("event_seat_update", self.seats[i]);
            }
        });

        cc.vv.net.addHandler("brc_tiles_wall_remaining", function (data) {
            self.tilesWallRemaining = data;
            self.dispatchEvent("event_remaining_tiles", data);
        });

        cc.vv.net.addHandler("brc_win", function (data) {
            self.doHu(data);
        });

        cc.vv.net.addHandler("brc_discard", function (a_data) {
            var userId = a_data.userId;
            var tile = a_data.tile;
            var seatIndex = self.getSeatIndexByUserId(userId);
            self.doDiscardTile(seatIndex, tile);
        });

        cc.vv.net.addHandler("push_draw_tile", function (data) {
            self.doDrawTile(self.seatIndex, data);
        });

        cc.vv.net.addHandler("brc_pass", function (data) {
            var userId = data.userId;
            var tile = data.tile;
            var si = self.getSeatIndexByUserId(userId);
            self.doGuo(si, tile);
        });

        cc.vv.net.addHandler("push_pass_result", function (data) {
            self.dispatchEvent("event_pass_result");
        });

        cc.vv.net.addHandler("push_player_pass_win", function (data) {
            self.dispatchEvent("event_faan", {
                info: "过胡",
                time: 1.5
            });
        });

        cc.vv.net.addHandler("push_huanpai", function (data) {
            var seat = self.getSeatByID(data.si);
            self.dispatchEvent("event_huanpai", seat);
        });

        cc.vv.net.addHandler("push_huanpai_finish", function (data) {
            var info = "";
            var method = data.method;
            if (method == 0) {
                info = "换对家牌";
            } else if (method == 1) {
                info = "换下家牌";
            } else {
                info = "换上家牌";
            }
            self.huanpaimethod = method;
            cc.vv.gameNetMgr.isHuanSanZhang = false;
            self.dispatchEvent("event_huanpai_finish");
            self.dispatchEvent("event_faan", {
                info: info,
                time: 2
            });
        });

        cc.vv.net.addHandler("brc_pong", function (data) {
            var userId = data.userid;
            var tile = data.tile;
            var si = self.getSeatIndexByUserId(userId);
            self.doPeng(si, data.tile);
        });

        cc.vv.net.addHandler("brc_kong", function (a_data) {
            var seatIndex = self.getSeatIndexByUserId(a_data.userId);
            self.doGang(seatIndex, a_data.meld);
        });

        cc.vv.net.addHandler("brc_game_dingque_notify", function (data) {
            self.dispatchEvent("event_game_dingque_notify", data);
        });

        cc.vv.net.addHandler("brc_game_dingque_finish", function (data) {
            for (var i = 0; i < data.length; ++i) {
                self.seats[i].dingque = data[i];
                if (i == self.seatIndex) {
                    self.dingque = data[i];
                }
            }
            self.dispatchEvent("event_game_dingque_finish", data);
        });


        cc.vv.net.addHandler("brc_chat", function (data) {
            self.dispatchEvent("event_chat", data);
        });

        cc.vv.net.addHandler("brc_quick_chat", function (data) {
            self.dispatchEvent("event_quick_chat", data);
        });

        cc.vv.net.addHandler("brc_emoji", function (data) {
            self.dispatchEvent("event_emoji", data);
        });

        cc.vv.net.addHandler("brc_propose_dismiss_room", function (data) {
            self.dissoveData = data;
            self.dispatchEvent("event_propose_dismiss_room", data);
        });

        cc.vv.net.addHandler("brc_reject_dismiss_room", function (data) {
            self.dissoveData = null;
            self.dispatchEvent("event_reject_dismiss_room", data);
        });

        cc.vv.net.addHandler("brc_voice_message", function (data) {
            self.dispatchEvent("event_voice_message", data);
        });
    },

    doGuo: function (seatIndex, tile) {
        var seatData = this.seats[seatIndex];
        var discardedTiles = seatData.discardedTiles;
        discardedTiles.push(tile);
        this.dispatchEvent("event_player_pass", seatData);
    },

    doDrawTile: function (a_seatIndex, a_tile) {
        var seatData = this.seats[a_seatIndex];
        if (seatData.handTiles) {
            seatData.handTiles.push(a_tile);
            this.dispatchEvent("event_draw_tile", {
                seatIndex: a_seatIndex,
                tile: a_tile
            });
        }
    },

    doDiscardTile: function (a_seatIndex, a_tile) {
        this._discardingTile = a_tile;
        var seatData = this.seats[a_seatIndex];
        if (seatData.handTiles) {
            var idx = seatData.handTiles.indexOf(a_tile);
            seatData.handTiles.splice(idx, 1); // Remove tile from hands
        }
        this.dispatchEvent("event_game_discard_tile", {
            seatData: seatData,
            tile: a_tile
        });
    },

    doPeng: function (seatIndex, tile) {
        var seatData = this.seats[seatIndex];
        //移除手牌
        if (seatData.handTiles) {
            for (var i = 0; i < 2; ++i) {
                var idx = seatData.handTiles.indexOf(tile);
                seatData.handTiles.splice(idx, 1);
            }
        }

        this.dispatchEvent("event_pong", seatData);
    },

    getGangType: function (seatData, tile) {
        var cnt = 0;
        for (var i = 0; i < seatData.handTiles.length; ++i) {
            if (seatData.handTiles[i] == tile) {
                cnt++;
            }
        }
        if (cnt == 3) {
            return "meld_exposed_kong";
        } else {
            return "meld_concealed_kong";
        }
    },

    doGang: function (a_seatIndex, a_meld) {
        var seatData = this.seats[a_seatIndex];

        seatData.melds.push(a_meld);

        if (seatData.handTiles) {
            for (var i = 0; i <= a_meld.tiles.length; ++i) {
                var tileIndex = seatData.handTiles.indexOf(a_meld.tiles[i]);
                if (tileIndex == -1) { // Don't find
                    break;
                }
                seatData.handTiles.splice(tileIndex, 1);
            }
        }

        this.dispatchEvent("event_kong", {
            seatData: seatData,
            meldType: a_meld.type
        });
    },

    doHu: function (data) {
        this.dispatchEvent("event_win", data);
    },

    doTurnChange: function (si) {
        var data = {
            last: this.turn,
            turn: si,
        }
        this.turn = si;
        this.dispatchEvent("event_turn", data);
    },

    connectGameServer: function (data) {
        this.dissoveData = null;
        cc.vv.net.ip = data.ip + ":" + data.port;
        var self = this;

        var onConnectOK = function () {
            var sd = {
                token: data.token,
                roomid: data.roomid,
                time: data.time,
                sign: data.sign,
            };
            cc.vv.net.send("login", sd);
        };

        var onConnectFailed = function () {
            console.error("Connect failed.");
            cc.vv.wc.hide();
        };
        cc.vv.wc.show("正在进入房间");
        cc.vv.net.connect(onConnectOK, onConnectFailed);
    }

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});