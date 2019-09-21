var mahjongSprites = [];

cc.Class({
    extends: cc.Component,

    properties: {
        leftAtlas: {
            default: null,
            type: cc.SpriteAtlas
        },

        rightAtlas: {
            default: null,
            type: cc.SpriteAtlas
        },

        bottomAtlas: {
            default: null,
            type: cc.SpriteAtlas
        },

        bottomFoldAtlas: {
            default: null,
            type: cc.SpriteAtlas
        },

        pengPrefabSelf: {
            default: null,
            type: cc.Prefab
        },

        pengPrefabLeft: {
            default: null,
            type: cc.Prefab
        },

        emptyAtlas: {
            default: null,
            type: cc.SpriteAtlas
        },

        holdsEmpty: {
            default: [],
            type: [cc.SpriteFrame]
        },

        _sides: null,
        _pres: null,
        _foldPres: null,
    },

    onLoad: function () {
        if (cc.vv == null) {
            return;
        }
        this._sides = ["myself", "right", "up", "left"];
        this._pres = ["M_", "R_", "B_", "L_"];
        this._foldPres = ["B_", "R_", "B_", "L_"];
        cc.vv.mahjongmgr = this;
        //筒 0 - 8
        for (var i = 1; i < 10; ++i) {
            mahjongSprites.push("dot_" + i);
        }

        //条 9 - 17
        for (var i = 1; i < 10; ++i) {
            mahjongSprites.push("bamboo_" + i);
        }

        //万 18 - 26
        for (var i = 1; i < 10; ++i) {
            mahjongSprites.push("character_" + i);
        }

        //中、发、白 27 - 29
        mahjongSprites.push("red");
        mahjongSprites.push("green");
        mahjongSprites.push("white");

        //东西南北风 30 - 33
        mahjongSprites.push("wind_east");
        mahjongSprites.push("wind_west");
        mahjongSprites.push("wind_south");
        mahjongSprites.push("wind_north");

        //春夏秋冬梅兰竹菊 34 -41
        mahjongSprites.push("spring");
        mahjongSprites.push("summer");
        mahjongSprites.push("autumn");
        mahjongSprites.push("winter");
        mahjongSprites.push("plum");
        mahjongSprites.push("orchid");
        mahjongSprites.push("bamboo");
        mahjongSprites.push("chrysanthemum");
    },

    getMahjongSpriteByID: function (id) {
        return mahjongSprites[id];
    },

    getMahjongType: function (id) {
        if (id >= 0 && id < 9) {
            //筒 0 - 8
            return 0;
        } else if (id >= 9 && id < 18) {
            //条 9 - 17
            return 1;
        } else if (id >= 18 && id < 27) {
            //万 18 - 26
            return 2;
        } else if (id == 27) {
            //中
            return 3;
        } else if (id == 28) {
            //发
            return 4;
        } else if (id == 29) {
            //白
            return 4;
        } else if (id == 30) {
            //东
            return 6;
        } else if (id == 31) {
            //西
            return 7;
        } else if (id == 32) {
            //南
            return 8;
        } else if (id == 33) {
            //北
            return 9;
        } else if (id == 34) {
            //春
            return 10;
        } else if (id == 35) {
            //夏
            return 11;
        } else if (id == 36) {
            //秋
            return 12;
        } else if (id == 37) {
            //冬
            return 13;
        } else if (id == 38) {
            //梅
            return 14;
        } else if (id == 39) {
            //兰
            return 15;
        } else if (id == 40) {
            //竹
            return 16;
        } else if (id == 41) {
            //菊
            return 17;
        }
    },

    getSpriteFrameByMJID: function (pre, mjid) {
        var spriteFrameName = this.getMahjongSpriteByID(mjid);
        spriteFrameName = pre + spriteFrameName;
        if (pre == "M_") {
            return this.bottomAtlas.getSpriteFrame(spriteFrameName);
        } else if (pre == "B_") {
            return this.bottomFoldAtlas.getSpriteFrame(spriteFrameName);
        } else if (pre == "L_") {
            return this.leftAtlas.getSpriteFrame(spriteFrameName);
        } else if (pre == "R_") {
            return this.rightAtlas.getSpriteFrame(spriteFrameName);
        }
    },

    getAudioURLByMJID: function (id) {
        var realId = 0;
        if (id >= 0 && id < 9) {
            //筒 0 - 8
            realId = id + 21;
        } else if (id >= 9 && id < 18) {
            //条 9 - 17
            realId = id - 8;
        } else if (id >= 18 && id < 27) {
            //万 18 - 26
            realId = id - 7;
        } else if (id == 27) {
            //中
            realId = 71;
        } else if (id == 28) {
            //发
            realId = 81;
        } else if (id == 29) {
            //白
            realId = 91;
        } else if (id == 30) {
            //东
            realId = 31;
        } else if (id == 31) {
            //西
            realId = 41;
        } else if (id == 32) {
            //南
            realId = 51;
        } else if (id == 33) {
            //北
            realId = 61;
        } else if (id == 34) {
            //春
            realId = 101;
        } else if (id == 35) {
            //夏
            realId = 111;
        } else if (id == 36) {
            //秋
            realId = 121;
        } else if (id == 37) {
            //冬
            realId = 131;
        } else if (id == 38) {
            //梅
            realId = 141;
        } else if (id == 39) {
            //兰
            realId = 151;
        } else if (id == 40) {
            //竹
            realId = 161;
        } else if (id == 41) {
            //菊
            realId = 171;
        }
        return "nv/" + realId + ".mp3";
    },

    getEmptySpriteFrame: function (side) {
        if (side == "up") {
            return this.emptyAtlas.getSpriteFrame("e_mj_b_up");
        } else if (side == "myself") {
            return this.emptyAtlas.getSpriteFrame("e_mj_b_bottom");
        } else if (side == "left") {
            return this.emptyAtlas.getSpriteFrame("e_mj_b_left");
        } else if (side == "right") {
            return this.emptyAtlas.getSpriteFrame("e_mj_b_right");
        }
    },

    getHoldsEmptySpriteFrame: function (side) {
        if (side == "up") {
            return this.emptyAtlas.getSpriteFrame("e_mj_up");
        } else if (side == "myself") {
            return null;
        } else if (side == "left") {
            return this.emptyAtlas.getSpriteFrame("e_mj_left");
        } else if (side == "right") {
            return this.emptyAtlas.getSpriteFrame("e_mj_right");
        }
    },

    sortMJ: function (mahjongs, dingque) {
        var self = this;
        mahjongs.sort(function (a, b) {
            if (dingque >= 0) {
                var t1 = self.getMahjongType(a);
                var t2 = self.getMahjongType(b);
                if (t1 != t2) {
                    if (dingque == t1) {
                        return 1;
                    } else if (dingque == t2) {
                        return -1;
                    }
                }
            }
            return a - b;
        });
    },

    getSide: function (localIndex) {
        return this._sides[localIndex];
    },

    getPre: function (localIndex) {
        return this._pres[localIndex];
    },

    getFoldPre: function (localIndex) {
        return this._foldPres[localIndex];
    }
});
