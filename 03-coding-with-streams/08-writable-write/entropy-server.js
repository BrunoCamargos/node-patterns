var chance = require('chance').Chance();
require('http').createServer(function(req, res) {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  var counter = 1;
  while (counter < 500) {
    res.write(chance.paragraph() + '\n-------------------\n');
    counter++;
  }

  res.end('\nThe end...\n');
  res.on('finish', function() {
    console.log('All data was sent');
  });

}).listen(8080, function() {
  console.log('Listening on port 8080');
});