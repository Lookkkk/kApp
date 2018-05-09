var irc = null;
//==================================================================================
//新增解析域名函数，接受第一个参数是url，字符串格式，第二个参数是需要打印日志的外部说明，字符串格式，
try {
    function parse(str, content) {
        var reg = /http(s?)\:\/\/(.+?)\//;
        var newStr = reg.exec(str)[2];
        if (!isNaN(newStr[0])) {
            log(2, '无需ip解析' + content + ': 完整url: ' + str + ' ,截取url: ' + newStr);
            return;
        }
        $.ajax({
            url: 'http://touch.xueersi.com/ZtRegister/requestWebGetIp',
            type: "get",
            dataType: 'json',
            data: {domain: newStr},
            success: function (data) {
//字符串拼接内容为=>ip解析成功：+外部说明: +parse: +域名 +返回ip：+ip
//示例：ip解析成功：是解析的视频调度地址：prase：www.baidu.com ,返回ip：61.135.169.125;61.135.169.121
                log(2, 'ip解析成功: ' + content + ': parse: ' + newStr + ' ,返回ip: ' + data.data);
            },
            error: function (e) {
//大体内容同上
                log(2, 'ip解析失败: ' + content + ': parse: ' + newStr + ' ,错误原因: ' + JSON.stringify(e))
            }
        });
    }
} catch (e) {
    console.log(e, '解析ip报错');
}
//=================================================================
//增加打印日志:设备类型，浏览器类型
try {
    setTimeout(function () {
        function IsAgent() {
            var userAgentInfo = navigator.userAgent;
            console.log(userAgentInfo);
            var regDevice = /\((.+?)\)/i;
            var regBrowser = /Gecko\)\s(.+)Mobile/ig;
            var deviceType = regDevice.exec(userAgentInfo)[1];
            var browserType = regBrowser.exec(userAgentInfo)[1] + 'Mobile';
            log(2, '设备类型及版本:' + deviceType);
            log(2, '浏览器类型及版本:' + browserType);
        }

        IsAgent();
    }, 2000)
} catch (e) {
    console.log(e, '打印设备类型报错');
}

function createClient(host, port, nick, pass, room) {
    irc = new IRCClient({
        /**
         * irc error
         *
         * params:
         * msg: a instance of MyMessage
         */
        onIrcError: function (msg) {
            log("irc = " + JSON.stringify(msg));
        },
        /**
         * irc error
         *
         * params:
         * status: a instance of IrcStatus
         * public:
         * "status id"
         * 1: connecting
         * 2: connected
         * 3: joining
         * 4: joined
         * 5: closed
         * 6: nick name is in use
         */
        onIrcStatus: function (status) {
//            log("irc = " + JSON.stringify(status));

            // 记录日志
            var filename = 2;
            if (status.status == 8) {
                filename = 3;
            }
            liveInfo.clientLog(filename, status.describe);

            if (status.status == 4) {
                // 聊天服务器连接成功!
                msg_static.stu_in_room = true;
                msg_static.reconnircnum = 0;
                msg_static.reconnirc = 0;
                var message = {
                    type: msgType.system,
                    name: msg_tip.CHAT.SPEECH_SYS,
                    text: msg_tip.CHAT.CONNECT
                }
                api.setMessage(message);
                if (liveInfo.videoData.state == 100) {
                    $('#video')[0].pause();
                    $('#video')[0].play();
                }

                // 互踢
                irc.sendPrivmsgSigle('T', chatRoom.getTheOtherNick(liveInfo.nick));

            } else if (status.status == 5 || status.status == 8) {
                // 聊天服务器连接失败!重新连接
                msg_static.stu_in_room = false;
                msg_static.reconnirc = 2;
                api.setOnlinePeople(0);

                if (!msg_static.reconnircnum++) {
                    var message = {
                        type: msgType.system,
                        name: msg_tip.CHAT.SPEECH_SYS,
                        text: msg_tip.CHAT.RECONNECT
                    }
                    api.setMessage(message);
                }
            } else if (status.status == 6) {
                // 昵称已存在，更换
                liveInfo.nick = chatRoom.getTheOtherNick(liveInfo.nick);
                msg_static.reconnircnum++;
            }
        },
        /**
         * irc a channel nick names
         *
         * params:
         * nickNames: a instance of NickNames
         */
        onIrcNickNames: function (nickNames) {

            var onlinePeople = nickNames.length();
            //老师是否在聊天中
            for (var i = 0; i < nickNames.length(); i++) {
                var nickName = nickNames.names()[i];
                if (nickName.substr(0, 2) == 't_') {
                    // 老师在直播间
                    msg_static.tea_in_room = true;
                    liveInfo.teaNick = nickName;
                    onlinePeople--;
                    break;
                } else {
                    // 老师不在直播间
                    msg_static.tea_in_room = false;
                }
            }

            api.setOnlinePeople(onlinePeople);

//            log("irc = len: " + nickNames.length() + " [" + nickNames.names() + "]");
        },
        /**
         * received messages
         *
         * params:
         * msg: a instance of IrcMessage
         */
        onIrcMessage: function (ircmsg) {
//            log("irc = " + JSON.stringify(ircmsg));
//            api.setMessage({
//                type: msgType.system,
//                name: ircmsg.sender,
//                text: JSON.stringify(ircmsg)
//            });
//            log(ircmsg.type);
            if (chatRoom.getTheOtherNick(ircmsg.sender) == liveInfo.nick && ircmsg.content == "T") {
                // 退出聊天
                irc.logout();
                msg_static.stu_in_room = false;
                msg_static.video_stream = false;
                api.setOnlinePeople(0);

                // 解除直播视频播放
                liveInfo.player.unbind();

//                alert(msg_tip.CHAT.REMOTE_LOGIN);
//                liveInfo.checkLogin();

                // 异地登录，请刷新！
                var message = {
                    type: msgType.system,
                    name: msg_tip.CHAT.SPEECH_SYS,
                    text: msg_tip.CHAT.REMOTE_LOGIN
                }
                api.setMessage(message);

                // 聊天服务器连接断开！
                var message = {
                    type: msgType.system,
                    name: msg_tip.CHAT.SPEECH_SYS,
                    text: msg_tip.CHAT.DISCONNECT
                }
                api.setMessage(message);
                if (liveInfo.liveType == 6) {
                    alert(message.text);
                    liveInfo.locationReload();
                    return;
                }
                api.alert(1);

            } else if (ircmsg.type == 'TOPIC') {
                chatRoom.TopicMsgToChannel(ircmsg.content);
            } else if (ircmsg.type == 'NOTICE') {
                chatRoom.NoticeMsgToChannel(ircmsg.content);
            } else {
                chatRoom.PrivMsgToChannel(ircmsg.content);
            }


        },
        /**
         * other irc command
         * msg: a instance of MyMessage
         */
        onIrcOther: function (msg) {
            log("irc = " + JSON.stringify(msg));
        },
        /**
         * get irc chat records
         *
         * params:
         * success: get a record successfully?
         * json:    return json string
         */
        onIrcRecords: function (success, json) {
            if (success == true) {
                log("irc = " + JSON.stringify(json));
            } else {
                log("irc = " + "get records error!!!");
            }
        },
    });

    window.onbeforeunload = irc.logout;

    /**
     * connect to irc server
     *
     * params:
     * host: irc server host
     * port: irc server port
     * nick: my nick name
     * pass: irc server password
     * room: a channel you join
     */
    irc.connect(host, port, nick, pass, room, 0);
}

