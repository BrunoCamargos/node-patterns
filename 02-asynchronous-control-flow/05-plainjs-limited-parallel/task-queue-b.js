module.exports = (function() {
  function next(collection, numberOfConcurrencyTasks, iterator) {
    var running = 0,
      concurrency = numberOfConcurrencyTasks,
      queue = collection;

    while (running < concurrency && queue.length) {
      var item = queue.shift();
      console.log('inspecting: ', item);

      iterator(item, function() {
        running--;
        console.log('running', running);
        next(queue, numberOfConcurrencyTasks, iterator);
      });

      running++
      console.log('running: ', running);
    }
  }

  return {
    start: next
  }

  // return function(collection, numberOfConcurrencyTasks) {
  //   concurrency = numberOfConcurrencyTasks || 5;
  //   queue = collection || [];
  //   return { start: next }
  // }
})()