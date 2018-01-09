
const React = require('react');

const state_names = {
    "AL": "Alabama",
    "AK": "Alaska",
    "AS": "American Samoa",
    "AZ": "Arizona",
    "AR": "Arkansas",
    "CA": "California",
    "CO": "Colorado",
    "CT": "Connecticut",
    "DE": "Delaware",
    "DC": "District Of Columbia",
    "FM": "Federated States Of Micronesia",
    "FL": "Florida",
    "GA": "Georgia",
    "GU": "Guam",
    "HI": "Hawaii",
    "ID": "Idaho",
    "IL": "Illinois",
    "IN": "Indiana",
    "IA": "Iowa",
    "KS": "Kansas",
    "KY": "Kentucky",
    "LA": "Louisiana",
    "ME": "Maine",
    "MH": "Marshall Islands",
    "MD": "Maryland",
    "MA": "Massachusetts",
    "MI": "Michigan",
    "MN": "Minnesota",
    "MS": "Mississippi",
    "MO": "Missouri",
    "MT": "Montana",
    "NE": "Nebraska",
    "NV": "Nevada",
    "NH": "New Hampshire",
    "NJ": "New Jersey",
    "NM": "New Mexico",
    "NY": "New York",
    "NC": "North Carolina",
    "ND": "North Dakota",
    "MP": "Northern Mariana Islands",
    "OH": "Ohio",
    "OK": "Oklahoma",
    "OR": "Oregon",
    "PW": "Palau",
    "PA": "Pennsylvania",
    "PR": "Puerto Rico",
    "RI": "Rhode Island",
    "SC": "South Carolina",
    "SD": "South Dakota",
    "TN": "Tennessee",
    "TX": "Texas",
    "UT": "Utah",
    "VT": "Vermont",
    "VI": "Virgin Islands",
    "VA": "Virginia",
    "WA": "Washington",
    "WV": "West Virginia",
    "WI": "Wisconsin",
    "WY": "Wyoming"
};

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

  componentDidMount() {
BowAndDrape.stockists = this.props.stockists;
    BowAndDrape.dispatcher.on("map_loaded", () => {
      let geocoder = new google.maps.Geocoder();
      var nyc = {lat: 40.6976684, lng: -74.260555};
      var map = new google.maps.Map(document.getElementById('map'), {
        zoom: 2,
        center: nyc,
      });
      var contentString = '<div id="content">'+
        '<div id="siteNotice">'+
        '</div>'+
        '<h1 id="firstHeading" class="firstHeading">Title</h1>'+
        '<div id="bodyContent">'+
          '<p>content</p>'+
        '</div>'+
      '</div>';
      var infowindow = new google.maps.InfoWindow({
        content: contentString
      });

      this.props.stockists.forEach((stockist, index) => {
        setTimeout(() => {
console.log("loaded "+index+" of "+this.props.stockists.length)
          let address = `${stockist.address} ${stockist["city"]}, ${stockist["state"]} ${stockist["zip"]}`;
          geocoder.geocode( {address}, function(results, status) {
            if (status != 'OK')
              console.log('Geocode was not successful for the following reason: ' + status);
            if (!results)
              return console.log("no result for "+address);
stockist.location = {
  lat: results[0].geometry.location.lat(),
  lng: results[0].geometry.location.lng()
};
            var marker = new google.maps.Marker({
              position: results[0].geometry.location,
              map: map
            });
            marker.addListener('click', function() {
              infowindow.open(map, marker);
            });
          });
        }, index*1500);
      });

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
              <div style={{fontWeight:"bold"}}>{stockist["retailer"]} at {stockist["store name"].toUpperCase()}</div> 
              <div className="info">
                <div><label>ADDRESS:</label>{stockist["address"]}</div> 
                <div>{stockist["city"]}, {stockist["state"]} {stockist["zip"]}</div> 
                <div>{stockist["phone"]}</div> 
              </div>
            </div>
          );
        });
        states.push(
          <div key={state} className="state">
            <div className="title">{state_names[state]||state}</div>
            <div className="store_list">
              {stores}
            </div>
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
        <div id="map" style={{width:"100%",height:"400px"}}></div>
          <script dangerouslySetInnerHTML={{__html:`
          function initMap() {
            if (typeof(BowAndDrape)=="undefined") {
              return setTimeout(() => {
                initMap();
              }, 1000);
            }
            BowAndDrape.dispatcher.emit("map_loaded");
          }
        `}}/>
        <script async defer
        src="https://maps.googleapis.com/maps/api/js?key=AIzaSyB78i-bzVlKnAmv5j4YSQnKw7ODgvafNCQ&callback=initMap">
        </script>

        {countries}
      </div>
    );
  }

}

module.exports = StockistList;
