var socket = io.connect('http://localhost');

function callback(data) {
  $("#main").html("<p>REAL PATH: " + data.realpath + "</p><p>MTIME: " + data.stat.mtime + "</p>");

  if (data.latestFile) {
    $("#main").append("<img src='" + data.latestFile + "'>");
  }
}

socket.on('input', function (data) {
  eval(data);
});

