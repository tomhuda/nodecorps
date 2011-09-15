require("./sproutcore-runtime");
var fs = require("fs");
var app = require('express').createServer();
var watch = require("watch");

// use `App =` to get better debug output.
var App = SC.Namespace.create();

App.File = SC.Object.extend({
  init: function(path, includes) {
    this.set('path', path);
    var self = this;

    fs.stat(path, function(err, result) { self.set('stat', result); });
    fs.realpath(path, function(err, result) { self.set('realpath', result); });

    watch.createMonitor(path, { interval: 1 }, function(monitor) {
      monitor.on("created", function(f, stat) {
        self.set('latestFile', f);
      });
    })
  },

  isLoaded: function() {
    return this.get('stat') && this.get('realpath');
  }.property('stat', 'realpath'),

  json: function() {
    var loaded = this.get('isLoaded');

    if (loaded) {
      return JSON.stringify({
        stat: this.get('stat'),
        realpath: this.get('realpath'),
        latestFile: this.get('latestFile') || null
      })
    }
  }.property('isLoaded', 'latestFile').cacheable()
});

App.JSONP = SC.Object.extend({
  upstreamJSONBinding: 'content.json',

  json: function() {
    var json = this.get('upstreamJSON');

    if (json) {
      return "callback(" + json + ")";
    }
  }.property('upstreamJSON').cacheable()
});

App.FileJSON = SC.Object.extend({
  init: function(path, callback) {
    var file = new App.File("./" + path);
    file = App.JSONP.create({ content: file });

    this.set('file', file);
    this.callback = callback;
  },

  jsonBinding: 'file.json',

  jsonDidChange: function() {
    var json = this.get('json');
    if (json) { this.callback(json); }
  }.observes('json'),
});

var app = require('express').createServer(),
    io = require('socket.io').listen(app);

/**
 * Serve files
 */
app.listen(9292);

app.get('/', function(req, res) {
  res.sendfile(__dirname + "/index.html");
});


app.get('*', function(req, res) {
  res.sendfile(__dirname + req.params[0]);
});

/**
 * Socket I/O
 */
var appFile = new App.FileJSON("images", function(json) {
  console.log(json);
  io.sockets.emit('input', json);
});

io.sockets.on('connection', function(socket) {
  socket.emit('input', appFile.get('json'));
});
