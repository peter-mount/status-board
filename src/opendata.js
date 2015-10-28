Feed.types.opendata = (function () {
    function OpenData(feed, body, v)
    {
        this.feed = feed;
        this.config = v;

        var tmp = this.stats = {};
        $.each(v.status, function (i, s) {
            var c = Feed.component(feed, body, i, s.name, s.desc);
            tmp[s.name] = {
                comp: c,
                conf: s
            };
            $.each(s.stats, function (si, se) {
                tmp[s.name][se.name] = {
                    comp: Feed.value(c, se.title + "," + se.desc),
                    conf: se
                };
            });
        });

        console.log(this.tmp);

        this.refresh = function (src, feed, v) {
            console.log("Refresh", feed.config.id, v);
            $.each(v.stats, function (i, s) {
                var c = feed.type.stats[s.name];
                if (c) {
                    $.each(c.conf.stats, function (si, se) {
                        setValue(c, c[se.name], s[se.name]);
                    });
                }
            });
        };
    }

    var setValue = function (c, se, v) {
        if (v.current) {
            se.comp.empty().append(v.current);
            setAlarm(c, se, v.current);
        } else {
            se.comp.empty().append("N/A");
            c.comp.addClass("alarmlow");
        }
    };

    var setAlarm = function (c, se, v) {
        var a = se.conf.alarm;
        if (a) {
            if (a.low && v < a.low) {
                c.comp.addClass("alarmlow")
                        .removeClass("alarmhigh")
                        .removeClass("alarmnorm");
            } else if (a.high && v > a.high) {
                c.comp.removeClass("alarmlow")
                        .addClass("alarmhigh")
                        .removeClass("alarmnorm");
            } else {
                c.comp.removeClass("alarmlow")
                        .removeClass("alarmhigh")
                        .addClass("alarmnorm");
            }
        }
        else {
            c.comp.addClass("alarmnorm");
        }
    };

    return OpenData;
})();
