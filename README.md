# persoo-admin-utils

Utilities for Persoo Admin Objects used both on Persoo server and Persoo UI.

 * [Installation](#installation)
 * [Render Templates Usage](#render-templates-usage)
 * [Convert Value to Persoo DataType](#convert-to-persoo-datatype)
 * [Used Variables Usage](#used-variables-usage)
 * [Tests](#tests)
 * [Contributing](#contributing)


## Installation

  `npm install persoo-admin-utils`

## Render Templates Usage

... for rendring EJS templates using Persoo admin structures.

Include js library in your code. Then you can render "persoo templates" by calling `persooTemplates.render()` and providing widget instance (content and configuration for each template) and context (global settings related to each customer, i.e. recommended products to be rendered).

```javascript
    var persooTemplates = require('persoo-admin-utils/lib/templates');

    var templateString = "Master template using predefined field as EJS variables, i.e. <%= fieldID %>";    
    var offerContentInstance = {
        templateID: 'templateID1',
        content: {
            fieldID: 'myFieldValue'
        },
        scenarios: [
            {id: 'products1', scenarioID: 'sampleScenarioID'}
        ]
    };
    var context = {};

    var renderedHTML = persooTemplates.render(templateString, offerContentInstance, context);
```
Output for the example above should be `Master template using predefined field as EJS variables, i.e. myFieldValue`

See unit tests for more examples.

> Note: in Persoo, each offer contains possible variants for AB testing. Thus inside Persoo, there is
```javascript
var offer = {
    variants: [
        offerContentInstance,
        ...
    ]
}
```
thus Persoo developers calls
```
var renderedHTML = persooTemplates.render(templateString, offer.variants[0], context);
```

> Note: Fields passed in context are rendered as well, except for fields, whose name ends with 'Template' suffix.
I.e. ItemTemplate: "<%= abc %>" will be kept as it is. It's usefull for adding template strings to Widget configurations.

## Used Variables Usage

... to list all variables from visitor profile, which are used in content templates and referred algorithms (possibly recursively called)

```javascript
    var getUsedVariables = require('persoo-admin-utils/lib/getUsedVariables');

    var offerVariantConfig = {
        templateID: 'templateID1',
        content: {
            fieldID: 'myFieldValue'
        },
        scenarios: [
            {id: 'products1', scenarioID: 'SCE1'}
        ]
    };
    var contentTemplate = {
        fields: [],
        groups: [],
        template: "<% if(profile.gender == 'man') { %> for man <% } %>"
    }
    var algorithmsMap = { // Mock all algorithms: they are required for reference look up
        ALG1: {
            class: "ProductSearch",
            config: {
                "must": [
                    {
                        "args": [["profile", "db.products.inBasket"]],
                        "operator": "inVariable",
                        "variable": "itemGroupID"
                    },
                ],
                "mustNot": [],
                "should": []
            }
        },
        ALG2: {
            class: "ProductSearch",
            config: {
                "must": [
                    {
                        "args": [["profile", "db.products.viewed"]],
                        "operator": "inVariable",
                        "variable": "itemGroupID"
                    },
                ],
                "mustNot": [],
                "should": []
            }
        }
    };
    var scenariosMap = { // Mock all scenarios: they are required for reference look up
        SCE1: {
            variants: [{
                "id": "0",
                "condition": "url.host.indexOf('my.cz') >= 0",
                "logic": {
                    "count": 10,
                    "fallbacks": [
                        { "ref": "ALG1" },
                        { "ref": "ALG2" }
                    ],
                    "minCount": 4
                },
                "name": "default",
                "template": "<% profile.x %>"
            }]
        }
    };

    var usedVariables = getUsedVariables.getVariablesUsedInOffer(offerVariantConfig, contentTemplate, {}, algorithmsMap, scenariosMap);
```
Output for the example above should be `{"db.products.viewed": true, ...}`

See unit tests for more examples.

> Note: in Persoo, each offer contains possible variants for AB testing. Thus inside Persoo, there is
```javascript
var offer = {
    variants: [
        offerContentInstance,
        ...
    ]
}
```
thus Persoo developers calls
```
var renderedHTML = persooTemplates.render(templateString, offer.variants[0], context);
```

## Convert to persoo dataType
... to convert any value to desired persoo data type. Or to get error message.

```javascript
var convertToDataType = require('persoo-admin-utils/lib/convertToDataType');

// convertToDataType(value, dataType);
result = convertToDataType.convertToDataType("123", 'longList'); // will return
result == {
    status: 'ok', // or 'error'
    value: [123]
    // errorMessage: 'Cannot covert ...' // for errors statuses
}
```

You may also use methods
```
convertToDataType.isNumeric(dataType): boolean
convertToDataType.getBasicDataType(dataType): string of ['boolean', 'long', 'double', 'string',...]
```


## Tests

  `npm test`

## Contributing

In lieu of a formal style guide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code.
