var g_tilesSpritesStrings = [];

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

        _sidesStrings: null,
        _prefixesStrings: null,
        _foldPrefixesStrings: null,
    },

    onLoad: function () {
        if (cc.vv == null) {
            return;
        }
        this._sidesStrings = ["myself", "right", "up", "left"];
        this._prefixesStrings = ["M_", "R_", "B_", "L_"];
        this._foldPrefixesStrings = ["B_", "R_", "B_", "L_"];
        cc.vv.mahjongmgr = this;
        //筒 0 - 8
        for (var i = 1; i < 10; ++i) {
            g_tilesSpritesStrings.push("dot_" + i);
        }

        //条 9 - 17
        for (var i = 1; i < 10; ++i) {
            g_tilesSpritesStrings.push("bamboo_" + i);
        }

        //万 18 - 26
        for (var i = 1; i < 10; ++i) {
            g_tilesSpritesStrings.push("character_" + i);
        }

        //中、发、白 27 - 29
        g_tilesSpritesStrings.push("red");
        g_tilesSpritesStrings.push("green");
        g_tilesSpritesStrings.push("white");

        //东西南北风 30 - 33
        g_tilesSpritesStrings.push("wind_east");
        g_tilesSpritesStrings.push("wind_west");
        g_tilesSpritesStrings.push("wind_south");
        g_tilesSpritesStrings.push("wind_north");

        //春夏秋冬梅兰竹菊 34 -41
        g_tilesSpritesStrings.push("spring");
        g_tilesSpritesStrings.push("summer");
        g_tilesSpritesStrings.push("autumn");
        g_tilesSpritesStrings.push("winter");
        g_tilesSpritesStrings.push("plum");
        g_tilesSpritesStrings.push("orchid");
        g_tilesSpritesStrings.push("bamboo");
        g_tilesSpritesStrings.push("chrysanthemum");
    },

    getMahjongSpriteByTile: function (a_tile) {
        return g_tilesSpritesStrings[a_tile];
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
            return 5;
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

    getSpriteFrameByTile: function (a_prefixString, a_tile) {
        var spriteFrameName = this.getMahjongSpriteByTile(a_tile);
        spriteFrameName = a_prefixString + spriteFrameName;
        if (a_prefixString == "M_") { // Bottom hands tile
            return this.bottomAtlas.getSpriteFrame(spriteFrameName);
        } else if (a_prefixString == "B_") { // Bottom/Top discard tile
            return this.bottomFoldAtlas.getSpriteFrame(spriteFrameName);
        } else if (a_prefixString == "L_") { // Left discard tile
            return this.leftAtlas.getSpriteFrame(spriteFrameName);
        } else if (a_prefixString == "R_") { // Right discard tile
            return this.rightAtlas.getSpriteFrame(spriteFrameName);
        }
    },

    getAudioUrlByTile: function (a_tile) {
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

    getFoldSpriteFrame: function (a_side) {
        if (a_side == "up") {
            return this.emptyAtlas.getSpriteFrame("e_mj_b_up");
        } else if (a_side == "myself") {
            return this.emptyAtlas.getSpriteFrame("e_mj_b_up");
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
            return this.emptyAtlas.getSpriteFrame("e_mj_up");
        } else if (a_side == "left") {
            return this.emptyAtlas.getSpriteFrame("e_mj_left");
        } else if (a_side == "right") {
            return this.emptyAtlas.getSpriteFrame("e_mj_right");
        }
    },

    sortTiles: function (a_tiles, a_dingqueType) {
        var self = this;
        a_tiles.sort(function (a_tile1, a_tile2) {
            return a_tile1 - a_tile2;
        });
    },

    getSideString: function (a_localIndex) {
        return this._sidesStrings[a_localIndex];
    },

    getPrefixString: function (a_localIndex) {
        return this._prefixesStrings[a_localIndex];
    },

    getFoldPrefixString: function (a_localIndex) {
        return this._foldPrefixesStrings[a_localIndex];
    }
});