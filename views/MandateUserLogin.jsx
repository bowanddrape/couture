
const React = require('react');

const UserLogin = require('./UserLogin.jsx');

class MandateUserLogin extends React.Component {
  componentDidMount() {
    BowAndDrape.dispatcher.on("user", (user) => {
      if (user.email)
        location.reload();
    });
  }

  render () {
    return (<UserLogin />)
  }
}

module.exports = MandateUserLogin;
