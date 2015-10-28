Feed.types.opendata = (function () {
    function OpenData(feed, body, v)
    {
        this.feed = feed;
        this.config = v;

        var tmp = this.stats = {};

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
            });
        });

        console.log(this.tmp);

        this.refresh = function (src, feed, v) {
            console.log("Refresh", feed.config.id, v);
            $.each(v.stats, function (i, s) {
                var c = feed.type.stats[s.name];
                if (c) {
                    $.each(c.conf.stats, function (si, se) {
                        setValue(c[se.name], s[se.name]);
                    });
                }
            });
        };
    }

    var setValue = function (se, v) {
        if (v.current) {
            se.comp.empty().append(v.current);
            setAlarm(se, v.current);
        } else {
            se.comp.empty()
                    .append("N/A")
                    .addClass("alarmlow");
        }
    };

    var setAlarm = function (se, v) {
        var a = se.conf.alarm;
        if (a) {
            if (a.low && v < a.low) {
                se.comp.addClass("alarmlow")
                        .removeClass("alarmhigh")
                        .removeClass("alarmnorm");
            } else if (a.high && v > a.high) {
                se.comp.removeClass("alarmlow")
                        .addClass("alarmhigh")
                        .removeClass("alarmnorm");
            } else {
                se.comp.removeClass("alarmlow")
                        .removeClass("alarmhigh")
                        .addClass("alarmnorm");
            }
        }
        else {
            se.comp.addClass("alarmnorm");
        }
    };

    return OpenData;
})();
