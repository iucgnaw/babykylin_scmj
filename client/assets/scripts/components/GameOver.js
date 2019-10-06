cc.Class({
    extends: cc.Component,

    properties: {
        // foo: {
        //    default: null,
        //    url: cc.Texture2D,  // optional, default is typeof default
        //    serializable: true, // optional, default is true
        //    visible: true,      // optional, default is true
        //    displayName: 'Foo', // optional
        //    readonly: false,    // optional, default is false
        // },
        // ...
        _gameover: null,
        _gameresult: null,
        _seats: [],
        _isGameEnd: false,
        _pingju: null,
        _win: null,
        _lose: null,
    },

    // use this for initialization
    onLoad: function () {
        if (cc.vv == null) {
            return;
        }
        if (cc.vv.gameNetMgr.conf == null) {
            return;
        }
        this._gameover = this.node.getChildByName("game_over_xlch");

        this._gameover.active = false;

        this._pingju = this._gameover.getChildByName("pingju");
        this._win = this._gameover.getChildByName("win");
        this._lose = this._gameover.getChildByName("lose");

        this._gameresult = this.node.getChildByName("game_result");

        var wanfa = this._gameover.getChildByName("wanfa").getComponent(cc.Label);
        wanfa.string = cc.vv.gameNetMgr.getWanfa();

        var listRoot = this._gameover.getChildByName("result_list");
        for (var i = 1; i <= 4; ++i) {
            var s = "s" + i;
            var sn = listRoot.getChildByName(s);
            var viewdata = {};
            viewdata.username = sn.getChildByName("username").getComponent(cc.Label);
            viewdata.reason = sn.getChildByName("reason").getComponent(cc.Label);

            var f = sn.getChildByName("fan");
            if (f != null) {
                viewdata.fan = f.getComponent(cc.Label);
            }

            viewdata.score = sn.getChildByName("score").getComponent(cc.Label);
            viewdata.hu = sn.getChildByName("hu");
            viewdata.mahjongs = sn.getChildByName("pai");
            viewdata.zhuang = sn.getChildByName("zhuang");
            viewdata.hupai = sn.getChildByName("hupai");
            viewdata._pengandgang = [];
            this._seats.push(viewdata);
        }

        //初始化网络事件监听器
        var self = this;
        this.node.on("event_hand_finish", function (data) {
            self.onGameOver(data);
        });

        this.node.on("event_match_finish", function (data) {
            self._isGameEnd = true;
        });
    },

    onGameOver(data) {
        this.onGameOver_XLCH(data);
    },

    onGameOver_XLCH: function (data) {
        console.log(data);
        if (data.length == 0) {
            this._gameresult.active = true;
            return;
        }
        this._gameover.active = true;
        this._pingju.active = false;
        this._win.active = false;
        this._lose.active = false;

        var myscore = data[cc.vv.gameNetMgr.seatIndex].score;
        if (myscore > 0) {
            this._win.active = true;
        } else if (myscore < 0) {
            this._lose.active = true;
        } else {
            this._pingju.active = true;
        }

        //显示玩家信息
        for (var i = 0; i < 4; ++i) {
            var seatView = this._seats[i];
            var userData = data[i];
            var hued = false;
            var actionArr = [];
            var is7pairs = false;
            var ischadajiao = false;
            var hupaiRoot = seatView.hupai;

            for (var j = 0; j < hupaiRoot.children.length; ++j) {
                hupaiRoot.children[j].active = false;
            }

            var hi = 0;
            for (var j = 0; j < userData.huinfo.length; ++j) {
                var info = userData.huinfo[j];
                hued = hued || info.ishupai;
                if (info.ishupai) {
                    if (hi < hupaiRoot.children.length) {
                        var hupaiView = hupaiRoot.children[hi];
                        hupaiView.active = true;
                        hupaiView.getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByTile("B_", info.pai);
                        hi++;
                    }
                }

                var str = ""
                var sep = "";

                var dataseat = userData;
                if (!info.ishupai) {
                    if (info.action == "fangpao") {
                        str = "放炮";
                    } else if (info.action == "gangpao") {
                        str = "杠上炮";
                    } else if (info.action == "beiqianggang") {
                        str = "被抢杠";
                    } else {
                        str = "被查大叫";
                    }

                    dataseat = data[info.target];
                    info = dataseat.huinfo[info.index];
                } else {
                    if (info.action == "hu") {
                        str = "接炮胡"
                    } else if (info.action == "zimo") {
                        str = "自摸";
                    } else if (info.action == "ganghua") {
                        str = "杠上花";
                    } else if (info.action == "dianganghua") {
                        str = "点杠花";
                    } else if (info.action == "gangpaohu") {
                        str = "杠炮胡";
                    } else if (info.action == "qiangganghu") {
                        str = "抢杠胡";
                    } else if (info.action == "chadajiao") {
                        str = "查大叫";
                    }
                }

                str += "(";

                if (info.pattern == "7pairs") {
                    str += "七对";
                    sep = "、"
                } else if (info.pattern == "l7pairs") {
                    str += "龙七对";
                    sep = "、"
                } else if (info.pattern == "j7pairs") {
                    str += "将七对";
                    sep = "、"
                } else if (info.pattern == "duidui") {
                    str += "碰碰胡";
                    sep = "、"
                } else if (info.pattern == "jiangdui") {
                    str += "将对";
                    sep = "、"
                }

                if (info.haidihu) {
                    str += sep + "海底胡";
                    sep = "、";
                }

                if (info.tianhu) {
                    str += sep + "天胡";
                    sep = "、";
                }

                if (info.dihu) {
                    str += sep + "地胡";
                    sep = "、";
                }

                if (dataseat.qingyise) {
                    str += sep + "清一色";
                    sep = "、";
                }

                if (dataseat.menqing) {
                    str += sep + "门清";
                    sep = "、";
                }

                if (dataseat.jingouhu) {
                    str += sep + "金钩胡";
                    sep = "、";
                }

                if (dataseat.zhongzhang) {
                    str += sep + "中张";
                    sep = "、";
                }

                if (info.numofgen > 0) {
                    str += sep + "根x" + info.numofgen;
                    sep = "、";
                }

                if (sep == "") {
                    str += "平胡";
                }

                str += "、" + info.fan + "番";

                str += ")";
                actionArr.push(str);
            }

            seatView.hu.active = hued;

            if (userData.melds.length) {
                actionArr.push("刻x" + userData.melds.length);
            }

            seatView.username.string = cc.vv.gameNetMgr.seats[i].name;
            seatView.zhuang.active = cc.vv.gameNetMgr.button == i;
            seatView.reason.string = actionArr.join("、");

            //
            if (userData.score > 0) {
                seatView.score.string = "+" + userData.score;
            } else {
                seatView.score.string = userData.score;
            }

            //隐藏所有牌
            for (var k = 0; k < seatView.mahjongs.childrenCount; ++k) {
                var n = seatView.mahjongs.children[k];
                n.active = false;
            }

            cc.vv.mahjongmgr.sortTiles(userData.holds, userData.dingque);

            var numOfGangs = userData.melds.length;

            var lackingNum = (userData.pengs.length + numOfGangs) * 3;
            //显示相关的牌
            for (var k = 0; k < userData.holds.length; ++k) {
                var pai = userData.holds[k];
                var n = seatView.mahjongs.children[k + lackingNum];
                n.active = true;
                var sprite = n.getComponent(cc.Sprite);
                sprite.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByTile("M_", pai);
            }


            for (var k = 0; k < seatView._pengandgang.length; ++k) {
                seatView._pengandgang[k].active = false;
            }

            //初始化杠牌
            var index = 0;
            var melds = userData.melds;
            for (var k = 0; k < melds.length; ++k) {
                this.drawMeld(seatView, index, melds[k]);
                index++;
            }

            // var melds = userData.diangangs;
            // for (var k = 0; k < melds.length; ++k) {
            //     var tile = melds[k];
            //     this.drawMeld(seatView, index, tile, "meld_exposed_kong");
            //     index++;
            // }

            // var melds = userData.wangangs;
            // for (var k = 0; k < melds.length; ++k) {
            //     var tile = melds[k];
            //     this.drawMeld(seatView, index, tile, "meld_pong_to_kong");
            //     index++;
            // }

            //初始化碰牌
            // var pengs = userData.pengs
            // if (pengs) {
            //     for (var k = 0; k < pengs.length; ++k) {
            //         var tile = pengs[k];
            //         this.drawMeld(seatView, index, tile, "peng");
            //         index++;
            //     }
            // }
        }
    },

    drawMeld: function (a_seatView, a_index, a_meld) {
        var prefab = null;
        if (a_seatView._pengandgang.length <= a_index) {
            prefab = cc.instantiate(cc.vv.mahjongmgr.pengPrefabSelf);
            a_seatView._pengandgang.push(prefab);
            a_seatView.mahjongs.addChild(prefab);
        } else {
            prefab = a_seatView._pengandgang[a_index];
            prefab.active = true;
        }

        // Draw the meld
        var sprites = prefab.getComponentsInChildren(cc.Sprite);
        var spritesOccupied = [];
        // Because sprites children is not sorted as meld tiles, so must draw bottom 3 tiles and top tile separately
        // Draw first 3 meld tiles
        console.assert(a_meld.tiles.length >= 3);
        for (var tileIndex = 0; tileIndex < 3; ++tileIndex) {
            for (var spriteIndex = 0; spriteIndex < sprites.length; ++spriteIndex) {
                if (sprites[spriteIndex].node.name == "nodeMeld4thTile") {
                    continue;
                }
                if (spritesOccupied[spriteIndex] == true) {
                    continue;
                }

                sprites[spriteIndex].spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByTile("B_", a_meld.tiles[tileIndex]);
                if (a_meld.type == "meld_concealed_kong") {
                    sprites[spriteIndex].node.opacity = 128;
                } else {
                    sprites[spriteIndex].node.opacity = 255;
                }

                spritesOccupied[spriteIndex] = true;
                break;
            }
        }
        // If has 4th tile, draw it
        if (a_meld.tiles.length < 4) {
            return;
        }
        for (var spriteIndex = 0; spriteIndex < sprites.length; ++spriteIndex) {
            if (sprites[spriteIndex].node.name != "nodeMeld4thTile") {
                continue;
            }

            sprites[spriteIndex].node.active = a_meld.type.includes("kong"); // Show the 4th tile if is kind of Kong
            sprites[spriteIndex].spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByTile("B_", a_meld.tiles[3]);
            if (a_meld.type == "meld_concealed_kong") {
                sprites[spriteIndex].node.opacity = 128;
            } else {
                sprites[spriteIndex].node.opacity = 255;
            }
        }

        prefab.x = a_index * 55 * 3 + a_index * 10;
    },

    onBtnReadyClicked: function () {
        console.log("onBtnReadyClicked");
        if (this._isGameEnd) {
            this._gameresult.active = true;
        } else {
            cc.vv.net.send("req_seat_ready");
        }
        this._gameover.active = false;
    },

    onBtnShareClicked: function () {
        console.log("onBtnShareClicked");
    }

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});