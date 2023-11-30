import { AsyncContext }      from  'asynchronous-context' ;
import { set_typesafe_tags } from  'runtime-typesafety' ;
import { middleware, METHOD_POST } from  'asynchronous-context-rpc/http-middleware' ;

/*
 * duplicated on
 * (Fri, 16 Jun 2023 11:35:26 +0900)
 */

function p(o) {
  return set_typesafe_tags( o, METHOD_POST );
}
function q(o) {
  return o;
}

class Hello extends AsyncContext {
  hello = p({
    world : p({
      foo : p({
        bar : p({
          baz : p(async function baz() {
            return 'hello world foo bar baz !!!!!!!';
          }),
        }),
      }),
    }),
  });

  hello2 = p({
    world : p({
      foo : p({
        bar : q({
          baz : p(async function baz() {
            return 'hello world foo bar baz !!!!!!!';
          }),
        }),
      }),
    }),
  });

  hello3 = p({
    world : p({
      foo : p({
        bar : q({
          baz : p(async function baz() {
            throw new Error( 'hello world foo bar baz !!!!!!!');
          }),
        }),
      }),
    }),
  });
}

Hello.defineMethod(
  async function ws_hello_world() {
    setTimeout( ()=>{
      this.send_ws_message({
        message : 'shutdown immediately',
      });
    },500);
    return 'hello world !!';
  },
  METHOD_POST,
  {
    unprotected_output : true,
  }
);

Hello.defineMethod(
  async function hello_world() {
    return 'hello world !!';
  },
  METHOD_POST,
  {
    unprotected_output : true,
  }
);

async function multiple(...args) {
  return [ ... args ];
}
Hello.defineMethod( multiple, METHOD_POST,{
  unprotected_output : true,
});



Hello.defineMethod(
  async function throw_hello_world() {
    throw new Error( 'hello world !!');
  },
  METHOD_POST,
  {
    unprotected_output : true,
  }
);



function createContext() {
  return Hello.create();
}

module.exports.createContext = createContext;

