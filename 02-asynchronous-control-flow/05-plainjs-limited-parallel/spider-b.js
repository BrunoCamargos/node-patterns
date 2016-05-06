var request = require('request');
var fs = require('fs');
var mkdirp = require('mkdirp');
var path = require('path');
var utilities = require('./utilities');
var downloaded = 0;
var spidered = 0;

var spidering = {}; // race condition
function spider(url, nesting, callback) {
  // console.log('%%%%%%%%%%%%%%% ', nesting);
  if (spidering[url]) {
    // console.log('race condition ---------------------------')
    return process.nextTick(callback);
  }

  spidering[url] = true;

  console.log('spidered : ', ++spidered);
  var filename = utilities.urlToFilename(url);
  fs.readFile(filename, 'utf8', function(err, body) {
    if (err) {
      if (err.code !== 'ENOENT') // 'ENOENT' Erro quando não encontra o arquivo 
      {
        return callback(err);
      }

      return download(url, filename, function(err, body) {
        if (err) {
          return callback(err);
        }

        spiderLinks(url, body, nesting, callback);
      });
    }

    spiderLinks(url, body, nesting, callback);
  });
}

function download(url, filename, callback) {
  // console.log('Downloading ' + url);
  request(url, function(err, response, body) {
    if (err) {
      return callback(err);
    }
    saveFile(filename, body, function(err) {
      console.log('Downloaded and saved: ' + url);
      downloaded++;
      console.log('downloaded: ', downloaded, err);
      if (err) {
        return callback(err);
      }
      callback(null, body);
    });
  });
}

function saveFile(filename, contents, callback) {
  mkdirp(path.dirname(filename), function(err) {
    if (err) {
      return callback(err);
    }
    fs.writeFile(filename, contents, callback);
  });
}

function spiderLinks(currentUrl, body, nesting, callback) {
  console.log('nesting: ' + nesting + ' - url: ' + currentUrl);
  if (nesting === 0) {
    return process.nextTick(callback);
  }

  var links = utilities.getPageLinks(currentUrl, body);
  if (links.length === 0) {
    return process.nextTick(callback);
  }

  console.log('current url ', currentUrl, ' links: ', links.length);
  // console.log('links: ', links.length);

  var running = 0,
    completed = 0,
    started = 0,
    errored = false,
    concurrency = 10;

  function next(err) {
    running--;
    completed++

    if (err) {
      errored = true;
      return process.nextTick(function() {
        callback(err)
      });
    }

    if (completed === links.length && !errored) {
      // callback(); // or not return 
      return process.nextTick(callback);
    } else {
      process.nextTick(queue);
    }
  }

  function queue() {
    while (running < concurrency && started < links.length) {
      running++;
      console.log('running ', running);
      spider(links[started++], nesting - 1, next);
    }

  }
  queue();


  /*function iterator(link, done) {
    spider(link, nesting - 1, function(err) {
      if (err) {
        console.log(err);
      }
      done(err);
    });
  }

  limitedParallel(links, 10, iterator, callback);*/
}

/*function limitedParallel(collection, concurrency, iterator, callback) {
  // console.log('concurrency: ', concurrency);

  var running = 0,
    completed = 0,
    errored = false,
    index = 0;

  function next() {
    // console.log('index: ', index, 'links: ', collection.length);
    while (running < concurrency && index < collection.length) {
      var item = collection[index++];
      // console.log('inspecting: ', item);

      iterator(item, function(err) {
        if (err) {
          console.log('+++++++++++++++++++++++++++++++++++++++++++');
          errored = true;
          return finish(err);
        }
        if (completed === collection.length && !errored) {
          return finish();
        }

        completed++, running--;
        // console.log('running', running, 'completed: ', completed);
        next();
      });

      running++
      // console.log('running: ', running);
    }
  }
  next();

  function finish(err) {
    return callback(err);
  }
}*/
process.on('uncaughtException', (err) => {
  console.log(`Caught exception: ${err}`);
});
try {
  spider(process.argv[2], 2, function(err, filename) {
    if (err) {
      console.log(err);
    } else {
      console.log('Download complete');
    }
  });
} catch (e) {
  console.log(e);
}