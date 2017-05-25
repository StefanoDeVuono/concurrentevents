So imagine we have a series of two events that occur and they may occur in any order A then B or B then A. A practical example of this is a proxy service that receives incoming connections that it forwards to a server. The incoming connections will emit packets and the outgoing connection will emit a ready event.

Let's say the incoming connection gives 4 packets and the outgoing connection is ready once. Once the outgoing connection is ready, we want to forward it all 4 packets. If we wait for the packets without waiting for the ready, we may send a packet to a service that can't accept it incur an error. If we wait for ready and then start sending packets, we might miss a packet available before ready.


Ready fires first:

    Ready     --*fires*----------
    Interval  ----------*fires*----------*fires*----------*fires*----------*fires*--


Interval fires first:

    Ready     ----------*fires*----------
    Interval  --*fires*----------*fires*----------*fires*----------*fires*--

Both start firing at the same time:

    Ready     --*fires*----------
    Interval  --*fires*----------*fires*----------*fires*----------*fires*--


The following is a series of patterns to forward all four packets once the outgoing connection is ready.

I've set this up  as a series of tests with `acknowledgement` as the function that forwards the packets.

We have an emitter pattern:

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

This sets ready to false, listens once for the ready event, listens continually for the interval event, and as the interval fires, it checks if ready is true then sends `acknowledgement`. If ready is not true, it listens *once* again for ready and is prepared to set ready to true again *and* send `acknowledgement` to make sure this instance of the interval is acknowledged (or this packet is sent).

We have a promise pattern:

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
    Promise.all([readyPromise, intervalPromise]).then( values => {
      acknowledgement();
      emitterInterval.on('interval', acknowledgement);
    })

This one promisifies listening once for ready and once for the first interval. When both promises are satisfied, we send `acknowledgement` and start to listen continually for interval events.

Next, we have an async-await variation:

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

This one promisifies again and creates an asynchronous immediately-invoked function expression that awaits both promises. When they are both true it sends the acknowledgement and then starts to continually listen for interval events.
