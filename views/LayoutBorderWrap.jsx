
const React = require('react');

class LayoutBorderWrap extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            expanded: false,
            desktop_mode: false,
        }
    }

    render() {
        return (
            <div className="border-wrap"></div>
        );
    }

}

module.exports = LayoutBorderWrap;
