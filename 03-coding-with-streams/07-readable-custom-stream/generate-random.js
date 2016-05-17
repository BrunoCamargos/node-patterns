var RandomStream = require('./random-stream');
var randomStream = new RandomStream();

randomStream.on('readable', function() {
  var chunk;
  while ((chunk = randomStream.read()) !== null) {
    console.log("# Chunk received: " + chunk.toString());
  }
});