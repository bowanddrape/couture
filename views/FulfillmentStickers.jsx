
const React = require('react');
class FulfillmentStickers extends React.Component {

  render() {
    if (!this.props.shipments) return null;

    let garment_ids = [];
    this.props.shipments.forEach((shipment) => {
      if (!shipment.fulfillment_id) return;
      let total_num_products = 0;
      shipment.contents.forEach((item, index) => {
        let quantity = item.quantity || 1;
        if (item.sku) {
          total_num_products += quantity;
        }
      });

      shipment.contents.forEach((item, index) => {
        if (!item.sku) return;
        garment_ids.push(
          <div key={garment_ids.length} className="garment_id_sticker">
            <div>216-{shipment.fulfillment_id}-{index+1}</div>
            <div style={{fontSize:"7px"}}>({shipment.id.substr(shipment.id.length-6)} {index+1} of {total_num_products})</div>
          </div>
        );
      });
    });

    return (
      <div>
        {garment_ids}
      </div>
    );
  }
}

module.exports = FulfillmentStickers;
