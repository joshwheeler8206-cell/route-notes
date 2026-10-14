/* auto-generated demo seed for route-notes */
var __SEED_DBS__ = {
"usaf_route_notes_db": {
"key": "usaf_route_notes_v1",
"value": [
{
"id": "r1",
"name": "Tuesday North Run",
"createdAt": "2026-08-04T06:30:00.000Z",
"routeDate": "2026-08-04",
"stops": [
{
"name": "OROURKE MOTORS",
"cod": false,
"instructions": "Dock 3, need pallet jack",
"notes": "Signed for 14 skids"
},
{
"name": "MIDWEST AUTO PARTS",
"cod": true,
"instructions": "C.O.D. \u2014 collect check from Amy at front office",
"notes": "Check #4821 collected"
},
{
"name": "CARDINAL SPEEDSHOP",
"cod": false,
"instructions": "",
"notes": ""
}
]
},
{
"id": "r2",
"name": "Friday South Loop",
"createdAt": "2026-08-07T05:45:00.000Z",
"routeDate": "2026-08-07",
"stops": [
{
"name": "RIVERSIDE GARAGE",
"cod": false,
"instructions": "Ring bell at side door",
"notes": ""
},
{
"name": "HILLCREST TIRE & AUTO",
"cod": true,
"instructions": "2 C.O.D. invoices",
"notes": ""
},
{
"name": "VALLEY PERFORMANCE",
"cod": false,
"instructions": "Liftgate only",
"notes": ""
}
]
}
]
},
"usaf_roster_db": {
"key": "usaf_roster_v1",
"value": [
{
"name": "Marcus Reed",
"license": "DRV-1024",
"warehouse": "OKC North",
"hireDate": "2021-09-10",
"trainer": "J. Kowalski",
"phone": "405-555-0142",
"licenseExp": "2029-07-04",
"medCardExp": "2031-02-28"
},
{
"name": "Alicia Santos",
"license": "DRV-1087",
"warehouse": "OKC North",
"hireDate": "2022-08-15",
"trainer": "S. Nakamura",
"phone": "405-555-0188",
"licenseExp": "2028-11-12",
"medCardExp": "2027-01-30"
},
{
"name": "Darrell Whitfield",
"license": "DRV-1102",
"warehouse": "Tulsa Yard",
"hireDate": "2019-04-02",
"trainer": "T. Beaumont",
"phone": "918-555-0110",
"licenseExp": "2030-03-19",
"medCardExp": "2026-03-12"
},
{
"name": "Kyle Osei",
"license": "TRN-2001",
"warehouse": "OKC North",
"hireDate": "2026-05-01",
"trainer": "B. Tran",
"phone": "405-555-0173",
"licenseExp": "",
"medCardExp": ""
},
{
"name": "Rebecca Hall",
"license": "TRN-2007",
"warehouse": "Dallas Metro",
"hireDate": "2026-07-06",
"trainer": "S. Nakamura",
"phone": "214-555-0165",
"licenseExp": "",
"medCardExp": ""
}
]
}
};

function __seedPut__(dbName, key, value) {
  return new Promise(function (res, rej) {
    var rq = indexedDB.open(dbName, 1);
    rq.onupgradeneeded = function () { rq.result.createObjectStore('kv'); };
    rq.onsuccess = function () {
      var db = rq.result;
      var tx = db.transaction('kv', 'readwrite');
      tx.objectStore('kv').put(value, key);
      tx.oncomplete = function () { db.close(); res(); };
      tx.onerror = function () { db.close(); rej(tx.error); };
    };
    rq.onerror = function () { rej(rq.error); };
  });
}
var __seedChain__ = Promise.resolve();
Object.keys(__SEED_DBS__).forEach(function (db) {
  var key = __SEED_DBS__[db].key, val = __SEED_DBS__[db].value;
  __seedChain__ = __seedChain__.then(function () {
    return __seedPut__(db, key, val).then(function () {
      if (console && console.log) console.log('seeded', db, key, JSON.stringify(val).length + 'B');
    }, function (e) { if (console) console.warn('seed fail', db, e); });
  });
});
