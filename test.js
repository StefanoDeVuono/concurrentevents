const test = require('tape'),
      td = require('testdouble'),
      EventEmitter = require('events');

test('interval fires twice', assert => {
  const emitterInterval = new EventEmitter(),
        acknowledgement = td.function('.acknowledgement');

  emitterInterval.on('interval', acknowledgement);
  emitterInterval.emit('interval');
  emitterInterval.emit('interval');
  td.verify(acknowledgement(), {times: 2});
  assert.pass('called twice');
  assert.end();
})

test('once-twice pattern: ready fires once then interval starts firing', assert => {
  const emitterReady = new EventEmitter(),
        emitterInterval = new EventEmitter(),
        acknowledgement = td.function('.acknowledgement');

  let ready = false;

  emitterReady.once('ready', ()=>{
    ready = true;
  });

  emitterInterval.on('interval', ()=>{
    if (ready){
      acknowledgement()
    } else {
      emitterReady.once('ready', ()=>{
        ready = true;
      });
    }
  });

  assert.readyThenIntervals(emitterReady, emitterInterval, acknowledgement)
});


test('once-twice pattern: interval starts firing then ready fires once', assert => {
  const emitterReady = new EventEmitter(),
        emitterInterval = new EventEmitter(),
        acknowledgement = td.function('.acknowledgement');

  let ready = false;

  emitterReady.once('ready', ()=>{
    ready = true;
  });

  emitterInterval.on('interval', ()=>{
    if (ready){
      acknowledgement()
    } else {
      emitterReady.once('ready', ()=>{
        ready = true;
        acknowledgement()
      });
    }
  });

  assert.intervalsThenReady(emitterReady, emitterInterval, acknowledgement);
});


test('once-twice pattern: both interval and ready start firing at the same time', assert => {
  const emitterReady = new EventEmitter(),
        emitterInterval = new EventEmitter(),
        acknowledgement = td.function('.acknowledgement');

  let ready = false;

  emitterReady.once('ready', ()=>{
    ready = true;
  });

  emitterInterval.on('interval', ()=>{
    if (ready){
      acknowledgement()
    } else {
      emitterReady.once('ready', ()=>{
        ready = true;
        acknowledgement()
      });
    }
  });

  assert.bothAtTheSameTime(emitterReady, emitterInterval, acknowledgement);
});

test('promises: ready fires once then interval starts firing', assert => {
  const emitterReady = new EventEmitter(),
        emitterInterval = new EventEmitter(),
        acknowledgement = td.function('.acknowledgement');

  const readyPromise = new Promise( (resolve, reject) => {
    emitterReady.once('ready', ()=>{
      resolve()
    });
  });
  const intervalPromise = new Promise( (resolve, reject) => {
    emitterInterval.once('interval', ()=>{
      resolve();
    });
  });
  Promise.all([readyPromise, intervalPromise]).then( _values => {
    acknowledgement();
    emitterInterval.on('interval', acknowledgement);
  });

  assert.readyThenIntervals(emitterReady, emitterInterval, acknowledgement);
});

test('promises: interval starts firing then ready fires once', assert => {
  const emitterReady = new EventEmitter(),
        emitterInterval = new EventEmitter(),
        acknowledgement = td.function('.acknowledgement');

  const readyPromise = new Promise( (resolve, reject) => {
    emitterReady.once('ready', ()=>{
      resolve()
    });
  });
  const intervalPromise = new Promise( (resolve, reject) => {
    emitterInterval.once('interval', ()=>{
      resolve();
    });
  });
  Promise.all([readyPromise, intervalPromise]).then( _values => {
    acknowledgement();
    emitterInterval.on('interval', acknowledgement);
  })

  assert.intervalsThenReady(emitterReady, emitterInterval, acknowledgement);
});

