/*
 * Server-related tasks
 *
 */

// Dependencies
const fs = require('fs'),
    url = require('url'),
    path = require('path'),
    util = require('util'),
    http = require('http'),
    https = require('https'),
    config = require('./config'),
    helpers = require('./helpers'),
    debug = util.debuglog('server'),
    handlers = require('./handlers'),
    StringDecoder = require('string_decoder').StringDecoder;

// Instantiate the server module object
const server = {};

// Instantiate the HTTP server
server.httpServer = http.createServer((req, res) => {
    server.unifiedServer(req, res);
});

// Instantiate the HTTPS server
server.httpsServerOptions = {
    'key': fs.readFileSync(path.join(__dirname, '../https/key.pem')),
    'cert': fs.readFileSync(path.join(__dirname, '../https/cert.pem'))
};

server.httpsServer = https.createServer(server.httpsServerOptions, (req, res) => {
    server.unifiedServer(req, res);
});

// All the server logic for both the http and https server
server.unifiedServer = (req, res) => {
    // Parse the url
    const parsedUrl = url.parse(req.url, true);

    // Get the path
    const path = parsedUrl.pathname;
    const trimmedPath = path.replace(/^\/+|\/+$/g, '');

    // Get the query string as an object
    const queryStringObject = parsedUrl.query;

    // Get the HTTP method
    const method = req.method.toLowerCase();

    // Get the headers as an object
    const headers = req.headers;

    // Get the payload,if any
    let buffer = '';
    const decoder = new StringDecoder('utf-8');

    req.on('data', data => {
        buffer += decoder.write(data);
    });

    req.on('end', () => {
        buffer += decoder.end();

        // Check the router for a matching path for a handler. If one is not found, use the notFound handler instead.
        let chosenHandler = typeof server.router[trimmedPath] !== 'undefined' ? server.router[trimmedPath] : handlers.notFound;

        // If the request is within the public directory use to the public handler instead
        chosenHandler = trimmedPath.indexOf('public/') > -1 ? handlers.public : chosenHandler;

        // Construct the data object to send to the handler
        const data = {
            'method': method,
            'headers': headers,
            'trimmedPath': trimmedPath,
            'queryStringObject': queryStringObject,
            'payload': helpers.parseJsonToObject(buffer)
        };

        // Route the request to the handler specified in the router
        try {
            chosenHandler(data, (statusCode, payload, contentType) => {
                server.processHandlerResponse(res, method, trimmedPath, statusCode, payload, contentType);
            });
        } catch (e) {
            debug(e);
            server.processHandlerResponse(res, method, trimmedPath, 500, {
                'Error': 'An unknown error has occured'
            }, 'json');
        }
    });
};

// Process the response from the handler
server.processHandlerResponse = (res, method, trimmedPath, statusCode, payload, contentType) => {
    // Determine the type of response (fallback to JSON)
    contentType = typeof contentType == 'string' ? contentType : 'json';

    // Use the status code returned from the handler, or set the default status code to 200
    statusCode = typeof statusCode == 'number' ? statusCode : 200;

    // Return the response parts that are content-type specific
    let payloadString = '';

    if (contentType == 'json') {
        res.setHeader('Content-Type', 'application/json');
        payload = typeof payload == 'object' ? payload : {};
        payloadString = JSON.stringify(payload);
    }

    if (contentType == 'html') {
        res.setHeader('Content-Type', 'text/html');
        payloadString = typeof payload == 'string' ? payload : '';
    }

    if (contentType == 'favicon') {
        res.setHeader('Content-Type', 'image/x-icon');
        payloadString = typeof payload !== 'undefined' ? payload : '';
    }

    if (contentType == 'plain') {
        res.setHeader('Content-Type', 'text/plain');
        payloadString = typeof payload !== 'undefined' ? payload : '';
    }

    if (contentType == 'css') {
        res.setHeader('Content-Type', 'text/css');
        payloadString = typeof payload !== 'undefined' ? payload : '';
    }

    if (contentType == 'png') {
        res.setHeader('Content-Type', 'image/png');
        payloadString = typeof payload !== 'undefined' ? payload : '';
    }

    if (contentType == 'jpg') {
        res.setHeader('Content-Type', 'image/jpeg');
        payloadString = typeof payload !== 'undefined' ? payload : '';
    }

    // Return the response-parts common to all content-types
    res.writeHead(statusCode);
    res.end(payloadString);
};

// Define the request router
server.router = {
    '': handlers.index,
    'ping': handlers.ping,
    'public': handlers.public,
    'api/users': handlers.users,
    'api/tokens': handlers.tokens,
    'favicon.ico': handlers.favicon,
    'account/edit': handlers.accountEdit,
    'session/create': handlers.sessionCreate,
    'account/create': handlers.accountCreate,
    'account/deleted': handlers.accountDeleted,
    'session/deleted': handlers.sessionDeleted,
};

// Init script
server.init = () => {
    // Start the HTTP server
    server
        .httpServer
        .listen(config.httpPort, () => {
            console.log('\x1b[36m%s\x1b[0m', 'The HTTP server is running on port ' + config.httpPort);
        });

    // Start the HTTPS server
    server
        .httpsServer
        .listen(config.httpsPort, () => {
            console.log('\x1b[35m%s\x1b[0m', 'The HTTPS server is running on port ' + config.httpsPort);
        });
};

// Export the module
module.exports = server;