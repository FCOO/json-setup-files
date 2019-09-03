/****************************************************************************
	json-setup-files.js,

	(c) 2019, FCOO

	https://github.com/FCOO/json-setup-files
	https://github.com/FCOO

Methods to read and adjust json-setup-files

It implements a simple way to make simple ref in one json-file to data in another file
and a way to have dafault-values that are inserted in the records

Example:
The file /path-to-the-file/aFile.json contains
{
    "id-1": ['this', 'is', 'an', 'array],
    "id-2": "This is a string"
}

The file setup.json contains
{
    default: {
        "default-3": 3,
        "default-record": {
            "rec-1": "default-value-1",
            "rec-2": "default-value-2"
            "rec-3": "default.default-3"
        }
    },
    alias : {
        "aFile": "/path-to-the-file/aFile.json*
    },

    record: {
        default: "default.default-record",
        "rec-2": "individuel-value-2"
        "rec-3": "default-3"
        "rec-4": "aFile.id-1",
        "aFile_id": "id-2"
    }
}

loadJsonSetupFile("setup.json", resolveFunc ) will call resolveFunc with
{
    record: {
        "rec-1"   : "default-value-1",
        "rec-2"   : "individuel-value-2"
        "rec-3"   : 3,
        "rec-4"   : ['this', 'is', 'an', 'array],
        "aFile_id": "id-2",
        "aFile"   : "This is a string"
    }
}

There are two way (#1 and #2) to make reference to data in another file:
{
    alias: {
        "external": "path to a json-file"
    }
    "external"   : "id-in-external", //#1
    "external_id": "id-in-external", //#2
}
#! will replace "id-in-external" with {content from the file}
#2 will add "external": {content-from-the-file} and keep "external_id" as a ref to the values inserted

****************************************************************************/
(function ($, window, document, undefined) {
	"use strict";

    //Create fcoo-namespace
	var ns = window;

    /**************************************************
    visitAll( json, function(id, data, type, parent), onlyType, onlyFirstLevel
    type = 'string', 'simple', 'object', 'array'
    onlyType = string of type. Ex "string object"

    **************************************************/
    function visitAll( json, func, onlyType, onlyFirstLevel ){
        onlyType = onlyType || '';
        var onlyTypeList = onlyType.split();
        function allowType(type){
            return (onlyType == '') || (onlyTypeList.indexOf(type) > -1);
        }

        $.each( json, function( id, data ){
            var dataType = $.type(data);
            if (!onlyFirstLevel && ((dataType == "object") || (dataType == "array")) )
                visitAll(data, func, onlyType);
            if (allowType(dataType))
                func( id, data, dataType, json );

        });
    }

    function visitAllString( json, func, onlyFirstLevel) {
        return visitAll( json, func, 'string', onlyFirstLevel );
    }
    function visitAllObject( json, func, onlyFirstLevel) {
        return visitAll( json, func, 'object', onlyFirstLevel );
    }

    /*************************************************
    finaliseJson( json, resolve )
    *************************************************/
    function finaliseJson( json, resolve ){
        var result = $.extend({}, json);

        //*********************************************
        //replaceJson( json, fromId )
        //Replace all "[fromId].XX.YY" with values from [fromId].XX.YY (if any)
        //Since [fromId] it self can contain [fromId]-values
        //the process is repeated until no chabges was made
        function replaceJson( fromId ){
            var values    = result[fromId] || {},
                changed   = true,
                anyChange = false;

            while (changed){
                changed = false;
                visitAllString( result, function(id, value, type, parent){
                    var idLgd = fromId.length+1;
                    if (value.substring(0, idLgd) == fromId+'.'){
                        //Try to get data fromn values
                        var subIds = '["' + value.substring(idLgd).split('.').join('"]["') + '"]',
                            f = new Function('values', 'return values'+subIds+';'),
                            newValue = undefined;
                        try {
                            newValue = f(values);
                        }
                        catch (error){
                            newValue = undefined;
                        }
                        if (newValue !== undefined){
                            parent[id] = newValue;
                            changed = true; anyChange = true;
                        }
                    }
                });
            }
            return anyChange;
        }
        //*********************************************

        var replaceIdList = ['default'];
        $.each( result.alias, function(id){
            replaceIdList.push( id );
        });

        //If a record have a "XXX_id": "any_id" => add "XXX": "XXX.any_id" to get replaced later
        visitAllString( result, function(id, value, type, parent){
            //id ends with "_id"
            if (id && ($.type(id) == "string") && (id.substring(id.length - 3) == '_id')){
                var ref = id.split('_')[0];
                if (replaceIdList.indexOf(ref) > -1)
                    parent[ref] = ref+'.'+value;
            }
        });

        var anyChanged = true;
        while (anyChanged){
            anyChanged = false;
            $.each(replaceIdList, function(index, id){
                if (replaceJson( id ))
                    anyChanged = true;
            });
        }

        //Adjust any record with its default record (if any)
        visitAllObject( result, function(id, data, type, parent){
            if (data.default && ($.type(data.default) == 'object')){
                parent[id] = $.extend({}, data.default, parent[id]);
                delete parent[id].default;
            }
        });

        //Remove alias and default and alias-values
        replaceIdList.push('alias');
        $.each( replaceIdList, function(index, id){
            delete result[id];
        });

        resolve( result );
    }

    /*************************************************
    processJsonFile( json )
    *************************************************/
    function processJsonFile( json, resolve, reject ){
        //If json contains ref to files => load all and process when all are loaded
        if (json.alias){
            var aliasList = [];
            $.each(json.alias, function(id, fileName){
                aliasList.push( Promise.getJSON(fileName, {}, function(aliasJson){ json[id] = aliasJson; }, reject) );
            });
            Promise.all(aliasList).then(function(){finaliseJson( json, resolve );});
        }
        else
            finaliseJson( json, resolve );
    }

    /*************************************************
    loadJsonSetupFile( fileName, resolve, reject )
    *************************************************/
    ns.loadJsonSetupFile = ns.loadJSONSetupFile = function( fileName, resolve, reject ){
        Promise.getJSON(fileName, {}, function(json){ processJsonFile(json, resolve, reject); }, reject );
    };

}(jQuery, this, document));


