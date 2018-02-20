var expect = require('chai').expect;
var assert = require('assert');

var getUsedVariables = require('../lib/getUsedVariables/index');

describe('getUsedVariables utils', function() {

    it('filterEJSFragments()', function() {
        var caseResults = {
            'Rendered <%= dynamic %> Content': ' dynamic ',
            '<% if(true) { %> Content <% } %>': ' if(true) {   } ',
            'Rendered <%= dynamic %> Content <%= double + 123 %>': ' dynamic   double + 123 '
        }
        for (var template in caseResults) {
            var result = getUsedVariables.filterEJSFragments(template);
            expect(result).to.equal(caseResults[template]);
        }
    });

    it('getVariablesUsedInTemplate()', function() {
        var caseResults = {
            'Rendered <%= dynamic %> Content': {},
            '<% if(true) { %> Content <% } %>': {},
            'Rendered <%= db.varx + lastEvent.url %> Content <%= profile.data + 123 + profile.a[3+profile.b]%>': {
                'db.varx': true,
                'data': true,
                'lastEvent.url': true,
                'a': true,
                'b': true
            }
        }
        for (var template in caseResults) {
            var result = getUsedVariables.getVariablesUsedInTemplate(template);
        }
        expect(result).to.deep.equal(caseResults[template]);
    });

    it('getVariablesUsedInContentFields()', function() {
        var fieldsTestCases = {
            a: "<% profile.x %> abc <% profile.y %>",
            b: 123,
            c: true,
            d: "only static content",
            e: {
                x: "<% if (profile.z) { %> a b c z <%} %>"
            }
        }
        var expectedResultsForTestCases = {
            a: {x: true, y:true},
            b: {},
            c: {},
            d: {},
            e: {z: true}
        }

        for (var caseID in fieldsTestCases) {
            var result = getUsedVariables.getVariablesUsedInContentFields(fieldsTestCases[caseID], {});
        }
        expect(result).to.deep.equal(expectedResultsForTestCases[caseID]);
    });

    it('getVariablesUsedInProductSearchAlgorithm()', function() {
        var algorithmConfig = {
            class: "ProductSearch",
            config: {
                "must": [],
                "mustNot": [
                    {
                        "args": [["profile", "db.products.inBasket"]],
                        "operator": "inVariable",
                        "variable": "itemGroupID"
                    },
                    {
                        "args": [["profile", "db.products.purchased"]],
                        "operator": "inVariable",
                        "variable": "itemGroupID"
                    }
                ],
                "should": [
                    {
                        "args": [["currentProduct.itemGroupID + ''"]],
                        "operator": "inExpression",
                        "variable": "alsoViewed30Inverted",
                        "weight": 100
                    }
                ]
            }
        }
        var expectedUsedVariables = {
            "db.products.inBasket": true,
            "db.products.purchased": true,
            "currentProduct.itemGroupID": true
        }

        var result = getUsedVariables.getVariablesUsedInAlgorithm(algorithmConfig, {});
        expect(result).to.deep.equal(expectedUsedVariables);
    });

    var algorithmsMap = {
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
    var scenariosMap = {
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

    it('getVariablesUsedInScenario()', function() {
        var scenarioVariantConfig = scenariosMap.SCE1.variants[0];
        var expectedUsedVariables = {
            "db.products.inBasket": true,
            "db.products.viewed": true,
            "x": true
        }

        var result = getUsedVariables.getVariablesUsedInScenario(scenarioVariantConfig, {}, algorithmsMap, true);
        expect(result).to.deep.equal(expectedUsedVariables);
    });

    it('getVariablesUsedInOffer()', function() {
        var offerVariantConfig = {
            content: {
                a: "<% profile.x %> abc <% products1.length %>",
                b: 123,
                c: true,
                d: "only static content",
                e: {
                    x: "<% if (profile.y) { %> a b c z <%} %>"
                }
            },
            scenarios: [{
                id: "products1",
                scenarioID: "SCE1"
            }]
        }
        var contentTemplate = {
            fields: [],
            groups: [],
            template: "<% if(profile.gender) { %> man <% } %>"
        }
        var expectedUsedVariables = {
            x: true,
            y:true,
            gender: true,
            // products1: true // is deleted when eveluating scenario for products1
            "db.products.inBasket": true,
            "db.products.viewed": true
        }

        var result = getUsedVariables.getVariablesUsedInOffer(offerVariantConfig, contentTemplate, {}, algorithmsMap, scenariosMap);
        expect(result).to.deep.equal(expectedUsedVariables);
    });
});
