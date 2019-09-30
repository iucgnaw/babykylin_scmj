cc.Class({
    extends: cc.Component,

    properties: {
        gameRoot: {
            default: null,
            type: cc.Node
        },

        prepareRoot: {
            default: null,
            type: cc.Node
        },

        _myMJArr: [],
        _options: null,
        _selectedMJ: null,
        _chupaiSprite: [],
        _mjcount: null,
        _gamecount: null,
        _hupaiTips: [],
        _hupaiLists: [],
        _playEfxs: [],
        _opts: [],
    },

    onLoad: function () {
        cc.vv.utils.setFitSreenMode();
        this.addComponent("NoticeTip");
        this.addComponent("GameOver");
        this.addComponent("DingQue");
        this.addComponent("PengGangs");
        this.addComponent("MJRoom");
        this.addComponent("TimePointer");
        this.addComponent("GameResult");
        this.addComponent("Chat");
        this.addComponent("Folds");
        this.addComponent("ReplayCtrl");
        this.addComponent("PopupMgr");
        this.addComponent("HuanSanZhang");
        this.addComponent("ReConnect");
        this.addComponent("Voice");
        this.addComponent("UserInfoShow");
        this.addComponent("Status");

        this.initView();
        this.initEventHandlers();

        this.gameRoot.active = false;
        this.prepareRoot.active = true;
        this.initWanfaLabel();
        this.onGameBeign();
        cc.vv.audioMgr.playBGM("bgFight.mp3");
        cc.vv.utils.addEscEvent(this.node);
    },

    initView: function () {

        //搜索需要的子节点
        var gameChild = this.node.getChildByName("game");

        this._mjcount = gameChild.getChildByName('mjcount').getComponent(cc.Label);
        this._mjcount.string = "剩余" + cc.vv.gameNetMgr.numOfMJ + "张";
        this._gamecount = gameChild.getChildByName('gamecount').getComponent(cc.Label);
        this._gamecount.string = "" + cc.vv.gameNetMgr.numOfGames + "/" + cc.vv.gameNetMgr.maxNumOfGames + "局";

        var myselfChild = gameChild.getChildByName("myself");
        var myholds = myselfChild.getChildByName("holds");

        this._chupaidrag = gameChild.getChildByName('chupaidrag');
        this._chupaidrag.active = false;

        for (var i = 0; i < myholds.children.length; ++i) {
            var sprite = myholds.children[i].getComponent(cc.Sprite);
            this._myMJArr.push(sprite);
            sprite.spriteFrame = null;
            this.initDragStuffs(sprite.node);
        }

        //var realwidth = this.node.width;
        //myholds.scaleX *= realwidth/1280;
        //myholds.scaleY *= realwidth/1280;  

        var sides = ["myself", "right", "up", "left"];
        for (var i = 0; i < sides.length; ++i) {
            var side = sides[i];

            var sideChild = gameChild.getChildByName(side);
            this._hupaiTips.push(sideChild.getChildByName("HuPai"));
            this._hupaiLists.push(sideChild.getChildByName("hupailist"));
            this._playEfxs.push(sideChild.getChildByName("play_efx").getComponent(cc.Animation));
            this._chupaiSprite.push(sideChild.getChildByName("ChuPai").children[0].getComponent(cc.Sprite));

            var opt = sideChild.getChildByName("opt");
            opt.active = false;
            var sprite = opt.getChildByName("pai").getComponent(cc.Sprite);
            var data = {
                node: opt,
                sprite: sprite
            };
            this._opts.push(data);
        }

        var opts = gameChild.getChildByName("ops");
        this._options = opts;
        this.hideOptions();
        this.hideChupai();
    },

    start: function () {
        this.checkIp();
    },

    checkIp: function () {
        if (cc.vv.gameNetMgr.gamestate == '') {
            return;
        }
        var selfData = cc.vv.gameNetMgr.getSelfData();
        var ipMap = {}
        for (var i = 0; i < cc.vv.gameNetMgr.seats.length; ++i) {
            var seatData = cc.vv.gameNetMgr.seats[i];
            if (seatData.ip != null && seatData.userid > 0 && seatData != selfData) {
                if (ipMap[seatData.ip]) {
                    ipMap[seatData.ip].push(seatData.name);
                } else {
                    ipMap[seatData.ip] = [seatData.name];
                }
            }
        }

        for (var k in ipMap) {
            var d = ipMap[k];
            if (d.length >= 2) {
                var str = "" + d.join("\n") + "\n\n正在使用同一IP地址进行游戏!";
                cc.vv.alert.show("注意", str);
                return;
            }
        }
    },

    initDragStuffs: function (a_node) {
        //break if it's not my turn.
        a_node.on(cc.Node.EventType.TOUCH_START, function (event) {
            console.log("cc.Node.EventType.TOUCH_START");
            if (cc.vv.gameNetMgr.turn != cc.vv.gameNetMgr.seatIndex) {
                return;
            }
            a_node.interactable = a_node.getComponent(cc.Button).interactable;
            if (!a_node.interactable) {
                return;
            }
            a_node.opacity = 255;
            this._chupaidrag.active = false;
            this._chupaidrag.getComponent(cc.Sprite).spriteFrame = a_node.getComponent(cc.Sprite).spriteFrame;
            this._chupaidrag.x = event.getLocationX() - this.node.width / 2;
            this._chupaidrag.y = event.getLocationY() - this.node.height / 2;
        }.bind(this));

        a_node.on(cc.Node.EventType.TOUCH_MOVE, function (event) {
            console.log("cc.Node.EventType.TOUCH_MOVE");
            if (cc.vv.gameNetMgr.turn != cc.vv.gameNetMgr.seatIndex) {
                return;
            }
            if (!a_node.interactable) {
                return;
            }
            if (Math.abs(event.getDeltaX()) + Math.abs(event.getDeltaY()) < 0.5) {
                return;
            }
            this._chupaidrag.active = true;
            a_node.opacity = 150;
            this._chupaidrag.opacity = 255;
            this._chupaidrag.scaleX = 1;
            this._chupaidrag.scaleY = 1;
            this._chupaidrag.x = event.getLocationX() - this.width / 2;
            this._chupaidrag.y = event.getLocationY() - this.height / 2;
            a_node.y = 0;
        }.bind(this));

        a_node.on(cc.Node.EventType.TOUCH_END, function (event) {
            if (cc.vv.gameNetMgr.turn != cc.vv.gameNetMgr.seatIndex) {
                return;
            }
            if (!a_node.interactable) {
                return;
            }
            console.log("cc.Node.EventType.TOUCH_END");
            this._chupaidrag.active = false;
            a_node.opacity = 255;
            if (event.getLocationY() >= 200) {
                this.shoot(a_node.mjId);
            }
        }.bind(this));

        a_node.on(cc.Node.EventType.TOUCH_CANCEL, function (event) {
            if (cc.vv.gameNetMgr.turn != cc.vv.gameNetMgr.seatIndex) {
                return;
            }
            if (!a_node.interactable) {
                return;
            }
            console.log("cc.Node.EventType.TOUCH_CANCEL");
            this._chupaidrag.active = false;
            a_node.opacity = 255;
            if (event.getLocationY() >= 200) {
                this.shoot(a_node.mjId);
            } else if (event.getLocationY() >= 150) {
                //this._huadongtishi.active = true;
                //this._huadongtishi.getComponent(cc.Animation).play('huadongtishi');
            }
        }.bind(this));
    },

    hideChupai: function () {
        for (var i = 0; i < this._chupaiSprite.length; ++i) {
            this._chupaiSprite[i].node.active = false;
        }
    },

    initEventHandlers: function () {
        cc.vv.gameNetMgr.dataEventHandler = this.node;

        //初始化事件监听器
        var self = this;

        this.node.on('game_holds', function (a_data) {
            self.drawMyHands();
            self.checkQueYiMen();
        });

        this.node.on('game_begin', function (a_data) {
            self.onGameBeign();
            //第一把开局，要提示
            if (cc.vv.gameNetMgr.numOfGames == 1) {
                self.checkIp();
            }
        });

        this.node.on('check_ip', function (a_data) {
            self.checkIp();
        });

        this.node.on('game_sync', function (a_data) {
            self.onGameBeign();
            self.checkIp();
        });

        this.node.on('game_chupai', function (a_data) {
            self.hideChupai();
            self.checkQueYiMen();
            if (a_data.last != cc.vv.gameNetMgr.seatIndex) {
                self.initMopai(a_data.last, null);
            }
            if (!cc.vv.replayMgr.isReplay() && a_data.turn != cc.vv.gameNetMgr.seatIndex) {
                self.initMopai(a_data.turn, -1);
            }
        });

        this.node.on('game_mopai', function (a_data) {
            self.hideChupai();
            var pai = a_data.pai;
            var localIndex = cc.vv.gameNetMgr.getLocalIndex(a_data.seatIndex);
            if (localIndex == 0) {
                var index = 13;
                var sprite = self._myMJArr[index];
                self.setSpriteFrameByMJID("M_", sprite, pai, index);
                sprite.node.mjId = pai;
            } else if (cc.vv.replayMgr.isReplay()) {
                self.initMopai(a_data.seatIndex, pai);
            }
        });

        this.node.on('game_action', function (a_data) {
            self.showAction(a_data);
        });

        this.node.on('hupai', function (a_data) {
            //如果不是玩家自己，则将玩家的牌都放倒
            var seatIndex = a_data.seatindex;
            var localIndex = cc.vv.gameNetMgr.getLocalIndex(seatIndex);
            var hupai = self._hupaiTips[localIndex];
            hupai.active = true;

            if (localIndex == 0) {
                self.hideOptions();
            }
            var seatData = cc.vv.gameNetMgr.seats[seatIndex];
            seatData.hued = true;
            if (cc.vv.gameNetMgr.conf.type == "xlch") {
                hupai.getChildByName("sprHu").active = true;
                hupai.getChildByName("sprZimo").active = false;
                self.initHupai(localIndex, a_data.hupai);
                if (a_data.iszimo) {
                    if (seatData.seatindex == cc.vv.gameNetMgr.seatIndex) {
                        seatData.holds.pop();
                        self.drawMyHands();
                    } else {
                        self.drawOtherHands(seatData);
                    }
                }
            } else {
                hupai.getChildByName("sprHu").active = !a_data.iszimo;
                hupai.getChildByName("sprZimo").active = a_data.iszimo;

                if (!(a_data.iszimo && localIndex == 0)) {
                    //if(cc.vv.replayMgr.isReplay() == false && localIndex != 0){
                    //    self.initEmptySprites(seatIndex);                
                    //}
                    self.initMopai(seatIndex, a_data.hupai);
                }
            }

            if (cc.vv.replayMgr.isReplay() == true && cc.vv.gameNetMgr.conf.type != "xlch") {
                var opt = self._opts[localIndex];
                opt.node.active = true;
                opt.sprite.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("M_", a_data.hupai);
            }

            if (a_data.iszimo) {
                self.playEfx(localIndex, "play_zimo");
            } else {
                self.playEfx(localIndex, "play_hu");
            }

            cc.vv.audioMgr.playSFX("nv/hu.mp3");
        });

        this.node.on('mj_count', function (a_data) {
            self._mjcount.string = "剩余" + cc.vv.gameNetMgr.numOfMJ + "张";
        });

        this.node.on('game_num', function (a_data) {
            self._gamecount.string = "" + cc.vv.gameNetMgr.numOfGames + "/" + cc.vv.gameNetMgr.maxNumOfGames + "局";
        });

        this.node.on('game_over', function (a_data) {
            self.gameRoot.active = false;
            self.prepareRoot.active = true;
        });


        this.node.on('game_chupai_notify', function (a_data) {
            self.hideChupai();
            var seatData = a_data.seatData;
            //如果是自己，则刷新手牌
            if (seatData.seatindex == cc.vv.gameNetMgr.seatIndex) {
                self.drawMyHands();
            } else {
                self.drawOtherHands(seatData);
            }
            self.showChupai();
            var audioUrl = cc.vv.mahjongmgr.getAudioURLByMJID(a_data.pai);
            cc.vv.audioMgr.playSFX(audioUrl);
        });

        this.node.on('guo_notify', function (a_data) {
            self.hideChupai();
            self.hideOptions();
            var seatData = a_data;
            //如果是自己，则刷新手牌
            if (seatData.seatindex == cc.vv.gameNetMgr.seatIndex) {
                self.drawMyHands();
            }
            cc.vv.audioMgr.playSFX("give.mp3");
        });

        this.node.on('guo_result', function (a_data) {
            self.hideOptions();
        });

        this.node.on('game_dingque_finish', function (a_data) {
            self.drawMyHands();
        });

        this.node.on('peng_notify', function (a_data) {
            self.hideChupai();

            var seatData = a_data;
            if (seatData.seatindex == cc.vv.gameNetMgr.seatIndex) {
                self.drawMyHands();
            } else {
                self.drawOtherHands(seatData);
            }
            var localIndex = self.getLocalIndex(seatData.seatindex);
            self.playEfx(localIndex, "play_peng");
            cc.vv.audioMgr.playSFX("nv/peng.mp3");
            self.hideOptions();
        });

        this.node.on('gang_notify', function (a_data) {
            self.hideChupai();
            var seatData = a_data.seatData;
            var gangType = a_data.gangtype;
            if (seatData.seatindex == cc.vv.gameNetMgr.seatIndex) {
                self.drawMyHands();
            } else {
                self.drawOtherHands(seatData);
            }

            var localIndex = self.getLocalIndex(seatData.seatindex);
            if (gangType == "wangang") {
                self.playEfx(localIndex, "play_guafeng");
                cc.vv.audioMgr.playSFX("guafeng.mp3");
            } else {
                self.playEfx(localIndex, "play_xiayu");
                cc.vv.audioMgr.playSFX("rain.mp3");
            }
        });

        this.node.on("hangang_notify", function (a_data) {
            var localIndex = self.getLocalIndex(a_data);
            self.playEfx(localIndex, "play_gang");
            cc.vv.audioMgr.playSFX("nv/gang.mp3");
            self.hideOptions();
        });

        this.node.on('login_result', function () {
            self.gameRoot.active = false;
            self.prepareRoot.active = true;
            console.log('login_result');
        });
    },

    showChupai: function () {
        var pai = cc.vv.gameNetMgr.chupai;
        if (pai >= 0) {
            //
            var localIndex = this.getLocalIndex(cc.vv.gameNetMgr.turn);
            var sprite = this._chupaiSprite[localIndex];
            sprite.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("M_", pai);
            sprite.node.active = true;
        }
    },

    addOption: function (a_btnName, a_pai) {
        for (var i = 0; i < this._options.childrenCount; ++i) {
            var child = this._options.children[i];
            if (child.name == "op" && child.active == false) {
                child.active = true;
                var sprite = child.getChildByName("opTarget").getComponent(cc.Sprite);
                sprite.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("M_", a_pai);
                var btn = child.getChildByName(a_btnName);
                btn.active = true;
                btn.pai = a_pai;
                return;
            }
        }
    },

    hideOptions: function (a_data) {
        this._options.active = false;
        for (var i = 0; i < this._options.childrenCount; ++i) {
            var child = this._options.children[i];
            if (child.name == "op") {
                child.active = false;
                child.getChildByName("btnPeng").active = false;
                child.getChildByName("btnGang").active = false;
                child.getChildByName("btnHu").active = false;
            }
        }
    },

    showAction: function (a_data) {
        if (this._options.active) {
            this.hideOptions();
        }

        if (a_data && (a_data.hu || a_data.gang || a_data.peng)) {
            this._options.active = true;
            if (a_data.hu) {
                this.addOption("btnHu", a_data.pai);
            }
            if (a_data.peng) {
                this.addOption("btnPeng", a_data.pai);
            }

            if (a_data.gang) {
                for (var i = 0; i < a_data.gangpai.length; ++i) {
                    var gp = a_data.gangpai[i];
                    this.addOption("btnGang", gp);
                }
            }
        }
    },

    initWanfaLabel: function () {
        var wanfa = cc.find("Canvas/infobar/wanfa").getComponent(cc.Label);
        wanfa.string = cc.vv.gameNetMgr.getWanfa();
    },

    initHupai: function (a_localIndex, a_pai) {
        if (cc.vv.gameNetMgr.conf.type == "xlch") {
            var hupailist = this._hupaiLists[a_localIndex];
            for (var i = 0; i < hupailist.children.length; ++i) {
                var hupainode = hupailist.children[i];
                if (hupainode.active == false) {
                    var pre = cc.vv.mahjongmgr.getFoldPre(a_localIndex);
                    hupainode.getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(pre, a_pai);
                    hupainode.active = true;
                    break;
                }
            }
        }
    },

    playEfx: function (a_index, a_name) {
        this._playEfxs[a_index].node.active = true;
        this._playEfxs[a_index].play(a_name);
    },

    onGameBeign: function () {

        for (var i = 0; i < this._playEfxs.length; ++i) {
            this._playEfxs[i].node.active = false;
        }

        for (var i = 0; i < this._hupaiLists.length; ++i) {
            for (var j = 0; j < this._hupaiLists[i].childrenCount; ++j) {
                this._hupaiLists[i].children[j].active = false;
            }
        }

        for (var i = 0; i < cc.vv.gameNetMgr.seats.length; ++i) {
            var seatData = cc.vv.gameNetMgr.seats[i];
            var localIndex = cc.vv.gameNetMgr.getLocalIndex(i);
            var hupai = this._hupaiTips[localIndex];
            hupai.active = seatData.hued;
            if (seatData.hued) {
                hupai.getChildByName("sprHu").active = !seatData.iszimo;
                hupai.getChildByName("sprZimo").active = seatData.iszimo;
            }

            if (seatData.huinfo) {
                for (var j = 0; j < seatData.huinfo.length; ++j) {
                    var info = seatData.huinfo[j];
                    if (info.ishupai) {
                        this.initHupai(localIndex, info.pai);
                    }
                }
            }
        }

        this.hideChupai();
        this.hideOptions();
        var sides = ["right", "up", "left"];
        var gameChild = this.node.getChildByName("game");
        for (var i = 0; i < sides.length; ++i) {
            var sideChild = gameChild.getChildByName(sides[i]);
            var holds = sideChild.getChildByName("holds");
            for (var j = 0; j < holds.childrenCount; ++j) {
                var nc = holds.children[j];
                nc.active = true;
                nc.scaleX = 1.0;
                nc.scaleY = 1.0;
                var sprite = nc.getComponent(cc.Sprite);
                sprite.spriteFrame = cc.vv.mahjongmgr.holdsEmpty[i + 1];
            }
        }

        if (cc.vv.gameNetMgr.gamestate == "" && cc.vv.replayMgr.isReplay() == false) {
            return;
        }

        this.gameRoot.active = true;
        this.prepareRoot.active = false;
        this.drawMyHands();
        var seats = cc.vv.gameNetMgr.seats;
        for (var i in seats) {
            var seatData = seats[i];
            var localIndex = cc.vv.gameNetMgr.getLocalIndex(i);
            if (localIndex != 0) {
                this.drawOtherHands(seatData);
                if (i == cc.vv.gameNetMgr.turn) {
                    this.initMopai(i, -1);
                } else {
                    this.initMopai(i, null);
                }
            }
        }
        this.showChupai();
        if (cc.vv.gameNetMgr.curaction != null) {
            this.showAction(cc.vv.gameNetMgr.curaction);
            cc.vv.gameNetMgr.curaction = null;
        }

        this.checkQueYiMen();
    },

    onMJClicked: function (a_event) {
        if (cc.vv.gameNetMgr.isHuanSanZhang) {
            this.node.emit("mj_clicked", a_event.target);
            return;
        }

        //如果不是自己的轮子，则忽略
        if (cc.vv.gameNetMgr.turn != cc.vv.gameNetMgr.seatIndex) {
            console.log("not your turn." + cc.vv.gameNetMgr.turn);
            return;
        }

        for (var i = 0; i < this._myMJArr.length; ++i) {
            if (a_event.target == this._myMJArr[i].node) {
                //如果是再次点击，则出牌
                if (a_event.target == this._selectedMJ) {
                    this.shoot(this._selectedMJ.mjId);
                    this._selectedMJ.y = 0;
                    this._selectedMJ = null;
                    return;
                }
                if (this._selectedMJ != null) {
                    this._selectedMJ.y = 0;
                }
                a_event.target.y = 15;
                this._selectedMJ = a_event.target;
                return;
            }
        }
    },

    //出牌
    shoot: function (a_mjId) {
        if (a_mjId == null) {
            return;
        }
        cc.vv.net.send('chupai', a_mjId);
    },

    getMJIndex: function (a_side, a_index) {
        if (a_side == "right" || a_side == "up") {
            return 13 - a_index;
        }
        return a_index;
    },

    initMopai: function (a_seatIndex, a_pai) {
        var localIndex = cc.vv.gameNetMgr.getLocalIndex(a_seatIndex);
        var side = cc.vv.mahjongmgr.getSide(localIndex);
        var pre = cc.vv.mahjongmgr.getFoldPre(localIndex);

        var gameChild = this.node.getChildByName("game");
        var sideChild = gameChild.getChildByName(side);
        var holds = sideChild.getChildByName("holds");

        var lastIndex = this.getMJIndex(side, 13);
        var nc = holds.children[lastIndex];

        nc.scaleX = 1.0;
        nc.scaleY = 1.0;

        if (a_pai == null) {
            nc.active = false;
        } else if (a_pai >= 0) {
            nc.active = true;
            if (side == "up") {
                nc.scaleX = 0.73;
                nc.scaleY = 0.73;
            }
            var sprite = nc.getComponent(cc.Sprite);
            sprite.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(pre, a_pai);
        } else if (a_pai != null) {
            nc.active = true;
            if (side == "up") {
                nc.scaleX = 1.0;
                nc.scaleY = 1.0;
            }
            var sprite = nc.getComponent(cc.Sprite);
            sprite.spriteFrame = cc.vv.mahjongmgr.getHoldsEmptySpriteFrame(side);
        }
    },

    initEmptySprites: function (a_seatIndex) {
        var localIndex = cc.vv.gameNetMgr.getLocalIndex(a_seatIndex);
        var side = cc.vv.mahjongmgr.getSide(localIndex);
        var pre = cc.vv.mahjongmgr.getFoldPre(localIndex);

        var gameChild = this.node.getChildByName("game");
        var sideChild = gameChild.getChildByName(side);
        var holds = sideChild.getChildByName("holds");
        var spriteFrame = cc.vv.mahjongmgr.getEmptySpriteFrame(side);
        for (var i = 0; i < holds.childrenCount; ++i) {
            var nc = holds.children[i];
            nc.scaleX = 1.0;
            nc.scaleY = 1.0;

            var sprite = nc.getComponent(cc.Sprite);
            sprite.spriteFrame = spriteFrame;
        }
    },

    drawOtherHands: function (a_seatData) {
        //console.log("seat:" + seatData.seatindex);
        var localIndex = this.getLocalIndex(a_seatData.seatindex);
        if (localIndex == 0) {
            return;
        }
        var side = cc.vv.mahjongmgr.getSide(localIndex);
        var game = this.node.getChildByName("game");
        var sideRoot = game.getChildByName(side);
        var sideHolds = sideRoot.getChildByName("holds");
        var meldTilesNum = a_seatData.pengs.length + a_seatData.angangs.length + a_seatData.diangangs.length + a_seatData.wangangs.length;
        meldTilesNum *= 3; // Each set shows width of 3 tiles
        for (var i = 0; i < meldTilesNum; ++i) {
            var idx = this.getMJIndex(side, i);
            sideHolds.children[idx].active = false; // Hide these tiles
        }

        var pre = cc.vv.mahjongmgr.getFoldPre(localIndex);
        var holds = this.sortHolds(a_seatData);
        if (holds != null && holds.length > 0) {
            for (var i = 0; i < holds.length; ++i) {
                var idx = this.getMJIndex(side, i + meldTilesNum);
                var sprite = sideHolds.children[idx].getComponent(cc.Sprite);
                if (side == "up") {
                    sprite.node.scaleX = 0.73;
                    sprite.node.scaleY = 0.73;
                }
                sprite.node.active = true; // Show this tile
                sprite.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(pre, holds[i]);
            }

            if (holds.length + meldTilesNum == 13) {
                var lastIdx = this.getMJIndex(side, 13);
                sideHolds.children[lastIdx].active = false; // Hide the last tile
            }
        }
    },

    sortHolds: function (a_seatData) {
        var holds = a_seatData.holds;
        if (holds == null) {
            return null;
        }
        //如果手上的牌的数目是2,5,8,11,14，表示最后一张牌是刚摸到的牌
        var mopai = null;
        var l = holds.length
        if (l == 2 || l == 5 || l == 8 || l == 11 || l == 14) {
            mopai = holds.pop();
        }

        var dingque = a_seatData.dingque;
        cc.vv.mahjongmgr.sortMJ(holds, dingque);

        //将摸牌添加到最后
        if (mopai != null) {
            holds.push(mopai);
        }
        return holds;
    },

    drawMyHands: function () {
        var seats = cc.vv.gameNetMgr.seats;
        var seatData = seats[cc.vv.gameNetMgr.seatIndex];
        var holds = this.sortHolds(seatData);
        if (holds == null) {
            return;
        }

        //初始化手牌
        var meldTilesNum = (seatData.pengs.length + seatData.angangs.length + seatData.diangangs.length + seatData.wangangs.length) * 3;
        for (var i = 0; i < holds.length; ++i) {
            var tile = holds[i];
            var sprite = this._myMJArr[i + meldTilesNum];
            sprite.node.mjId = tile;
            sprite.node.y = 0;
            this.setSpriteFrameByMJID("M_", sprite, tile); // Set proper tile picture
        }
        for (var i = 0; i < meldTilesNum; ++i) {
            var sprite = this._myMJArr[i];
            sprite.node.mjId = null;
            sprite.spriteFrame = null;
            sprite.node.active = false; // Hide tiles that overlay with melds
        }
        for (var i = meldTilesNum + holds.length; i < this._myMJArr.length; ++i) {
            var sprite = this._myMJArr[i];
            sprite.node.mjId = null;
            sprite.spriteFrame = null;
            sprite.node.active = false; // ?
        }
    },

    setSpriteFrameByMJID: function (a_pre, a_sprite, a_mjid) {
        a_sprite.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(a_pre, a_mjid);
        a_sprite.node.active = true;
    },

    //如果玩家手上还有缺的牌没有打，则只能打缺牌
    checkQueYiMen: function () {
        if (cc.vv.gameNetMgr.conf == null || cc.vv.gameNetMgr.conf.type != "xlch" || !cc.vv.gameNetMgr.getSelfData().hued) {
            //遍历检查看是否有未打缺的牌 如果有，则需要将不是定缺的牌设置为不可用
            var dingque = cc.vv.gameNetMgr.dingque;
            //        console.log(dingque)
            var hasQue = false;
            if (cc.vv.gameNetMgr.seatIndex == cc.vv.gameNetMgr.turn) {
                for (var i = 0; i < this._myMJArr.length; ++i) {
                    var sprite = this._myMJArr[i];
                    //                console.log("sprite.node.mjId:" + sprite.node.mjId);
                    if (sprite.node.mjId != null) {
                        var type = cc.vv.mahjongmgr.getMahjongType(sprite.node.mjId);
                        if (type == dingque) {
                            hasQue = true;
                            break;
                        }
                    }
                }
            }

            //        console.log("hasQue:" + hasQue);
            for (var i = 0; i < this._myMJArr.length; ++i) {
                var sprite = this._myMJArr[i];
                if (sprite.node.mjId != null) {
                    var type = cc.vv.mahjongmgr.getMahjongType(sprite.node.mjId);
                    if (hasQue && type != dingque) {
                        sprite.node.getComponent(cc.Button).interactable = false;
                    } else {
                        sprite.node.getComponent(cc.Button).interactable = true;
                    }
                }
            }
        } else {
            if (cc.vv.gameNetMgr.seatIndex == cc.vv.gameNetMgr.turn) {
                for (var i = 0; i < 14; ++i) {
                    var sprite = this._myMJArr[i];
                    if (sprite.node.active == true) {
                        sprite.node.getComponent(cc.Button).interactable = i == 13;
                    }
                }
            } else {
                for (var i = 0; i < 14; ++i) {
                    var sprite = this._myMJArr[i];
                    if (sprite.node.active == true) {
                        sprite.node.getComponent(cc.Button).interactable = true;
                    }
                }
            }
        }
    },

    getLocalIndex: function (a_index) {
        var ret = (a_index - cc.vv.gameNetMgr.seatIndex + 4) % 4;
        //console.log("old:" + index + ",base:" + cc.vv.gameNetMgr.seatIndex + ",new:" + ret);
        return ret;
    },

    onOptionClicked: function (a_event) {
        console.log(a_event.target.pai);
        if (a_event.target.name == "btnPeng") {
            cc.vv.net.send("peng");
        } else if (a_event.target.name == "btnGang") {
            cc.vv.net.send("gang", a_event.target.pai);
        } else if (a_event.target.name == "btnHu") {
            cc.vv.net.send("hu");
        } else if (a_event.target.name == "btnGuo") {
            cc.vv.net.send("guo");
        }
    },

    // called every frame, uncomment this function to activate update callback
    update: function (dt) {},

    onDestroy: function () {
        console.log("onDestroy");
        if (cc.vv) {
            cc.vv.gameNetMgr.clear();
        }
    }
});