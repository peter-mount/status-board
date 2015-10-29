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
                var d = tmp[s.name][se.name] = {
                    comp: Feed.value(c, se.title + "," + se.desc),
                    conf: se
                };
                tmplast.push(d);
                Feed.showGraph(d.comp, showGraph, d);
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

    var showGraph = function (c, d) {
        var g = $('#graph').empty();

        // Calculate the Y scale so max value fits. No need to check -ve values as we dont use them
        var ys = 0;
        $.each(d.v.values, function (i, e) {
            ys = e > ys ? e : ys;
        });
        if (ys < 1)
            return false;
        ys = 100 / ys;

        // Calculate X scale - 1:1 for <200
        var xs, x, xaxis = d.conf.axis ? d.conf.axis.x : null;
        if (xaxis && xaxis.max)
            xs = 200 / xaxis.max;
        else
            xs = d.v.values.length < 200 ? 1 : 200 / d.v.values.length;
        x = 200 - (d.v.values.length * xs);

        // X axis label
        var t;
        if (d.conf.title && d.conf.desc)
            t = d.conf.title + ' - ' + d.conf.desc;
        else if (d.conf.title)
            t = d.conf.title;
        else if (d.conf.axis && xaxis && xaxis.label)
            t = xaxis.label;
        if (t)
            g.append(Feed.newSVG('text', {x: 100, y: 115}).append(t));

        // X axis
        g.append(Feed.newSVG('path', {'d': 'M0,100L200,100'}));

        if (xaxis && xaxis.max) {
            var k;

            // tick - minor tick
            if (xaxis.tick) {
                for (var i = 0, j = 0; i < xaxis.max; i += xaxis.tick, j += xs * xaxis.tick)
                    k = (k ? k : '') + 'M' + j + ',100l0,2';
            }

            // tic2k - major tick
            if (xaxis.tick2) {
                for (var i = 0, j = 0; i < xaxis.max; i += xaxis.tick2, j += xs * xaxis.tick2)
                    k = (k ? k : '') + 'M' + j + ',100l0,5';
            }

            if (k)
                g.append(Feed.newSVG('path', {'d': k}));
        }

        // Now the graph
        var p;
        $.each(d.v.values, function (i, e) {
            p = (p ? p + 'L' : 'M') + x + ',' + (100 - (e * ys));
            x += xs;
        });
        g.append(Feed.newSVG('path', {'d': p}));

        return true;
    };

    var setValue = function (se, v) {
        se.v = v;
        if (v.current) {
            se.comp.empty().append(v.current);
            setAlarm(se, v);
        } else {
            se.last = null;
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
