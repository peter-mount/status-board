Feed.types.opendata = (function () {
    function OpenData(feed, body, v)
    {
        this.feed = feed;
        this.config = v;

        var tmp = this.stats = {};
        var tmplast = this.last = [];

        var offset = 0;

        if (v.heading) {
            var h;
            $.each(v.heading, function (si, se) {
                if (h)
                    Feed.value(h).empty().append(se);
                else
                    h = Feed.header(feed, body, offset, se);
            });
            offset++;
        }

        $.each(v.status, function (i, s) {
            var name = s.label ? s.label : s.name;
            var desc = s.desc ? s.name + " " + s.desc : s.name;
            var c = Feed.component(feed, body, i + offset, name, desc);
            tmp[s.name] = {
                comp: c,
                conf: s
            };
            $.each(s.stats, function (si, se) {
                tmp[s.name][se.name] = {
                    comp: Feed.value(c, se.title + "," + se.desc),
                    conf: se
                };
                tmplast.push(tmp[s.name][se.name]);
            });
        });

        this.refresh = function (src, feed, v) {
            $.each(v.stats, function (i, s) {
                var c = feed.type.stats[s.name];
                if (c) {
                    $.each(c.conf.stats, function (si, se) {
                        setValue(c[se.name], s[se.name]);
                    });
                }
            });

            // Any stat that has not had an update for more than 1.3 minutes then it's in trouble
            var now = Date.prototype.getTime();
            $.each(feed.type.last, function (i, se) {
                if (!se.last || (now - se.last) > 90000) {
                    se.comp.removeClass("alarmlow")
                            .removeClass("alarmhigh")
                            .removeClass("alarmnorm")
                            .addClass("alarmfail");
                }
            });
        };
    }

    var setValue = function (se, v) {
        if (v.current) {
            se.comp.empty().append(v.current);
            setAlarm(se, v);
        } else {
            se.last=null;
        }
    };

    var setAlarm = function (se, v) {
        se.last = v.millis;

        var a = se.conf.alarm;
        if (a) {
            if (a.low && v.current < a.low) {
                se.comp.addClass("alarmlow")
                        .removeClass("alarmhigh")
                        .removeClass("alarmnorm")
                        .removeClass("alarmfail");
            } else if (a.high && v.current > a.high) {
                se.comp.removeClass("alarmlow")
                        .addClass("alarmhigh")
                        .removeClass("alarmnorm")
                        .removeClass("alarmfail");
            } else {
                se.comp.removeClass("alarmlow")
                        .removeClass("alarmhigh")
                        .addClass("alarmnorm")
                        .removeClass("alarmfail");
            }
        }
        else {
            se.comp.addClass("alarmnorm")
                    .removeClass("alarmlow")
                    .removeClass("alarmhigh")
                    .removeClass("alarmnorm")
                    .removeClass("alarmfail");
        }
    };

    return OpenData;
})();
