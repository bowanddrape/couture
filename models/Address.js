
/***
Don't remember why I wrote this, but maybe thought I needed to so address
sanitization. Well, if that needs to happen, it goes here.
***/
class Address {
  constructor(address) {
    this.name = address.name;
    if (this.name)
      this.name = this.name.replace(/"/g, "'");
    this.street = address.street;
    this.apt = address.apt;
    this.locality = address.locality;
    this.region = address.region;
    this.postal = address.postal;
    this.country = address.country;
  }
}

module.exports = Address;
