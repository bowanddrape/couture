
const React = require('react');
const Errors = require('./Errors.jsx');
const BADButton = require('./BADButton.jsx');
const jwt_decode = require('jwt-decode');

class EmailCampaigns extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      campaigns: this.props.campaigns
    };
    this.file = [];
  }

  handleUpdate(index, key, event) {
    let value = event.target.value;
    this.setState((prev_state) => {
      prev_state.campaigns[index][key] = value;
      return prev_state;
    });
  }

  handleFileChange(index, event) {
    this.file[index] = event.target.files[0];
    this.setState((prev_state) => {
      prev_state.campaigns[index].content = [
        {"image":`https://s3.amazonaws.com/www.bowanddrape.com/emailcampaign_uploads/${this.file[index].name}`},
      ];
    });
  }

  handlePreview(index) {
    let user = jwt_decode(BowAndDrape.token);
  }

  handleSave(index) {
    let payload = this.state.campaigns[index];
    delete payload.targets;
    if (this.file[index])
      payload.image_file = this.file[index];
    BowAndDrape.api("POST", "/emailcampaign", payload, (err, result) => {
      if (err) return Errors.emitError(null, err);
      BowAndDrape.dispatcher.emit("clear_busy");
    });
  }

  render() {
    let campaigns = [];
    this.state.campaigns.forEach((campaign, index) => {
      campaigns.push(
        <div key={campaign.id}>
          <input
            type="text"
            value={campaign.query}
            onChange={this.handleUpdate.bind(this, index, "query")}
          />
          <input
            type="file"
            onChange={this.handleFileChange.bind(this, index)}
          />
          <BADButton onClick={this.handleSave.bind(this, index)}>Save</BADButton>
        </div>
      );
    });

    return (
      <div>
        <h1>Email Campaigns</h1>
        <Errors />
        <div className="email_campaigns">
          {campaigns}
        </div>
      </div>
    );
  }
}

module.exports = EmailCampaigns;
