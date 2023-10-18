// require( 'dotenv' ).config();
// MODIFIED (Wed, 27 Sep 2023 13:28:23 +0900)
require('asynchronous-context/settings').filenameOfSettings( 'ws-backend-respapi-test-context-factory.settings.json' );
require('asynchronous-context/env').config();

const { createSimpleSemaphore } = require('asynchronous-context-rpc/simple-semaphore');

Object.assign( require('util').inspect.defaultOptions, {
  depth  : null,
  colors : false,
  showHidden : false,
  maxStringLength : Infinity,
  // compact: false,
  // breakLength: 1000,
});

const assert = require( 'node:assert/strict' );
const { test, describe, it, before, after }  = require( 'node:test' );
const { spawn } = require( 'node:child_process' );
const { WebSocket } = require( 'ws' );

let testService = null;

const sleep = (t)=>(new Promise((resolve,reject)=>{
  setTimeout(resolve,t);
}));

let service = null;

const host_object = {
  foo: {
    bar : {
      hello : function( a,b ) {
      },
    },
  },
};

const filter = (v, allowed_fields =[ 'reason','status_code'])=>({
  ...v,
  value :
    Object.fromEntries(
      Object
        .entries(v.value)
        .filter( ([k,v])=>allowed_fields.includes(k)))
});

describe( 'http-middleware-test', async ()=>{
  await before( async ()=>{
    console.warn('BEFORE');
    try {
      service = spawn( 'start-ws-service', {
        // detached:true,
        shell:false,
        env: Object.assign({},process.env,{})
      });
      service.stdout.on('data', (data)=>{
        console.log( data.toString().trim().replaceAll( /^/gm, 'stdout >> ' ) );
      });
      service.stderr.on('data', (data)=>{
        console.log( data.toString().trim().replaceAll( /^/gm, 'stderr >> ' ) );
      });
    } catch (e) {
      console.error(e);
    }

    await sleep( 1000 );
    console.error( 'BEFORE', service != null );
    await sleep( 1000 );
  });

  await after(  async ()=>{
    console.warn('AFTER');
    try{
      service.kill();
      service.unref();
      console.error( 'DISCONNECTED', service.pid );
    } catch(e){
      console.error(e);
    }
    await sleep( 1000 );
  });

  await it( 'as no.1' , async()=>{
    let resolve = createSimpleSemaphore();
    let reject  = createSimpleSemaphore();

    const ws = new WebSocket( 'ws://localhost:3953/foo' );

    ws.on('error', (...args)=>{
      console.error('error!', ...args );
      reject('foo');
    });

    ws.on('open', function open() {
      setTimeout(()=>{
        ws.send( JSON.stringify({
          command_type : "invoke",
          command_value : {
            method_path : [ 'ws_hello_world', ],
            method_args : [ 1, 2, 3 ],
          },
        }));
      },5000);
    });

    ws.on( 'message', function message(__data) {
      const data = JSON.parse( __data.toString() );
      console.log( 'received a message', data );

      if ( data.message === 'shutdown immediately' ) {
        console.log( data );
        console.log( 'okay,sir' );
        ws.close();
        resolve( 'okay,sir' );
      }
    });

    console.log(
      await new Promise((__resolve,__reject)=>{
        resolve.set( __resolve );
        reject .set( __reject  );
      })
    );
  });
});

