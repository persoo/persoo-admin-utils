var expect = require('chai').expect;
var assert = require('assert');

var convertToDataType = require('../lib/convertToDataType/index');

describe('convert and validate to dataType', function() {

    it('convertToBasicDataType()', function() {
        var testCases = [
            { value: true, dataType: 'boolean', result: true, exception: false },
            { value: 123, dataType: 'boolean', result: true, exception: false },
            { value: 123.45, dataType: 'boolean', result: true, exception: false },
            { value: '123', dataType: 'boolean', result: true, exception: false },
            { value: '123.45', dataType: 'boolean', result: true, exception: false },
            { value: 'abc', dataType: 'boolean', result: true, exception: false },
            { value: [], dataType: 'boolean', result: true, exception: false },
            { value: {}, dataType: 'boolean', result: true, exception: false },

            { value: false, dataType: 'boolean', result: false, exception: false },
            { value: 0, dataType: 'boolean', result: false, exception: false },
            { value: 0.0, dataType: 'boolean', result: false, exception: false },
            { value: "", dataType: 'boolean', result: false, exception: false },
            { value: true, dataType: 'int', result: 1, exception: false },
            { value: false, dataType: 'int', result: 0, exception: false },
            { value: 123, dataType: 'int', result: 123, exception: false },
            { value: 123.45, dataType: 'int', result: 123, exception: false },
            { value: '123', dataType: 'int', result: 123, exception: false },
            { value: '123.45', dataType: 'int', result: 123, exception: false },
            { value: 'abc', dataType: 'int', result: NaN, exception: true },
            { value: [], dataType: 'int', result: NaN, exception: true },
            { value: {}, dataType: 'int', result: NaN, exception: true },

            { value: true, dataType: 'double', result: 1, exception: false },
            { value: false, dataType: 'double', result: 0, exception: false },
            { value: 123, dataType: 'double', result: 123, exception: false },
            { value: 123.45, dataType: 'double', result: 123.45, exception: false },
            { value: '123', dataType: 'double', result: 123, exception: false },
            { value: '123.45', dataType: 'double', result: 123.45, exception: false },
            { value: 'abc', dataType: 'double', result: NaN, exception: true },
            { value: [], dataType: 'double', result: NaN, exception: true },
            { value: {}, dataType: 'double', result: NaN, exception: true },

            { value: true, dataType: 'string', result: "true", exception: false },
            { value: 123, dataType: 'string', result: "123", exception: false },
            { value: 123.45, dataType: 'string', result: "123.45", exception: false },
            { value: '123', dataType: 'string', result: "123", exception: false },
            { value: '123.45', dataType: 'string', result: "123.45", exception: false },
            { value: 'abc', dataType: 'string', result: 'abc', exception: false },
            { value: [], dataType: 'string', result: "", exception: false },
            { value: [1,2,3], dataType: 'string', result: "1,2,3", exception: false },
            { value: {}, dataType: 'string', result: "[object Object]", exception: false },

            { value: 'abc', dataType: 'intList', result: [NaN], exception: true },
            { value: 123, dataType: 'intList', result: [123], exception: false },
            { value: ['abc'], dataType: 'intList', result: [NaN], exception: true },
            { value: [123], dataType: 'intList', result: [123], exception: false },

            { value: 123, dataType: 'stringList', result: ["123"], exception: false },
            { value: [123], dataType: 'stringList', result: ["123"], exception: false },

            { value: "123", dataType: 'list', result: ["123"], exception: false },
            { value: [123], dataType: 'list', result: [123], exception: false },

            { value: 'abc', dataType: 'intMap', result: null, exception: true },
            { value: 123, dataType: 'intMap', result: null, exception: true },
            { value: {x:'abc'}, dataType: 'intMap', result: {x:NaN}, exception: true },
            { value: {x:123}, dataType: 'intMap', result: {x:123}, exception: false },

            { value: {x:'abc'}, dataType: 'stringMap', result: {x:'abc'}, exception: false },
            { value: {x:123}, dataType: 'stringMap', result: {x:'123'}, exception: false },

            { value: {x:'abc'}, dataType: 'map', result: {x:'abc'}, exception: false },
            { value: {x:123}, dataType: 'map', result: {x:123}, exception: false },
       ];

        for (var i = 0; i < testCases.length; i++) {
            var testCase = testCases[i];
            var result = null;
            var exception = false;
            try {
                result = convertToDataType.convertToBasicDataType(testCase.value, testCase.dataType);
            } catch(e) {
                exception = true;
            }
            expect(exception).to.equal(testCase.exception);
            if (!exception) {
                if (Array.isArray(result) || typeof result == 'object') {
                    expect(result).to.deep.equal(testCase.result);
                } else {
                    expect(result).to.equal(testCase.result);
                }
            }
        }
    });

    it('convertToDataType()', function() {
        var testCases = [
            { value: '123', dataType: 'long', resultStatus: 'ok', result: 123 },
            { value: '123', dataType: 'string', resultStatus: 'ok', result: '123' },
            { value: '123', dataType: 'stringList', resultStatus: 'ok', result: ['123'] },
            { value: '123', dataType: 'unknownId', resultStatus: 'ok', result: '123' }
        ];
        for (var i = 0; i < testCases.length; i++) {
            var testCase = testCases[i];
            var result = convertToDataType.convertToDataType(testCase.value, testCase.dataType);

            expect(result.status).to.equal(testCase.resultStatus);
            if (Array.isArray(result.value) || typeof result.value == 'object') {
                expect(result.value).to.deep.equal(testCase.result);
            } else {
                expect(result.value).to.equal(testCase.result);
            }
        }
    });
});
