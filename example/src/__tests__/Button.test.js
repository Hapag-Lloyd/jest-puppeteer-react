import React from 'react';
import { mount } from 'enzyme';

import Button from '../Button';

describe('Button', () => {
    test('should render correctly', () => {
        const wrapper = mount(<Button label="Button" />);

        expect(wrapper).toMatchSnapshot();
    });

    test.each([['row 1'], ['row 2'], ['row 3']])('test each %s', a => {
        expect(a).toMatchSnapshot();
    });

    describe('with describe', () => {
        test('should render correctly', () => {
            const wrapper = mount(<Button label="Button" />);

            expect(wrapper).toMatchSnapshot();
        });

        test.each([['row 1'], ['row 2'], ['row 3']])('test each %s', a => {
            expect(a).toMatchSnapshot();
        });
    });

    describe.each([[' 1'], [' 2'], [' 3']])('witch each describe %s !!', d => {
        test('should render correctly', () => {
            const wrapper = mount(<Button label={'Button' + d} />);

            expect(wrapper).toMatchSnapshot();
        });

        test.each([['row 1'], ['row 2'], ['row 3']])('test each %s', a => {
            expect(a + d).toMatchSnapshot();
        });
    });
});
