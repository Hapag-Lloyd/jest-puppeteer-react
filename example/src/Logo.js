import React, { Component } from 'react';

export default class Logo extends Component {
    render() {
        const { test } = this.props;

        let text = 'test';
        if (test) {
            text = 'test2';
        }
        return <div>{text}</div>;
    }
}
