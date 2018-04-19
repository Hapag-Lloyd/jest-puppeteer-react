import React from 'react';
import { mount } from 'enzyme';

import Logo from '../Logo';

describe('Logo', () => {
    test('should render correctly', () => {
        const wrapper = mount(<Logo />);

        expect(wrapper).toMatchSnapshot();
    });
});
