
class Address {
  constructor(address) {
    this.street = address.street;
    this.apt = address.apt;
    this.locality = address.locality;
    this.region = address.region;
    this.postal = address.postal;
    this.country = address.country;
  }
}

module.exports = Address;
