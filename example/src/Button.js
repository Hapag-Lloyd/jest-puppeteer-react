import React, { Component } from 'react';
import PropTypes from 'prop-types';

export default class Button extends Component {
    static propTypes = {
        label: PropTypes.string,
    };

    render() {
        return <button>{this.props.label}</button>;
    }
}
