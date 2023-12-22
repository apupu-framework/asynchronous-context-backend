
import { WebSocketServer } from 'ws' ;
import { parse } from 'url';
import { trace_validator } from 'vanilla-schema-validator' ;
import { respapi, t_respapi_message } from './respapi.mjs' ;
import { createContext  } from './ws-backend-callapi-context-factory.mjs' ;

const AUTO_CONNECTION = '__AUTO_CONNECTION__';

/*
 * function on_init_websocket( websocket, req ) {
 *    // ...
 * }
 *
 * websocket : an argument to specify a websocket instance from
 *             websocket/ws module.
 *
 * req       : an optional argument to specify request header object from
 *             the common Request object.
 *
 *             https://developer.mozilla.org/en-US/docs/Web/API/Headers
 */
function create_websocket_upgrader( on_init_websocket ) {
  const wss = new WebSocketServer({ noServer: true });
  wss.on( 'connection', ( websocket, req )=>{
    return on_init_websocket( websocket, req );
  });
  return ( request, socket, head )=>{
    wss.handleUpgrade( request, socket, head, function done(websocket) {
      wss.emit('connection', websocket, request);
    });
  };
}

export { create_websocket_upgrader as create_websocket_upgrader };


const handle_multi_path_upgrade = ( mapper, request, socket, head )=>{
  const { pathname } = parse( request.url );
  console.log( 'handle_upgrade : ', pathname );
  if ( pathname in mapper ) {
    console.log( `handle_upgrade on [${pathname}]` );
    mapper[ pathname ]( request, socket, head )
  } else {
    console.log( `failed to 'handle_upgrade' on [${pathname}]` );
    socket.destroy();
  }
};

export { handle_multi_path_upgrade };


const create_multi_path_upgrade_handler = (mapper)=>(
  function handle_upgrade( request, socket, head ) {
    return handle_multi_path_upgrade( mapper, request, socket, head );
  }
);
export {  create_multi_path_upgrade_handler as create_multi_path_upgrade_handler };


const get_authentication_token = (req)=>{
  let auth = req.get( 'Authentication' );
  if ( auth == null ) {
    return null;
  } else {
    if ( Array.isArray( auth ) ) {
      new Error( 'Invalid Authentication Token' );
    }
    auth = auth.trim();
    let ma = auth.match( /^Bearer +(.*)$/ );
    if ( ma ) {
      return ma[1].trim();
    } else {
      return null;
    }
  }
};

async function handle_event_of_ws_backend( nargs ) {
  const {
    event_name         = ((name)=>{throw new Error(`${name} is not defined`)})('event_name'),
    event_handler_name = ((name)=>{throw new Error(`${name} is not defined`)})('event_handler_name'),
    event_handlers     = {},
    context            = ((name)=>{throw new Error(`${name} is not defined`)})('context'),
    websocket          = ((name)=>{throw new Error(`${name} is not defined`)})('websocket'),
    req                = null,
  } = nargs;

  console.log('LOG','handle_event_of_ws_backend');

  /*
   * Call the specified event handler on the context object.
   */
  const respapi_result  =
    await respapi(
      /* callapi_target */
      context,

      /* callapi_method_path */
      // message.command_value.method_path,
      [event_handler_name],

      /* http-method as TAGS */
      'WEBSOCKET_EVENT_HANDLER',

      /* on_execution */
      async ( resolved_callapi_method )=>{
        /*
         * Invoking the Resolved Method
         */
        const target_method      = resolved_callapi_method.value;
        const target_method_args = [{websocket,event_name}]; // message.command_value.method_args;
        return await (context.executeTransaction( target_method, ... target_method_args ));
      },
    );

  console.log( 'handle_event_of_ws_backend : %s', respapi_result );

  /*
   * Call the specified event handler on the event handler object.
   * Note that this mechanism is currently not used.
   */
  if ( event_handler_name in event_handlers ) {
    try {
      event_handlers[event_handler_name]();
    } catch( e ){
      console.error( `WARNING ${event_handler_name} threw an error. ignored. `, e );
    }
  }
};


