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
                .attr('class', "feed " + v.class)
                .css(v.css);

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

    Feed.header = function (feed, body, i, name) {
        return Feed.component(feed, body, i, name)
                .removeClass("alarmlow")
                .addClass("stathead");
    }

    Feed.component = function (feed, body, i, name, desc) {
        feed.comp.css('height', ((i * 1.25) + 3.5) + 'em');
        var comp = $('<div></div>')
                .addClass('stat')
                .addClass("alarmlow")
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
        var body = $('#status').empty()
        this.body = body;

        // Create sources map
        $.each(v.sources, function (i, c) {
            c.feeds = [];
            Status.sources[c.name] = c;
        });

        // Now the panels
        var tmp = {};
        $.each(v.panels, function (i, c) {
            var feed = new Feed(body, c);
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

                $.ajax({
                    url: src.url,
                    type: src.method,
                    dataType: src.dataType,
                    async: true,
                    statusCode: {
                        200: function (v) {
                            console.log("Next refresh", src.name, "in", src.rate);
                            src.timer = setTimeout(src.refresh, src.rate);

                            $.each(src.feeds, function (i, feed) {
                                feed.type.refresh(src, feed, v);
                            });
                        },
                        500: src.error
                    }
                });
            };

            src.error = function () {
                if (src.timer) {
                    clearInterval(src.timer);
                }
                // Show error?
                console.error("Failed", src.name, "retry", src.retry);
                src.timer = setTimeout(src.refresh, src.retry);
            };

            src.refresh();
        });
    };

    return Status;
})();

$(document).ready(function () {
    Status.start();
});
