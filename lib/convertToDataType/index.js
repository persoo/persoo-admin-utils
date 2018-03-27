'use strict';

/* Basic data types are  boolean | int | long | double | string | slug | list | map | <type>List | <type>Map
    @see MapOperator in persoo dataflows
*/
function getBasicDataType(dataType) {
    var basicDataType = 'string';
    switch (dataType) {
        case 'boolean':
            basicDataType = 'boolean';
            break;
        case 'int':
        case 'long':
        case 'time':
        case 'timestamp':
        case 'duration':
            basicDataType = 'long';
            break;
        case 'double':
        case 'percent':
        case 'currency':
            basicDataType = 'double';
            break;
        case 'slug':
        case 'string':
            basicDataType = "string";
            break;
        case 'list':
        case 'map':
            basicDataType = dataType;
            break;
        default:
            if (dataType.match(/Affinity/)) {
                throw new Error('Cannot convert to Affinity types.');
            } else if (dataType.match(/[Ll]ist$/)) {
                basicDataType = getBasicDataType(dataType.replace(/[Ll]ist$/,'')) + 'List';
            } else if (dataType.match(/[Mm]ap$/)) {
                basicDataType = getBasicDataType(dataType.replace(/[Mm]ap$/,'')) + 'Map';
            } else {
                /* all other <object>IDs are strings */
                basicDataType = "string";
            }
    }
    return basicDataType;
}

/**
* may throw exceptions
*/
function convertToBasicDataType(value, basicDataType) {
    var result = value;
    switch (basicDataType) {
        case "boolean":
            result = !!value;
            break
        case "int":
        case "long":
            if (typeof value == 'boolean') {
                result = value ? 1 : 0;
            } else {
                result = parseInt(value);
            }
            if (isNaN(result)) {
                throw new Error("Cannot convert value '" + value + "' to integer number.");
            }
            break;
        case "float":
        case "double":
            if (typeof value == 'boolean') {
                result = value ? 1 : 0;
            } else {
                result = parseFloat(value);
            }
            if (isNaN(result)) {
                throw new Error("Cannot convert value '" + value + "' to floating point number.");
            }
            break;
        case "string":
            result = value.toString();
            break;
        case "slug":
            result = value.toString();
            // TODO ocesat diakritiku a nahradit nepismenkove znaky
            break;
        default:
            if (basicDataType.match(/[Ll]ist$/)) {
                if (Array.isArray(value)) {
                    result = value;
                } else {
                    result = [value];
                }
                var itemDataType = basicDataType.replace(/[Ll]ist$/, '');
                if (itemDataType) { /* else dataType was 'list' and do not care of items type */
                    for (var i = 0; i < result.length; i++) {
                        result[i] = convertToBasicDataType(result[i], itemDataType);
                    }
                }
            } else if (basicDataType.match(/[Mm]ap$/)) {
                if (typeof value !== 'object') {
                    throw new Error("Value '" + value + "' is not an object.");
                } else  {
                    result = value;
                    var itemDataType = basicDataType.replace(/[Mm]ap$/, '');
                    if (itemDataType) { /* else dataType was 'map' and do not care of items type */
                        for (var prop in result) {
                            if (result.hasOwnProperty(prop)) {
                                result[prop] = convertToBasicDataType(result[prop], itemDataType);
                            }
                        }
                    }
                }
            } else {
                /* do not convert it */
                result = value;
            }
    }
    return result;
};

module.exports = {
    getBasicDataType: getBasicDataType,
    convertToBasicDataType: convertToBasicDataType,
    convertToDataType: function(value, dataType) {
        var result = {
            status: 'ok',
            value: null
        }
        var basicDataType = getBasicDataType(dataType);

        try {
            result.value = convertToBasicDataType(value, basicDataType);
        } catch (e) {
           result.status = 'error';
           result.errorMessage = e.message;
        }
        return result;
    }
};
