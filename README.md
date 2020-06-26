# quickFeed.js
A client-side and server-side JavaScript library for Web Analytics

<hr>

<h3> quickFeed.js </h3> (require: jQuery, Bootstrap)
The client-side library. 
It builds the graphic content, collects and sends the data gathered at client side.
It select the question for the user and filter them using cookies.
<br>
<h3> quickFeed-server.js </h3> (require: NodeJS)
The server-side library.
It listens for the data sent from the client-side library and save them in a JSON file.
It manages and creates the JSON file.
<br>
<h3> options_example.json </h3>
A file for the options of the library.
<br>
<h3> results.html </h3>
A human-readable page of the results.json that will be created by the server-side library
<hr>
<h2> Usage </h2>
<ol>
  <li> include the client-side library in the HTML pages <code> <script src="path/to/quickFeed.js"></script> </code>
    <br>as well as server-side 
    <code> var quickFeed = require('path/to/quickFeed-server.js');  </code>
 </li>
  <li> In the HTML page declare the container for the explicit data gathering and the options file <br>
    <pre><code>&lt;div id="question" data-src="/path/to/options.json"></div&lt;
    </code></pre> 
  </li>
  <li> 
    In the server-side, allow the server to listen for data <br><code>app.post('/answer', function(request, response){
    response.json(quickFeed.add("query",request));
    });
    app.post('/time_spent', function(request,response) {
        response.json(quickFeed.add("time",request));
    });
    app.post('/click_track', function(request,response) {
        response.json(quickFeed.add("click",request));
    });
    app.post('/over_track', function(request,response) {
        response.json(quickFeed.add("over",request));
    });</code><br>
    (here i used 'express' library <br>
    <code> var express = require('express');
     var app = express();
    </code> ) </li>
