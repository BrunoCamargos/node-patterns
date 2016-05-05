var request = require('request');
var fs = require('fs');
var mkdirp = require('mkdirp');
var path = require('path');
var utilities = require('./utilities');

function spider(url, nesting, callback) {
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

  console.log('--------------------------');
  console.log('nesting: ' + nesting + ' - url: ' + currentUrl);
  console.log('links: ', links);

  function iterator(link, done) {
    console.log('iterator');
    spider(link, nesting - 1, function(err) {
      if (err) {
        return callback(err);
      }

      done();
    });
  }

  try {
    iterateSeries(links, iterator, callback);
  } catch (e) {
    console.log(e);
  }
}

function iterateSeries(collection, iterator, callback) {
  console.log('iterateSeries');

  function iterate(index) {
    if (index === collection.length) {
      return finish();
    }

    var item = collection[index];
    console.log(item);
    iterator(item, function(err) {
      // if (err) {
      //   return callback(err);
      // }

      iterate(index + 1);
    });

  }

  function finish() {
    callback();
  }

  iterate(0);
}

/*function iterateTasks(tasks, callback) {
  function iterate(index) {
    if (index === tasks.length) {
      return finish();
    }

    var task = tasks[index];
    task(function() {
      iterate(index + 1);
    });
  }

  function finish() {
    callback();
  }

  iterate(0);
}*/

spider(process.argv[2], 2, function(err, filename) {
  if (err) {
    console.log(err);
  } else {
    console.log('Download complete');
  }
});