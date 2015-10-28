# status-board
A simple system status board in pure HTML5 so it can be deployed on any webserver.

An example is my live status board http://status.area51.onl which is actually hosted on Amazon S3:

![Example status board](/example.png)

## How it works
It works by reading config json from the host server which defines:
1. List of data sources
2. List of panels

The sources is simple - it consists of a url that the ajax will call to retrieve the current status in json and the type of that source.

The panels consists of an array of panel definitions. Those definitions contains details of the name, optional headers for those panels and the source to use for each one. Whenever the source is updated it will then update every panel that references that source.

## Plugins
It's easy to add a new source type. Simply look at opendata.js for an example which supports the RateMonitor/RateStatics classes within https://github.com/peter-mount/opendata

To add a new type create a new .js file based on opendata.js and add it to index.html. As long as the type name is unique it will get used.
