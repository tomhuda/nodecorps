require("./sproutcore-runtime");
var fs = require("fs");
var app = require('express').createServer();

var App = SC.Namespace.create();

App.File = SC.Object.extend({
  init: function(path, includes) {
    this.set('path', path);
    var self = this;

    fs.stat(path, function(err, result) { self.set('stat', result); });
    fs.readFile(path, "UTF-8", function(err, result) { self.set('body', result); });
    fs.realpath(path, function(err, result) { self.set('realpath', result); });
  },

  isLoaded: function() {
    return this.get('stat') && this.get('body') && this.get('realpath');
  }.property('stat', 'body', 'realpath'),

  json: function() {
    var loaded = this.get('isLoaded');

    if (loaded) {
      return JSON.stringify({
        stat: this.get('stat'),
        body: this.get('body'),
        realpath: this.get('realpath')
      })
    }
  }.property('isLoaded').cacheable()
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

app.get("/file/:path", function(req, res) {
  new App.FileJSON(req.params.path, function(json) { res.send(json); });
});

app.listen(3000);
