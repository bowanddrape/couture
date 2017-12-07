
const React = require('react');

/***
Edit an announcement banner
***/
class AnnouncementEdit extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      announcements: this.props.announcements || [],
    };
  }

  handleUpdate(index, event) {
    let name = event.target.getAttribute("name");
    let value = event.target.value;
    this.setState((prev_state) => {
      let announcements = prev_state.announcements.slice(0);
      if (name=="start" || name=="stop") {
        value = new Date(value).getTime()/1000;
      }
      announcements[index][name] = value;
      return ({announcements});
    });
  }

  handleSave() {
    this.state.announcements.forEach((announcement) => {
      BowAndDrape.api("POST", "/announcement", announcement, (err, resp) => {
      });
    });
  }

  render() {
    let announcements = [];
    this.state.announcements.forEach((announcement, index) => {
      announcement.start = announcement.start || Math.round(new Date().getTime()/1000);
      announcement.stop = announcement.stop || Math.round(new Date().getTime()/1000);
      let start = new Date(announcement.start*1000);
      let stop = new Date(announcement.stop*1000);
      announcements.push(
        <div key={announcement.id} className="announcement" style={{color:"#fff",backgroundColor:"#ff5c5c",width:"100%",textAlign:"center",fontFamily: "zurichbold_condensed",marginBottom:"10px"}}>
          start:<input type="date" value={start.toISOString().substr(0,10)} name="start" onChange={this.handleUpdate.bind(this, index)} />
          stop:<input type="date" value={stop.toISOString().substr(0,10)} name="stop" onChange={this.handleUpdate.bind(this, index)} />
          text:<input type="text" value={announcement.text} name="text" onChange={this.handleUpdate.bind(this, index)} />
          <div style={{fontFamily: "zurichbold_condensed"}} dangerouslySetInnerHTML={{__html:`
            ${announcement.text}
          `}} />
        </div>
      )
    });

    return (
      <div className="announcement_edit">
        {announcements}
        <div className="actions">
          <button onClick={this.handleSave.bind(this)}>Save</button>
        </div>
      </div>
    )
  }
}

module.exports = AnnouncementEdit;
