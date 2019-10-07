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

        _handsSprites: [],
        _nodeActions: null,
        _discardingTileSprites: [],
        _remainingTilesCount: null,
        _remainingHandsCount: null,
        _winTilesTips: [],
        _nodeHonorTiles: [],
        _playEfxs: [],
        _options: [],
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

        this._remainingTilesCount = gameChild.getChildByName("mjcount").getComponent(cc.Label);
        this._remainingTilesCount.string = "剩余" + cc.vv.gameNetMgr.numOfMJ + "张";
        this._remainingHandsCount = gameChild.getChildByName("gamecount").getComponent(cc.Label);
        this._remainingHandsCount.string = "" + cc.vv.gameNetMgr.numOfGames + "/" + cc.vv.gameNetMgr.maxNumOfGames + "局";

        var myselfChild = gameChild.getChildByName("myself");
        var myHands = myselfChild.getChildByName("holds");

        this._chupaidrag = gameChild.getChildByName("chupaidrag");
        this._chupaidrag.active = false;

        for (var i = 0; i < myHands.children.length; ++i) {
            var sprite = myHands.children[i].getComponent(cc.Sprite);
            this._handsSprites.push(sprite);

            sprite.spriteFrame = null;
            this.initDragStuffs(sprite.node);
        }

        var nodeSidesNames = ["myself", "right", "up", "left"];
        for (var i = 0; i < nodeSidesNames.length; ++i) {
            var nodeSideName = nodeSidesNames[i];

            var sideChild = gameChild.getChildByName(nodeSideName);
            this._winTilesTips.push(sideChild.getChildByName("HuPai"));

            var nodeHonorTiles = sideChild.getChildByName("nodeHonorTiles");
            if (nodeSideName == "right") {
                for (var j = 0; j < nodeHonorTiles.children.length; j++) { // This side need to revert zIndex to show tiles properly
                    nodeHonorTiles.children[j].zIndex = -j;
                }
            }
            this._nodeHonorTiles.push(nodeHonorTiles);

            this._playEfxs.push(sideChild.getChildByName("play_efx").getComponent(cc.Animation));
            this._discardingTileSprites.push(sideChild.getChildByName("ChuPai").children[0].getComponent(cc.Sprite));

            var opt = sideChild.getChildByName("opt");
            opt.active = false;
            var sprite = opt.getChildByName("pai").getComponent(cc.Sprite);
            var data = {
                node: opt,
                sprite: sprite
            };
            this._options.push(data);
        }

        var nodeActions = gameChild.getChildByName("nodeActions");
        this._nodeActions = nodeActions;
        this._nodeActions.zIndex = 100;
        // this.hideActions();
        this.hideDiscardingTiles();
    },

    start: function () {
        this.checkIp();
    },

    checkIp: function () {
        if (cc.vv.gameNetMgr.gamestate == "") {
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
        // Break if it is not my turn.
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
                this.discardTile(a_node.tile);
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
                this.discardTile(a_node.tile);
            } else if (event.getLocationY() >= 150) {
                //this._huadongtishi.active = true;
                //this._huadongtishi.getComponent(cc.Animation).play("huadongtishi");
            }
        }.bind(this));
    },

    hideDiscardingTiles: function () {
        for (var i = 0; i < this._discardingTileSprites.length; ++i) {
            this._discardingTileSprites[i].node.active = false;
            this._discardingTileSprites[i].node.y = 0;
        }
    },

    initEventHandlers: function () {
        cc.vv.gameNetMgr.dataEventHandler = this.node;

        //初始化事件监听器
        var self = this;

        this.node.on("event_hands", function (a_data) {
            self.drawMyHands();
            self.checkQueYiMen();
        });

        this.node.on("event_game_begin", function (a_data) {
            self.onGameBeign();
            //第一把开局，要提示
            if (cc.vv.gameNetMgr.numOfGames == 1) {
                self.checkIp();
            }
        });

        this.node.on("event_check_ip", function (a_data) {
            self.checkIp();
        });

        this.node.on("event_game_sync", function (a_data) {
            self.onGameBeign();
            self.checkIp();
        });

        this.node.on("event_turn", function (a_data) {
            self.hideDiscardingTiles();
            self.checkQueYiMen();
            if (a_data.last != cc.vv.gameNetMgr.seatIndex) {
                self.drawTile(a_data.last, null);
            }
            if (!cc.vv.replayMgr.isReplaying() && a_data.turn != cc.vv.gameNetMgr.seatIndex) {
                self.drawTile(a_data.turn, -1);
            }
        });

        this.node.on("event_draw_tile", function (a_data) {
            self.hideDiscardingTiles();

            var tile = a_data.pai;
            var localIndex = cc.vv.gameNetMgr.getLocalIndex(a_data.seatIndex);
            if (localIndex == 0) {
                var tileSpritePos = 13; // The draw tile position
                var sprite = self._handsSprites[tileSpritePos];
                sprite.node.tile = tile;
                sprite.node.y = 15;
                self.setSpriteFrameByTile("M_", sprite, tile);
            } else if (cc.vv.replayMgr.isReplaying()) {
                self.drawTile(a_data.seatIndex, tile);
            } else {
                // Do nothing
            }
        });

        this.node.on("event_game_actions", function (a_data) {
            self.showActions(a_data);
        });

        this.node.on("event_server_message", function (a_data) {
            alert("服務器消息：\r\n" + a_data);
        });

        this.node.on("event_win", function (a_data) {
            //如果不是玩家自己，则将玩家的牌都放倒
            var seatIndex = a_data.seatindex;
            var localIndex = cc.vv.gameNetMgr.getLocalIndex(seatIndex);
            var hupai = self._winTilesTips[localIndex];
            hupai.active = true;

            // if (localIndex == 0) {
            //     self.hideActions();
            // }
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
                    //if(cc.vv.replayMgr.isReplaying() == false && localIndex != 0){
                    //    self.initEmptySprites(seatIndex);                
                    //}
                    self.drawTile(seatIndex, a_data.hupai);
                }
            }

            if (cc.vv.replayMgr.isReplaying() == true && cc.vv.gameNetMgr.conf.type != "xlch") {
                var opt = self._options[localIndex];
                opt.node.active = true;
                opt.sprite.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByTile("M_", a_data.hupai);
            }

            if (a_data.iszimo) {
                self.playEfx(localIndex, "play_zimo");
            } else {
                self.playEfx(localIndex, "play_hu");
            }

            cc.vv.audioMgr.playSFX("nv/hu.mp3");
        });

        this.node.on("event_remaining_tiles", function (a_data) {
            self._remainingTilesCount.string = "剩余" + cc.vv.gameNetMgr.numOfMJ + "张";
        });

        this.node.on("event_remaining_hands", function (a_data) {
            self._remainingHandsCount.string = "" + cc.vv.gameNetMgr.numOfGames + "/" + cc.vv.gameNetMgr.maxNumOfGames + "局";
        });

        this.node.on("event_hand_finish", function (a_data) {
            self.gameRoot.active = false;
            self.prepareRoot.active = true;
        });

        this.node.on("event_game_discard_tile", function (a_data) {
            self.hideDiscardingTiles();
            var seatData = a_data.seatData;
            //如果是自己，则刷新手牌
            if (seatData.seatindex == cc.vv.gameNetMgr.seatIndex) {
                self.drawMyHands();
            } else {
                self.drawOtherHands(seatData);
            }
            self.showDiscardingTile();
            var audioUrl = cc.vv.mahjongmgr.getAudioUrlByTile(a_data.pai);
            cc.vv.audioMgr.playSFX(audioUrl);
        });

        this.node.on("event_player_pass", function (a_data) {
            self.hideDiscardingTiles();
            // self.hideActions();

            var seatData = a_data;
            //如果是自己，则刷新手牌
            if (seatData.seatindex == cc.vv.gameNetMgr.seatIndex) {
                self.drawMyHands();
            }
            cc.vv.audioMgr.playSFX("give.mp3");
        });

        this.node.on("event_pass_result", function (a_data) {
            // self.hideActions();
        });

        this.node.on("event_game_dingque_finish", function (a_data) {
            self.drawMyHands();
        });

        this.node.on("event_pong", function (a_data) {
            self.hideDiscardingTiles();

            var seatData = a_data;
            if (seatData.seatindex == cc.vv.gameNetMgr.seatIndex) {
                self.drawMyHands();
            } else {
                self.drawOtherHands(seatData);
            }
            var localIndex = self.getLocalIndex(seatData.seatindex);
            self.playEfx(localIndex, "play_peng");
            cc.vv.audioMgr.playSFX("nv/peng.mp3");
            // self.hideActions();
        });

        this.node.on("event_kong", function (a_data) { // Mainly draw hands
            self.hideDiscardingTiles();
            var seatData = a_data.seatData;
            var meldType = a_data.meldType;

            if (seatData.seatindex == cc.vv.gameNetMgr.seatIndex) { // Here only draw hands, in onPengGangChanged() draw melds
                self.drawMyHands();
            } else {
                self.drawOtherHands(seatData);
            }

            var localIndex = self.getLocalIndex(seatData.seatindex);
            if (meldType == "meld_pong_to_kong") {
                self.playEfx(localIndex, "play_guafeng");
                cc.vv.audioMgr.playSFX("guafeng.mp3");
            } else {
                self.playEfx(localIndex, "play_xiayu");
                cc.vv.audioMgr.playSFX("rain.mp3");
            }
        });

        this.node.on("event_call_kong", function (a_data) { // Mainly play Efx
            var localIndex = self.getLocalIndex(a_data);
            self.playEfx(localIndex, "play_gang");
            cc.vv.audioMgr.playSFX("nv/gang.mp3");
            // self.hideActions();
        });

        this.node.on("event_login_result", function () {
            self.gameRoot.active = false;
            self.prepareRoot.active = true;
            console.log("event_login_result");
        });
    },

    showDiscardingTile: function () {
        var discardingTile = cc.vv.gameNetMgr._discardingTile;
        if (discardingTile >= 0) {
            var turnIndex = this.getLocalIndex(cc.vv.gameNetMgr.turn);
            var sprite = this._discardingTileSprites[turnIndex];
            sprite.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByTile("M_", discardingTile);
            sprite.node.active = true;
        }
    },

    addAction: function (a_btnName, a_pai) {
        for (var i = 0; i < this._nodeActions.childrenCount; ++i) {
            var child = this._nodeActions.children[i];
            // if (child.name == "op" && child.active == false) {
            child.active = true;

            // Set picture
            // var sprite = child.getChildByName("opTarget").getComponent(cc.Sprite);
            // sprite.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByTile("M_", a_pai);

            // Enable button
            //     var btn = child.getChildByName(a_btnName);
            //     btn.active = true;
            //     btn.pai = a_pai;
            //     return;
            // }
        }
    },

    hideActions: function (a_data) {
        this._nodeActions.active = false;
        for (var i = 0; i < this._nodeActions.childrenCount; ++i) {
            var child = this._nodeActions.children[i];
            // if (child.name == "op") {
            child.active = false;
            //     child.getChildByName("btnActionPong").active = false;
            //     child.getChildByName("btnActionKong").active = false;
            //     child.getChildByName("btnActionWin").active = false;
            // }
        }
    },

    showActions: function (a_data) {
        // if (this._nodeActions.active) {
        //     this.hideActions();
        // }

        // if (a_data && (a_data.hu || a_data.gang || a_data.peng)) {
        //     this._nodeActions.active = true;
        //     if (a_data.hu) {
        //         this.addAction("btnActionWin", a_data.pai);
        //     }
        //     if (a_data.peng) {
        //         this.addAction("btnActionPong", a_data.pai);
        //     }
        //     if (a_data.gang) {
        //         for (var i = 0; i < a_data.gangpai.length; ++i) {
        //             var kongTile = a_data.gangpai[i];
        //             this.addAction("btnActionKong", kongTile);
        //         }
        //     }
        // }
    },

    initWanfaLabel: function () {
        var lableWanfa = cc.find("Canvas/infobar/wanfa").getComponent(cc.Label);
        lableWanfa.string = cc.vv.gameNetMgr.getWanfa();
    },

    initHupai: function (a_localIndex, a_pai) {
        if (cc.vv.gameNetMgr.conf.type == "xlch") {
            var nodeWinTilesList = this._nodeHonorTiles[a_localIndex];
            for (var i = 0; i < nodeWinTilesList.children.length; ++i) {
                var nodeWinTile = nodeWinTilesList.children[i];
                if (nodeWinTile.active == false) {
                    var pre = cc.vv.mahjongmgr.getFoldPrefixString(a_localIndex);
                    nodeWinTile.getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByTile(pre, a_pai);
                    nodeWinTile.active = true;
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

        for (var i = 0; i < this._nodeHonorTiles.length; ++i) {
            for (var j = 0; j < this._nodeHonorTiles[i].childrenCount; ++j) {
                this._nodeHonorTiles[i].children[j].active = false;
            }
        }

        for (var i = 0; i < cc.vv.gameNetMgr.seats.length; ++i) {
            var seatData = cc.vv.gameNetMgr.seats[i];
            var localIndex = cc.vv.gameNetMgr.getLocalIndex(i);
            var hupai = this._winTilesTips[localIndex];
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

        this.hideDiscardingTiles();
        // this.hideActions();
        var sides = ["right", "up", "left"];
        var gameChild = this.node.getChildByName("game");
        for (var i = 0; i < sides.length; ++i) {
            var sideChild = gameChild.getChildByName(sides[i]);
            var holds = sideChild.getChildByName("holds");
            for (var j = 0; j < holds.childrenCount; ++j) {
                var nodeTile = holds.children[j];
                nodeTile.active = true;
                var sprite = nodeTile.getComponent(cc.Sprite);
                sprite.spriteFrame = cc.vv.mahjongmgr.holdsEmpty[i + 1];
            }
        }

        if (cc.vv.gameNetMgr.gamestate == "" && cc.vv.replayMgr.isReplaying() == false) {
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
                    this.drawTile(i, -1);
                } else {
                    this.drawTile(i, null);
                }
            }
        }
        this.showDiscardingTile();
        if (cc.vv.gameNetMgr.curaction != null) {
            this.showActions(cc.vv.gameNetMgr.curaction);
            cc.vv.gameNetMgr.curaction = null;
        }

        this.checkQueYiMen();
    },

    onClickedTile: function (a_event) {
        if (cc.vv.gameNetMgr.isHuanSanZhang) {
            this.node.emit("event_select_tile", a_event.target);
            return;
        }

        //如果不是自己的轮子，则忽略
        // if (cc.vv.gameNetMgr.turn != cc.vv.gameNetMgr.seatIndex) {
        //     console.log("not your turn." + cc.vv.gameNetMgr.turn);
        //     return;
        // }

        for (var i = 0; i < this._handsSprites.length; ++i) {
            if (a_event.target == this._handsSprites[i].node) { // Clicked this tile
                if (this._handsSprites[i].node.y == 0) {
                    this._handsSprites[i].node.y = 15; // Decend tile, as unselected
                } else {
                    this._handsSprites[i].node.y = 0; // Ascend tile, as selected
                }
                return;
            }
        }
    },

    //出牌
    discardTile: function (a_tile) {
        if (a_tile == null) {
            return;
        }
        cc.vv.net.send("req_discard", a_tile);
    },

    getLastTilePositionBySide: function (a_side, a_position) {
        if (a_side == "right" || a_side == "up") {
            return 13 - a_position;
        }
        return a_position;
    },

    drawTile: function (a_seatIndex, a_tile) {
        var localIndex = cc.vv.gameNetMgr.getLocalIndex(a_seatIndex);
        var side = cc.vv.mahjongmgr.getSideString(localIndex);
        var prefab = cc.vv.mahjongmgr.getFoldPrefixString(localIndex);

        var nodeGame = this.node.getChildByName("game");
        var nodeSide = nodeGame.getChildByName(side);
        var nodeHands = nodeSide.getChildByName("holds");

        var lastTilePosition = this.getLastTilePositionBySide(side, 13);
        var nodeTile = nodeHands.children[lastTilePosition];

        if (a_tile == null) { // Null tile, then hide it
            nodeTile.active = false;
        } else if (a_tile >= 0) { // Valid tile. TODO: add upper value check
            nodeTile.active = true;
            var sprite = nodeTile.getComponent(cc.Sprite);
            sprite.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByTile(prefab, a_tile);
        } else if (a_tile != null) { // < 0 Invalid tile
            nodeTile.active = true;
            var sprite = nodeTile.getComponent(cc.Sprite);
            sprite.spriteFrame = cc.vv.mahjongmgr.getHoldsEmptySpriteFrame(side);
        }
    },

    initEmptySprites: function (a_seatIndex) {
        var localIndex = cc.vv.gameNetMgr.getLocalIndex(a_seatIndex);
        var side = cc.vv.mahjongmgr.getSideString(localIndex);
        var pre = cc.vv.mahjongmgr.getFoldPrefixString(localIndex);

        var gameChild = this.node.getChildByName("game");
        var sideChild = gameChild.getChildByName(side);
        var holds = sideChild.getChildByName("holds");
        var spriteFrame = cc.vv.mahjongmgr.getFoldSpriteFrame(side);
        for (var i = 0; i < holds.childrenCount; ++i) {
            var nodeTile = holds.children[i];
            var sprite = nodeTile.getComponent(cc.Sprite);
            sprite.spriteFrame = spriteFrame;
        }
    },

    drawOtherHands: function (a_seatData) {
        //console.log("seat:" + seatData.seatindex);
        var localIndex = this.getLocalIndex(a_seatData.seatindex);
        if (localIndex == 0) {
            return;
        }
        var side = cc.vv.mahjongmgr.getSideString(localIndex);
        var game = this.node.getChildByName("game");
        var sideRoot = game.getChildByName(side);
        var sideHolds = sideRoot.getChildByName("holds");
        var meldTilesNum = a_seatData.melds.length;
        meldTilesNum *= 3; // Each set shows width of 3 tiles
        for (var i = 0; i < meldTilesNum; ++i) {
            var idx = this.getLastTilePositionBySide(side, i);
            sideHolds.children[idx].active = false; // Hide these tiles
        }

        var pre = cc.vv.mahjongmgr.getFoldPrefixString(localIndex);
        var holds = this.sortHands(a_seatData);
        if (holds != null && holds.length > 0) {
            for (var i = 0; i < holds.length; ++i) {
                var idx = this.getLastTilePositionBySide(side, i + meldTilesNum);
                var sprite = sideHolds.children[idx].getComponent(cc.Sprite);
                sprite.node.active = true; // Show this tile
                sprite.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByTile(pre, holds[i]);
            }

            if (holds.length + meldTilesNum == 13) {
                var lastIdx = this.getLastTilePositionBySide(side, 13);
                sideHolds.children[lastIdx].active = false; // Hide the last tile
            }
        }
    },

    sortHands: function (a_seatData) {
        var hands = a_seatData.holds;
        if (hands == null) {
            return null;
        }

        //如果手上的牌的数目是2,5,8,11,14，表示最后一张牌是刚摸到的牌
        var drawingTile = null;
        var length = hands.length
        if (length == 2 || length == 5 || length == 8 || length == 11 || length == 14) {
            drawingTile = hands.pop();
        }

        var dingque = a_seatData.dingque;
        cc.vv.mahjongmgr.sortTiles(hands, dingque);

        //将摸牌添加到最后
        if (drawingTile != null) {
            hands.push(drawingTile);
        }
        return hands;
    },

    drawMyHands: function () {
        var seats = cc.vv.gameNetMgr.seats;
        var seatData = seats[cc.vv.gameNetMgr.seatIndex];
        var hands = this.sortHands(seatData);
        if (hands == null) {
            return;
        }

        // Draw remaining hands
        var meldTilesNum = seatData.melds.length * 3;
        // Set hands SpriteFrame but don't show yet
        for (var i = 0; i < hands.length; ++i) {
            var tile = hands[i];
            var sprite = this._handsSprites[i + meldTilesNum];
            sprite.node.tile = tile;
            sprite.node.y = 0;
            this.setSpriteFrameByTile("M_", sprite, tile);
        }
        // Hide tiles positions that overlay with melds
        for (var i = 0; i < meldTilesNum; ++i) {
            var sprite = this._handsSprites[i];
            sprite.node.tile = null;
            sprite.spriteFrame = null;
            sprite.node.active = false;
            sprite.node.y = 0;
        }
        // Hide other positions neither melds nor hands
        for (var i = meldTilesNum + hands.length; i < this._handsSprites.length; ++i) {
            var sprite = this._handsSprites[i];
            sprite.node.tile = null;
            sprite.spriteFrame = null;
            sprite.node.active = false;
            sprite.node.y = 0;
        }
    },

    setSpriteFrameByTile: function (a_prefixString, a_sprite, a_tile) {
        a_sprite.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByTile(a_prefixString, a_tile);
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
                for (var i = 0; i < this._handsSprites.length; ++i) {
                    var sprite = this._handsSprites[i];
                    //                console.log("sprite.node.tile:" + sprite.node.tile);
                    if (sprite.node.tile != null) {
                        var type = cc.vv.mahjongmgr.getTileType(sprite.node.tile);
                        if (type == dingque) {
                            hasQue = true;
                            break;
                        }
                    }
                }
            }

            //        console.log("hasQue:" + hasQue);
            for (var i = 0; i < this._handsSprites.length; ++i) {
                var sprite = this._handsSprites[i];
                if (sprite.node.tile != null) {
                    var type = cc.vv.mahjongmgr.getTileType(sprite.node.tile);
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
                    var sprite = this._handsSprites[i];
                    if (sprite.node.active == true) {
                        sprite.node.getComponent(cc.Button).interactable = i == 13;
                    }
                }
            } else {
                for (var i = 0; i < 14; ++i) {
                    var sprite = this._handsSprites[i];
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

    onClickAction: function (a_event) {
        // console.log(a_event.target.pai);

        var tile;
        var meld = {
            type: "",
            tiles: []
        };
        for (var i = 0; i < this._handsSprites.length; i++) {
            if (this._handsSprites[i].node.active == true && this._handsSprites[i].node.y == 15) { // Found a selected tile
                meld.tiles.push(this._handsSprites[i].node.tile);
            }
        }

        if (a_event.target.name == "btnActionChow") {
            cc.vv.net.send("req_chow", tile); // TODO
        } else if (a_event.target.name == "btnActionPong") {
            cc.vv.net.send("req_pong");
        } else if (a_event.target.name == "btnActionKong") {
            if (meld.tiles.length == 1) {
                meld.type = "meld_pong_to_kong";
            } else if (meld.tiles.length == 3) {
                meld.type = "meld_exposed_kong";
            } else if (meld.tiles.length == 4) {
                meld.type = "meld_concealed_kong";
            } else {
                alert("客户端消息：\r\n如果是明杠，请选择3张手牌。如果是暗杠，请选择4张手牌。如果是补杠，请选择1张手牌。");
                return;
            }
            cc.vv.net.send("req_kong", meld);
        } else if (a_event.target.name == "btnActionWin") {
            cc.vv.net.send("req_win");
        } else if (a_event.target.name == "btnActionPass") {
            cc.vv.net.send("req_pass");
        } else if (a_event.target.name == "btnActionDraw") {
            cc.vv.net.send("req_draw");
        } else if (a_event.target.name == "btnActionDiscard") {
            if (meld.tiles.length <= 0) {
                alert("客户端消息：\r\n由于未选择手牌，将随机打出一张。");
                // TOFIX: Sprites is not exact hands, because if has meld, will hide these sprites, but still has tiles...
                var index = Math.floor(Math.random() * this._handsSprites.length + 0);
                tile = this._handsSprites[index].node.tile;
            } else if (meld.tiles.length > 1) {
                alert("客户端消息：\r\n由于选择了多张手牌，将随机打出一张。");
                var index = Math.floor(Math.random() * meld.tiles.length + 0);
                tile = meld.tiles[index];
            } else {
                tile = meld.tiles[0];
            }
            this.discardTile(tile);
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