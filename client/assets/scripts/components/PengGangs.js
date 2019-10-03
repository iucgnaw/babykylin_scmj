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
        // nodePongKong.scaleX *= scale;
        // nodePongKong.scaleY *= scale;

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

    onPengGangChanged: function (a_seatData) {

        if (a_seatData.angangs == null && a_seatData.diangangs == null && a_seatData.wangangs == null && a_seatData.pengs == null) {
            return;
        }
        var localIndex = cc.vv.gameNetMgr.getLocalIndex(a_seatData.seatindex);
        var side = cc.vv.mahjongmgr.getSide(localIndex);
        var prefabFold = cc.vv.mahjongmgr.getFoldPre(localIndex);

        console.log("onPengGangChanged, localIndex: " + localIndex);

        var nodeGame = this.node.getChildByName("game");
        var nodeSide = nodeGame.getChildByName(side);
        var nodePongKong = nodeSide.getChildByName("penggangs");

        for (var i = 0; i < nodePongKong.childrenCount; ++i) {
            nodePongKong.children[i].active = false;
        }
        //初始化杠牌
        var meldNum = 0;

        var concealedKongs = a_seatData.angangs
        if (concealedKongs) {
            for (var i = 0; i < concealedKongs.length; ++i) {
                var tile = concealedKongs[i];
                this.drawMeld(nodePongKong, side, prefabFold, meldNum, tile, "angang");
                meldNum++;
            }
        }
        var exposedKongs = a_seatData.diangangs
        if (exposedKongs) {
            for (var i = 0; i < exposedKongs.length; ++i) {
                var tile = exposedKongs[i];
                this.drawMeld(nodePongKong, side, prefabFold, meldNum, tile, "diangang");
                meldNum++;
            }
        }
        var drewKongs = a_seatData.wangangs
        if (drewKongs) {
            for (var i = 0; i < drewKongs.length; ++i) {
                var tile = drewKongs[i];
                this.drawMeld(nodePongKong, side, prefabFold, meldNum, tile, "wangang");
                meldNum++;
            }
        }

        //初始化碰牌
        var pongs = a_seatData.pengs
        if (pongs) {
            for (var i = 0; i < pongs.length; ++i) {
                var tile = pongs[i];
                this.drawMeld(nodePongKong, side, prefabFold, meldNum, tile, "peng");
                meldNum++;
            }
        }
    },

    drawMeld: function (a_nodePongKong, a_side, a_prefab, a_meldNum, a_tile, a_pongKongType) {
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

            // Show lower meld at higher Z Order.
            prefab.zIndex = -a_meldNum;
        } else if (a_side == "myself") {
            prefab.x = a_meldNum * 55 * 3 + a_meldNum * 10;
        } else { // "up"
            prefab.x = -(a_meldNum * 55 * 3);
        }

        var sprites = prefab.getComponentsInChildren(cc.Sprite);
        for (var s = 0; s < sprites.length; ++s) {
            var sprite = sprites[s];
            if (sprite.node.name == "gang") { // Kong, handle the top 4th tile
                var isGang = a_pongKongType != "peng";
                sprite.node.active = isGang; // Show or hide the 4th tile if not Pong
                // sprite.node.scaleX = 1.0;
                // sprite.node.scaleY = 1.0;
                if (a_pongKongType == "angang") { // Concealed Kong
                    if (a_side == "myself") { // Show 4th tile
                        sprite.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByTile(a_prefab, a_tile);
                        sprite.node.opacity = 128;
                    } else { // Other sides, then fold tile
                        sprite.spriteFrame = cc.vv.mahjongmgr.getFoldSpriteFrame(a_side);
                        sprite.node.opacity = 255;
                    }
                } else { // Exposed Kong
                    // Show the tile
                    sprite.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByTile(a_prefab, a_tile);
                    sprite.node.opacity = 255;
                }
            } else { // Not Kong, handle the bottom 3 tiles
                if (a_pongKongType == "angang") { // Concealed Kong
                    if (a_side == "myself") { // Show bottm 3 tiles
                        sprite.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByTile(a_prefab, a_tile);
                        sprite.node.opacity = 128;
                    } else { // Other sides, then fold bottom 3 tiles
                        sprite.spriteFrame = cc.vv.mahjongmgr.getFoldSpriteFrame(a_side);
                        sprite.node.opacity = 255;
                        // if (a_side == "up") { // Enlarge sprite
                        //     sprite.node.scaleX = 1.4;
                        //     sprite.node.scaleY = 1.4;
                        // }
                    }
                } else { // Exposed Kong
                    sprite.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByTile(a_prefab, a_tile);
                    sprite.node.opacity = 255;
                }
            }
        }
    },

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});