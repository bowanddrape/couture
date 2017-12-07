const React = require('react');


class MetricsDash extends React.Component {
    constructor(props) {
      super(props);
      this.state = {
        hasMetrics: false,
        searchParams: {
          start:'',
          stop: '',
        },
      }
    }

    handleInputChange(event) {
      const target = event.target;
      const value = target.type === 'checkbox' ? target.checked : target.value;
      const name = target.name;

      this.setState((prevState) => {
        let searchParams = Object.assign({}, this.state.searchParams);
        searchParams[name] = value;
        return ({searchParams});
      });
    }

    handleSearch() {
      BowAndDrape.api("POST", "/dashboard", this.state.searchParams, (err, result) => {
        if (err) {
          alert("Error on POSTing");
          return err;
        }
        this.setState((prevState)=>{
          return ({
            hasMetrics: true,
            metricsData: result,
          });
        });
      });
    }

    renderMetrics() {
      // fill in table data!
      if (this.state.hasMetrics){
        let queries = [];
        this.state.metricsData.metrics.forEach((query, index)=>{
          let tableTitle = query["format"]["title"];
          let columnNames = query["format"]["columnNames"];
          let formatType = query["format"]["type"];

          // Construct our header of column names
          let header = [];
          columnNames.forEach((name, index)=>{
            header.push(<th key={index}>{name}</th>);
          });

          // Fill in our data
          let columnData = [];
          let data = query["data"];

          switch(formatType){
            case "production":
              let users = {};
              let tags = {
                "needs_picking":    0,
                "needs_pressing":   0,
                "needs_qaing":      0,
                "needs_packing":    0,
                "needs_embroidery": 0,
                "needs_airbrush":   0,
                "needs_stickers":   0,
              }
              data.forEach((obj)=>{
                // check if the user exists in our userMap
                if (!obj.hasOwnProperty(obj.props.name)) {
                  users[obj.props.user] = tags;
                }
                let count = users[obj.props.user][obj.props.tag];
                users[obj.props.user][obj.props.tag] = count + 1;
              });
              for(let name in users){
                if (users.hasOwnProperty(name)){
                  for(let tag in users[name]){
                    if(users[name].hasOwnProperty(tag)){
                      columnData.push(
                        <tr key = {columnData.length}>
                          <td>{name}</td>
                          <td>{tag}</td>
                          <td>{users[name][tag]}</td>
                        </tr>
                      );
                    }
                  }
                }
              }
              break;

            case "sum":
              data.forEach((obj)=>{
                for (let key in obj){
                  if (obj.hasOwnProperty(key)){
                    columnData.push(
                      <tr key={columnData.length}>
                        <td>{obj[key]}</td>
                      </tr>
                    );
                  }
                }
              });
              break;

            case "inventory":
              data.forEach((obj)=>{
                let inventory = obj["inventory"]
                for (let key in inventory){
                  if (inventory.hasOwnProperty(key)){
                    columnData.push(
                      <tr key={columnData.length}>
                        <td>{key}</td>
                        <td>{inventory[key]}</td>
                      </tr>
                    );
                  }
                }
              });
              break;

            case "daily_sum":
              data.forEach((obj)=>{
                let tdata = [];
                for (let key in obj){
                  if (obj.hasOwnProperty(key)){
                    tdata.push(
                      <td>{obj[key]}</td>
                    );
                  }
                }
                columnData.push(
                  <tr key={columnData.length}>
                    {tdata}
                  </tr>
                );
              });

              break;
          } // switch

          queries.push(
            <div>
              <h2>{tableTitle}</h2>
              <table key={queries.length}>
                <thead>
                  <tr>
                    {header}
                  </tr>
                </thead>
                <tbody>
                   {columnData}
                </tbody>
              </table>
            </div>
          );
        });
        return queries;
      }
      return null;
    }

    render() {
      // header menu with options: Inventory, Sales, Production
      // have a default view drawn from one of the menu options
      let menu_options = ["Inventory", "Sales", "Production"];
      let menu_items = [];
      menu_options.forEach((option)=>{
        menu_items.push(<button className="primary" key={menu_items.length}>{option}</button>);
      });

      let metrics = this.renderMetrics();
      //let metrics = null;
      return(
        <div className="metrics_dash">
          <section>Search Metrics</section>
            <row>
              <div>
                <label>Start Date: </label>
                <input
                 type="date"
                 onChange={this.handleInputChange.bind(this)}
                 value={this.state.searchParams["start"]}
                 name="start"
                />
             </div>
             <div>
               <label>Stop Date: </label>
               <input
                type="date"
                onChange={this.handleInputChange.bind(this)}
                value={this.state.searchParams["stop"]}
                name="stop"
               />
            </div>
            </row>
            <button onClick={this.handleSearch.bind(this)}>Search</button>
            <div className="display_metrics">
              {metrics}
            </div>
        </div>
      );
    }
}

module.exports = MetricsDash;