//============================================================================
//上传日志，加入数组里，每一分钟提交一次，
function log(str) {
    liveInfo.appendLogData(str);
//    console.log(obj);
//    api.setMessage({
//        type: msgType.system,
//        name: 'log',
//        text: JSON.stringify(obj)
//    });
}

//=======================================================================================
//连接聊天室函数
function ircclient() {
    msg_static.reconnirc = 1;
//    liveInfo.newTalkIndex++;

    var newTalkIndex = (liveInfo.newTalkIndex++) % liveInfo.infoData.newTalkConf.length;
    log("irc = " + 'newTalkIndex:' + newTalkIndex);
    var newTalkConf = liveInfo.infoData.newTalkConf[newTalkIndex];
//==========================================================================================================
//增加打印日志
    log(2, '聊天室地址: ' + newTalkConf.host);
    createClient(newTalkConf.host, newTalkConf.port, liveInfo.nick, newTalkConf.pwd, liveInfo.room);

}


var liveInfo = {
    debug: false,
    logText: null,
    // 直播初始化URL
    getInfoUrl: null,
    // 直播初始化数据
    infoData: null,
    // 用户昵称
    nick: null,
    // 老师昵称
    teaNick: null,
    // 聊天房间
    room: null,
    // ajax提交数据方式
    method: 'get',
    // ajax提交重试次数
    tryTimes: {getInfoUrl: 0},
    // ajax提交次数总数
    times: 3,
    // 聊天服务器编号
    newTalkIndex: 0,
    isUCBrowser: navigator.userAgent.indexOf('UCBrowser') > -1,
    isAndroid: navigator.userAgent.indexOf('Android') > -1,
    // 直播视频类型, true为flv,false为hls
    videoType: function () {
        return (flvjs.isSupported() && liveInfo.isAndroid && liveInfo.isUCBrowser) ? 'flv' : 'm3u8'
    },
    //直播种类(6:帮学堂)
    liveType: null,
    /**
     * 直播初始化
     *
     * @returns {undefined}
     */
    getInfo: function () {
        var data = {time: (new Date()).getTime()};

        // 上报日志的数据
        var logData = {
            type: liveInfo.method,
            url: liveInfo.getInfoUrl,
            data: data,
            dataType: 'json',
        }

        $.ajax({
            type: liveInfo.method,
            url: liveInfo.getInfoUrl,
            data: data,
            dataType: 'json',
            beforeSend: function () {
                log('getInfo:beforeSend');
            },
            success: function (jsonData) {
                if (jsonData.stat) {
                    liveInfo.infoData = jsonData.data;

                    msg_static.stu_is_login = liveInfo.infoData.is_login;

                    //初始化接口重试次数
                    $.each(liveInfo.infoData, function (index, data) {
                        if (index.indexOf('Url') >= 0) {
                            liveInfo.tryTimes[index] = 0;
                        }
                    });

                    liveInfo.tryTimes.getInfoUrl = 0;

                    // #+直播类型+L+直播ID
                    liveInfo.room = "#" + liveInfo.infoData.liveType + 'L' + liveInfo.infoData.id;
                    if (liveInfo.infoData.roomId) {
                        liveInfo.room += '-' + liveInfo.infoData.roomId;
                    }
                    liveInfo.nick = "s_" + liveInfo.infoData.liveType + '_' + liveInfo.infoData.id + '_' + liveInfo.infoData.stuId + '_' + liveInfo.infoData.stuSex;

                    liveInfo.timerEventData.flag = true;

                    // 刷新金币数
                    liveInfo.setGold(0);

                    liveInfo.gslbServer();

                    log(JSON.stringify(liveInfo.tryTimes));
                } else {
                    log('getInfo:get data fail;');
                    liveInfo._ajaxReturnFail(jsonData);
                }

                log('getInfo:success');

                // 记录日志
                var filename = 2;
                logData.jsonData = jsonData;
                var str = 'getInfo success logData:' + JSON.stringify(logData);
                liveInfo.clientLog(filename, str);
            },
            error: function (XMLHttpRequest, textStatus, errorThrown) {
                log('getInfo:fail');
                // 初始化失败，无法获取到接口数据，无法记录日志
                if (liveInfo.tryTimes.getInfoUrl < liveInfo.times) {
                    liveInfo.tryTimes.getInfoUrl++;
                    liveInfo.getInfo();
                } else {
                    liveInfo.tryTimes.getInfoUrl = 0;
                    api.showDownMessage(msg_tip.NETWORK_DISCONNECT, 3000);
                }
            },
            complete: function () {
                log('getInfo:complete');
            }

        });
    },
    /**
     * 直播调度
     *
     * flvPlayer 播放器对象
     * gslbData 调度数据
     */
    gslbAjaxHandle: null,
    gslbData: {data: null, playserver: null, servernum: 0, reconnnum: -1, ajax: false, step: 0, stat: 0},
    gslbServer: function () {

//        if (liveInfo.gslbData.reconnnum > 0) {
//            if (msg_static.tea_in_room || msg_static.video_stream) {
//                api.showVideoMesage('重新加载视频中...');
//            }
//        }
        // 过滤重复提交
        if (liveInfo.gslbData.ajax) {
            return;
        }

        liveInfo.gslbData.ajax = true;
        liveInfo.gslbData.stat = 0;

        // 提交的数据
        //================================================================================
        var data = {
            channelname: liveInfo.infoData.videoName,
            uniqueId: ++liveInfo.tryTimes.gslbServerUrl,
            userid: liveInfo.infoData.stuId,
            cmd: 'live_get_playserver',
            username: liveInfo.infoData.stuName,
            protocol: liveInfo.videoType(),
            format: 'json',
            time: (new Date()).getTime()
        };

        // 上报日志的数据
        var logData = {
            type: liveInfo.method,
            url: liveInfo.infoData.gslbServerUrl, // 'http://biglive.wx4.0.com/lecturelives/test/7594',
            data: data,
            dataType: 'jsonp',
        }

//        liveInfo.infoData.gslbServerUrl = 'http://biglive.wx4.0.com/lecturelives/test/7594';
        var liveUrsTwo = liveInfo.infoData.gslbServerUrl_baks[1];
        if ($.cookie('res') == null) {
            $.cookie('res', liveUrsTwo);
        }
//=======================================================================================
//liveInfo.infoData.gslbServerUrl已经不存在，每次判断都进入else，意味每次重新更换调度地址，都使用第二个地址，
        if (liveInfo.infoData.gslbServerUrl_baks.shift() === liveInfo.infoData.gslbServerUrl) {
            var liveUrls = liveInfo.infoData.gslbServerUrl;

        } else {
            var liveUrls = $.cookie('res');
        }
        $.jsonp({
            type: liveInfo.method,
            url: liveUrls, //liveInfo.infoData.gslbServerUrl,
            data: data,
            callbackParameter: 'callback',
            beforeSend: function () {
                // 上报之前的日志
                liveInfo.uploadLog();

                log('gslbServer:beforeSend');

                // 直播视频没有真正播放时，判定老师是不在直播里的
                msg_static.video_stream = false;

                //连接次数
                liveInfo.gslbData.reconnnum++;

                liveInfo.videoData.videoTypeTime++;

                if (liveInfo.gslbData.reconnnum > 0) {
                    var connectSec = (new Date()).getTime();
                    var detail = 'bufreconnect';
                    var msgid = 12137;
                    if (liveInfo.gslbData.step == 1) {
                        msgid = 12107;
                    }

                    liveInfo.gslbData.step = 0;

                    liveInfo.logServer(msgid, connectSec, detail);

                    log('gslbServer:msgid=' + msgid);
                }

            },
            success: function (jsonData) {
//==========================================================================================================
//增加打印日志
                parse(liveUrls, '请求成功,视频调度地址');
                log('请求成功,视频调度地址: ' + liveUrls);
                log('gslbServer:success');
                log(JSON.stringify(jsonData));

                liveInfo.gslbData.stat = 1;

                if (liveInfo.gslbData.data && liveInfo.gslbData.data.playserver != undefined) {

                    var rtmpUrl = 'http://' + liveInfo.gslbData.playserver.address + ':' + liveInfo.gslbData.playserver.port + '/' +
                        liveInfo.gslbData.data.appname + '/' + liveInfo.infoData.videoName + liveInfo.gslbData.playserver.postfix;
//==========================================================================================================
//增加打印日志
                    parse(rtmpUrl, 'video播放url');
                    log('video播放url: ' + rtmpUrl);
                    //筛选服务器
                    var server = liveInfo.gslbData.data.playserver.length > jsonData.playserver.length ? jsonData.playserver : liveInfo.gslbData.data.playserver;
                    var len = server.length;
                    var flag = false;
                    for (var i = 0; i < len; i++) {
                        // 旧列表与新列表比较
                        if (JSON.stringify(liveInfo.gslbData.data.playserver[i]) == JSON.stringify(jsonData.playserver[i])) {
                            flag = true;
                        } else {
                            liveInfo.gslbData.servernum = i;
                            break;
                        }
                    }

                    if (flag) {
                        liveInfo.gslbData.servernum = (liveInfo.gslbData.servernum + 1) % jsonData.playserver.length;
                    }
                }
                liveInfo.gslbData.data = jsonData;

                log('liveInfo.gslbData.servernum = ' + liveInfo.gslbData.servernum);

                // 解除直播视频播放
                liveInfo.player.unbind();

                // 绑定直播视频播放
                liveInfo.player.bind();

                // 记录日志
                var filename = 2;
                logData.jsonData = jsonData;
                var str = 'gslbServer success logData:' + JSON.stringify(logData);
                liveInfo.clientLog(filename, str);
            },
            error: function (XMLHttpRequest, textStatus, errorThrown) {
//==========================================================================================================
//增加打印日志
                parse(liveUrls, '请求失败,视频调度地址');
                log('请求失败,视频调度地址: ' + liveUrls);
                log('gslbServer:fail');
                // 记录日志
                var filename = 3;
                var str = 'gslbServer fail XMLHttpRequest:' + JSON.stringify(XMLHttpRequest) + ' textStatus:' + textStatus + ' error logData:' + JSON.stringify(logData);
                liveInfo.clientLog(filename, str);

                // 出错一直不断重新请求
                setTimeout('liveInfo.gslbServer()', 0);
            },
            complete: function () {
                log('gslbServer:complete');
                // 初始化视频播放时长
                liveInfo.gslbData.ajax = false;
            }

        });
    },
    /**
     * 视频播放器
     */
    player: {
        flvPlayer: null,
        bind: function () {
            log('playerBind:start');

            if (liveInfo.videoType() == 'flv') {
                // 当前连接的服务器
                liveInfo.gslbData.playserver = liveInfo.gslbData.data.playserver[liveInfo.gslbData.servernum];

                var rtmpUrl = 'http://' + liveInfo.gslbData.playserver.address + ':' + liveInfo.gslbData.playserver.port + '/' +
                    liveInfo.gslbData.data.appname + '/' + liveInfo.infoData.videoName + liveInfo.gslbData.playserver.postfix + '?' + (new Date()).getTime();
//==========================================================================================================
//增加打印日志
                parse(rtmpUrl, 'video播放url');
                log('video播放url: ' + rtmpUrl);
                var videoElement = document.getElementById('video');
                if (liveInfo.isUCBrowser) {
                    videoElement.src = rtmpUrl;
                    videoElement.load();
                    videoElement.play();
                    return;
                }

                liveInfo.player.flvPlayer = flvjs.createPlayer({
                    type: 'flv',
                    isLive: true,
                    url: rtmpUrl
                });

                liveInfo.player.flvPlayer.attachMediaElement(videoElement);
                liveInfo.logServerData.connectSec = (new Date()).getTime();
                liveInfo.player.flvPlayer.load();
                liveInfo.player.flvPlayer.play();

//            liveInfo.player.flvPlayer.on(flvjs.Events.ERROR, function () {
//                log('视频出现错误-----------');
//            });
//
//            liveInfo.player.flvPlayer.on(flvjs.Events.ERROR, function () {
//                log('LOADING_COMPLETE-----------');
//            });
//
//            liveInfo.player.flvPlayer.on(flvjs.Events.ERROR, function () {
//                log('MEDIA_INFO-----------');
//            });
//
//            liveInfo.player.flvPlayer.on(flvjs.Events.ERROR, function () {
//                log('STATISTICS_INFO-----------');
//            });

            } else {
                var rtmpUrl = liveInfo.gslbData.data.hlsaddr;

                var videoElement = document.getElementById('video');
                videoElement.src = rtmpUrl;
                videoElement.play();


                if (!liveInfo.videoData.isClickPlay) {
                    if (liveInfo.isUCBrowser) {
                        msg_static.video_stream = true;
                    }
                    api.showVideoMesage('');
                    api.showWaitTeacher(3);
                }
            }


            msg_static.video_stream = true;
//=====================================================================================
//增加打印日志/在原有基础上修改
            parse(rtmpUrl, 'video播放url');
            log('video播放url: ' + rtmpUrl);
            log('playerBind:end');
        },
        unbind: function () {
            var videoElement = document.getElementById('video');
            videoElement.pause();

            if (typeof liveInfo.player.flvPlayer !== "undefined") {
                if (liveInfo.player.flvPlayer != null) {
                    liveInfo.player.flvPlayer.unload();
                    liveInfo.player.flvPlayer.detachMediaElement();
                    liveInfo.player.flvPlayer.destroy();
                    liveInfo.player.flvPlayer = null;
                }
            }
            log('playerUnBind');
        }
    },
    /**
     * 刷新金币数
     */
    setGold: function (gold) {
        // 更新金币数
        liveInfo.infoData.goldNum = parseInt(liveInfo.infoData.goldNum) + parseInt(gold);
        // 设置金币数
        api.setMoney(liveInfo.infoData.goldNum);
    },
    /**
     * 发送聊天信息
     *
     * @returns {undefined}
     */
    sendPrivmsg: function () {
        var m_text = '';
        var m_name = msg_tip.CHAT.SPEECH_SYS;

        // 用户是否在聊天室
        if (!msg_static.stu_in_room) {
            // 服务器连接断开，当前无法发言！
//==========================================================================================================
//增加打印日志
            log('服务器连接断开，当前无法发言！');
            api.showDownMessage(msg_tip.CHAT.CHAT_DISCONNECT, 3000);
            return;
        }

        if (!msg_static.room_1.openchat) {
            // 老师关闭了发言功能，请认真听课！
            // m_text  = '老师关闭了发言功能，请认真听课！';
            api.showDownMessage(msg_tip.CHAT.CLOSE_CHAT, 3000);
            return;
        }

        if (msg_static.disable_speaking) {
            // 你被老师禁言了，请联系老师解除禁言！
            // m_text  = '你被老师禁言了，请联系老师解除禁言！';
            api.showDownMessage(msg_tip.CHAT.BAN_SPEECH_1, 3000);
            return;
        }

        if ((new Date()).getTime() - msg_static.room_1.sendmsgtime <= 5000) {
            // 发言间隔为5秒，请稍后发言！
            // m_text  = '发言间隔为5秒，请稍后发言！';
//            m_text = msg_tip.CHAT.SPEECH_INTERVAL;
//            var message = {
//                type: msgType.system,
//                name: m_name,
//                text: m_text
//            }
//            api.setMessage(message);
            return;
        }

        m_text = $.trim(api.getInputText());

        if (m_text.length == 0) {
            api.showDownMessage(msg_tip.CHAT.SPEECH_EMPTY, 3000);
//            m_text = msg_tip.CHAT.SPEECH_EMPTY;
//            var message = {
//                type: msgType.system,
//                name: m_name,
//                text: m_text
//            }
//            api.setMessage(message);

            api.clearInputText();
            return;
        }

        var g_message = {
            name: liveInfo.infoData.stuName,
            type: msg_type.ROOM_CHAT + "",
            msg: m_text,
            from: liveInfo.videoType()
        };
//        log(JSON.stringify(g_message));
        irc.sendPrivmsgGroup(JSON.stringify(g_message));
        m_name = msg_tip.CHAT.SPEECH_MINE;
        if (!liveInfo.infoData.is_login) {
            m_name += '(' + liveInfo.infoData.stuName + ')';
        }
        var message = {
            type: msgType.mine,
            name: m_name,
            text: m_text
        }
        api.setMessage(message);
        api.clearInputText();
        api.closeExpressPanel();
        msg_static.room_1.sendmsgtime = (new Date()).getTime();

        api.banImInput();
    },
    showTestInput: function (data) {
        if (data.ptype == 1) {
            if (data.choiceType == 1) {
                // 显示单选题
                api.switchRoute('question1', data.num);
            } else if (data.choiceType == 2) {
                // 显示多选题
                api.switchRoute('question1', data.num);
            }
        } else if (data.ptype == 2) {
            // 显示填空题
            log('显示填空题');
            api.switchRoute('question2', data.num);
        }

        liveInfo.testSubmitData.testId = data.id;
        liveInfo.testSubmitData.ptype = data.ptype;
    },
    /**
     * 提交互动题
     *
     * testSubmitData 提交的数据
     */
    testSubmitData: {testId: 0, testAnswer: null, ptype: 0, ajax: false},
    testSubmit: function () {

        // 用户是否登录
        if (!msg_static.stu_is_login) {
            api.showDownMessage(msg_tip.ANSWER.NO_LOGIN, 3000);
            return;
        }

        //if (isEmptyObject(liveInfo.testSubmitData.testAnswer)) {
        //   api.showDownMessage(msg_tip.ANSWER.NO_ANSWER, 3000);
        //   return;
        // }

        // 过滤重复提交
        if (liveInfo.testSubmitData.ajax) {
            return;
        }
        liveInfo.testSubmitData.ajax = true;

        // 提交的数据
        var data = {
            testId: liveInfo.testSubmitData.testId,
            time: (new Date()).getTime()
        };

        if (liveInfo.testSubmitData.ptype == 1) {
            // 选择题
            data.testAnswer = liveInfo.testSubmitData.testAnswer;
        } else if (liveInfo.testSubmitData.ptype == 2) {
            // 填空题
            data.testAnswer = encodeURI(JSON.stringify(liveInfo.testSubmitData.testAnswer));
        }

        // 上报日志的数据
        var logData = {
            type: liveInfo.method,
            url: liveInfo.infoData.testSubmitUrl,
            data: data,
            dataType: 'json',
        }

        $.ajax({
            type: liveInfo.method,
            url: liveInfo.infoData.testSubmitUrl,
            data: data,
            dataType: 'json',
            beforeSend: function () {
            },
            timeout: 5000,
            success: function (jsonData) {
                log(JSON.stringify(jsonData));

                if (jsonData.stat) {
                    var data = jsonData.data;

                    if (data.tip == 1) {
                        // {"stat":1,"data":{"tip":1,"gold":"1","msg":"真不错，全对了！奖励1个金币！","testId":"162132"}}
                        api.switchAlert('daduilejinbi', data.gold);
                    } else if (data.tip == 2) {
                        // {"stat":1,"data":{"tip":2,"gold":0,"msg":"哦～，答错啦！下次要认真一点哟…","testId":"162130"}}
                        api.switchAlert('dacuole', data.gold);
                    } else if (data.tip == 3) {
                        // {"stat":1,"data":{"tip":3,"gold":2,"msg":"答对空1,2,4,6,7,8,9","testId":"162131"}}
                        api.switchAlert('bufendaduijinbi', data.gold);
                    } else if (data.tip == 4) {
                        // {"stat":1,"data":{"tip":4,"gold":0,"msg":"哦～，答错啦！下次要认真一点哟…","testId":"162130"}}
                        api.switchAlert('daduile', data.gold);
                    } else if (data.tip == 5) {
                        // {"stat":1,"data":{"tip":5,"gold":0,"msg":"哦～，答错啦！下次要认真一点哟…","testId":"162130"}}
                        api.switchAlert('bufendadui', data.gold);
                    }

                    // 刷新金币数
                    liveInfo.setGold(data.gold);
                } else {
                    liveInfo._ajaxReturnFail(jsonData);
                }

                // 切换到聊天
                api.switchRoute('im');

                liveInfo.tryTimes.testSubmitUrl = 0;

                // 记录日志
                var filename = 2;
                logData.jsonData = jsonData;
                var str = 'testSubmit success logData:' + JSON.stringify(logData);
                liveInfo.clientLog(filename, str);

            },
            error: function (XMLHttpRequest, textStatus, errorThrown) {
                // 记录日志
                var filename = 3;
                var str = 'testSubmit fail XMLHttpRequest:' + JSON.stringify(XMLHttpRequest) + ' textStatus:' + textStatus + ' error logData:' + JSON.stringify(logData);
                liveInfo.clientLog(filename, str);
            },
            complete: function () {
                liveInfo.testSubmitData.ajax = false;
            }

        });
    },
    /**
     * 刷新页面
     *
     * @returns {undefined}
     */
    locationReload: function () {
        location.reload();
    },
    /**
     * 开启关闭献花面板
     *
     * @returns {undefined}
     */
    toggleFlowerPanel: function () {
        // 用户是否登录
        if (!msg_static.stu_is_login) {
            // 登录后可以献花！
            api.showDownMessage(msg_tip.FLOWER.NO_LOGIN, 3000);
            return;
        }

        // 用户是否在聊天室
        if (!msg_static.stu_in_room) {
            // 服务器连接断开，现在无法献花！
//==========================================================================================================
//增加打印日志
            log('服务器连接断开，现在无法献花！');
            api.showDownMessage(msg_tip.FLOWER.CHAT_DISCONNECT, 3000);
            return;
        }

        if (!msg_static.video_stream && !msg_static.tea_in_room) {
            // 老师不在直播间，你想给谁献花？
            api.showDownMessage(msg_tip.FLOWER.NO_TEACHER, 3000);
            return;
        }

        if (msg_static.topic) {
            // 正在答题，不能鲜花！
            api.showDownMessage(msg_tip.FLOWER.ANSWERING, 3000);
            return;
        }

        if (!msg_static.room_1.openbarrage) {
            // 老师关闭了献花功能，不能献花！
            api.showDownMessage(msg_tip.FLOWER.CLOSE_FLOWER, 3000);
            return;
        }

        //开启关闭献花面板
        api.toggleFlowerPanel();
    },
    /**
     * 学生献花
     *
     * @returns {undefined}
     */
    praiseTeacherData: {ajax: false},
    praiseTeacher: function () {
        // 用户是否登录
        if (!msg_static.stu_is_login) {
            api.showDownMessage(msg_tip.NO_LOGIN, 3000);
            return;
        }

        //开启关闭献花面板
        api.toggleFlowerPanel();

        var flowerType = api.getFlowerType();
        if (flowerType == undefined) {
            api.showDownMessage(msg_tip.FLOWER.CHOICE, 3000);
            return;
        }

        var type = 2;
        var text = '';
        var flowerText = '';
        var gold = 0;
        switch (flowerType) {
            case 0:
                type = 2;
                text = msg_tip.CHAT.FLOWER_TXT_1 + '[e]' + msg_tip.CHAT.FLOWER_NAME_1 + '1[e]';
                flowerText = msg_tip.FLOWER.FLOWER_TYPE_2.replace(/%s/, msg_tip.FLOWER.MINE);
                gold = 10;
                break;
            case 1:
                type = 3;
                text = msg_tip.CHAT.FLOWER_TXT_2 + '[e]' + msg_tip.CHAT.FLOWER_NAME_1 + '2[e]';
                flowerText = msg_tip.FLOWER.FLOWER_TYPE_3.replace(/%s/, msg_tip.FLOWER.MINE);
                gold = 50;
                break;
            case 2:
                type = 4;
                text = msg_tip.CHAT.FLOWER_TXT_2 + '[e]' + msg_tip.CHAT.FLOWER_NAME_1 + '3[e]';
                flowerText = msg_tip.FLOWER.FLOWER_TYPE_4.replace(/%s/, msg_tip.FLOWER.MINE);
                gold = 100;
                break;
        }
        if (liveInfo.liveType == 6) {
            liveInfo.bxtPraiseTeacher(type, flowerText);
            return;
        }

        if (liveInfo.infoData.goldNum < gold) {
            api.showDownMessage(msg_tip.FLOWER.LACK_OF_GOLD, 3000);
            //设置献花禁用时间
            api.setFlowerDisable(10);
            return;
        }

        // 过滤重复提交
        if (liveInfo.praiseTeacherData.ajax) {
            api.showDownMessage(msg_tip.FLOWER.SENDING, 3000);
            return;
        }
        liveInfo.praiseTeacherData.ajax = true;

        // 提交的数据
        var data = {
            type: type,
            time: (new Date()).getTime()
        };

        // 上报日志的数据
        var logData = {
            type: liveInfo.method,
            url: liveInfo.infoData.praiseTeacherUrl,
            data: data,
            dataType: 'json',
        };

        $.ajax({
            type: liveInfo.method,
            url: liveInfo.infoData.praiseTeacherUrl,
            data: data,
            dataType: 'json',
            beforeSend: function () {
            },
            success: function (jsonData) {
                log(JSON.stringify(jsonData));

                if (jsonData.stat) {
                    //{"stat":1,"data":{"type":2,"gold":10}}
                    var data = jsonData.data;

                    //设置献花禁用时间
                    api.setFlowerDisable(10);

                    // 刷新金币数
                    liveInfo.setGold(-data.gold);

                    api.setBarrage(flowerType, flowerText);

                    var g_message = {name: liveInfo.infoData.stuName, type: msg_type.ROOM_BARRAGE + "", ftype: type};
                    irc.sendNoticeSigle(JSON.stringify(g_message), liveInfo.teaNick);

                    //提示
                    var message = {
                        type: msgType.mine,
                        name: msg_tip.CHAT.SPEECH_MINE,
                        text: text
                    }
                    api.setMessage(message);

                    api.showDownMessage('');

                } else {
                    liveInfo._ajaxReturnFail(jsonData);
                }

                // 记录日志
                var filename = 2;
                logData.jsonData = jsonData;
                var str = 'praiseTeacher success logData:' + JSON.stringify(logData);
                liveInfo.clientLog(filename, str);
            },
            error: function (XMLHttpRequest, textStatus, errorThrown) {
                // 记录日志
                var filename = 3;
                var str = 'praiseTeacher fail XMLHttpRequest:' + JSON.stringify(XMLHttpRequest) + ' textStatus:' + textStatus + ' error logData:' + JSON.stringify(logData);
                liveInfo.clientLog(filename, str);
            },
            complete: function () {
                liveInfo.praiseTeacherData.ajax = false;
            }

        });
    },
    //帮学堂献花
    bxtPraiseTeacher: function (flowerType, text) {
        var g_message = {name: liveInfo.infoData.stuName, type: msg_type.ROOM_BARRAGE + "", ftype: flowerType};
        irc.sendNoticeSigle(JSON.stringify(g_message), liveInfo.teaNick);
        api.setBarrage(flowerType - 2, text);
        api.setFlowerDisable(10);
    },
    /**
     * 学生领红包
     *
     * @type type
     */
    receiveGoldData: {operateId: null, ajax: false},
    receiveGold: function () {
        // 用户是否登录
        if (!msg_static.stu_is_login) {
            // 登录后可以领取红包！
            api.showDownMessage(msg_tip.GOLD.NO_LOGIN, 3000);
            api.closeAlert('hongbao');
            return;
        }

        // 用户是否在聊天室
        if (!msg_static.stu_in_room) {
            // 服务器连接断开，无法领取红包！
//==========================================================================================================
//增加打印日志
            log('服务器连接断开，无法领取红包！');
            api.showDownMessage(msg_tip.GOLD.CHAT_DISCONNECT, 3000);
            api.closeAlert('hongbao');
            return;
        }

        // 过滤重复提交
        if (liveInfo.receiveGoldData.ajax) {
            return;
        }

        liveInfo.receiveGoldData.ajax = true;

        // 提交的数据
        var data = {
            operateId: liveInfo.receiveGoldData.operateId,
            time: (new Date()).getTime()
        };

        // 上报日志的数据
        var logData = {
            type: liveInfo.method,
            url: liveInfo.infoData.receiveGoldUrl,
            data: data,
            dataType: 'json',
        };

        $.ajax({
            type: liveInfo.method,
            url: liveInfo.infoData.receiveGoldUrl,
            data: data,
            dataType: 'json',
            beforeSend: function () {
            },
            success: function (jsonData) {
                log(JSON.stringify(jsonData));
                if (jsonData.stat) {
                    var data = jsonData.data;
                    // 刷新金币数
                    liveInfo.setGold(data.gold);
                    api.closeAlert('hongbao');
                    api.switchAlert('lingdaohongbao', data.gold);
                } else {
                    liveInfo._ajaxReturnFail(jsonData);
                }

                // 记录日志
                var filename = 2;
                logData.jsonData = jsonData;
                var str = 'receiveGold success logData:' + JSON.stringify(logData);
                liveInfo.clientLog(filename, str);
            },
            error: function (XMLHttpRequest, textStatus, errorThrown) {
                // 记录日志
                var filename = 3;
                var str = 'receiveGold fail XMLHttpRequest:' + JSON.stringify(XMLHttpRequest) + ' textStatus:' + textStatus + ' error logData:' + JSON.stringify(logData);
                liveInfo.clientLog(filename, str);
            },
            complete: function () {
                liveInfo.receiveGoldData.ajax = false;
            }

        });
    },
    /**
     * 懂了吗
     *
     * @type Boolean
     */
    understandData: false,
    understand: function () {
        api.closeAlert('tingdongleme');

        // 用户是否在聊天室
        if (!msg_static.stu_in_room) {
            // 服务器连接断开，当前无法发言！
//==========================================================================================================
//增加打印日志
            log('服务器连接断开，当前无法发言！');
            api.showDownMessage(msg_tip.UNDERSTAND.CHAT_DISCONNECT, 3000);
            return;
        }

        var g_message = {understand: liveInfo.understandData, type: msg_type.ROOM_UNDERSTAND_S + ""};
        irc.sendNoticeSigle(JSON.stringify(g_message), liveInfo.teaNick);
    },
    videoData: {currentTime: 0, isClickPlay: false, canPlay: false, videoTypeTime: 0, videoHandle: null, state: 0},
    /**
     * 定时器
     * @type type
     */
    timerEventHandle: null,
    timerEventData: {flag: false, timer: 0.5, currentTime: 0, videoDuration: 0, timeOut: 0, videoTimeOut: 0},
    timerEvent: function () {
        if (!liveInfo.timerEventData.flag) {
            return;
        }

        if (msg_static.reconnirc == 2) {
            // 连接聊天
//==========================================================================================================
//增加打印日志
            liveInfo.clientLog(2, '连接聊天');
            setTimeout('ircclient()', 0);
        }

        if (!(liveInfo.timerEventData.timeOut % 5)) {
            setTimeout('liveInfo.updateOnlineTime()', 0);
        }

        if (!(liveInfo.timerEventData.timeOut % 60)) {
            setTimeout('liveInfo.uploadLog()', 0);
        }


        if (msg_static.tea_in_room || liveInfo.videoData.state >= 200) {
//            log('老师在直播间');
            if (liveInfo.videoData.isClickPlay) {
                if (!msg_static.video_stream) {
//                api.showVideoMesage('加载视频中...');
                    api.showVideoMesage('');
                    api.showWaitTeacher(4);
                } else {
//                    api.showWaitTeacher(0);
                    if (liveInfo.videoData.state == 100) {
                        $('#video')[0].play();
                    }
                }
            } else {
                api.showVideoMesage('');
                api.showWaitTeacher(3);
            }
        } else {
//            log('老师不在直播间');
//                api.showVideoMesage('老师不在直播间...');
            api.showVideoMesage('');
            api.showWaitTeacher(2);
        }

        liveInfo.timerEventData.timeOut += liveInfo.timerEventData.timer;
//        log(liveInfo.timerEventData.timeOut);
    },
    /**
     * 更新在线cookie时间
     * @returns {undefined}
     */
    updateOnlineTime: function () {
        var cookieName = "lecture_online_" + liveInfo.infoData.id;
        var onlineTime = getCookie(cookieName);
        if (onlineTime == '' || isNaN(onlineTime)) {
            onlineTime = 0;
        }
        onlineTime = parseInt(onlineTime) + 5;
        if (onlineTime >= liveInfo.infoData.hbTime) {
            liveInfo.hb();
            onlineTime = 0;
        }
        setCookie(cookieName, onlineTime);
    },
    hb: function () {
        var data = {
            time: (new Date()).getTime()
        };

        // 上报日志的数据
        var logData = {
            type: liveInfo.method,
            url: liveInfo.infoData.hbUrl,
            data: data,
            dataType: 'json',
        };

        $.ajax({
            type: liveInfo.method,
            url: liveInfo.infoData.hbUrl,
            data: data,
            dataType: 'json',
            beforeSend: function () {
            },
            success: function (jsonData) {
                log(JSON.stringify(jsonData));
                if (jsonData.stat) {
                } else {
                    liveInfo._ajaxReturnFail(jsonData);
                }

                // 记录日志
                var filename = 2;
                logData.jsonData = jsonData;
                var str = 'hb success logData:' + JSON.stringify(logData);
                liveInfo.clientLog(filename, str);
            },
            error: function (XMLHttpRequest, textStatus, errorThrown) {
                // 记录日志
                var filename = 3;
                var str = 'hb fail XMLHttpRequest:' + JSON.stringify(XMLHttpRequest) + ' textStatus:' + textStatus + ' error logData:' + JSON.stringify(logData);
                liveInfo.clientLog(filename, str);
            },
            complete: function () {
            }
        });
    },
    // 验证失败处理
    _ajaxReturnFail: function (jsonData) {
        // {"stat":0,"msg":"账号退出登陆，请刷新"}
        // {"stat":0,"msg":"网络异常，请刷新当前页面，重新进入直播","refresh":1}
        if (jsonData.refresh != undefined && jsonData.refresh == 1) {
            if (liveInfo.liveType == 6) {
                alert(jsonData.msg);
                liveInfo.locationReload();
                return;
            }
            api.alert(1);
            return;
        }

        api.showDownMessage(jsonData.msg, 3000);
    },
    loginUrl: null,
    liveUrl: null,
    checkLogin: function () {
        if (liveInfo.infoData.stuId > 0) {
            // 登录
            location.href = liveInfo.loginUrl;
        } else {
            // 刷新当前页
            liveInfo.locationReload();
        }
    },
    logData: {index: 0, data: []},
    appendLogData: function (str) {
        var len = liveInfo.logData.data.length;
        if (len > 100 || len > 0 && liveInfo.logData.data[len - 1].data == str) {
            return;
        }
        var d = {index: ++liveInfo.logData.index, data: str};
        liveInfo.logData.data.push(d);
    },
    popAllLogData: function () {
        var data = liveInfo.logData.data;
        liveInfo.logData.data = [];
        return data;
    },
    uploadLog: function () {
        // 上报之前的日志
        var filename = 2;
        var logData = liveInfo.popAllLogData();
        if (logData.length == 0) {
            return;
        }
        var str = 'logData stuid = ' + liveInfo.infoData.stuId + ' JsonData = ' + JSON.stringify(logData);
        liveInfo.clientLog(filename, str);
    },
    /**
     * 上报大数据日志
     *
     */
    clientLogData: {order: 0},
    clientLog: function (filename, str) {
        var data = {
//=======================================================================================
//修改报错
            type: liveInfo.infoData ? liveInfo.infoData.liveType : '',
            groupid: liveInfo.infoData.id,
            uname: liveInfo.infoData.uname,
            uid: liveInfo.nick,
            stuid: liveInfo.infoData.stuId,
            tuid: liveInfo.infoData.teacherId,
            filename: filename, // 2，为正常流程日志，3为错误日志
            str: 'touch: ' + str, // 日志内容
            order: liveInfo.clientLogData.order++, // 日志上报顺序
            time: (new Date()).getTime()
        };
//==============================================================================
//展示日志
        /*api.setMessage({
            type: msgType.system,
            name: 'log',
            text: str
        });
        console.log(str);*/
        $.ajax({
            type: liveInfo.method,
            url: liveInfo.infoData.clientLog,
            data: data,
            dataType: 'json',
            beforeSend: function () {
            },
            success: function (jsonData) {
                log(JSON.stringify(jsonData));
            },
            error: function (XMLHttpRequest, textStatus, errorThrown) {
//                if (liveInfo.tryTimes.clientLog < liveInfo.times) {
//                    liveInfo.tryTimes.clientLog++;
//                    liveInfo.clientLog(filename, str);
//                } else {
//                    liveInfo.tryTimes.clientLog = 0;
//                }
            },
            complete: function () {
            }
        });
    },
    logServerData: {connectSec: 0, streamSec: 0,},
    logServer: function (msgid, connsec, detail) {
        if (liveInfo.gslbData.data == null) {
            return;
        }
        // 提交的数据
        var data = {
            msgid: msgid,
            userid: liveInfo.infoData.stuId,
            username: liveInfo.infoData.stuName,
            channelname: liveInfo.infoData.videoName,
            ccode: liveInfo.gslbData.data.ccode,
            pcode: liveInfo.gslbData.data.pcode,
            acode: liveInfo.gslbData.data.acode,
            icode: liveInfo.gslbData.data.icode,
            server: liveInfo.gslbData.data.server,
            servercc: liveInfo.gslbData.data.serverccode,
            serverpc: liveInfo.gslbData.data.serverpcode,
            serverac: liveInfo.gslbData.data.serveracode,
            serveric: liveInfo.gslbData.data.servericode,
            servergroup: liveInfo.gslbData.data.servergroup,
            appname: '',
            reconnnum: liveInfo.gslbData.reconnnum,
            connsec: connsec,
            detail: liveInfo.videoType() + ' UA:' + liveInfo.myBrowser(),
            cfrom: 'touch',
            time: (new Date()).getTime()
        };

        if (liveInfo.videoType() == 'flv') {
            // 提交的数据
            data = {
                msgid: msgid,
                userid: liveInfo.infoData.stuId,
                username: liveInfo.infoData.stuName,
                channelname: liveInfo.infoData.videoName,
                ccode: liveInfo.gslbData.data.ccode,
                pcode: liveInfo.gslbData.data.pcode,
                acode: liveInfo.gslbData.data.acode,
                icode: liveInfo.gslbData.data.icode,
                server: liveInfo.gslbData.playserver.address,
                servercc: liveInfo.gslbData.playserver.ccode,
                serverpc: liveInfo.gslbData.playserver.pcode,
                serverac: liveInfo.gslbData.playserver.acode,
                serveric: liveInfo.gslbData.playserver.icode,
                servergroup: liveInfo.gslbData.playserver.group,
                appname: liveInfo.gslbData.data.appname,
                reconnnum: liveInfo.gslbData.reconnnum,
                connsec: connsec,
                detail: liveInfo.videoType() + ' UA:' + liveInfo.myBrowser(),
                cfrom: 'touch',
                time: (new Date()).getTime()
            };
        }

        // 上报日志的数据
        var logData = {
            type: liveInfo.method,
            url: liveInfo.infoData.logServerUrl,
            data: data,
            dataType: 'json',
        };

        $.jsonp({
            type: liveInfo.method,
            url: liveInfo.infoData.logServerUrl,
            data: data,
            dataType: 'json',
            beforeSend: function () {
            },
            success: function (jsonData) {
                log(JSON.stringify(jsonData));
            },
            error: function (XMLHttpRequest, textStatus, errorThrown) {
                // 记录日志
                var filename = 3;
                var str = 'logServer XMLHttpRequest:' + JSON.stringify(XMLHttpRequest) + ' textStatus:' + textStatus + ' error logData:' + JSON.stringify(logData);
                liveInfo.clientLog(filename, str);
            },
            complete: function () {
                // 记录日志
                var filename = 2;
                var str = 'logServer success logData:' + JSON.stringify(logData);
                liveInfo.clientLog(filename, str);
            }
        });
    },
    myBrowser: function () {
        var userAgent = window.navigator.userAgent;//取得浏览器的userAgent字符串
        return userAgent;
    },
//    //显示h5素材课件
//    h5SourceShow: function (url) {
//        $(".left-content").css("display", "none");
//        $(".right-wrap").css("display", "none");
//        $("#h5SourceShow").css({
//            "z-index": 3,
//            "display": "block",
//        });
//        $("#h5SourceShow iframe").attr('src', url);
//    },
//    //关闭h5素材课件
//    h5SourceHidden: function () {
//        console.log("关闭h5实验");
//        $(".left-content").css("display", "block");
//        $(".right-wrap").css("display", "block");
//        $("#h5SourceShow").css({
//            "z-index": -1,
//            "display": "none",
//        });
//        $("#h5SourceShow iframe").attr('src', "");
//    }

}

function isEmptyObject(e) {
    var t;
    for (t in e)
        return !1;
    return !0
}

function getCookie(c_name) {
    if (document.cookie.length > 0) {
        c_start = document.cookie.indexOf(c_name + "=");
        if (c_start != -1) {
            c_start = c_start + c_name.length + 1;
            c_end = document.cookie.indexOf(";", c_start);
            if (c_end == -1)
                c_end = document.cookie.length;
            return unescape(document.cookie.substring(c_start, c_end));
        }
    }
    return "";
}

function setCookie(name, value) {
    var exp = new Date();
    exp.setTime(exp.getTime() + 3 * 60 * 60 * 1000);
    document.cookie = name + "=" + escape(value) + ";expires=" + exp.toGMTString();
}

function GetQueryString(name) {
    var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
    var r = window.location.search.substr(1).match(reg);
    if (r != null) return unescape(r[2]);
    return null;
}