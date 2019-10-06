var ACTION_CHUPAI = 1;
var ACTION_MOPAI = 2;
var ACTION_PENG = 3;
var ACTION_GANG = 4;
var ACTION_HU = 5;
var ACTION_ZIMO = 6;

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
        _lastAction: null,
        _actionRecords: null,
        _actionRecordsIndex: 0,
    },

    // use this for initialization
    onLoad: function () {

    },

    clear: function () {
        this._lastAction = null;
        this._actionRecords = null;
        this._actionRecordsIndex = 0;
    },

    init: function (data) {
        this._actionRecords = data.action_records;
        if (this._actionRecords == null) {
            this._actionRecords = {};
        }
        this._actionRecordsIndex = 0;
        this._lastAction = null;
    },

    isReplaying: function () {
        return this._actionRecords != null;
    },

    getNextAction: function () {
        if (this._actionRecordsIndex >= this._actionRecords.length) {
            return null;
        }

        var si = this._actionRecords[this._actionRecordsIndex++];
        var action = this._actionRecords[this._actionRecordsIndex++];
        var pai = this._actionRecords[this._actionRecordsIndex++];
        return {
            si: si,
            type: action,
            pai: pai
        };
    },

    takeAction: function () {
        var action = this.getNextAction();
        if (this._lastAction != null && this._lastAction.type == ACTION_CHUPAI) {
            if (action != null && action.type != ACTION_PENG && action.type != ACTION_GANG && action.type != ACTION_HU) {
                cc.vv.gameNetMgr.doGuo(this._lastAction.si, this._lastAction.pai);
            }
        }
        this._lastAction = action;
        if (action == null) {
            return -1;
        }
        var nextActionDelay = 1.0;
        if (action.type == ACTION_CHUPAI) {
            //console.log("ACTION_CHUPAI");
            cc.vv.gameNetMgr.doDiscardTile(action.si, action.pai);
            return 1.0;
        } else if (action.type == ACTION_MOPAI) {
            //console.log("ACTION_MOPAI");
            cc.vv.gameNetMgr.doDrawTile(action.si, action.pai);
            cc.vv.gameNetMgr.doTurnChange(action.si);
            return 0.5;
        } else if (action.type == ACTION_PENG) {
            //console.log("ACTION_PENG");
            cc.vv.gameNetMgr.doPeng(action.si, action.pai);
            cc.vv.gameNetMgr.doTurnChange(action.si);
            return 1.0;
        } else if (action.type == ACTION_GANG) {
            //console.log("ACTION_GANG");
            cc.vv.gameNetMgr.dispatchEvent("event_call_kong", action.si);
            cc.vv.gameNetMgr.doGang(action.si, action.pai);
            cc.vv.gameNetMgr.doTurnChange(action.si);
            return 1.0;
        } else if (action.type == ACTION_HU) {
            //console.log("ACTION_HU");
            cc.vv.gameNetMgr.doHu({
                seatindex: action.si,
                hupai: action.pai,
                iszimo: false
            });
            return 1.5;
        }
    }

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});