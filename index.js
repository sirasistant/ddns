String.prototype.hexEncode = function(){
    var hex, i;

    var result = "0x";
    for (i=0; i<this.length; i++) {
        hex = this.charCodeAt(i).toString(16);
        result += (hex);
    }

    return result
}

var Web3 = require('web3'),
http = require('http'),
fs = require("fs"),
httpProxy = require('http-proxy');
var web3 = new Web3();

var config = JSON.parse(fs.readFileSync("./config.cnf"));

//
// Create a proxy server with custom application logic
//
var proxy = httpProxy.createProxyServer({});

web3.setProvider(new web3.providers.HttpProvider(config.nodeAddr));

//console.log(web3.eth.coinbase);

var contract = web3.eth.contract(JSON.parse(fs.readFileSync("./contract.json"))).at(config.contractAddr);

function hex_to_ascii(str1)  
{  
	var hex  = str1.toString();  
	var str = '';  
	for (var n = 0; n < hex.length; n += 2) {  
		str += String.fromCharCode(parseInt(hex.substr(n, 2), 16));  
	}  
	return str;  
}  

function isASCII(str) {
	return /^[\x00-\x7F]*$/.test(str);
}


//
// Create your custom server and just call `proxy.web()` to proxy
// a web request to the target passed in the options
// also you can use `proxy.ws()` to proxy a websockets request
//
var server = http.createServer(function(req, res) {
  // You can define here your custom logic to handle the request
  // and then proxy the request.
  var host = req.headers['host']; //get the host of the request

  console.log(host);

  var ethDomain = null;
  var ethSubdomain = "";

  if(isASCII(host)){

  var numberOfDots = (host.match(/[.]/g)||[]).length

  console.log("Dot count: ", numberOfDots);
  	if(numberOfDots>1){
  		var firstDotIndex = host.indexOf(".");
  		if(firstDotIndex>0&&firstDotIndex<=31&&(host.length-firstDotIndex)<=31){
  			ethSubdomain = host.substring(0,firstDotIndex);
  			ethDomain = host.substring(firstDotIndex+1,host.length);
  		}
  	}
  	if(!ethDomain&&host.length>0&&host.length<=31){
  		ethDomain = host;
  	}
  }

  console.log(ethDomain);
  console.log(ethSubdomain);

  var type = ethDomain?parseInt(contract.getType(ethDomain.hexEncode(),ethSubdomain.length>0?ethSubdomain.hexEncode():"").toString()):0;
  console.log(type);

  if(type){
  	proxy.web(req, res, { target: "http://localhost:3000" }, function(e) { 
  		res.statusCode=404;
  		res.end();
  	});
  }else{
  	proxy.web(req, res, { target: "http://"+host+":80" }, function(e) { 
  		res.statusCode=404;
  		res.end();
  	});}
  });

proxy.on('error', function(e) {
	console.log(e);
});

console.log("listening on port "+config.port)
server.listen(config.port);