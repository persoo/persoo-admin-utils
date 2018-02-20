'use strict';

var embeddedJS = require('../templates/embeddedjs');

/** @return {string} inner framents between <% and %> */
function filterEJSFragments(templateString) {
    var parts = embeddedJS.parseTemplateText(templateString);
    var fragments = [];
    var isInsideJS = false;
    for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        if (p.match(/^<%/)) {
            isInsideJS = true;
        } else if (p.match(/%>$/)) {
            isInsideJS = false;
        } else if (isInsideJS) {
            fragments.push(p);
        }
    }
    return fragments.join(' ');
}

/** Get variables used in javascript code. Variables are
 *        products1, products2, ...
 *        db.<whatever.variable.name>
 *        profile.<whatever.variable.name>
 *        lastEvent.<whatever.variable.name>
 * @retrun map of variables, i. e. {"my.variable": true, "x": true} */
function getVariablesUsedInJSCode(jsString, usedVariables) {
    function isNumeric(obj) {
        return !isNaN(parseFloat(obj)) && isFinite(obj);
    }

    if (jsString) {
         var parts = jsString.split(/[^a-zA-Z0-9_.]+/g);
         var persooVariablePrefixes = ['db.', 'lastEvent.', 'session.', 'currentProduct.', 'currentCategory.'];
         for (var i = 0; i < parts.length; i++) {
             if (parts[i].indexOf('products') == 0 && isNumeric(parts[i][8])) {
                 var prodVarName = parts[i].replace(/(products[0-9]+).*/, '$1');
                 usedVariables[prodVarName] = true;
             }
             if (parts[i].indexOf('profile.') == 0) {
                 usedVariables[parts[i].replace('profile.', '')] = true;
             }
             for (var j = 0; j < persooVariablePrefixes.length; j++) {
                 if (parts[i].indexOf(persooVariablePrefixes[j]) == 0) {
                     usedVariables[parts[i]] = true;
                     break;
                 }
             }
         }
    }
    return usedVariables;
}

function getVariablesUsedInTemplate(templateString, usedVariables) {
    usedVariables = usedVariables || {};
    templateString = filterEJSFragments(templateString);
    getVariablesUsedInJSCode(templateString, usedVariables);
    return usedVariables;
}

/* Get map with templates (possibly recursive map of map of templates) and
 * find all variables used in all templates.
 */
function getVariablesUsedInContentFields(fields, usedVariables) {
    usedVariables = usedVariables || {};
    for (var field in fields) {
        var template = fields[field];
        if (typeof template == 'string') {
            getVariablesUsedInTemplate(template, usedVariables);
        } else if (typeof template == 'object') {
            getVariablesUsedInContentFields(template, usedVariables);
        }
        // ignore numbers, booleans, ...
    }
    return usedVariables;
}


function getVariablesUsedInProductSearchAlgorithm(algorithmConfig, usedVariables) {
    function getUsedVariablesInRules(list, usedVariables) {
        if (list) {
            for (var i = 0; i < list.length; i++) {
                var ruleConfig = list[i];
                /* exampleRuleConfig = {
                    "variable": "itemGroupID"
                    "operator": "inVariable",
                    "args": [["profile", "db.products.inBasket"]],
                }  */
                if (ruleConfig.operator.match(/Variable$/) && ruleConfig.args && ruleConfig.args[0]) {
                    var variableID = ruleConfig.args[0][1];
                    usedVariables[variableID] = true;
                } else if (ruleConfig.operator.match(/Expression$/) && ruleConfig.args && ruleConfig.args[0]) {
                    getVariablesUsedInJSCode(ruleConfig.args[0][0], usedVariables);
                }
            }
        }
    }

    getUsedVariablesInRules(algorithmConfig.config.must, usedVariables);
    getUsedVariablesInRules(algorithmConfig.config.mustNot, usedVariables);
    getUsedVariablesInRules(algorithmConfig.config.should, usedVariables);
    return usedVariables;
}

