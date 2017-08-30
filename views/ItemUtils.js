
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

// get price of an item list, optionally only counting ones that pass filter
let getPrice = (items, filter) => {
  let total_price = 0;
  items.forEach((item, index) => {
    if (typeof(filter)=="function" && !filter(item)) return;
    let quant = item.quantity || 1;
    total_price += parseFloat(item.props.price) * quant;
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
  // figure out value of our promo
  promo.props.price = -1 * Math.max((Math.round(total_price*promo.props.percent)/100||0), (promo.props.absolute||0));
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
  // don't apply credit to a nothing
  if (!total_price) return;
  let credit_price = Math.min(total_price, credits);
  items.push({
    props: {
      name: "Account balance",
      price: -1*credit_price,
      description: `${credits-credit_price} remaining in balance`,
    },
  });
}

module.exports = {
  recurseAssembly,
  getPrice,
  applyPromoCode,
  applyCredits,
};
