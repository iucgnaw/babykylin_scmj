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

        var gameChild = this.node.getChildByName("game");
        var myself = gameChild.getChildByName("myself");
        var pengGangRoot = myself.getChildByName("penggangs");
        var canvas = cc.find('Canvas');
        var canvasWidth = canvas.width;
        var scale = canvasWidth / 1280;
        pengGangRoot.scaleX *= scale;
        pengGangRoot.scaleY *= scale;

        var self = this;
        this.node.on('peng_notify', function (a_data) {
            //刷新所有的牌
            self.onPengGangChanged(a_data);
        });

        this.node.on('gang_notify', function (a_data) {
            //刷新所有的牌
            self.onPengGangChanged(a_data.seatData);
        });

        this.node.on('game_begin', function (a_data) {
            self.onGameBegin();
        });

        var seats = cc.vv.gameNetMgr.seats;
        for (var i in seats) {
            this.onPengGangChanged(seats[i]);
        }
    },

    onGameBegin: function () {
        this.hideSide("myself");
        this.hideSide("right");
        this.hideSide("up");
        this.hideSide("left");
    },

    hideSide: function (a_side) {
        var gameChild = this.node.getChildByName("game");
        var myself = gameChild.getChildByName(a_side);
        var pengGangRoot = myself.getChildByName("penggangs");
        if (pengGangRoot) {
            for (var i = 0; i < pengGangRoot.childrenCount; ++i) {
                pengGangRoot.children[i].active = false;
            }
        }
    },

    onPengGangChanged: function (a_seatData) {

        if (a_seatData.angangs == null && a_seatData.diangangs == null && a_seatData.wangangs == null && a_seatData.pengs == null) {
            return;
        }
        var localIndex = cc.vv.gameNetMgr.getLocalIndex(a_seatData.seatindex);
        var side = cc.vv.mahjongmgr.getSide(localIndex);
        var foldPre = cc.vv.mahjongmgr.getFoldPre(localIndex);

        console.log("onPengGangChanged, localIndex: " + localIndex);

        var gameChild = this.node.getChildByName("game");
        var mySide = gameChild.getChildByName(side);
        var pengGangRoot = mySide.getChildByName("penggangs");

        for (var i = 0; i < pengGangRoot.childrenCount; ++i) {
            pengGangRoot.children[i].active = false;
        }
        //初始化杠牌
        var meldNum = 0;

        var concealedKongs = a_seatData.angangs
        if (concealedKongs) {
            for (var i = 0; i < concealedKongs.length; ++i) {
                var tile = concealedKongs[i];
                this.drawPengGangs(pengGangRoot, side, foldPre, meldNum, tile, "angang");
                meldNum++;
            }
        }
        var exposedKongs = a_seatData.diangangs
        if (exposedKongs) {
            for (var i = 0; i < exposedKongs.length; ++i) {
                var tile = exposedKongs[i];
                this.drawPengGangs(pengGangRoot, side, foldPre, meldNum, tile, "diangang");
                meldNum++;
            }
        }
        var drewKongs = a_seatData.wangangs
        if (drewKongs) {
            for (var i = 0; i < drewKongs.length; ++i) {
                var tile = drewKongs[i];
                this.drawPengGangs(pengGangRoot, side, foldPre, meldNum, tile, "wangang");
                meldNum++;
            }
        }

        //初始化碰牌
        var pengs = a_seatData.pengs
        if (pengs) {
            for (var i = 0; i < pengs.length; ++i) {
                var tile = pengs[i];
                this.drawPengGangs(pengGangRoot, side, foldPre, meldNum, tile, "peng");
                meldNum++;
            }
        }
    },

    drawPengGangs: function (a_pengGangRoot, a_side, a_pre, a_meldNum, a_tile, a_pengGangType) {
        var prefab = null;
        if (a_pengGangRoot.childrenCount <= a_meldNum) {
            if (a_side == "left" || a_side == "right") {
                prefab = cc.instantiate(cc.vv.mahjongmgr.pengPrefabLeft);
            } else {
                prefab = cc.instantiate(cc.vv.mahjongmgr.pengPrefabSelf);
            }

            a_pengGangRoot.addChild(prefab);
        } else {
            prefab = a_pengGangRoot.children[a_meldNum];
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
            if (sprite.node.name == "gang") { // The top 4th tile
                var isGang = a_pengGangType != "peng";
                sprite.node.active = isGang; // Show or hide the 4th tile if not Pong
                sprite.node.scaleX = 1.0;
                sprite.node.scaleY = 1.0;
                if (a_pengGangType == "angang") { // Concealed Kong
                    // Fold the tile
                    sprite.spriteFrame = cc.vv.mahjongmgr.getEmptySpriteFrame(a_side);
                    if (a_side == "myself" || a_side == "up") {
                        sprite.node.scaleX = 1.4;
                        sprite.node.scaleY = 1.4;
                    }
                } else { // Exposed Kong
                    // Show the tile
                    sprite.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(a_pre, a_tile);
                }
            } else { // the bottom 3 tiles
                if (a_pengGangType == "angang") { // Also fold the bottom tiles
                    if (a_side == "myself") { // Show tiles
                        sprite.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(a_pre, a_tile);
                    } else { // Fold tiles
                        sprite.spriteFrame = cc.vv.mahjongmgr.getEmptySpriteFrame(a_side);
                        if (a_side == "up") { // Enlarge sprite
                            sprite.node.scaleX = 1.4;
                            sprite.node.scaleY = 1.4;
                        }
                    }
                } else { // Show tiles
                    sprite.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(a_pre, a_tile);
                }
            }
        }
    },

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});