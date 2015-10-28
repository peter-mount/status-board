/* 
 * Area51 Status Page
 */

var Feed = (function () {

    Feed.types = {};

    function Feed(container, v) {
        this.config = v;

        this.comp = $('<div></div>')
                .appendTo(container)
                .attr('id', v.id)
                .attr('class', v.class ? "feed " + v.class : "feed")
        if (v.css)
            this.comp.css(v.css);

        var x = $("<div></div>")
                .appendTo(this.comp)
                .append(v.title)
                .addClass('feedtitle');
        if (v.desc)
            x.attr("title", v.desc);

        var body = this.body = $('<div></div>')
                .appendTo(this.comp)
                .addClass('feedbody');

        // Lookup the source & type of feed
        if (v.source) {
            this.source = Status.sources[v.source];
            if (typeof this.source === 'undefined') {
                $("<div></div>")
                        .attr('class', 'failure')
                        .append("Undefined source " + v.source)
                        .appendTo(this.comp);
            } else {
                var type = Feed.types[this.source.type];
                if (typeof type === 'undefined') {
                    $("<div></div>")
                            .attr('class', 'failure')
                            .append("Unsupported type " + v.type)
                            .appendTo(this.comp);
                } else {
                    this.type = new type(this, body, v);
                    this.source.feeds.push(this);
                }
            }
        }
    }

    Feed.header = function (feed, body, i, name) {
        return Feed.component(feed, body, i, name)
                .removeClass("alarmlow")
                .addClass("stathead");
    }

    Feed.component = function (feed, body, i, name, desc) {
        feed.comp.css('height', ((i * 1.25) + 3.5) + 'em');
        var comp = $('<div></div>')
                .addClass('stat')
                .appendTo(body);
        var n = $('<span></span>')
                .addClass("statname")
                .append(name)
                .appendTo(comp);
        if (desc)
            n.attr("title", desc);
        return comp;
    };

    Feed.value = function (c, t) {
        var value = $('<span></span>')
                .addClass("statval")
                .append('0')
                .appendTo(c);
        if (t)
        {
            value.attr("title", t);
        }
        return value;
    };

    return Feed;
})();

var Status = (function () {

    function Status() {

    }

    Status.sources = {};

    Status.start = function () {
        var fail = function () {
            $('#status').empty().append("<h1>Unable to retrieve config</h1><p>Please refresh</p>");
        };
        $.ajax({
            url: 'config.json',
            type: 'GET',
            dataType: 'json',
            async: true,
            statusCode: {
                200: Status.init,
                404: fail,
                500: fail
            }
        });
    };

    Status.init = function (v) {
        var body = $('#status').empty(), tmp = {};
        this.body = body;

        // The "sources" panel
        var sourcesPanel = new Feed(body, {
            name: "",
            title: "Applications",
            desc: "The monitored applications",
            heading: [
                "Application", "Status"
            ]
        });
        Feed.value(Feed.header(sourcesPanel, sourcesPanel.body, 0, 'Application'))
                .empty()
                .append('Status')
                .css('text-align', 'center');
        sourcesPanel.type = {
            comps: {},
            status: {},
            refresh: function (src, feed, v) {
                var s = feed.type.status[src.name];
                if (s) {
                    s.empty().append("OK")
                            .removeClass("alarmlow").removeClass("alarmhigh").addClass("ok");
                }
            },
            error: function (src, feed) {
                var s = feed.type.status[src.name];
                if (s) {
                    s.empty().append("Offline")
                            .removeClass("alarmlow").addClass("alarmhigh").removeClass("ok");
                }
            }
        };

        // Create sources map
        $.each(v.sources, function (i, c) {
            c.feeds = [sourcesPanel];
            var fc = sourcesPanel.type.comps[c.name] = Feed.component(sourcesPanel, sourcesPanel.body, i + 1, c.label ? c.label : c.name, c.desc ? c.desc : c.name);
            sourcesPanel.type.status[c.name] = Feed.value(fc).css('text-align', 'center');
            Status.sources[c.name] = c;
        });

        // The configured panels
        $.each(v.panels, function (i, c) {
            var feed = new Feed(body, c);
            feed.id = c.id;
            tmp[c.id] = feed;
            body.append(c.comp);
        });
        console.log(tmp);
        this.feeds = tmp;

        // Now start the feeds
        $.each(Status.sources, function (i, src) {
            src.refresh = function () {
                if (src.timer) {
                    clearInterval(src.timer);
                }
                src.timer = setTimeout(src.refresh, src.rate);

                $.ajax({
                    url: src.url,
                    type: src.method,
                    dataType: src.dataType,
                    async: true,
                    success: function (v, t) {
                        $.each(src.feeds, function (i, feed) {
                            feed.type.refresh(src, feed, v);
                        });
                    },
                    error: function (request, status, error) {
                        if (src.timer) {
                            clearInterval(src.timer);
                        }
                        console.error("Failed", src.name, status, error, "retry", src.retry);
                        src.timer = setTimeout(src.refresh, src.retry);

                        $.each(src.feeds, function (i, feed) {
                            if (feed.type.error)
                                feed.type.error(src, feed, status);
                        });
                    }
                });
            };

            src.refresh();
        });
    };

    return Status;
})();

$(document).ready(function () {
    Status.start();
});
