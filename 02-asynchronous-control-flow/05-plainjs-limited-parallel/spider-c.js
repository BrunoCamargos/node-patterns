var request = require('request');
var fs = require('fs');
var mkdirp = require('mkdirp');
var path = require('path');
var utilities = require('./utilities');
var taskQueue = require('./task-queue-b');
var downloadCompleted = 0;
var spidered = 0;

var spidering = {}; // race condition
function spider(url, nesting, callback) {
  if (spidering[url]) {
    return process.nextTick(callback);
  }

  spidering[url] = true;

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
  console.log('Downloading ' + url);
  request(url, function(err, response, body) {
    if (err) {
      return callback(err);
    }
    saveFile(filename, body, function(err) {
      console.log('Downloaded and saved: ' + url);
      downloadCompleted++;
      console.log('downloadCompleted: ', downloadCompleted, err);
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
  if (nesting === 0) {
    return process.nextTick(callback);
  }

  var links = utilities.getPageLinks(currentUrl, body);
  if (links.length === 0) {
    return process.nextTick(callback);
  }

  console.log('nesting: ' + nesting + ' - url: ' + currentUrl);
  console.log('links: ', links);

  function iterator(link, done) {
    console.log('iterator');
    spider(link, nesting - 1, done);
  }

  try {
    limitedParallel(links, 10, iterator, callback);
  } catch (e) {
    console.log(e);
  }
}

function limitedParallel(collection, concurrency, iterator, callback) {
  console.log('concurrency: ', concurrency);
  var completed = 0,
    errored = false;

  taskQueue.start(collection, concurrency, function(link, next) {
    iterator(link, function(err) {
      if (err) {
        errored = true;
        return callback(err);
      }

      if (++completed === collection.length && !errored) {
        callback();
      } else {
        console.log('completed: ', completed);
        next();
      }

    });
  });
}

spider(process.argv[2], 2, function(err, filename) {
  if (err) {
    console.log(err);
  } else {
    console.log('Download complete');
  }
});