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
        _folds: null,
    },

    // use this for initialization
    onLoad: function () {
        if (cc.vv == null) {
            return;
        }

        this.initView();
        this.initEventHandler();

        this.drawAllFolds();
    },

    initView: function () {
        this._folds = {};
        var game = this.node.getChildByName("game");
        var sides = ["myself", "right", "up", "left"];
        for (var i = 0; i < sides.length; ++i) {
            var sideName = sides[i];
            var nodeSide = game.getChildByName(sideName);
            var folds = [];
            var foldRoot = nodeSide.getChildByName("folds");
            for (var j = 0; j < foldRoot.children.length; ++j) {
                var node = foldRoot.children[j];
                node.active = false;
                var sprite = node.getComponent(cc.Sprite);
                sprite.spriteFrame = null;
                folds.push(sprite);
            }
            this._folds[sideName] = folds;
        }

        this.hideAllFolds();
    },

    hideAllFolds: function () {
        for (var k in this._folds) {
            var f = this._folds[i];
            for (var i in f) {
                f[i].node.active = false;
            }
        }
    },

    initEventHandler: function () {
        var self = this;
        this.node.on("event_game_begin", function (data) {
            self.drawAllFolds();
        });

        this.node.on("event_game_sync", function (data) {
            self.drawAllFolds();
        });

        this.node.on("event_game_discard_tile", function (data) {
            self.drawFolds(data);
        });

        this.node.on("event_player_pass", function (data) {
            self.drawFolds(data);
        });
    },

    drawAllFolds: function () {
        var seats = cc.vv.gameNetMgr.seats;
        for (var i in seats) {
            this.drawFolds(seats[i]);
        }
    },

    drawFolds: function (a_seatData) {
        var folds = a_seatData.folds;
        if (folds == null) {
            return;
        }
        var localIndex = cc.vv.gameNetMgr.getLocalIndex(a_seatData.seatindex);
        var prefab = cc.vv.mahjongmgr.getFoldPre(localIndex);
        var side = cc.vv.mahjongmgr.getSide(localIndex);

        var foldsSprites = this._folds[side];
        for (var i = 0; i < foldsSprites.length; ++i) {
            var index = i;
            if (side == "right" || side == "up") {
                index = foldsSprites.length - i - 1;
            }
            var sprite = foldsSprites[index];
            sprite.node.active = true;
            this.setSpriteFrameByTile(prefab, sprite, folds[i]);
        }
        for (var i = folds.length; i < foldsSprites.length; ++i) {
            var index = i;
            if (side == "right" || side == "up") {
                index = foldsSprites.length - i - 1;
            }
            var sprite = foldsSprites[index];

            sprite.spriteFrame = null;
            sprite.node.active = false;
        }
    },

    setSpriteFrameByTile: function (a_prefab, a_sprite, a_tile) {
        a_sprite.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByTile(a_prefab, a_tile);
        a_sprite.node.active = true;
    },

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});