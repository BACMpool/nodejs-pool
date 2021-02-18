"use strict";

const argv = require('minimist')(process.argv.slice(2));

if (!argv.hash) {
	console.error("Please specify altblock hash");
	process.exit(1);
}
const hash = argv.hash;

require("../init_mini.js").init(function() {
	let txn = global.database.env.beginTxn();
        let cursor = new global.database.lmdb.Cursor(txn, global.database.altblockDB);
        for (let found = cursor.goToFirst(); found; found = cursor.goToNext()) {
        	cursor.getCurrentBinary(function(key, data){  // jshint ignore:line
			let blockData = global.protos.AltBlock.decode(data);
			if (blockData.hash === hash) {
				console.log("Found altblock with " + blockData.hash + " hash");
                                global.coinFuncs.getPortAnyBlockHeaderByHash(blockData.port, argv.hash, false, function (err, body) {
					if (err) {
					        cursor.close();
					        txn.commit();
						console.error("Can't get block header");
						process.exit(1);
					}
					console.log("Changing raw block reward from " + blockData.value + " to " + body.reward);
					//blockData.value = body.reward;
					//txn.putBinary(global.database.altblockDB, key, global.protos.AltBlock.encode(blockData));
					txn.commit();
					cursor.close();
					console.log("Changed altblock");
					process.exit(0);
				});
			}
		});
        }
        cursor.close();
        txn.commit();
	console.log("Not found altblock with " + hash + " hash");
	process.exit(1);
});