function getVariablesUsedInAlgorithm(algorithmConfig, usedVariables, algorithmsMap) {
    switch (algorithmConfig.class) {
        case 'ProductSearch':
            getVariablesUsedInProductSearchAlgorithm(algorithmConfig, usedVariables);
            break;
        case "LastViewed":
            usedVariables["db.products.viewed"] = true;
            usedVariables["db.products.viewedRecently"] = true;
            // usedVariables["db.affinityToProduct.lastAccess"] = true;
            break;
        case "ProductVariantsInBasket":
            usedVariables["db.productVariants.inBasket"] = true;
            break;
        case "ViewedProductsPriceDrop":
            usedVariables["db.products.viewed"] = true;
            break;
        case "Fallbacks":
            getVariablesUsedInFallbacksAlgorithm_inner(algorithmConfig.config.fallbacks, usedVariables, algorithmsMap);
            break;
        default:

    }
    return usedVariables;
}

function getVariablesUsedInFallbacksAlgorithm_inner(fallbacksConfig, usedVariables, algorithmsMap) {
    for (var i = 0; i < fallbacksConfig.length; i++) {
        getVariablesUsedInJSCode(fallbacksConfig[i].condition, usedVariables);
        var fbAlgorithmID = fallbacksConfig[i].ref;
        var fbAlgorithmConfig = algorithmsMap[fbAlgorithmID];
        if (fbAlgorithmConfig) {
            getVariablesUsedInAlgorithm(fbAlgorithmConfig, usedVariables, algorithmsMap);
        }
    }
}

/**
@param {object} offerVariantConfig json (offer.variant[*] json)
@param {object} usedVariables map where to add new used variables
@param {object} algorithmsMap map by algorithmID of algorithm jsons
@param {boolean} includeTemplate variables (or algorithms only variables)
*/
function getVariablesUsedInScenario(scenarioVariantConfig, usedVariables, algorithmsMap, includeTemplate) {
    usedVariables = usedVariables || {};
    if (includeTemplate) {
        getVariablesUsedInTemplate(scenarioVariantConfig.template, usedVariables);
    }
    getVariablesUsedInFallbacksAlgorithm_inner(scenarioVariantConfig.logic.fallbacks, usedVariables, algorithmsMap);
    return usedVariables;
}

/** When offer is
var offer = {
    variants: [
        offerVariantConfig,
        ...
    ]
}

and offerVariantConfig is
{
    templateID: 'templateID1',
    content: {
        fieldID: 'myFieldValue'
    },
    scenarios: [
        {id: 'products1', scenarioID: 'sampleScenarioID'}
    ]
}
@param {object} offerVariantConfig json (offer.variant[*] json)
@param {object} contentTemplate json
@param {object} usedVariables map where to add new used variables
@param {object} algorithmsMap map by algorithmID of algorithm jsons
@param {object} scenariosMap map by scenarioID of scenarios jsons
*/
function getVariablesUsedInOffer(offerVariantConfig, contentTemplate, usedVariables, algorithmsMap, scenariosMap) {
    usedVariables = usedVariables || {};
    if (offerVariantConfig.content) {
        getVariablesUsedInContentFields(offerVariantConfig.content, usedVariables);
    }
    if (contentTemplate) {
        var contentTemplateMasterFields = ['template', 'htmlBody', 'textBody', 'subject'];
        for (var i = 0; i < contentTemplateMasterFields.length; i++) {
            var masterFieldName = contentTemplateMasterFields[i];
            if (contentTemplate[masterFieldName]) {
                getVariablesUsedInTemplate(contentTemplate[masterFieldName], usedVariables);
            }
        }
    }
    if (offerVariantConfig.scenarios) {
        for (var j = 0; j < offerVariantConfig.scenarios.length; j++) {
            var refScenarioConfig = offerVariantConfig.scenarios[j];
            var variableID = refScenarioConfig.id;
            if (usedVariables[variableID]) { /* when "products1" variable not in the content, no need to call such scenario */
                delete usedVariables[variableID];
                var scenarioID = refScenarioConfig.scenarioID;
                for (var variantID in scenariosMap[scenarioID].variants) {
                    var scenarioVariantConfig = scenariosMap[scenarioID].variants[variantID];
                    getVariablesUsedInScenario(scenarioVariantConfig, usedVariables, algorithmsMap, false);
                }
            }
        }
    }
    return usedVariables;
}

module.exports = {
    filterEJSFragments: filterEJSFragments,
    getVariablesUsedInTemplate: getVariablesUsedInTemplate,
    getVariablesUsedInContentFields: getVariablesUsedInContentFields,
    getVariablesUsedInOffer: getVariablesUsedInOffer,
    getVariablesUsedInAlgorithm: getVariablesUsedInAlgorithm,
    getVariablesUsedInScenario: getVariablesUsedInScenario
};
