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
        return (prevState.searchParams[name] = value);
      });
    }

    handleSearch() {
      //TODO THIS STUFF IS COPY PASTA, CHANGE IT!
      BowAndDrape.api("POST", "/dashboard", this.state.searchParams, (err, result) => {
        if (err) {
          alert("Error on POSTing");
          return err;
        }
        this.setState((prevState)=>{
            return ({hasMetrics: true, metrics: result.metrics["rows"]});
        });
      });
    }

    renderMetrics() {
      if (this.state.hasMetrics){
        let queries = [];
        this.state.metrics.forEach((query, index)=>{
          let type = Object.keys(query)[0];
          queries.push(
            <tr key={queries.length}>
              <td>{type}</td>
              <td>{query[type]}</td>
            </tr>
          );
        });
        return queries;
      }
      return null;
    }

    render() {
      let metrics = this.renderMetrics();
      return(
        <div className="metrics_dash">
          <section>Search Metrics</section>
            <row>
              <div>
                <label>Start Date: </label>
                <input
                 type="text"
                 onChange={this.handleInputChange.bind(this)}
                 value={this.state.searchParams["start"]}
                 name="start"
                 placeholder="mm/dd/yy"
                />
             </div>
             <div>
               <label>Stop Date: </label>
               <input
                type="text"
                onChange={this.handleInputChange.bind(this)}
                value={this.state.searchParams["stop"]}
                name="stop"
                placeholder="mm/dd/yy"
               />
            </div>
            </row>
            <button onClick={this.handleSearch.bind(this)}>Search</button>
            <div className="display_metrics">
              <table>
                <tbody>
                  {metrics}
                </tbody>
              </table>
            </div>
        </div>
      );
    }
}

module.exports = MetricsDash;
