module.exports = (function() {

  function internalQueue(worker, concurrency) {
    if (concurrency == null) {
      concurrency = 1;
    } else if (concurrency === 0) {
      throw new Error('Concurrency must not be zero');
    }

    function insert(q, data, doneTaskCallback) {
      var item = {
        data: data,
        done: doneTaskCallback
      };

      q.tasks.push(item);

      setImmediate(q.process);
    }

    function next(q, task) {
      console.log('next - q: ', q, ' task: ', task);
      running--;
      task.done();
      q.process();
    }

    /*function next(q, task) {
      console.log('next - q: ', q, ' task: ', task);
      return function() {
        running--;

        var args = arguments;
        console.log('function inside next args: ', args);
        console.log('----------------------------------: ');
        task.callback.apply(task, args);

        q.process();
      };
    }

    function only_once(fn) {
      console.log('only_once - fn: ', fn);
      return function() {
        if (fn === null) {
          throw new Error("Callback was already called.");
        }

        console.log('function inside only_once - arguments: ', arguments, ' fn: ', fn);
        fn.apply(this, arguments);
        fn = null;
      };
    }*/

    var running = 0;
    var q = {
      tasks: [],
      concurrency: concurrency,
      push: function(data, doneTaskCallback) {
        insert(q, data, doneTaskCallback);
      },
      process: function() {
        while (running < q.concurrency && q.tasks.length) {
          var task = q.tasks.shift();

          // var cb = only_once(next(q, task));
          // worker(task.data, cb);

          console.log('process task.data: ', task.data);
          worker(task.data, function(err) {
            if (err) {
              return task.done(err);
            }

            next(q, task);
          });

          running++;
        }
      }
    };

    return q;
  }

  function queue(worker, concurrency) {
    var q = internalQueue(function(taskData, cb) {
      console.log('queue - callback from internalQueue, taksData: ', taskData);
      worker(taskData, cb);
    }, concurrency);

    return q;
  }

  return {
    queue: queue
  }
})()

/*module.exports = (function() {

  function queue(iterator, concurrency) {
    function TaskQueue(iterator, concurrency) {
      this.iterator = iterator;
      this.concurrency = concurrency;
      this.queue = [];
      this.running = 0;
    }

    TaskQueue.prototype.push = function(taskData, done) {
      this.queue.push(this.iterator);
      var self = this;
      while (this.running < this.concurrency && this.queue.length) {
        var task = this.queue.shift();

        task(taskData, function(err) {
          self.running--;
          console.log('self.running', self.running);

          process.nextTick(function() {
            done(err);
          });
        });

        this.running++;
        console.log('this.running: ', this.running);
      }
    }

    return new TaskQueue(iterator, concurrency);
  }

  return {
    queue: queue
  }
})()*/
/*module.exports = (function() {
  function queue(iterator, concurrency) {
    var taskQueue = [];

    function push(taskData, done) {
      var running = 0;

      taskQueue.push(iterator);

      function next() {
        while (running < concurrency && taskQueue.length) {
          var task = taskQueue.shift();
          task(taskData, function(err) {
            running--;
            console.log('running', running);

            process.nextTick(function() {
              done(err);
            });
          });

          running++
          console.log('running: ', running);
        }
      }
      next();
    }

    return {
      push: push
    };
  }

  return {
    queue: queue
  }
})()*/

/*module.exports = (function() {
  function queue(iterator, concurrency) {

    return (function(iterator, concurrency) {
      var taskQueue = [];

      function push(taskData, done) {
        var running = 0;
        // iterator = iterator1;

        taskQueue.push(iterator);

        function next() {
          while (running < concurrency && taskQueue.length) {
            var task = taskQueue.shift();
            task(taskData, function(err) {
              running--;
              console.log('running', running);

              process.nextTick(function() {
                done(err);
              });
            });

            running++
            console.log('running: ', running);
          }
        }
        next();
      }

      return {
        push: push
      };

    })(iterator, concurrency);
  }

  return {
    queue: queue
  }
})()*/