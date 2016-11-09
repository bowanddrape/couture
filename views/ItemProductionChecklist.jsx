
const React = require('react');

class ItemProductionChecklist extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    let total_item_count = 0;
    let item_pages = [];
    // create item pages
    for (let i=0; i<this.props.orders.length; i++) {
      let order = this.props.orders[i];
      for (let j=0; j<order.items.length; j++, total_item_count++) {
        let item = order.items[j];
        let textmessage = "";
        let components = {};
        // TODO recurse through assemblies
        for (var k=0; k<item.assembly.length; k++) {
          if (item.assembly[k].text) {
            textmessage += item.assembly[k].text
          }
          components[item.assembly[k].name] = components[item.assembly[k].name]
              ? components[item.assembly[k].name]+1 : 1;
        }
        components = Object.keys(components).map(function(key){
          return {"name":key,"count":components[key]};
        });
        components.sort(function(a, b) {
          if (!a.name) return -1;
          if (!b.name) return 1;
          if (/"/i.test(a.name) && !/"/i.test(b.name))
            return -1;
          if (!/"/i.test(a.name) && /"/i.test(b.name))
            return 1;
          return a.name.localeCompare(b.name);
        });
        let picklist = [];
        for (let k=0; k<components.length; k++) {
          let name = components[k].name;
          // format old names a bit better
          if (/"/.test(name)) {
            picklist.push(<div>{name.substring(0,name.length-1)}<b>{name.substring(name.length-2)}</b> (<b>{components[k].count}</b>)</div>);
            continue;
          }
          picklist.push(<div><b>{name}</b> (<b>{components[k].count}</b>)</div>);
        }

        item_pages.push(
          <order_item>
            <page_label>
              <div>OrderID <b>{order.id}</b></div>
              <div>Item <b>{j+1}</b> of <b>{order.items.length}</b></div>
              <checklist>
                <div>Picked</div>
                <div>Transfered</div>
                <div>Inspected</div>
              </checklist>
        
            </page_label>
            <shipping_details>
              <div><label>Target Ship Date</label>{order.date_to_ship.toDateString()}</div>
              <div><label>Date Ordered</label>{order.date_ordered.toDateString()}</div>
              
              <address dangerouslySetInnerHTML={{__html:"<label>Shipping Address</label>"+order.address}}></address>
              <div><label>Text</label>{textmessage?textmessage:'[N/A]'}</div>
              <div><label>Item</label>{item.name}</div>
            </shipping_details>
            <div></div>
            <picklist>{picklist}</picklist>
            <images>
              <img src={item.image}></img>
              <img src={item.image.replace("_front","_back").replace("_f.jpg","_b.jpg")}></img>
            </images>
          </order_item>
        );
      }
    } // create item pages

    let item_summary_row = [];
    let item_count = 0;
    // create item summary rows
    for (let i=0; i<this.props.orders.length; i++) {
      for (let j=0; j<this.props.orders[i].items.length; j++, item_count++) {
        let item_name = this.props.orders[i].items[j].name.split(',');
        item_summary_row.push(
          <item_summary_row>
            <div>{item_count+1} of {total_item_count}</div>
            <div>{this.props.orders[i].id}</div>
            <div>{item_name[0]}</div>
            <div>{item_name[1]}</div>
            <div>{item_name[2]}</div>
            <div>{item_name[3]}</div>
          </item_summary_row>
        );
      }
    } // create item summary rows

    // list of consumed skus for shelly TODO this goes in a spreadsheet
    let sku_summary = {};
    let sku_summary_product_hack = {};
    if (this.props.summarize_skus) {
      item_summary_row = [];
      for (let i=0; i<this.props.orders.length; i++) {
        let order = this.props.orders[i];
        for (let j=0; j<order.items.length; j++, total_item_count++) {
          let item = order.items[j];
          for (var k=0; k<item.assembly.length; k++) {
            sku_summary[item.assembly[k].name] = sku_summary[item.assembly[k].name]
              ? sku_summary[item.assembly[k].name]+1 : 1;
          }
          sku_summary_product_hack[item.name] = sku_summary_product_hack[item.name]
            ? sku_summary_product_hack[item.name]+1 : 1;
        }
      }
      sku_summary = Object.keys(sku_summary).map(function(key){
        return {"name":key.replace(",","comma"),"count":sku_summary[key]};
      });
      sku_summary.sort(function(a, b) {
        if (!a.name) return -1;
        if (!b.name) return 1;
        if (/"/i.test(a.name) && !/"/i.test(b.name))
          return -1;
        if (!/"/i.test(a.name) && /"/i.test(b.name))
          return 1;
        return a.name.localeCompare(b.name);
      });
      sku_summary_product_hack = Object.keys(sku_summary_product_hack).map(function(key){
        return {"name":key,"count":sku_summary_product_hack[key]};
      });
      let sku_summary_row = [];
      let date = new Date(this.props.date);
      function padLeft(nr, n){
        return Array(n-String(nr).length+1).join('0')+nr;
      }
      let datestring = [date.getFullYear(), padLeft(date.getMonth()+1,2), padLeft(date.getDate(),2)].join('');
      for (let k=0; k<sku_summary.length; k++) {
        let name = sku_summary[k].name;
        sku_summary_row.push(<tr><td>{datestring}</td><td>{/"/.test(name)?"LETTERING":"APPLIQUE"}</td><td></td><td>{/"/.test(name)?name.substring(0,name.length-3):""}</td><td>{/"/.test(name)?name.substring(name.length-2):name}</td><td>{sku_summary[k].count}</td></tr>);
      }
      for (let k=0; k<sku_summary_product_hack.length; k++) {
        let name = sku_summary_product_hack[k].name;
        sku_summary_row.push(<tr><td>{datestring}</td><td>PRODUCT</td><td>{name.split(',')[0]}</td><td>{name.split(',')[2]} {name.split(',')[3]}</td><td>{name.split(',')[1]}</td><td>{sku_summary_product_hack[k].count}</td></tr>);
      }
      return (
        <div>
          <style dangerouslySetInnerHTML={{__html:`
            td {
              border: 1px solid #000;
            }
          `}}></style>
          <table><tbody>
            {sku_summary_row}
          </tbody></table>
        </div>
      );
    } // alternate shelly view

    // TODO check auth
    return (
      <div>
        <item_summary>
          {item_summary_row}
        </item_summary>
        <order_items>
          {item_pages}
        </order_items>
        <style dangerouslySetInnerHTML={{__html:`
          item_summary_row {
            width: 100%;
            display: flex;
            justify-content: space-around;
            padding-bottom: 3px;
            margin-bottom: 3px;
            border-bottom: solid 1px #aaa;
          }
          item_summary_row:last-child {
            border-bottom: none;
          }
          item_summary_row div {
            width: 270px;
          }
          order_item {
            page-break-before: always;
            position: relative;
            width: 100%;
            min-height: 200px;
            display: block;
          }
          page_label {
            position: absolute;
            text-align: right;
            right: 0;
            top: 0;
            font-size: 30px;
            color: #aaa;
          }
          page_label checklist * {
            padding-right: 115px;
            position: relative;
            padding-top: 35px;
            padding-bottom: 40px;
          }
          page_label checklist *:after {
            content: '';
            position: absolute;
            top: 0;
            right: 0;
            background-color: #eee;
            border: solid 2px #000;
            border-radius: 10px;
            width: 100px;
            height: 100px;
            display: block;
          }
          shipping_details {
            display: flex;
            flex-direction: column;
            justify-content: center;
            margin-left: 175px;
            padding-top: 10px;
            padding-bottom: 10px;
          }
          shipping_details * {
            position: relative;
          }
          shipping_details * label {
            position: absolute;
            text-align: right;
            top: 0;
            left: -200px;
            width: 170px;
            color: #aaa;
          }
          address span {
            display: block;
          }
          address span:nth-child(n+4):nth-child(-n+6){
            display: inline-block;
            margin-right: 20px;
          }
          picklist {
            display: flex;
            flex-direction: column;
            flex-wrap: wrap;
            width: 60%;
            margin-left: 20px;
            height: 225px;
            font-size: 11px;
            color: #aaa;
          }
          picklist b {
            font-size: 15px;
          }
          images {
            display: flex;
            justify-content: center;
          }
          images > * {
          }
          b {
            font-weight: bold;
            color: #000;
          }
`}}>
        </style>
      </div>
    );
  }
}
module.exports = ItemProductionChecklist;
