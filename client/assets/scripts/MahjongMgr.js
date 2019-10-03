var g_mahjongSprites = [];

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
            g_mahjongSprites.push("dot_" + i);
        }

        //条 9 - 17
        for (var i = 1; i < 10; ++i) {
            g_mahjongSprites.push("bamboo_" + i);
        }

        //万 18 - 26
        for (var i = 1; i < 10; ++i) {
            g_mahjongSprites.push("character_" + i);
        }

        //中、发、白 27 - 29
        g_mahjongSprites.push("red");
        g_mahjongSprites.push("green");
        g_mahjongSprites.push("white");

        //东西南北风 30 - 33
        g_mahjongSprites.push("wind_east");
        g_mahjongSprites.push("wind_west");
        g_mahjongSprites.push("wind_south");
        g_mahjongSprites.push("wind_north");

        //春夏秋冬梅兰竹菊 34 -41
        g_mahjongSprites.push("spring");
        g_mahjongSprites.push("summer");
        g_mahjongSprites.push("autumn");
        g_mahjongSprites.push("winter");
        g_mahjongSprites.push("plum");
        g_mahjongSprites.push("orchid");
        g_mahjongSprites.push("bamboo");
        g_mahjongSprites.push("chrysanthemum");
    },

    getMahjongSpriteByID: function (a_tile) {
        return g_mahjongSprites[a_tile];
    },

    getTileType: function (a_tile) {
        if (a_tile >= 0 && a_tile < 9) {
            //筒 0 - 8
            return 0;
        } else if (a_tile >= 9 && a_tile < 18) {
            //条 9 - 17
            return 1;
        } else if (a_tile >= 18 && a_tile < 27) {
            //万 18 - 26
            return 2;
        } else if (a_tile == 27) {
            //中
            return 3;
        } else if (a_tile == 28) {
            //发
            return 4;
        } else if (a_tile == 29) {
            //白
            return 4;
        } else if (a_tile == 30) {
            //东
            return 6;
        } else if (a_tile == 31) {
            //西
            return 7;
        } else if (a_tile == 32) {
            //南
            return 8;
        } else if (a_tile == 33) {
            //北
            return 9;
        } else if (a_tile == 34) {
            //春
            return 10;
        } else if (a_tile == 35) {
            //夏
            return 11;
        } else if (a_tile == 36) {
            //秋
            return 12;
        } else if (a_tile == 37) {
            //冬
            return 13;
        } else if (a_tile == 38) {
            //梅
            return 14;
        } else if (a_tile == 39) {
            //兰
            return 15;
        } else if (a_tile == 40) {
            //竹
            return 16;
        } else if (a_tile == 41) {
            //菊
            return 17;
        }
    },

    getSpriteFrameByTile: function (a_pre, a_tile) {
        var spriteFrameName = this.getMahjongSpriteByID(a_tile);
        spriteFrameName = a_pre + spriteFrameName;
        if (a_pre == "M_") {
            return this.bottomAtlas.getSpriteFrame(spriteFrameName);
        } else if (a_pre == "B_") {
            return this.bottomFoldAtlas.getSpriteFrame(spriteFrameName);
        } else if (a_pre == "L_") {
            return this.leftAtlas.getSpriteFrame(spriteFrameName);
        } else if (a_pre == "R_") {
            return this.rightAtlas.getSpriteFrame(spriteFrameName);
        }
    },

    getAudioURLByMJID: function (a_tile) {
        var audioName = 0;
        if (a_tile >= 0 && a_tile < 9) {
            //筒 0 - 8
            audioName = a_tile + 21;
        } else if (a_tile >= 9 && a_tile < 18) {
            //条 9 - 17
            audioName = a_tile - 8;
        } else if (a_tile >= 18 && a_tile < 27) {
            //万 18 - 26
            audioName = a_tile - 7;
        } else if (a_tile == 27) {
            //中
            audioName = 71;
        } else if (a_tile == 28) {
            //发
            audioName = 81;
        } else if (a_tile == 29) {
            //白
            audioName = 91;
        } else if (a_tile == 30) {
            //东
            audioName = 31;
        } else if (a_tile == 31) {
            //西
            audioName = 41;
        } else if (a_tile == 32) {
            //南
            audioName = 51;
        } else if (a_tile == 33) {
            //北
            audioName = 61;
        } else if (a_tile == 34) {
            //春
            audioName = 101;
        } else if (a_tile == 35) {
            //夏
            audioName = 111;
        } else if (a_tile == 36) {
            //秋
            audioName = 121;
        } else if (a_tile == 37) {
            //冬
            audioName = 131;
        } else if (a_tile == 38) {
            //梅
            audioName = 141;
        } else if (a_tile == 39) {
            //兰
            audioName = 151;
        } else if (a_tile == 40) {
            //竹
            audioName = 161;
        } else if (a_tile == 41) {
            //菊
            audioName = 171;
        }
        return "nv/" + audioName + ".mp3";
    },

    getEmptySpriteFrame: function (a_side) {
        if (a_side == "up") {
            return this.emptyAtlas.getSpriteFrame("e_mj_b_up");
        } else if (a_side == "myself") {
            return this.emptyAtlas.getSpriteFrame("e_mj_b_bottom");
        } else if (a_side == "left") {
            return this.emptyAtlas.getSpriteFrame("e_mj_b_left");
        } else if (a_side == "right") {
            return this.emptyAtlas.getSpriteFrame("e_mj_b_right");
        }
    },

    getHoldsEmptySpriteFrame: function (a_side) {
        if (a_side == "up") {
            return this.emptyAtlas.getSpriteFrame("e_mj_up");
        } else if (a_side == "myself") {
            return null;
        } else if (a_side == "left") {
            return this.emptyAtlas.getSpriteFrame("e_mj_left");
        } else if (a_side == "right") {
            return this.emptyAtlas.getSpriteFrame("e_mj_right");
        }
    },

    sortTiles: function (a_tiles, a_dingqueType) {
        var self = this;
        a_tiles.sort(function (a_tile1, a_tile2) {
            // if (a_dingqueType >= 0) {
            //     var type1 = self.getTileType(a_tile1);
            //     var type2 = self.getTileType(a_tile2);
            //     if (type1 != type2) {
            //         if (a_dingqueType == type1) {
            //             return 1;
            //         } else if (a_dingqueType == type2) {
            //             return -1;
            //         }
            //     }
            // }
            return a_tile1 - a_tile2;
        });
    },

    getSide: function (a_localIndex) {
        return this._sides[a_localIndex];
    },

    getPre: function (a_localIndex) {
        return this._pres[a_localIndex];
    },

    getFoldPre: function (a_localIndex) {
        return this._foldPres[a_localIndex];
    }
});
