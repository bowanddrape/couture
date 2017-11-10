
const React = require('react');
class FulfillmentStickers extends React.Component {

  render() {
    if (!this.props.shipments) return null;

    let garment_ids = [];
    this.props.shipments.forEach((shipment) => {
      if (!shipment.fulfillment_id) return;
      shipment.contents.forEach((item, index) => {
        garment_ids.push(
          <div key={garment_ids.length} className="garment_id_sticker">
            216-{shipment.fulfillment_id}-{index+1}
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
