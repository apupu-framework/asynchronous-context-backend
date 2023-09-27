
// require( 'dotenv' ).config();
// MODIFIED (Wed, 27 Sep 2023 13:28:23 +0900)
require('asynchronous-context/env').config();

const assert = require( 'node:assert/strict' );
const { test, describe, it, before, after }  = require( 'node:test' );

const is_remote = true;
function createContext() {
  if ( is_remote ) {
    return require( './http-callapi-context-factory' ).createContext({
      http_server_url           : 'http://localhost:2003/api/',
      http_authentication_token : 'hello_authentication_token',
    });
  } else {
    return require( 'asynchronous-context-backend/http-middleware-test-context-factory' ).createContext();
  }
}


describe( '', ()=>{
  it('as test1', async()=>{
    debugger;
    const context = createContext();
    assert.equal( await ( context.hello_world( 'hello world !!' ) ) , 'hello world !!' );
  });

  it('as test2', async()=>{
    const context = createContext();
    await (context.hello.world.foo.bar.baz('hello world'));
  });

  it('as test3', async()=>{
    await assert.rejects((async()=>{
      try {
        const context = createContext();
        await (context.hello2.world.foo.bar.baz({hello:'hello world'}));
      } catch ( e ) {
        console.log( 'expected exception', e );
        throw new Error( 'error', { cause : e } );
      }

    }));
  });

  it('as test4', async()=>{
    await assert.doesNotReject( async()=>{
      try {
        const context = createContext();
        const result = await context.multiple(1,2,3,4);
        assert.deepEqual( result, [1,2,3,4]);
      } catch ( e ) {
        console.error( 'unexpected exception', e );
        throw new Error( 'error', { cause : e } );
      }
    });
  });
});
