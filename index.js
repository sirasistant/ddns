String.prototype.hexEncode = function(){ //encodes an ASCII string into hexadecimal string
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

var config = JSON.parse(fs.readFileSync("./config.cnf")); //read the config file

//
// Create a proxy server with custom application logic
//
var proxy = httpProxy.createProxyServer({}); 

//
// Set the provider to the Ethereum web3 API
//
web3.setProvider(new web3.providers.HttpProvider(config.nodeAddr));

//console.log(web3.eth.coinbase);

//
// Instantiate the contract using the ABI definition and the address from the config.
//
var contract = web3.eth.contract(JSON.parse(fs.readFileSync("./contract.json"))).at(config.contractAddr);

// Helper function to transform an hex string to a ASCII string
function hex_to_ascii(str1)  
{  
	var hex  = str1.toString();  
	var str = '';  
	for (var n = 0; n < hex.length; n += 2) {  
		str += String.fromCharCode(parseInt(hex.substr(n, 2), 16));  
	}  
	return str;  
}  

// Helper function to tell if a string is ASCII compliant
function isASCII(str) {
	return /^[\x00-\x7F]*$/.test(str);
}

// Helper function that transform a 4-byte hex string into an IPv4 (XXX.XXX.XXX.XXX)
var hexToIpv4=function(hex){
	var result = [];
	var bytes = hex.substring(2,hex.length);
	for(var i =0;i<(bytes.length);i+=2){
		var byte = "0x"+bytes.substring(i,i+2);
		result.push(parseInt(byte);
	}
	return result.join(".");
}

// Helper function that splits a url into domain and subdomain
var splitDomain = function(url){
	var numberOfDots = (url.match(/[.]/g)||[]).length

	console.log("Dot count: ", numberOfDots);
	if(numberOfDots>1){
		var firstDotIndex = url.indexOf(".");
		if(firstDotIndex>0&&firstDotIndex<=31&&(url.length-firstDotIndex)<=31){
			return {subdomain:url.substring(0,firstDotIndex),domain:url.substring(firstDotIndex+1,url.length)}
		}
	}
	if(url.length>0&&url.length<=31){
		return {domain:url,subdomain:""}
	}
	return null;
}

// The function that resolves recursively an address 
var resolve=function(contract,host,callback,errBack){
	var hostNames = []; //This array prevents loops in CNAME resolution
	console.log("Resolving: ",host);

	//One step in the resolution of a host
	var step = function(host){
		if(hostNames.indexOf(host)!=-1){ //If we already tried to resolve this host, there is a loop. stop.
			errBack();
		}else{
			console.log("Step: ",host);
			hostNames.push(host);

			if(isASCII(host)){ //Non-ASCII hosts are not allowed

				var splits = splitDomain(host);
				if(splits){
					ethDomain = splits.domain;
					ethSubdomain = splits.subdomain;
				}
				console.log("Domain: "+ethDomain.hexEncode());
				console.log("SubDomain: "+ethSubdomain.hexEncode());

				var type = ethDomain?parseInt(contract.getType(ethDomain.hexEncode(),ethSubdomain.length>0?ethSubdomain.hexEncode():"").toString()):0;
				console.log("Type: "+type);
				if(type){
					if(type ==1){
						var newHost = contract.getAlias(ethDomain.hexEncode(),ethSubdomain.length>0?ethSubdomain.hexEncode():"");
						step(newHost);
					}else{
						if(type==2){
							var resolvedAddr = hexToIpv4(contract.getIPV4(ethDomain.hexEncode(),ethSubdomain.length>0?ethSubdomain.hexEncode():""));
							callback(resolvedAddr);
						}else{
							errBack();
						}
					}
				}else{
					callback(host);
				}
			}else{
				callback(host);
			}
		}
	}

	step(host);
}



var server = http.createServer(function(req, res) {
  var host = req.headers['host']; //get the host of the request
  var port = 80;
  var twoPointsIndex = host.indexOf(":");
  if(twoPointsIndex>-1){
  	port = host.substring(twoPointsIndex+1,host.length);
  	host = host.slice(0,twoPointsIndex);
  }
  console.log("--------------");
  console.log(host+":"+port);

  resolve(contract,host,(result)=>{
  	console.log("Resolved: ",result);
  	proxy.web(req, res, { target: "http://"+result+":"+port }, function(e) { 
  		res.statusCode=404;
  		res.end();
  	});
  },()=>{
  	res.statusCode=404;
  	res.end();
  });


});

proxy.on('error', function(e) {
	console.log(e);
});

console.log("listening on port "+config.port)
server.listen(config.port);