test('promises: both interval and ready start firing at the same time', assert => {
  const emitterReady = new EventEmitter(),
        emitterInterval = new EventEmitter(),
        acknowledgement = td.function('.acknowledgement');

  const readyPromise = new Promise( (resolve, reject) => {
    emitterReady.once('ready', ()=>{
      resolve()
    });
  });
  const intervalPromise = new Promise( (resolve, reject) => {
    emitterInterval.once('interval', ()=>{
      resolve();
    });
  });
  Promise.all([readyPromise, intervalPromise]).then( _values => {
    acknowledgement();
    emitterInterval.on('interval', acknowledgement);
  })

  assert.bothAtTheSameTime(emitterReady, emitterInterval, acknowledgement);
});

test('async await: ready fires once then interval starts firing', assert => {
  const emitterReady = new EventEmitter(),
        emitterInterval = new EventEmitter(),
        acknowledgement = td.function('.acknowledgement');

  const readyPromise = new Promise( resolve => {
    emitterReady.once('ready', ()=>{
      resolve(true)
    });
  });

  const intervalPromise = new Promise( resolve => {
    emitterInterval.once('interval', ()=>{
      resolve(true)
    });
  });

  (async ()=>{
    const ready = await readyPromise;
    const interval = await intervalPromise;
    if (ready && interval) {
      acknowledgement();
      emitterInterval.on('interval', acknowledgement);
    }
  })();

  assert.readyThenIntervals(emitterReady, emitterInterval, acknowledgement);
});

test('async await: interval starts firing then ready fires once', assert => {
  const emitterReady = new EventEmitter(),
        emitterInterval = new EventEmitter(),
        acknowledgement = td.function('.acknowledgement');

  const readyPromise = new Promise( resolve => {
    emitterReady.once('ready', () => resolve(true) );
  });

  const intervalPromise = new Promise( resolve => {
    emitterInterval.once('interval', () => resolve(true) );
  });

  (async ()=>{
    const [ready, interval] = [await readyPromise, await intervalPromise];
    if (ready && interval) {
      acknowledgement();
      emitterInterval.on('interval', acknowledgement);
    }
  })();

  assert.intervalsThenReady(emitterReady, emitterInterval, acknowledgement);
});

test('async await: both interval and ready start firing at the same time', assert => {
  const emitterReady = new EventEmitter(),
        emitterInterval = new EventEmitter(),
        acknowledgement = td.function('.acknowledgement');

  const readyPromise = new Promise( resolve => {
    emitterReady.once('ready', () => resolve(true) );
  });

  const intervalPromise = new Promise( resolve => {
    emitterInterval.once('interval', () => resolve(true) );
  });

  (async ()=>{
    const [ready, interval] = [await readyPromise, await intervalPromise];
    if (ready && interval) {
      acknowledgement();
      emitterInterval.on('interval', acknowledgement);
    }
  })();

  assert.bothAtTheSameTime(emitterReady, emitterInterval, acknowledgement);
});


test.Test.prototype.readyThenIntervals = function(emitterReady, emitterInterval, ver){
  setTimeout(()=>{
    emitterReady.emit('ready');
  }, 50);
  setInterval(()=>{
    emitterInterval.emit('interval');
  }, 100);

  setTimeout(()=>{
    td.verify(ver(), {times: 4});
    this.pass('called four times');
    this.end();
  }, 421);
};

test.Test.prototype.intervalsThenReady = function(emitterReady, emitterInterval, ver){
  setTimeout(()=>{
    emitterReady.emit('ready');
  }, 150);
  setInterval(()=>{
    emitterInterval.emit('interval');
  }, 100);

  setTimeout(()=>{
    td.verify(ver(), {times: 4});
    this.pass('called four times');
    this.end();
  }, 421);
};

test.Test.prototype.bothAtTheSameTime = function(emitterReady, emitterInterval, ver){
  setTimeout(()=>{
    emitterReady.emit('ready');
  }, 100);
  setInterval(()=>{
    emitterInterval.emit('interval');
  }, 100);

  setTimeout(()=>{
    td.verify(ver(), {times: 4});
    this.pass('called four times');
    this.end();
  }, 421);
};
