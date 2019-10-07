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
        _foldsSprites: null,
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
        this._foldsSprites = {};
        var nodeGame = this.node.getChildByName("game");
        var nodeSidesNames = ["myself", "right", "up", "left"];
        for (var i = 0; i < nodeSidesNames.length; ++i) {
            var nodeSideName = nodeSidesNames[i];
            var nodeSide = nodeGame.getChildByName(nodeSideName);
            var foldsSprites = [];
            var nodeDiscardTiles = nodeSide.getChildByName("folds");
            for (var j = 0; j < nodeDiscardTiles.children.length; ++j) {
                var node = nodeDiscardTiles.children[j];
                if ((nodeSideName == "myself") || (nodeSideName == "right")) { // This two sides need to revert zIndex to show tiles properly
                    node.zIndex = -j;
                }
                node.active = false;
                var sprite = node.getComponent(cc.Sprite);
                sprite.spriteFrame = null;
                foldsSprites.push(sprite);
            }
            this._foldsSprites[nodeSideName] = foldsSprites;
        }

        this.hideAllFolds();
    },

    hideAllFolds: function () {
        for (var k in this._foldsSprites) {
            var foldSprites = this._foldsSprites[i];
            for (var i in foldSprites) {
                foldSprites[i].node.active = false;
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
        var foldsTiles = a_seatData.folds;
        if (foldsTiles == null) {
            return;
        }
        var localIndex = cc.vv.gameNetMgr.getLocalIndex(a_seatData.seatindex);
        var prefixString = cc.vv.mahjongmgr.getFoldPrefixString(localIndex);
        var sideString = cc.vv.mahjongmgr.getSideString(localIndex);

        var foldsSprites = this._foldsSprites[sideString];
        for (var i = 0; i < foldsSprites.length; ++i) {
            var index = i;
            // if (sideString == "right" || sideString == "up") {
            //     index = foldsSprites.length - i - 1;
            // }
            var sprite = foldsSprites[index];
            sprite.node.active = true;
            this.setSpriteFrameByTile(prefixString, sprite, foldsTiles[i]);
        }
        for (var i = foldsTiles.length; i < foldsSprites.length; ++i) {
            var index = i;
            // if (sideString == "right" || sideString == "up") {
            //     index = foldsSprites.length - i - 1;
            // }
            var sprite = foldsSprites[index];

            sprite.spriteFrame = null;
            sprite.node.active = false;
        }
    },

    setSpriteFrameByTile: function (a_prefixString, a_sprite, a_tile) {
        a_sprite.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByTile(a_prefixString, a_tile);
        a_sprite.node.active = true;
    },

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});