async function handle_message_of_ws_backend( nargs ) {
  const {
    event_handlers  = {},
    context         = ((name)=>{throw new Error('${name} is not defined')})('context'),
    websocket       = ((name)=>{throw new Error('${name} is not defined')})('websocket'),
    req             = null,
    data            = ((name)=>{throw new Error('${name} is not defined')})('data'),
  } = nargs;
  const message = JSON.parse( data.toString() );

  const info = trace_validator( t_respapi_message, message );

  if ( ! info.value ) {
    throw new Error( 'invalid message' + info.report() );
  }

  /*
   * The followign code migrated to `on_init_websocket_of_ws_backend`.
   */

  // context.send_ws_message = async function( value ) {
  //   websocket.send( JSON.stringify( value ) );
  // };

  // /*
  //  * This line is tested by `ws-backend-respapi-test.js`
  //  * See ws-frontend-respapi-test-context-factory.js
  //  * (Fri, 16 Jun 2023 14:09:54 +0900)
  //  */
  // context.frontend = createContext({
  //   websocket,
  // });




  // COPIED FROM http-middleware
  /*
   * The procedure to execute before invocation of the method.
   */
  async function context_initializer( resolved_callapi_method ) {
    this.logger.output({
      type : 'begin_of_method_invocation',
      info : {
        resolved_callapi_method
      }
    });

    console.log( 'dGNndxPMXh',  resolved_callapi_method );

    // COMMENTED OUT (Thu, 21 Dec 2023 15:27:24 +0900)
    // // 4) get the current authentication token.
    // if ( ( req ) && ( 'set_user_identity' in this ) ) {
    //   const authentication_token = get_authentication_token( req );
    //   // (Wed, 07 Sep 2022 20:13:01 +0900)
    //   await this.set_user_identity( authentication_token );
    // }
    // COMMENTED OUT (Thu, 21 Dec 2023 15:27:24 +0900)

    /*
     * These steps which are done in this block `context_initializer` should be
     * shared for the sake of maintainability. (Thu, 21 Dec 2023 15:27:24 +0900)
     */

    this.setOptions({ showReport : false, coloredReport:true });

    if ( resolved_callapi_method.tags.includes( AUTO_CONNECTION ) ) {
      console.log( 'ew6pMCEV3o', resolved_callapi_method );
      this.setOptions({ autoCommit : true });

      console.log( 'ew6pMCEV3o', this.getOptions() );
    }
  }

  console.log('AAAAAAAAAAA NO2', req.headers );

  const respapi_result  =
    await respapi(
      /* callapi_target */
      context,

      /* callapi_method_path */
      message.command_value.method_path,

      /* http-method as TAGS */
      'WEBSOCKET_METHOD',

      /* on_execution */
      async ( resolved_callapi_method )=>{

        // (Mon, 05 Jun 2023 20:07:53 +0900)
        await context_initializer.call( context, resolved_callapi_method );

        /*
         * Invoking the Resolved Method
         */
        const target_method      = resolved_callapi_method.value
        const target_method_args = message.command_value.method_args;
        return await (context.executeTransaction( target_method, ... target_method_args ));
      },
    );

  console.log( 'received No.1: %s', data );
  console.log( 'respapi_result', respapi_result );
  // console.log( 'context.hello_world', await context.hello_world() );

  return context
}

/*
 * This function is not used anymore.
 * (Thu, 14 Dec 2023 19:17:19 +0900)
 */
async function handle_on_error_of_ws_backend( nargs ) {
  const {
    event_handlers  = {},
    // context         = ((name)=>{throw new Error('${name} is not defined')})('context'),
    // websocket       = ((name)=>{throw new Error('${name} is not defined')})('websocket'),
    // req             = null,
    // data            = ((name)=>{throw new Error('${name} is not defined')})('data'),
  } = nargs;

  if ( 'on_error' in event_handlers ) {
    try {
      event_handlers.on_error( ...args );
    } catch( e ){
      console.error('WARNING on_error handler threw an error. ignored. ', e );
    }
  }
}

async function on_init_websocket_of_ws_backend( nargs ) {
  const {
    create_context = ((name)=>{ throw new Error( `${name} is not defined` ) } )('create_context'),
    event_handlers  = {} ,
    websocket       = ((name)=>{ throw new Error( `${name} is not defined` ) } )('websocket'),
    req             = ((name)=>{ throw new Error( `${name} is not defined` ) } )('websocket'),
  } = nargs;

  const context = await create_context();

  console.log( "LOG" , "on_init_websocket_of_ws_backend" );

  /*
   * Initialize the backend context object.
   *   - Set an accessor to the websocket object to the backend context object.
   *   - Set the websocket object on the backend context object.
   *   - Create a frontend context object and set it to the backend context object.
   *
   * This part migrated from the following method.
   */
  context.websocket = websocket;
  context.send_ws_message = async function( value ) {
    websocket.send( JSON.stringify( value ) );
  };
  context.frontend = createContext({
    websocket,
  });
  console.log( 'context.frontend' , context.frontend );

  /*
   * The frontend context object above was tested by `ws-backend-respapi-test.js`
   * See test/ws-frontend-respapi-test-context-factory.mjs
   * (Fri, 16 Jun 2023 14:09:54 +0900)
   */


  // websocket.on( 'open', async (data)=>(
    await handle_event_of_ws_backend(
      {
        event_name         : 'open',
        event_handler_name : 'on_open',
        event_handlers  ,
        context         ,
        websocket       ,
        req             ,
        // data            ,
      }
    )
  // ));

  websocket.on( 'close', async (data)=>(
    handle_event_of_ws_backend(
      {
        event_name         : 'close',
        event_handler_name : 'on_close',
        event_handlers  ,
        context         ,
        websocket       ,
        req             ,
        // data            ,
      }
    )
  ));

  websocket.on( 'error', async ()=>(
    handle_event_of_ws_backend(
      {
        event_name         : 'error',
        event_handler_name : 'on_error',
        event_handlers  ,
        context         ,
        websocket       ,
        req             ,
        // data            ,
      }
    )
  ));

  websocket.on( 'message', (data)=>(
    handle_message_of_ws_backend(
      {
        event_handlers  ,
        context         ,
        websocket       ,
        req             ,
        data            ,
      }
    )
  ));

}

export { on_init_websocket_of_ws_backend as on_init_websocket_of_ws_backend };









