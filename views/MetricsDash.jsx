const React = require('react');

/*
 *
 */

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
          let type = query["format"]["type"];
          let numCols = query["format"]["columns"];
          // Construct our header of column names
          let header = [];
          columnNames.forEach((name, index)=>{
            header.push(<th key={index}>{name}</th>);
          });
          // Fill in our data
          let columnData = [];
          let data = query["data"][0][type];
          // switch based on column numbers
          switch(numCols){
            case 1:
              columnData.push(
                <tr key={columnData.length}>
                  <td>{data}</td>
                </tr>
              );
              break;

            case 2:
              for (let key in data){
                if (data.hasOwnProperty(key)){
                  columnData.push(
                    <tr key={columnData.length}>
                      <td>{key}</td>
                      <td>{data[key]}</td>
                    </tr>
                  );
                }
              }
              break;
            } // switch

          queries.push(
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
          );
        });
        return queries;
      }
      return null;
    }

    render() {
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
