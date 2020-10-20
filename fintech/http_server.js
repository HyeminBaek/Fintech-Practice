var http = require("http");

http.createServer(function(req,res)
{
    var body = "<html><h1>이정혁</h1></html>";
    console.log("request")
    res.setHeader('Content-Type','text/plain; charset=utf-8');
    res.end(body)
}).listen(3000);