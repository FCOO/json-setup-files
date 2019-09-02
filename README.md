# json-setup-files
>


## Description
Read json-files and insert default and external data into data


## Installation
### bower
`bower install https://github.com/FCOO/json-setup-files.git --save`

## Demo
http://FCOO.github.io/json-setup-files/demo/ 

## Usage
        window.loadJsonSetupFile( 'data/setup.json',
            function( json ) { console.log('resolve:', json ); },
            function( error ){ console.log('error:', error );  },
        );

**SEE src/json-setup-files.js for description on formats**


### Example
The file `/path-to-the-file/aFile.json` contains

    {
        "id-1": ['this', 'is', 'an', 'array],
        "id-2": "This is a string"
    }

The file `setup.json` contains

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

Calling `loadJsonSetupFile("setup.json", resolveFunc )` will call `resolveFunc` with

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


There are two way (no1 and no2) to make reference to data in another file:

    {
        alias: {
            "external": "path to a json-file"
        }
        "external"   : "id-in-external", //no1
        //OR
        "external_id": "id-in-external", //no2
    }

no1 will replace `"id-in-external"` with `{content from the file}`
no2 will add `"external": {content-from-the-file}` and keep `"external_id"` as a ref to the values inserted


## Copyright and License
This plugin is licensed under the [MIT license](https://github.com/FCOO/json-setup-files/LICENSE).

Copyright (c) 2019 [FCOO](https://github.com/FCOO)

## Contact information
Niels Holt nho@fcoo.dk