/* 
 * Area51 Status Page
 */

var Feed = (function () {

    function Feed(body, v) {
        this.config = v;

        this.comp = $('<div></div>')
                .appendTo(body)
                .attr('id', v.id)
                .attr('class', "feed " + v.class)
                .css(v.css);

        var x = $("<div></div>")
                .appendTo(this.comp)
                .append(v.title)
                .attr("title", v.desc)
                .attr("alt", v.desc)
                .addClass('feedtitle');

        this.body = $('<div></div>')
                .appendTo(this.comp)
                .addClass('feedbody');

        switch (v.type) {
            case "opendata":
                initOpenData(this, v);
                break;

            default:
                $("<div></div>")
                        .attr('class', 'failure')
                        .append("Unsupported type " + v.type)
                        .appendTo(this.comp);
        }
    }

    var component = function (body, n, d) {
        var div = $('<div></div>')
                .addClass('stat')
                .appendTo(body)
                .append($('<span></span>')
                        .addClass("statname")
                        .attr("title", d)
                        .append(n)
                        )
                .append($('<span></span>')
                        .addClass("statval")
                        .attr("title", "Current value")
                        .append('N/A')
                        )
                .append($('<span></span>')
                        .addClass("statalarm")
                        .attr("title", "Alarm Status")
                        .append('')
                        );

        return div;
    };

    /**
     * Initialise the open data type of feed
     * @param {type} v
     * @returns {undefined}
     */
    var initOpenData = function (feed, v)
    {
        var stats = this.stats = {};
        $.each(v.status, function (i, c) {
            c.comp = component(feed.body, c.name, c.desc);
            stats[c.name] = c;
            feed.comp.css('height', (i+3.5)+'em');
        });

        console.log(this.stats);
    }

    return Feed;
})();

var Status = (function () {
    function Status() {

    }

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
        var tmp = {};
        $.each(v.sources,function(i,c){
            tmp[c.name]=c;
        });
        console.log(tmp);
        this.sources=tmp;
        
        // Now the panels
        tmp={};
        $.each(v.panels, function (i, c) {
            var feed = new Feed(body, c);
            tmp[c.id] = feed;
        });
        console.log(tmp);
        this.feeds = tmp;
        
    };

    return Status;
})();

$(document).ready(function () {
    Status.start();
});
