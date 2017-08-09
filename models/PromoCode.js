
const JSONAPI = require('./JSONAPI');
class PromoCode extends JSONAPI {
  constructor(promo) {
    super();
    Object.assign(this, promo);
  }

  // needed by SQLTable
  static getSQLSettings() {
    return {
      tablename: "promos",
      pkey: "code",
      fields: ["props"],
    };
  }
}
module.exports = PromoCode;
