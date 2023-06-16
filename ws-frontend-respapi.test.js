
require( 'dotenv' ).config();


const assert = require( 'node:assert/strict' );
const { test, describe, it, before, after }  = require( 'node:test' );
const { AsyncContext } = require( 'asynchronous-context' );
const { METHOD_POST  } = require( 'asynchronous-context-backend' );

const { create_callapi } = require( './callapi.js' );
const { websocket_callapi_handler } = require( './ws-callapi' );
const { create_websocket, await_websocket, await_sleep } = require( './ws-utils.js' );
const { set_typesafe_tags } = require( 'runtime-typesafety' );

const {
 t_handle_message,
 t_respapi_message,
 handle_on_message_of_ws_frontend,
 on_init_websocket,
} = require( './ws-frontend-respapi.js' );

function p(o) {
  return set_typesafe_tags( o, 'WEBSOCKET_METHOD' );
}

describe( async ()=>{
  const test_state = {
    __service : null,
  };

  before( async()=>{
    function p(o) {
      return set_typesafe_tags( o, 'WEBSOCKET_METHOD' );
    }
    class Hello extends AsyncContext {
      hello = p({
        world : p({
          foo : p({
            bar : p({
              baz : p(async (...args)=>{
                this.send_ws_message({
                  message : [ 'okay', ...args ],
                });
              }),
            }),
          }),
        }),
      });
    }

    Hello.defineMethod(
      async function how_are_you(a,b,c) {
        await this.frontend.fine_thank_you( a+1, b+1, c+1 );
      },
      METHOD_POST,
      'WEBSOCKET_METHOD',
      {
        unprotected_output : true,
      }
    );
    function create_context() {
      return Hello.create();
    }

    test_state.__service =
      require( './ws-backend-respapi-service.js' ).start_service_for_ws_backend({
        create_context,
        event_handlers : {},
        path : '/foo',
        ports : [3632],
      });

    await await_sleep(1000);
  });

  after(async ()=>{
    try {
      test_state.__service.shutdown();
    } catch ( e ) {
      console.error(e);
    }

    console.log('after','ZqAyat5UOs');

    // process.exit(0);
  });

  process.on('beforeExit', (code) => {
    console.log('CcvcXZMz9UE','Process beforeExit event with code: ', code);
  });
  process.on('unhandledRejection', (reason, promise) => {
    console.log('CcvcXZMz9UE','Unhandled Rejection at:', promise, 'reason:', reason);
  });
  process.on('uncaughtExceptionMonitor', (err, origin) => {
    console.log('CcvcXZMz9UE',err, origin);
  });
  process.on('uncaughtException', (err, origin) => {
    console.log('CcvcXZMz9UE',err, origin);
  });


  it('as test1',{skip:false,},async()=>{
    let flag_succeded = false;

    class Hello extends AsyncContext {
      constructor(event_handlers){
        super();
        this.event_handlers = event_handlers;
      }
    }

    Hello.defineMethod(
      async function fine_thank_you(...args) {
        console.log( 'hooray!' , ...args );
        flag_succeded = true;
        websocket.close();
        test_state.__service.shutdown();
        // await this.backend.how_are_you(...args);
      },
      'WEBSOCKET_METHOD',
      {
        unprotected_output : true,
      }
    );

    Hello.defineMethod(
      async function start() {
        await this.backend.how_are_you(1,2,3);
      },
      'WEBSOCKET_METHOD',
      {
        unprotected_output : true,
      }
    );

    const websocket = create_websocket( 'ws://localhost:3632/foo' );

    const context = Hello.create();
    context.backend = create_callapi({
      callapi_handler : websocket_callapi_handler,
      websocket,
    });

    on_init_websocket( websocket, context );
    await await_websocket( websocket );

    await context.start();
    await await_sleep( 1000 );

    assert.ok( flag_succeded, 'failed' );

    console.log( 'websocket.close()');

    try {
      console.log( 'shutdown1' );
      websocket.close();
    } catch ( e) {
      console.log(e);
    }

    try {
      console.log( 'shutdown2' );
      test_state.__service.shutdown();
    } catch ( e) {
      console.log(e);
    }

  });


//  it('as test2', async()=>{
//    const p = new Promise( async (resolve,reject)=>{
//      const { context } = await on_init_websocket();
//      const websocket = (await context.websocket() );
//      const close = ()=>websocket.close();
//
//      websocket.on( 'message', ( data )=>{
//        const v = JSON.parse( data.toString() );
//        console.log( 'hJGqsnbq5A4', v );
//        if ( v.message.join(',') === 'okay,hello,world,foo' ) {
//          resolve(v);
//        } else {
//          reject(v);
//        }
//        close();
//      });
//
//      setTimeout( ()=>{
//        reject('timeout')
//        close();
//      }, 1000 );
//
//      await (context.hello.world.foo.bar.baz( 'hello','world','foo' ));
//    });
//
//    //assert.equal( await ( context.hello_world( 'hello world !!' ) ) , 'hello world !!' );
//    return await p;
//  });

});
