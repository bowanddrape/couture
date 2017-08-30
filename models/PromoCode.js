
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

  hasApiPermission(req, res) {
    if (req.method=="GET") return true;
    return super.hasApiPermission(req, res);
  }
}
module.exports = PromoCode;
