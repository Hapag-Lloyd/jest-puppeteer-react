import leftPad from '../leftPad';

describe('leftPad', () => {
    test('should pad correctly', () => {
        const padded = leftPad('test', 6);
        expect(padded).toEqual('  test');
    });
});
