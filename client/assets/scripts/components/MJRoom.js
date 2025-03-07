cc.Class({
    extends: cc.Component,

    properties: {
        lblRoomNo: {
            default: null,
            type: cc.Label
        },
        // foo: {
        //    default: null,
        //    url: cc.Texture2D,  // optional, default is typeof default
        //    serializable: true, // optional, default is true
        //    visible: true,      // optional, default is true
        //    displayName: 'Foo', // optional
        //    readonly: false,    // optional, default is false
        // },
        // ...
        _seats: [],
        _seats2: [],
        _timeLabel: null,
        _voiceMsgQueue: [],
        _lastPlayingSeat: null,
        _playingSeat: null,
        _lastPlayTime: null,
    },

    // use this for initialization
    onLoad: function () {
        if (cc.vv == null) {
            return;
        }

        this.initView();
        this.initSeats();
        this.initEventHandlers();
    },

    initView: function () {
        var prepare = this.node.getChildByName("prepare");
        var seats = prepare.getChildByName("seats");
        for (var i = 0; i < seats.children.length; ++i) {
            this._seats.push(seats.children[i].getComponent("Seat"));
        }

        this.refreshBtns();

        this.lblRoomNo = cc.find("Canvas/infobar/nodeRoom/nodeRoomNum").getComponent(cc.Label);
        this._timeLabel = cc.find("Canvas/infobar/time").getComponent(cc.Label);
        this.lblRoomNo.string = cc.vv.gameNetMgr.roomId;
        var gameChild = this.node.getChildByName("game");
        var sides = ["myself", "right", "up", "left"];
        for (var i = 0; i < sides.length; ++i) {
            var sideNode = gameChild.getChildByName(sides[i]);
            var seat = sideNode.getChildByName("seat");
            this._seats2.push(seat.getComponent("Seat"));
        }

        var btnWechat = cc.find("Canvas/prepare/btnWeichat");
        if (btnWechat) {
            cc.vv.utils.addClickEvent(btnWechat, this.node, "MJRoom", "onBtnWeichatClicked");
        }


        // var titles = cc.find("Canvas/typeTitle");
        // for (var i = 0; i < titles.children.length; ++i) {
        //     titles.children[i].active = false;
        // }

        // if (cc.vv.gameNetMgr.conf) {
        //     var type = cc.vv.gameNetMgr.conf.type;
        //     if (type == null || type == "") {
        //         type = "xlch";
        //     }

        //     titles.getChildByName(type).active = true;
        // }
    },

    refreshBtns: function () {
        var prepare = this.node.getChildByName("prepare");
        var btnExit = prepare.getChildByName("btnExit");
        var btnDispress = prepare.getChildByName("btnDissolve");
        var btnWeichat = prepare.getChildByName("btnWeichat");
        var isIdle = cc.vv.gameNetMgr.numOfGames == 0;

        btnExit.active = !cc.vv.gameNetMgr.isOwner() && isIdle;
        btnDispress.active = cc.vv.gameNetMgr.isOwner() && isIdle;

        btnWeichat.active = isIdle;
    },

    initEventHandlers: function () {
        var self = this;
        this.node.on("event_player_join", function (data) {
            self.initSingleSeat(data);
        });

        this.node.on("event_seat_update", function (data) {
            self.initSingleSeat(data);
        });

        this.node.on("event_game_begin", function (data) {
            self.refreshBtns();
            self.initSeats();
        });

        this.node.on("event_number_of_hands", function (data) {
            self.refreshBtns();
        });

        this.node.on("event_game_huanpai", function (data) {
            for (var i in self._seats2) {
                self._seats2[i].refreshXuanPaiState();
            }
        });

        this.node.on("event_huanpai", function (data) {
            var idx = data.seatIndex;
            var localIdx = cc.vv.gameNetMgr.getLocalIndex(idx);
            self._seats2[localIdx].refreshXuanPaiState();
        });

        this.node.on("event_huanpai_finish", function (data) {
            for (var i in self._seats2) {
                self._seats2[i].refreshXuanPaiState();
            }
        });

        this.node.on("event_voice_message", function (data) {
            self._voiceMsgQueue.push(data);
            self.playVoice();
        });

        this.node.on("event_chat", function (data) {
            var idx = cc.vv.gameNetMgr.getSeatIndexByUserId(data.sender);
            var localIdx = cc.vv.gameNetMgr.getLocalIndex(idx);
            self._seats[localIdx].chat(data.content);
            self._seats2[localIdx].chat(data.content);
        });

        this.node.on("event_quick_chat", function (data) {
            var idx = cc.vv.gameNetMgr.getSeatIndexByUserId(data.sender);
            var localIdx = cc.vv.gameNetMgr.getLocalIndex(idx);

            var index = data.content;
            var info = cc.vv.chat.getQuickChatInfo(index);
            self._seats[localIdx].chat(info.content);
            self._seats2[localIdx].chat(info.content);

            cc.vv.audioMgr.playSFX(info.sound);
        });

        this.node.on("event_emoji", function (data) {
            var idx = cc.vv.gameNetMgr.getSeatIndexByUserId(data.sender);
            var localIdx = cc.vv.gameNetMgr.getLocalIndex(idx);
            console.log(data);
            self._seats[localIdx].emoji(data.content);
            self._seats2[localIdx].emoji(data.content);
        });
    },

    initSeats: function () {
        var seats = cc.vv.gameNetMgr.seats;
        for (var i = 0; i < seats.length; ++i) {
            this.initSingleSeat(seats[i]);
        }
    },

    initSingleSeat: function (seat) {
        var index = cc.vv.gameNetMgr.getLocalIndex(seat.seatIndex);
        var isOffline = !seat.online;
        var isZhuang = seat.seatIndex == cc.vv.gameNetMgr.dealer;

        // console.log("isOffline:" + isOffline);

        this._seats[index].setInfo(seat.name, seat.score);
        this._seats[index].setReady(seat.ready);
        this._seats[index].setOffline(isOffline);
        this._seats[index].setID(seat.userid);
        this._seats[index].voiceMsg(false);

        this._seats2[index].setInfo(seat.name, seat.score);
        this._seats2[index].setDealer(isZhuang);
        this._seats2[index].setOffline(isOffline);
        this._seats2[index].setID(seat.userid);
        this._seats2[index].voiceMsg(false);
        this._seats2[index].refreshXuanPaiState();
    },

    onBtnSettingsClicked: function () {
        cc.vv.popupMgr.showSettings();
    },

    onBtnBackClicked: function () {
        cc.vv.alert.show("返回大厅", "返回大厅房间仍会保留，快去邀请大伙来玩吧！", function () {
            cc.vv.wc.show("正在返回游戏大厅");
            cc.director.loadScene("hall");
        }, true);
    },

    onBtnChatClicked: function () {

    },

    onBtnWeichatClicked: function () {
        var title = "<麻将>";
        cc.vv.anysdkMgr.share("麻将" + title, "房号:" + cc.vv.gameNetMgr.roomId);
    },

    onBtnDissolveClicked: function () {
        cc.vv.alert.show("解散房间", "解散房间不扣房卡，是否确定解散？", function () {
            cc.vv.net.send("req_dismiss_room");
        }, true);
    },

    onBtnExit: function () {
        cc.vv.net.send("req_exit");
    },

    playVoice: function () {
        if (this._playingSeat == null && this._voiceMsgQueue.length) {
            console.log("playVoice2");
            var data = this._voiceMsgQueue.shift();
            var idx = cc.vv.gameNetMgr.getSeatIndexByUserId(data.sender);
            var localIndex = cc.vv.gameNetMgr.getLocalIndex(idx);
            this._playingSeat = localIndex;
            this._seats[localIndex].voiceMsg(true);
            this._seats2[localIndex].voiceMsg(true);

            var msgInfo = JSON.parse(data.content);

            var msgfile = "voicemsg.amr";
            console.log(msgInfo.msg.length);
            cc.vv.voiceMgr.writeVoice(msgfile, msgInfo.msg);
            cc.vv.voiceMgr.play(msgfile);
            this._lastPlayTime = Date.now() + msgInfo.time;
        }
    },

    // called every frame, uncomment this function to activate update callback
    update: function (dt) {
        var minutes = Math.floor(Date.now() / 1000 / 60);
        if (this._lastMinute != minutes) {
            this._lastMinute = minutes;
            var date = new Date();
            var h = date.getHours();
            h = h < 10 ? "0" + h : h;

            var m = date.getMinutes();
            m = m < 10 ? "0" + m : m;
            this._timeLabel.string = "" + h + ":" + m;
        }


        if (this._lastPlayTime != null) {
            if (Date.now() > this._lastPlayTime + 200) {
                this.onPlayerOver();
                this._lastPlayTime = null;
            }
        } else {
            this.playVoice();
        }
    },


    onPlayerOver: function () {
        cc.vv.audioMgr.resumeAll();
        console.log("onPlayCallback:" + this._playingSeat);
        var localIndex = this._playingSeat;
        this._playingSeat = null;
        this._seats[localIndex].voiceMsg(false);
        this._seats2[localIndex].voiceMsg(false);
    },

    onDestroy: function () {
        cc.vv.voiceMgr.stop();
        //        cc.vv.voiceMgr.onPlayCallback = null;
    }
});