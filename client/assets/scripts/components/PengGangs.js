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
    },

    // use this for initialization
    onLoad: function () {
        if (!cc.vv) {
            return;
        }

        var nodeGame = this.node.getChildByName("game");
        var nodeMyself = nodeGame.getChildByName("myself");
        var nodePongKong = nodeMyself.getChildByName("penggangs");
        var canvas = cc.find("Canvas");
        var canvasWidth = canvas.width;
        var scale = canvasWidth / 1280;

        var self = this;
        this.node.on("event_pong", function (a_data) {
            //刷新所有的牌
            self.onPengGangChanged(a_data);
        });

        this.node.on("event_kong", function (a_data) {
            //刷新所有的牌
            self.onPengGangChanged(a_data.seatData);
        });

        this.node.on("event_game_begin", function (a_data) {
            self.onGameBegin();
        });

        var seats = cc.vv.gameNetMgr.seats;
        for (var i in seats) {
            this.onPengGangChanged(seats[i]);
        }
    },

    onGameBegin: function () {
        this.hidePongKongs("myself");
        this.hidePongKongs("right");
        this.hidePongKongs("up");
        this.hidePongKongs("left");
    },

    hidePongKongs: function (a_side) {
        var nodeGame = this.node.getChildByName("game");
        var nodeMyself = nodeGame.getChildByName(a_side);
        var nodePongKong = nodeMyself.getChildByName("penggangs");
        if (nodePongKong) {
            for (var i = 0; i < nodePongKong.childrenCount; ++i) {
                nodePongKong.children[i].active = false;
            }
        }
    },

    onPengGangChanged: function (a_seatData) { // Mainly draw melds
        if (a_seatData.melds == null) {
            return;
        }
        var localIndex = cc.vv.gameNetMgr.getLocalIndex(a_seatData.seatindex);
        var sideString = cc.vv.mahjongmgr.getSide(localIndex);
        var prefabFold = cc.vv.mahjongmgr.getFoldPre(localIndex);

        console.log("onPengGangChanged, localIndex: " + localIndex);

        var nodeGame = this.node.getChildByName("game");
        var nodeSide = nodeGame.getChildByName(sideString);
        var nodeMelds = nodeSide.getChildByName("penggangs");

        for (var i = 0; i < nodeMelds.childrenCount; ++i) {
            nodeMelds.children[i].active = false;
        }
        //初始化杠牌
        var melds = a_seatData.melds;
        if (melds) {
            for (var i = 0; i < melds.length; ++i) {
                var meld = melds[i];
                this.drawMeld(nodeMelds, sideString, prefabFold, i, meld);
            }
        }

        //初始化碰牌
        // var pongs = a_seatData.pengs
        // if (pongs) {
        //     for (var i = 0; i < pongs.length; ++i) {
        //         var tile = pongs[i];
        //         this.drawMeld(nodePongKong, side, prefabFold, meldNum, tile, "peng");
        //         meldNum++;
        //     }
        // }
    },

    drawMeld: function (a_nodePongKong, a_side, a_prefab, a_meldNum, a_meld) {
        var prefab = null;
        if (a_nodePongKong.childrenCount <= a_meldNum) {
            if (a_side == "left" || a_side == "right") {
                prefab = cc.instantiate(cc.vv.mahjongmgr.pengPrefabLeft);
            } else {
                prefab = cc.instantiate(cc.vv.mahjongmgr.pengPrefabSelf);
            }

            a_nodePongKong.addChild(prefab);
        } else {
            prefab = a_nodePongKong.children[a_meldNum];
            prefab.active = true; // Show this meld
        }

        // Position the meld
        if (a_side == "left") {
            prefab.y = -(a_meldNum * 25 * 3);
        } else if (a_side == "right") {
            prefab.y = (a_meldNum * 25 * 3);
            prefab.zIndex = -a_meldNum; // Show lower meld at higher Z Order.
        } else if (a_side == "myself") {
            prefab.x = a_meldNum * 55 * 3 + a_meldNum * 10;
        } else { // "up"
            prefab.x = -(a_meldNum * 55 * 3);
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

                if (a_meld.type == "meld_concealed_kong") {
                    if (a_side == "myself") { // Show bottm 3 tiles
                        sprites[spriteIndex].spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByTile(a_prefab, a_meld.tiles[tileIndex]);
                        sprites[spriteIndex].node.opacity = 128;
                    } else { // Other sides, then fold bottom 3 tiles
                        sprites[spriteIndex].spriteFrame = cc.vv.mahjongmgr.getFoldSpriteFrame(a_side);
                        sprites[spriteIndex].node.opacity = 255;
                    }
                } else {
                    sprites[spriteIndex].spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByTile(a_prefab, a_meld.tiles[tileIndex]);
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
            if (a_meld.type == "meld_concealed_kong") { // Concealed Kong
                if (a_side == "myself") { // Show 4th tile
                    sprites[spriteIndex].spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByTile(a_prefab, a_meld.tiles[3]);
                    sprites[spriteIndex].node.opacity = 128;
                } else { // Other sides, then fold tile
                    sprites[spriteIndex].spriteFrame = cc.vv.mahjongmgr.getFoldSpriteFrame(a_side);
                    sprites[spriteIndex].node.opacity = 255;
                }
            } else { // Exposed Kong
                sprites[spriteIndex].spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByTile(a_prefab, a_meld.tiles[3]);
                sprites[spriteIndex].node.opacity = 255;
            }
        }
    },

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});