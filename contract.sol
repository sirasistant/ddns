pragma solidity ^0.4.2;

contract mortal {
    /* Define variable owner of the type address*/
    address owner;

    /* this function is executed at initialization and sets the owner of the contract */
    function mortal() { owner = msg.sender; }

    /* Function to recover the funds on the contract */
    function kill() { if (msg.sender == owner) suicide(owner); }
}

contract DDNS is mortal{
    address creator;
    uint CNAME_ENTRY =1;
    uint IPV4_ENTRY = 2;
    uint IPV6_ENTRY = 3;
    
    struct entry{
        uint typeOfEntry;
        bytes4 ipv4;
        bytes16 ipv6;
        string alias;
    }
    
    struct domain{
        mapping(bytes32=>entry) subdomains;
        address owner;
    }
    
    mapping(bytes32=>domain) public domains;
    
    /* Constructor */
    function DDNS() {
        creator = msg.sender;
    }
    
    function registerDomain(bytes32 domain){
        if(domains[domain].owner!=address(0)){
            throw;
        }
        domains[domain].owner = msg.sender;
    }
    
    modifier isOwnerOfDomain(domain _domain){ 
        if (_domain.owner != msg.sender) throw; _;
    }
    
    function storeCNAME(bytes32 domainName,bytes32 subdomain,string cname) isOwnerOfDomain(domains[domainName]) {
        domain _domain = domains[domainName];
        _domain.subdomains[subdomain] = entry({typeOfEntry:CNAME_ENTRY,alias:cname,ipv4:0,ipv6:0});
    }
    
    function storeIPV6(bytes32 domainName,bytes32 subdomain,bytes16 ipv6) isOwnerOfDomain(domains[domainName]) {
        domain _domain = domains[domainName];
        _domain.subdomains[subdomain] = entry({typeOfEntry:IPV6_ENTRY,alias:"asd",ipv4:0,ipv6:ipv6});
    }
    
    function storeIPV4(bytes32 domainName,bytes32 subdomain,bytes4 ipv4) isOwnerOfDomain(domains[domainName]) {
        domain _domain = domains[domainName];
        _domain.subdomains[subdomain] = entry({typeOfEntry:IPV4_ENTRY,alias:"asd",ipv4:ipv4,ipv6:0});
    }
    
    function getType(bytes32 domainName,bytes32 subdomain) constant returns(uint){
        entry _entry = domains[domainName].subdomains[subdomain];
        return (_entry.typeOfEntry);
    }

    function getAlias(bytes32 domainName,bytes32 subdomain) constant returns (string){
        entry _entry = domains[domainName].subdomains[subdomain];
        return _entry.alias;
    }

     function getIPV4(bytes32 domainName,bytes32 subdomain) constant returns(bytes4){
        entry _entry = domains[domainName].subdomains[subdomain];
        return (_entry.ipv4);
    }

    function getIPV6(bytes32 domainName,bytes32 subdomain) constant returns(bytes16){
        entry _entry = domains[domainName].subdomains[subdomain];
        return (_entry.ipv6);
    }
}