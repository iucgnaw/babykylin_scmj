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
        _popuproot: null,
        _settings: null,
        _dissolveNotice: null,

        _endTime: -1,
        _extraInfo: null,
        _noticeLabel: null,
    },

    // use this for initialization
    onLoad: function () {
        if (cc.vv == null) {
            return;
        }

        cc.vv.popupMgr = this;

        this._popuproot = cc.find("Canvas/popups");
        this._settings = cc.find("Canvas/popups/settings");
        this._dissolveNotice = cc.find("Canvas/popups/dissolve_notice");
        this._noticeLabel = this._dissolveNotice.getChildByName("info").getComponent(cc.Label);

        this.closeAll();

        this.addBtnHandler("settings/btn_close");
        this.addBtnHandler("settings/btn_sqjsfj");
        this.addBtnHandler("dissolve_notice/btn_agree");
        this.addBtnHandler("dissolve_notice/btn_reject");
        this.addBtnHandler("dissolve_notice/btn_ok");

        var self = this;
        this.node.on("event_propose_dismiss_room", function (data) {
            self.showDissolveNotice(data);
        });

        this.node.on("event_reject_dismiss_room", function (event) {
            self.closeAll();
        });
    },

    start: function () {
        if (cc.vv.gameNetMgr.dissoveData) {
            this.showDissolveNotice(cc.vv.gameNetMgr.dissoveData);
        }
    },

    addBtnHandler: function (btnName) {
        var btn = cc.find("Canvas/popups/" + btnName);
        this.addClickEvent(btn, this.node, "PopupMgr", "onBtnClicked");
    },

    addClickEvent: function (node, target, component, handler) {
        var eventHandler = new cc.Component.EventHandler();
        eventHandler.target = target;
        eventHandler.component = component;
        eventHandler.handler = handler;

        var clickEvents = node.getComponent(cc.Button).clickEvents;
        clickEvents.push(eventHandler);
    },

    onBtnClicked: function (event) {
        this.closeAll();
        var btnName = event.target.name;
        if (btnName == "btn_agree") {
            cc.vv.net.send("req_accept_dismiss_room");
        } else if (btnName == "btn_reject") {
            cc.vv.net.send("req_reject_dismiss_room");
        } else if (btnName == "btn_sqjsfj") {
            cc.vv.net.send("req_propose_dismiss_room");
        }
    },

    closeAll: function () {
        this._popuproot.active = false;
        this._settings.active = false;
        this._dissolveNotice.active = false;
    },

    showSettings: function () {
        this.closeAll();
        this._popuproot.active = true;
        this._settings.active = true;
    },

    showDissolveRequest: function () {
        this.closeAll();
        this._popuproot.active = true;
    },

    showDissolveNotice: function (a_data) {
        this._endTime = Date.now() / 1000 + a_data.time;
        this._extraInfo = "";
        for (var i = 0; i < a_data.states.length; ++i) {
            var b = a_data.states[i];
            var name = cc.vv.gameNetMgr.seats[i].name;
            if (b) {
                this._extraInfo += "\n[已同意] " + name;
            } else {
                this._extraInfo += "\n[待确认] " + name;
            }
        }
        this.closeAll();
        this._popuproot.active = true;
        this._dissolveNotice.active = true;;
    },

    // called every frame, uncomment this function to activate update callback
    update: function (dt) {
        if (this._endTime > 0) {
            var lastTime = this._endTime - Date.now() / 1000;
            if (lastTime < 0) {
                this._endTime = -1;
            }

            var minutes = Math.floor(lastTime / 60);
            var second = Math.ceil(lastTime - minutes * 60);

            var str = "";
            if (minutes > 0) {
                str += minutes + "分";
            }

            this._noticeLabel.string = str + second + "秒后房间将自动解散" + this._extraInfo;
        }
    },
});