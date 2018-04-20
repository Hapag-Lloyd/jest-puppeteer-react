import React from 'react';
import { mount } from 'enzyme';

import Button from '../Button';

describe('Button', () => {
    test('should render correctly', () => {
        const wrapper = mount(<Button label="Button" />);

        expect(wrapper).toMatchSnapshot();
    });
});
