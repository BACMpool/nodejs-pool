"use strict";

let range = require('range');
const argv = require('minimist')(process.argv.slice(2));

let depth = 10;
if (argv.depth) depth = argv.depth;

console.log("Dumping shares");

require("../init_mini.js").init(function() {

        global.coinFuncs.getLastBlockHeader(function (err, body) {
                if (err !== null) {
                        console.error("Invalid block header");
                        process.exit(1);
                }
                let lastBlock = body.height + 1;
                let txn = global.database.env.beginTxn({readOnly: true});

                let cursor = new global.database.lmdb.Cursor(txn, global.database.shareDB);
                range.range(lastBlock, lastBlock - depth, -1).forEach(function (blockID) {
                        for (let found = (cursor.goToRange(parseInt(blockID)) === blockID); found; found = cursor.goToNextDup()) {
                                cursor.getCurrentBinary(function(key, data){  // jshint ignore:line
                                        let shareData = global.protos.Share.decode(data);
                                        var d = new Date(shareData.timestamp);
                                        console.log(d.toString() + ": " + JSON.stringify(shareData))
                                });
                        }
                });
                cursor.close();
                txn.commit();
                process.exit(0);
        });
});
