var AWS = require('aws-sdk');
const fs = require('fs');

exports.handler =  async function(event, context, callback) {
  parsed_event = JSON.parse(event.body);

  keepalive = parsed_event["keepalive"];
  data = parsed_event["data"];
  unique_code = parsed_event["unique_code"];
  table_format = parsed_event["table_format"];
  short_handed = parsed_event["short_handed"];

  if(typeof table_format == "undefined") {
    table_format = 9;
  } else {
    table_format = Number(table_format);
    if(table_format != 2 && table_format != 6 && table_format != 9) {
      table_format = 9;
    }
  }

  AWS.config.update({region: 'eu-west-1'});
  var ddb = new AWS.DynamoDB({apiVersion: '2012-08-10'});

  // Unique code is the hand history URL bit
  if(typeof unique_code !== "undefined") {
    // Backwards compatibility with older versions
    if(!unique_code.includes("hand=")) {
      unique_code = "hand=" + unique_code;
    }
  }

  /**
   * Upload hand to S3
   **/
  if(typeof data !== "undefined") {
    id_list = data["id_list"];
    raw_history = data["raw_history"];

    if(typeof raw_history !== "undefined") {
      try {
        var hand_code = unique_code;
        hand_code = hand_code.replace('hand=','');
        var bucket = new AWS.S3();
        const bucket_params = {
          Bucket: 'raw-hand-history',
          Key: hand_code + ".json",
          Body: JSON.stringify(raw_history)
        };
        bucket.upload(bucket_params, function(s3Err, data) {
          if (s3Err) throw s3Err
          console.log(`File uploaded successfully at ${data.Location}`)
         });
      } catch(err) {
        console.log("S3 Error:" + err);
      }
    }

    if(typeof id_list === "undefined") {
      id_list = []
    }

    response_data = {};
    var response = {};
    var items = {};
    var table_name = "hud_stats_" + table_format;

    // Store aliases
    for(name in id_list) {
      id = id_list[name];
      try {
        params = {
          TableName: "aliases",
          Item: {
            'id': {S: id},
            'name' : {S: name}
          }
        };
        await ddb.putItem(params).promise();
      } catch(err) {
        // Something went wrong
        console.log("Something went wrong... " + err);
      }
    }
    // Get updated aliases for player
    alias_map = {};
    id_list_finally = []
    for(name in id_list) {
      id = id_list[name];
      try {
        params = {
          TableName: "aliases",
          IndexName: "id-name-index",
          KeyConditionExpression: "id = :id",
          ExpressionAttributeValues: {
            ":id": {
              "S": id
            }
          }
        }
        var alias_response = await ddb.query(params).promise();
        try {
          var items = alias_response["Items"];
          for(record in items) {
            this_id = items[record]["id"]["S"];
            this_name = items[record]["name"]["S"];
            if(typeof alias_map[this_id] === "undefined") {
              alias_map[this_id] = []
            }
            alias_map[this_id].push(this_name);
          }
        } catch(err) {
          console.log("Something went wrong... " + err);
        }
      } catch(err) {
        console.log("Something went wrong... " + err);
      }
    }
    // Make results relevant to query
    for(alias_id in alias_map) {
      alias_array = alias_map[alias_id]
      var current_villain = "";
      for(name in id_list) {
        this_id = id_list[name];
        if(this_id == alias_id) {
          current_villain = name;
        }
      }
      for(index in alias_array) {
        if(typeof id_list_finally[current_villain] === "undefined") {
          id_list_finally[current_villain] = [];
        }
        id_list_finally[current_villain].push(alias_array[index]);
      }
    }

    in_hand_players = data["in_hand"];

    for (let player of in_hand_players) {
      var vpip = 0;
      var pfr = 0;
      var hands = 0;
      var showdowns = 0;
      var showdown_value = 0;
      var bbh = 0;
      var bbdef = 0;
      var tsdh = 0; // To showdown hands
      var tsd = 0; // To showdown
      var bet3h = 0; // 3bet hands
      var bet3 = 0; // 3bet
      var wwsf_h = 0;
      var wwsf = 0;
      var wsd_h = 0;
      var wsd = 0;
      var ftcb = 0;
      var ftcb_h = 0;
      var af_bet = 0;
      var af_call = 0;

      var villain_id = "0";
      for(name in id_list) {
        if(name == player) {
          villain_id = id_list[name].toString();
        }
      }

      /**
       * Try to get data from stats table.
       * If an error occurs, create the entry instead to initialize
       **/
      var params = {
        TableName: table_name,
        Key: {
          'id': {S: villain_id}
        }
      };

      try {
        var result = await ddb.getItem(params).promise();
        try {
          hands = result["Item"]["hands"]["N"]
          vpip = result["Item"]["vpip"]["N"]
          pfr = result["Item"]["pfr"]["N"]
          sdv = result["Item"]["ev"]["N"] // Showdown Value
          sdh = result["Item"]["sd"]["N"] // Showdown hands
          bbh = result["Item"]["bb_def_h"]["N"] // # Hands received in bb
          bbdef = result["Item"]["bb_def"]["N"] // # Hands defended from bb
          cb = result["Item"]["cbet"]["N"]
          pfa = result["Item"]["cbet_h"]["N"] // C-bet opportunities (after being aggressor)
          tsd = result["Item"]["sd"]["N"]
          bet3h = result["Item"]["bet3_h"]["N"]
          bet3 = result["Item"]["bet3"]["N"]
          wwsf_h = result["Item"]["wwsf_h"]["N"]
          wwsf = result["Item"]["wwsf"]["N"]
          wsd_h = result["Item"]["wsd_h"]["N"]
          wsd = result["Item"]["wsd"]["N"]
          ftcb = result["Item"]["ftcb"]["N"]
          ftcb_h = result["Item"]["ftcb_h"]["N"]
          af_bet = result["Item"]["af_bet"]["N"]
          af_call = result["Item"]["af_call"]["N"]
          bb_won = result["Item"]["bb_won"]["N"]
          street = result["Item"]["street"]["N"]
          
          vpip_p = (vpip > 0) ? ((100/hands)*vpip).toFixed(2) : 0;
          pfr_p = (pfr > 0) ? ((100/hands)*pfr).toFixed(2) : 0;
          ev_a = (sdh > 0) ? (sdv/sdh).toFixed(2) : 0.00;
          bbd_p = (bbdef > 0) ? ((100/bbh)*bbdef).toFixed(2) : 0;
          cb_p = (cb > 0) ? ((100/pfa)*cb).toFixed(2) : 0;
          tsd_p = (tsd > 0) ? ((100/vpip)*sdh).toFixed(2) : 0;
          bet3_p = (bet3 > 0) ? ((100/bet3h)*bet3).toFixed(2) : 0;
          bb_100 = (bb_won > 0 || bb_won < 0) ? ((bb_won / hands)*100).toFixed(2) : 0;
          avg_street = (street > 0) ? ((street / vpip).toFixed(2)) : 0;
          wwsf_p = (wwsf_h > 0) ? ((100/wwsf_h)*wwsf).toFixed(2) : 0;
          wsd_p = (wsd_h > 0) ? ((100/wsd_h)*wsd).toFixed(2) : 0;
          ftcb_p = (ftcb_h > 0) ? ((100/ftcb_h)*ftcb) : 0;
          if(af_call > 0) {
            if(af_bet > 0) {
              af = (af_bet / af_call);
            } else {
              // Infinite passive factor
              af = 0;
            }
          } else {
            if(af_bet > 0) {
              // Infinite aggression factor
              af = 42;
            } else {
              // Infinite passive factor
              af = 0;
            }
          }

          hp = (typeof hands !== "undefined") ? Number(hands) : 0;
          this_aliases = "";

          if(typeof id_list_finally[player] !== "undefined") {
            this_aliases = id_list_finally[player].join(", ");
          }
          response_data[player] = {
            vpip: vpip_p,
            pfr: pfr_p,
            cb_p: cb_p,
            ev: ev_a,
            bbd: bbd_p,
            hp: hp,
            cb_hp: pfa,
            bbd_hp: bbh,
            tsd_p: tsd_p,
            bet3_p: bet3_p,
            bb_100: bb_100,
            street: avg_street,
            ftcb_p: ftcb_p,
            wwsf: wwsf_p,
            wsd: wsd_p,
            af: af,
            aliases: this_aliases,
            is_weekly: true
          }
        }
        catch(err) {
          console.log("ERROR: " + err);
        }
      } catch(error) {
        console.log(error);
      }
    }
    response = {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify(response_data)
    }
    return(response);
  } else {
    response = {
      statusCode: 500,
      headers: {
	'Content-Type': 'application/json',
	"Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify("INVALID REQUEST")
    }
    return(response);
  }
}
