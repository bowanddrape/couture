
const Errors = require('./Errors.jsx');

let recurseAssembly = (component, foreach) => {
  if (!component) return;
  // if we got an array, just call ourselves on each
  if (typeof(component.forEach)=="function") {
    return component.forEach((component) => {
      recurseAssembly(component, foreach);
    });
  }
  // run callback
  foreach(component);
  // walk through our assembly
  if (component.assembly) {
    component.assembly.forEach((component) => {
      recurseAssembly(component, foreach);
    });
  }
}

let recurseOptions = (component, foreach) => {
  if (!component) return;
  // run callback
  foreach(component);
  // walk through our assembly
  if (component.options) {
    for (let option in component.options) {
      recurseOptions(component.options[option], foreach);
    }
  }
}

// get price of an item list, optionally only counting ones that pass filter
let getPrice = (items, filter) => {
  let total_price = 0;
  items.forEach((item, index) => {
    if (typeof(filter)=="function" && !filter(item)) return;
    let quant = item.quantity || 1;
    let price = parseFloat(item.props.price);
    if (isNaN(price))
      price = 0;
    total_price += price * quant;
  });
  return total_price;
}

// items gets passed in by reference and updated
let applyPromoCode = (items, promo, callback) => {
  // only one promo code at a time, remove any previous ones
  items.forEach((item, index) => {
    // TODO generalize special line items like these
    if (new RegExp("^promo:", "i").test(item.props.name))
      return items.splice(index, 1);
  });
  let total_price = getPrice(items, (item) => {return item.sku});
  // TODO see if the promo is applicable
  let reason = "Not Applicable";
  if (promo.props.info)
    reason += `: "${promo.props.info}"`;
  if (promo.props.min_total && total_price<promo.props.min_total)
    return callback(reason);

  // TODO if the promo is a percent, maybe decrease the cost of cart items (for tax)
  // figure out value of our promo
  promo.props.price = -1 * Math.max((Math.round(total_price*promo.props.percent)/100||0), (promo.props.absolute||0));
  // special hardcoded logic for "presents" promo
  if (promo.code.toLowerCase()=="presents") {
    promo.props.price = 0;
    if (total_price>=75)
      promo.props.price = -15;
    if (total_price>=100)
      promo.props.price = -25;
    if (total_price>=200)
      promo.props.price = -50;
    if (total_price>=300)
      promo.props.price = -100;
  }
  if (!new RegExp("^promo:", "i").test(promo.props.name)) {
    promo.props.name = `Promo: ${promo.props.name || promo.code}`;
  }
  items.push(promo);
  callback(null, items);
}

// items gets passed in by reference and updated
let applyCredits = (credits, items) => {
  // remove any previous credits line
  items.forEach((item, index) => {
    // TODO generalize special line items like these
    if (new RegExp("^Account balance", "i").test(item.props.name))
      return items.splice(index, 1);
  });
  // credits should never be negative anyways
  if (!credits || credits < 0) return;
  let total_price = getPrice(items);
  let credit_price = Math.min(total_price, credits);
  items.push({
    props: {
      name: "Account balance",
      price: -1*credit_price,
      info: `$${credit_price} applied, $${credits-credit_price} remaining`,
    },
  });
}

// estimate date from now, takes days, returns time in seconds
let countBusinessDays = (days) => {
  let floorDate = function(time_stamp) {
    time_stamp -= time_stamp % (24 * 60 * 60 * 1000); // subtract amount of time since midnight
    time_stamp += new Date().getTimezoneOffset() * 60 * 1000; // add on the timezone offset
    return time_stamp;
  }
  // start counting from midnight tonight
  let ms_per_day = (24 * 60 * 60 * 1000);
  let time = floorDate(new Date().getTime()) + ms_per_day;
  for (let i=0; i<days; ) {
    time += ms_per_day;
    if (new Date(time).getDay()%6!=0)
      i += 1;
  }
  return time/1000;
}

let querying_promo = null;
let updatePromo = (contents, promo, callback) => {
  if (querying_promo)
    querying_promo.abort()
  Errors.clear("promo");

  // only one promo code at a time, remove any previous ones
  contents.forEach((item, index) => {
    if (new RegExp("^promo:", "i").test(item.props.name))
      contents.splice(index, 1);
  });

  if (!promo || !promo.code)
    return callback(null, contents, promo);

  querying_promo = BowAndDrape.api("GET", "/promocode", {code:promo.code.toLowerCase()}, (err, result) => {
    querying_promo = null;
    if (!err && !result.length)
      err = "No such promo code";
    if (err) {
      Errors.emitError("promo", err.toString());
      if (promo && promo.props && promo.props.name) {
        promo.props.price = "N/A";
        promo.props.info = err.toString();
        contents.push(promo);
      }
      return callback(null, contents, promo);
    }
    promo = result[0];
    applyPromoCode(contents, promo, (err, items) => {
      if (err) {
        Errors.emitError("promo", err.toString());
      }
      return callback(null, contents, promo);
    });
  });
}

let querying_shipment_rate = null;
let updateShipping = (contents, address, promo, callback) => {
  if (querying_shipment_rate) {
    querying_shipment_rate.abort()
  }
  // default shipping quote.
  let shipping_quote = {
    days: 5,
    amount: 7,
    currency_local: "USD",
  }
  // remove any previous shipping line
  contents.forEach((item, index) => {
    if (/^Shipping /.test(item.props.name))
      return contents.splice(index, 1);
  });
  // doesn't cost anything to ship nothing
  if (!contents.length)
    return callback(null, contents);

  if (!address || !address.name || !address.street || !address.country) {
    contents.push({
      props: {
        name: "Shipping & Handling:",
        price: "enter address for quote"
      }
    });
    return callback(null, contents);
  }

  // TODO show that we're quoting shipping, cancel previous quote when quoting
  querying_shipment_rate = BowAndDrape.api("POST", "/shipment/quote", {
    contents,
    address,
  }, (err, response) => {
    // mark as done quoting
    querying_shipment_rate = null;
    // go based on the first quote we see
    if (response && response.length)
      shipping_quote = response[0];
    let shipping_cost = shipping_quote.amount;
    let shipping_info = "";
    // min shipping cost is 7
    if (shipping_cost < 7)
      shipping_cost = 7;
    // domestic orders may conditionally get free shipping
    let domestic = (address.country.toLowerCase().trim()=="usa" || address.country.toLowerCase().trim()=="united states");
    if (domestic) {
      // apply free shipping promos
      if (promo && promo.props && promo.props.free_ship) {
        shipping_cost = 0;
        shipping_info = "Promo eligible for free shipping!";
      }
      // free domestic shipping for 75+ orders
      let total_price = getPrice(contents, (item)=>{
        // only count product
        return !!item.sku;
      });
      if (total_price>=75) {
        shipping_cost = 0;
        shipping_info = "Free domestic shipping on orders of $75!";
      }
    } // if (domestic)
    contents.push({
      props: {
        name: "Shipping & Handling:",
        price: shipping_cost,
        info: shipping_info,
      }
    });
    return callback(null, contents);
  });
}

module.exports = {
  recurseAssembly,
  recurseOptions,
  getPrice,
  applyPromoCode,
  updatePromo,
  applyCredits,
  countBusinessDays,
  updateShipping,
};
