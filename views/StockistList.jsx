
const React = require('react');


class StockistList extends React.Component {

  static preprocessProps(options, callback) {
    const csv=require('csvtojson')
    options.stockists = options.stockists || [];
    csv().fromFile("./stockists.csv")
    .on('json', (row) => {
      options.stockists.push(row);
    }).on('done', (err) => {
      if (err) console.log("error reading stockists.csv file "+err);
      callback(err, options);
    });
  }

  render() {

    let stockists = {};
    this.props.stockists.forEach((stockist) => {
      stockists[stockist.country] = stockists[stockist.country] || {};
      stockists[stockist.country][stockist.state] = stockists[stockist.country][stockist.state] || [];
      stockists[stockist.country][stockist.state].push(stockist);
    });

    let countries = [];
    Object.keys(stockists).sort((a, b) => {
      if (a=="USA") return -1;
      if (b=="USA") return 1;
      return a-b;
    }).forEach((country) => {
      let states = [];
      Object.keys(stockists[country]).sort().forEach((state) => {
        let stores = [];
        stockists[country][state].forEach((stockist) => {
          stores.push(
            <div key={stores.length} className="store">
              <div><label>NAME:</label>{stockist["store name"]}</div> 
              <div><label>RETAILER:</label>{stockist["retailer"]}</div> 
              <div><label>ADDRESS:</label>{stockist["address"]}</div> 
              <div>{stockist["city"]}, {stockist["state"]} {stockist["zip"]}</div> 
              <div>{stockist["phone"]}</div> 
              <div><label>NOTES:</label>{stockist["notes"]}</div> 
            </div>
          );
        });
        states.push(
          <div key={state} className="state">
            <div className="title">{state}</div>
            {stores}
          </div>
        )
      });
      countries.push(
        <div key={country} className="country">
          <div className="title">{country}</div>
          {states}
        </div>
      )
    });

    return (
      <div className="stockist_list">
        {countries}
      </div>
    );
  }

}

module.exports = StockistList;
