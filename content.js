/**
 *
 * __________       __     BLOCKCHAIN    ___ ___  ____ ___________   
 * \______   \____ |  | __ ___________  /   |   \|    |   \______ \  
 *  |     ___/  _ \|  |/ // __ \_  __ \/    ~    \    |   /|    |  \ 
 *  |    |  (  <_> )    <\  ___/|  | \/\    Y    /    |  / |    `   \
 *  |____|   \____/|__|_ \\___  >__|    \___|_  /|______/ /_______  /
 *                      \/    \/              \/                  \/
 *
 *                      (c) 2020 RainbowFlop.com
 **/

/**
 * CHANGELOG
 **/

var changelog = [
  'THIS VERSION',
  '------------',
  '- Optimized table summary code (HUD is faster now)',
  '- Preparation for 3-bet, and % to showdown stats',
  '0.0.31',
  '--------',
  '- Fixed syntax error',
  '0.0.30',
  '--------',
  '- When you sit out at a table, you will sit in and out after every new hand',
  '  has started, so that you will not lose your seat.',
  '0.0.29',
  '- Fixed quick table links',
  '- Added all time winnings/losses display',
  '',
  '0.0.28',
  '------',
  '- Added (non-freeroll) tournament tables to quick links',
  '0.0.27',
  '------',
  '- Stats are now based on the previous week of play plus the current week.',
  '  If there are insufficient hands, then all time stats will be displayed.',
  '  This should give you a better understanding of the current stats of villains.',
  '- Stats stick to a player, even if player changes name',
  '0.0.26',
  '------',
  '- Last hand strength was removed by blockchain.poker developers after',
  '  users massively started to call each other out. As such, hovering',
  '  will no longer display last hand strength unless cards were revealed',
  '- Fixed bug that emited socket messages prior to being logged in',
  '- Improved efficiency of code in general',
  '0.0.25',
  '------',
  '- Hovering over a player stats box now reveals their last hand strength',
  '- Fixed bug in table finder not waiting until after log in to find tables',
  '- Added CHANGELOG to HUD to inform users of new features',
  '',
  'Teaser for next release: Weekly stats are being implemented.',
  '',
  '0.0.24',
  '------',
  '- Added note icon. Hovering over stats box displays notes you have on players',
  '',
  '0.0.23',
  '------',
  '- Added table finder with quick links',
  '- Added icon for top 100 earners'
];

/**
 * Icons for villains
 **/

var clown_icon = '&#129313;';
var fish_icon = '&#128031;';
var king_icon = '&#9812;';
var maniac_icon = '&#128544;';
var newbie_icon = '&#128118;';
var shark_icon = '&#129416;';
var rainbow_icon = '&#127752;';
var robot_icon = '&#129302;';
var turtle_icon = '&#128034;';
var earner_icon = '&#127942;';
var note_icon = '&#128206;';

/**
 * Global variables
 **/

var apiKey = "unset";
var autotopup = false;
var betting_action = [];
var eula_agreed = false;
var last_changelog = 0;
var ev_map = [];
var hand_history = [];
var hand_history_map = {};
var hand_rank = [];
var hand_strength = "undefined";
var high_bet = 0;
var hud_components = [];
var last_round = "";
var open_tables = [];
var played_hand = [];
var player_notes = {};
var processed_hand = [];
var table_state = {};
var rewards_balance = 0;
var top_earners = [];
var tournament_tables = [];
var transaction_history = [];
var villain_alias_map = [];
var villain_bbd_hp_map = [];
var villain_bbd_map = [];
var villain_cb_hp_map = [];
var villain_cb_map = [];
var villain_ev_map = [];
var villain_hands = [];
var villain_is_weekly_map = [];
var villain_hp_map = [];
var villain_mucked = [];
var villain_pfr_map = [];
var villain_vpip = [];
var villain_vpip_map = [];
var vpip_hand = [];
var vpip_map = [];
var you_state = {};
var manifestData = chrome.runtime.getManifest();
var hud_version = manifestData.version;
var last_hand_id = 0;

/**
 * Add table_state script to pass window.table and window.you
 * to the extension
 **/

var s = document.createElement('script');
s.src = chrome.extension.getURL('table_state.js');
(document.head||document.documentElement).appendChild(s);
s.onload = function() {
    s.remove();
};

/**
 * Listener for socket returned data
 **/
document.addEventListener('RW759_connectExtension', function(e) {
  data = e.detail;
  rewards_balance = data.rewards_balance;
  top_earners = data.top_earners;
  open_tables = data.open_tables;
  player_notes = data.player_notes;
  tournament_tables = data.tournament_tables;
  transaction_history = data.transaction_history;
});

/**
 * Handle return messages
 **/
window.addEventListener('message', function(event) {
  if(event.origin !== 'https://blockchain.poker') return;
  let response = event.data;
  if(typeof response["type"] !== "undefined") {
    switch(response["type"]) {
      case "getHistoryResponse":
        hand_history = response["payload"];
        hand_id = response["hand_id"];
        result = JSON.stringify(parseHistory(hand_history));
        addToHistory(result, hand_id);
        break;
      case "getTableStateResponse":
        table_state = response["payload"];
        break;
      case "getYouStateResponse":
        you_state = response["payload"];
        break;
    }
  }
  return;
}, false);

/**
 * CSS code for mouseover tooltips
 **/
let tooltip_css = [
  "<style>.tooltip {",
  "  position: relative;",
  "  display: inline-block;",
  "  z-index: 1000;",
  "  border-bottom: 1px dotted black;",
  "}",
  "",
  ".tooltip .tooltiptext {",
  "  visibility: hidden;",
  "  width: 120px;",
  "  background-color: ",
  "fff;",
  "  color: ",
  "000;",
  "  text-align: center;",
  "  border-radius: 6px;",
  "  padding: 5px 0;",
  "  position: absolute;",
  "  z-index: 1000;",
  "  bottom: 125%;",
  "  left: 50%;",
  "  margin-left: -60px;",
  "  opacity: 0;",
  "  transition: opacity 0.3s;",
  "}",
  "",
  ".tooltip .tooltiptext::after {",
  "  content: '';",
  "  position: absolute;",
  "  top: 100%;",
  "  left: 50%;",
  "  margin-left: -5px;",
  "  border-width: 5px;",
  "  border-style: solid;",
  "  border-color: ",
  "555 transparent transparent transparent;",
  "}",
  "",
  ".tooltip:hover .tooltiptext {",
  "  visibility: visible;",
  "  background: #fff;",
  "  color: #000;",
  "  opacity: 1;",
  "}",
  "</style>"

].join("\n");
$("head").append(tooltip_css);

chrome.storage.sync.get({
  eula_agreed: false
}, function(items) {
  eula_agreed = items.eula_agreed;
  if(eula_agreed == false) {
    let eula_html = [
      "<div class='eula' style='opacity: 0.8; background: #000; width: 50%; height: 50%; z-index: 1000; top: 25%; left: 25%; position: fixed; border: 1px solid #fff; padding: 5px;'><h1><b>Agreement</b></h1><hr><textarea style='width: 99%; height: 60%; border:0px; resize: none; color: #fff; background-color: #000; '>This is a legal agreement between you and blockchainpokerhud.com",
      "",
      "This agreement governs your acquisition and use of our Blockchain Poker HUD software ('Software') directly from blockchainpokerhud.com or indirectly through a blockchainpokerhud.com authorized reseller or distributor (a 'Reseller').",
      "",
      "Please read this agreement carefully before completing the installation process and using the Blockchain Poker HUD software. It provides a license to use the Blockchain Poker HUD software and contains warranty information and liability disclaimers.",
      "",
      "By clicking 'I agree' or installing and/or using the Blockchain Poker HUD software, you are confirming your acceptance of the Software and agreeing to become bound by the terms of this agreement.",
      "",
      "If you are entering into this agreement on behalf of a company or other legal entity, you represent that you have the authority to bind such entity and its affiliates to these terms and conditions. If you do not have such authority or if you do not agree with the terms and conditions of this agreement, do not install or use the Software, and you must not accept this agreement.",
      "",
      "This agreement shall apply only to the Software supplied by blockchainpokerhud.com herewith regardless of whether other software is referred to or described herein. The terms also apply to any blockchainpokerhud.com updates, supplements, Internet-based services, and support services for the Software, unless other terms accompany those items on delivery. If so, those terms apply.",
      "",
      "blockchainpokerhud.com hereby grants you a personal, non-transferable, non-exclusive licence to use the Blockchain Poker HUD software on your devices in accordance with the terms of this agreement.",
      "",
      "You are permitted to load the Blockchain Poker HUD software (for example a PC, laptop, mobile or tablet) under your control. You are responsible for ensuring your device meets the minimum requirements of the Blockchain Poker HUD software.",
      "",
      "You are not permitted to:",
      "",
      "Edit, alter, modify, adapt, translate or otherwise change the whole or any part of the Software nor permit the whole or any part of the Software to be combined with or become incorporated in any other software, nor decompile, disassemble or reverse engineer the Software or attempt to do any such things",
      "Reproduce, copy, distribute, resell or otherwise use the Software for any commercial purpose",
      "Allow any third party to use the Software on behalf of or for the benefit of any third party",
      "Use the Software in any way which breaches any applicable local, national or international law",
      "use the Software for any purpose that blockchainpokerhud.com considers is a breach of this agreement",
      "",
      "blockchainpokerhud.com shall at all times retain ownership of the Software as originally downloaded by you and all subsequent downloads of the Software by you. The Software (and the copyright, and other intellectual property rights of whatever nature in the Software, including any modifications made thereto) are and shall remain the property of blockchainpokerhud.com.",
      "",
      "blockchainpokerhud.com reserves the right to grant licences to use the Software to third parties.",
      "",
      "This agreement is effective from the date you first use the Software and shall continue until terminated. You may terminate it at any time upon written notice to blockchainpokerhud.com.",
      "",
      "It will also terminate immediately if you fail to comply with any term of this agreement. Upon such termination, the licenses granted by this agreement will immediately terminate and you agree to stop all access and use of the Software. The provisions that by their nature continue and survive will survive any termination of this agreement. Blockchain Poker HUD disclaims any and all other warranties, whether express, implied, or statutory including without limitation any implied warranties of merchantability, satisfactory quality, fitness for a particular purpose, accuracy, timeliness, title, or non-infringement of third-party rights, to the fullest extent authorized by law.",
      "",
      "By using this software you agree that this extension sends information about players, including yourself, to the backend system. This includes but is not limited to who was in the hand, who raised pre-flop, hand strength, and what cards were visible. In addition, you expressly agree that these statistics are aggregated by the back end systems and distributed to other users of the software.",
      "",
      "Blockchain Poker HUD does not story history of hands. Information about players, hands and statistics are sent to the backend, processed, and aggregated. Blockchain Poker HUD does not keep a history of the data.",
      "",
      "You explicitly agree that your online screen name is processed and statistics tied to your screen name visible to other Blockchain Poker HUD users.</textarea><hr /><button class='eulabutton'>I agree</button>",
    ].join("\n");
    $("body").append(eula_html);
    $('.eulabutton').on('click', function() { chrome.storage.sync.set({ eula_agreed: true }, function() { eula_agreed = true; $('.eula').fadeOut(); location.reload()})});
  } else {
    chrome.storage.sync.get({
      last_changelog: 0
    }, function(items) {
        last_changelog = items.last_changelog;
        if(last_changelog !== hud_version) {
          let changelog_html = [
            "<div class='changelog' style='opacity: 0.8; background: #000; width: 50%; height: 50%; z-index: 1000; top: 25%; left: 25%; position: fixed; border: 1px solid #fff; padding: 5px;'><h1><b>Changes in " + hud_version + " </b></h1><hr><textarea style='width: 99%; height: 60%; border:0px; resize: none; color: #fff; background-color: #000; '>",
            changelog.join("\n"),
            "</textarea><hr /><button class='changelogbutton'>Continue</button>",
          ].join("\n");
          $("body").append(changelog_html);
          $('.changelogbutton').on('click', function() { chrome.storage.sync.set({ last_changelog: hud_version }, function() { last_changelog = hud_version; $('.changelog').fadeOut(); location.reload()})});
        }
      }
    );
  }
});

/**
 * Read configuration
 **/
chrome.storage.sync.get({
  apiKey: 'unset',
  autotopup: false
}, function(items) {
  apiKey = items.apiKey;
  autotopup = items.autotopup;
});

function sortHashTableByKey(hash, key_order, remove_key)
{
  var tmp = [],
    end = [],
    f_order = null;
  remove_key = remove_key || false;
  for (var key in hash)
  {
    if (hash.hasOwnProperty(key))
    {
      tmp.push(hash[key][key_order]);
    }
  }
  if (hash && hash[0] && typeof(hash[0][key_order]) === 'number')
  {
    f_order = function (a, b) { return a - b; };
  }
  tmp.sort(f_order);
  function getHash(hash, value)
  {
    for (k in hash)
    {
      if (hash[k] && hash[k][key_order] === value)
      {
        return { key : k, hash : hash[k] };
      }
    }
  }
  for (var i = 0, l = tmp.length; i < l; i++)
  {
    tmp[i] = getHash(hash, tmp[i]);
    if (remove_key)
    {
      delete tmp[i].hash[key_order];
    }
    if (!hash.length)
    {
      end[tmp[i].key] = tmp[i].hash;
    }
    else
    {
      end.push(tmp[i].hash);
    }
  }
  return end;
}

/**
 * Parse the returned Hand History
 **/
function parseHistory(history) {
  // Determine until which street this hand was played
  let last_round = 0;
  let round_map = {}
  for(const[i, round] of history["rounds"].entries()) {
    last_round = i;
    round_map[i] = Date.parse(round.time);
  }

  let pfr_players = [];
  let raise_highscore = 0;
  let aggressor_player = "";
  let action_map = {};
  let vpip = [];
  let in_hand = [];
  let bb_player = "";
  let sb_player = "";
  let btn_player = "";
  let bb_def = false;
  let showdowns = [];
  let cbet_player = "";
  let prev_bet_in = false;
  let id_list = {};
  let sd_players = [];
  let river_players = [];
  let f_river_players = [];
  let bet3_players = [];

  for (action of history["seats"]) {
    let seat = action.index;
    let name = action.name;
    let amount = action.amount;
    let account = action.account;
    let rounds = action.rounds;
    id_list[name] = account.toString();
    for(seat_action of action["actions"]) {
      action_map[Date.parse(seat_action.time)] = {
        type: seat_action.type,
        name: action.name,
        winnings: action.winnings,
        cards: action.cards,
        amount: seat_action.amount,
        isBigBlind: action.isBigBlind,
        isSmallBlind: action.isSmallBlind,
        isDealer: action.isDealer
      }
    }
  }

  var action_keys = [];
  for(k in action_map) {
    action_keys.push(k);
  }

  action_keys = action_keys.sort();

  action_keys.forEach(function(k) {
    let actions = action_map[k];
    let ts = k;
    let preflop = round_map[0];
    let flop = round_map[1];
    let turn = round_map[2];
    let river = round_map[3];
    let street = "";
    if(typeof river !== "undefined" && ts > river) {
      street = "river"
      if(!river_players.includes(actions.name)) {
        river_players.push(actions.name);
      }
      if(actions.type == "FOLD") {
        f_river_players.push(actions.name);
      }
    } else if(typeof turn !== "undefined" && ts > turn) {
      street = "turn"
    } else if(typeof flop !== "undefined" && ts > flop) {
      street = "flop"
      if(actions.type == "RAISE") {
        if(actions.name !== aggressor_player) {
          prev_bet_in = true;
        }
        if(prev_bet_in == false && actions.name == aggressor_player) {
          cbet_player = actions.name;
        }
      }
    } else if(typeof preflop !== "undefined" && ts > preflop) {
      street = "preflop"
      /**
       * Determine vpip players
       **/

      if(actions.type == "CALL" || actions.type == "RAISE" || actions.type == "BET") {
        vpip.push(actions.name);
        if(actions.type == "CALL" && actions.isBigBlind == true) {
          bb_def == true;
        }
      }
      if(actions.type == "RAISE") {
        /**
         * Determine preflop raisers
         **/

        // Detect 3-bet
        if(raise_highscore > 0 && actions.amount >= (raise_highscore * 3) && actions.amount <= (raise_highscore * 4)) {
          bet3_players.push(actions.name);
        }
        if(actions.amount > raise_highscore) {
          raise_highscore = actions.amount;
        }
        pfr_players.push(actions.name);
        // Determine preflop aggressor. This is always the last raiser
        aggressor_player = actions.name
      }
      // Add all players to in_hand
      if(["FOLD", "CALL", "CHECK", "RAISE", "POST_BLIND"].includes(actions.type)) {
        in_hand.push(actions.name);
      }

      // Determine positions
      if(actions.isBigBlind == true) {
        bb_player = actions.name;
      }
      if(actions.isSmallBlind == true) {
        sb_player = actions.name;
      }
      if(actions.isDealer == true) {
        btn_player = actions.name;
      }

    } else if(typeof preflop !== "undefined" && ts <= preflop) {
      street = "blindpost"
    }

    let end_street = 0;
    switch(street) {
      case "preflop":
        end_street = 0;
        break;
      case "flop":
        end_street = 1;
        break;
      case "turn":
        end_street = 2;
        break;
      case "river":
        end_street = 3;
        break;
    }
    if(end_street == last_round) {
      let villain_name = actions.name;
      let villain_pos = "unknown";
      if(actions.isBigBlind == true) {
        villain_pos = "bb";
      } else if(actions.isSmallBlind == true) {
        villain_pos = "sb";
      } else if(actions.isDealer == true) {
        villain_pos = "btn";
      }
      let villain_rank = [];
      let villain_suit = [];

      for(c of actions.cards) {
        if(c.isRevealed !== true) {
          continue;
        }
        if (c.holeCard == true) {
          villain_rank.push(c.rank);
          villain_suit.push(c.suit);
        }
      }
      if(villain_rank.length > 0) {
        let starting_hand = getSortedStartingHand(villain_rank, villain_suit);
        let showdown_str = actions.name + "###" + villain_pos + "###" + starting_hand;
        if(!showdowns.includes(showdown_str)) {
          showdowns.push(showdown_str);
        }
      }
    }
  });

  for(x of river_players) {
    if(!f_river_players.includes(x)) {
      sd_players.push(x);
    }
  }
  return {
    pfr_players: pfr_players,
    aggressor_player: aggressor_player,
    cbet_player: cbet_player,
    showdowns: showdowns,
    vpip: vpip.join(","),
    in_hand: in_hand,
    bb: bb_player,
    bb_def: bb_def,
    showdown_players: sd_players.join(","),
    bet3_players: bet3_players.join(","),
    id_list: id_list
  }
}

// Extract hand history when hand concludes
function checkEndOfHandAndProcess() {
  var review_button = $(".log-button[target='history']:not([processed])");
  if ($(review_button).is(":visible")) {
    var unique_code = $(review_button).attr("ng-href");
    if(typeof unique_code !== "undefined") {
      var tmp_code = unique_code.split("=")[1];
      window.postMessage({ type: 'history_id', text: tmp_code});
    }
    $(review_button).attr("processed", "true");
  }
}

// Get table format
function getMaxSeats() {
  var seats = $(".seat[ng-repeat='player in table.seats track by $index']");
  if(typeof seats !== "undefined") {
    return(seats.length);
  } else {
    return(0);
  }
}

/**
 * Returns our current hand strength (pair, high card, flush, etc)
 */
function getHandStrength(id, tid) {
  evaluate_raw = getHoleCards();
  evaluate_raw2 = getCommunityCards();

  if(evaluate_raw.length == 4) {
    evaluate_a = [evaluate_raw[3][0] + evaluate_raw[3][1], evaluate_raw[3][2] + evaluate_raw[3][3]];
  } else {
    evaluate_a = [];
  }
  evaluate_b = evaluate_raw2[1];

  var round = table_state.round;

  // Only update hand strength when the board changed so that we
  // don't call the API unnecessarily
  if (last_round != round) {
    last_round = round;
    // Transform symbols to letters
    for(var i=0; i < evaluate_a.length; i++) {
      try {
        evaluate_a[i] = evaluate_a[i].replace(/♥/g, 'h');
        evaluate_a[i] = evaluate_a[i].replace(/♦/g, 'd');
        evaluate_a[i] = evaluate_a[i].replace(/♣/g, 'c');
        evaluate_a[i] = evaluate_a[i].replace(/♠/g, 's');
      } catch {}
    }

    evaluate_a = evaluate_a.filter(function (el) {
      if(el != "NaN") {
        return el
      }
    });

    evaluate_b = evaluate_b.filter(function (el) {
      return el != null;
    });

    for(var i=0; i < evaluate_b.length; i++) {
      try {
        evaluate_b[i] = evaluate_b[i].replace(/♥/g, 'h');
        evaluate_b[i] = evaluate_b[i].replace(/♦/g, 'd');
        evaluate_b[i] = evaluate_b[i].replace(/♣/g, 'c');
        evaluate_b[i] = evaluate_b[i].replace(/♠/g, 's');
      } catch {} 
    }

    if(evaluate_a.length >= 2) {
      chrome.runtime.sendMessage(
        {
          "type": "getHandStrength",
          "apiKey": apiKey,
          "id": id,
          "tid": tid,
          "evaluate_a": evaluate_a,
          "evaluate_b": evaluate_b
        }, async response => {
          hand_strength = response;
        }
      );
    } else {
      hand_strength = "undefined";
      // There is no current hand strength to evaluate
    }
  }
}

function getUpdate(id, tid) {
  if(typeof apiKey === "undefined" && apiKey !== "unset") {
    chrome.storage.sync.get({
      apiKey: 'unset'
    }, function(items) {
      apiKey = items.apiKey;
    })
  }
  if(typeof apiKey !== "undefined" && apiKey !== "unset") {
    chrome.runtime.sendMessage(
      {
        "type": "getUpdate",
        "apiKey": apiKey,
        "id": id,
        "tid": tid
      }, async response => {
        hud_components = response;
      }
    );
  }
}

function getNumberOfSeatedPlayers() {
  var seats = $(".seat[ng-repeat='player in table.seats track by $index']");
  var seated = 0;
  $(seats).each(function(index) {
    villain_name = $(this).find("md-card[ng-if='player.name']").attr("name");
    if(typeof villain_name !== "undefined") {
      seated++;
    }
  });
  return seated;
}

// Finds player on table and returns seat number
function getPlayerSeat(player_name) {
  var player_seat = '-1';
  if(table_state.seats !== "undefined") {
    let seats = table_state.seats;
    for(seat of seats) {
      let index = seat.index;
      let name = seat.name;
      if(name == player_name) {
        player_seat = index;
      }
    }
  }
  return player_seat;
}

// Convert strings to Ids
var stringToId = function (string) {
  function RotateLeft(lValue, iShiftBits) {
    return (lValue<<iShiftBits) | (lValue>>>(32-iShiftBits));
  }

  function AddUnsigned(lX,lY) {
    var lX4,lY4,lX8,lY8,lResult;
    lX8 = (lX & 0x80000000);
    lY8 = (lY & 0x80000000);
    lX4 = (lX & 0x40000000);
    lY4 = (lY & 0x40000000);
    lResult = (lX & 0x3FFFFFFF)+(lY & 0x3FFFFFFF);
    if (lX4 & lY4) {
      return (lResult ^ 0x80000000 ^ lX8 ^ lY8);
    }
    if (lX4 | lY4) {
      if (lResult & 0x40000000) {
        return (lResult ^ 0xC0000000 ^ lX8 ^ lY8);
      } else {
        return (lResult ^ 0x40000000 ^ lX8 ^ lY8);
      }
    } else {
      return (lResult ^ lX8 ^ lY8);
    }
  }

  function F(x,y,z) { return (x & y) | ((~x) & z); }
  function G(x,y,z) { return (x & z) | (y & (~z)); }
  function H(x,y,z) { return (x ^ y ^ z); }
  function I(x,y,z) { return (y ^ (x | (~z))); }

  function FF(a,b,c,d,x,s,ac) {
    a = AddUnsigned(a, AddUnsigned(AddUnsigned(F(b, c, d), x), ac));
    return AddUnsigned(RotateLeft(a, s), b);
  };

  function GG(a,b,c,d,x,s,ac) {
    a = AddUnsigned(a, AddUnsigned(AddUnsigned(G(b, c, d), x), ac));
    return AddUnsigned(RotateLeft(a, s), b);
  };

  function HH(a,b,c,d,x,s,ac) {
    a = AddUnsigned(a, AddUnsigned(AddUnsigned(H(b, c, d), x), ac));
    return AddUnsigned(RotateLeft(a, s), b);
  };

  function II(a,b,c,d,x,s,ac) {
    a = AddUnsigned(a, AddUnsigned(AddUnsigned(I(b, c, d), x), ac));
    return AddUnsigned(RotateLeft(a, s), b);
  };

  function ConvertToWordArray(string) {
    var lWordCount;
    var lMessageLength = string.length;
    var lNumberOfWords_temp1=lMessageLength + 8;
    var lNumberOfWords_temp2=(lNumberOfWords_temp1-(lNumberOfWords_temp1 % 64))/64;
    var lNumberOfWords = (lNumberOfWords_temp2+1)*16;
    var lWordArray=Array(lNumberOfWords-1);
    var lBytePosition = 0;
    var lByteCount = 0;
    while ( lByteCount < lMessageLength ) {
      lWordCount = (lByteCount-(lByteCount % 4))/4;
      lBytePosition = (lByteCount % 4)*8;
      lWordArray[lWordCount] = (lWordArray[lWordCount] | (string.charCodeAt(lByteCount)<<lBytePosition));
      lByteCount++;
    }
    lWordCount = (lByteCount-(lByteCount % 4))/4;
    lBytePosition = (lByteCount % 4)*8;
    lWordArray[lWordCount] = lWordArray[lWordCount] | (0x80<<lBytePosition);
    lWordArray[lNumberOfWords-2] = lMessageLength<<3;
    lWordArray[lNumberOfWords-1] = lMessageLength>>>29;
    return lWordArray;
  };

  function WordToHex(lValue) {
    var WordToHexValue="",WordToHexValue_temp="",lByte,lCount;
    for (lCount = 0;lCount<=3;lCount++) {
      lByte = (lValue>>>(lCount*8)) & 255;
      WordToHexValue_temp = "0" + lByte.toString(16);
      WordToHexValue = WordToHexValue + WordToHexValue_temp.substr(WordToHexValue_temp.length-2,2);
    }
    return WordToHexValue;
  };

  function Utf8Encode(string) {
    string = string.replace(/\r\n/g,"\n");
    var utftext = "";

    for (var n = 0; n < string.length; n++) {

      var c = string.charCodeAt(n);

      if (c < 128) {
        utftext += String.fromCharCode(c);
      }
      else if((c > 127) && (c < 2048)) {
        utftext += String.fromCharCode((c >> 6) | 192);
        utftext += String.fromCharCode((c & 63) | 128);
      }
      else {
        utftext += String.fromCharCode((c >> 12) | 224);
        utftext += String.fromCharCode(((c >> 6) & 63) | 128);
        utftext += String.fromCharCode((c & 63) | 128);
      }

    }

    return utftext;
  };

  var x=Array();
  var k,AA,BB,CC,DD,a,b,c,d;
  var S11=7, S12=12, S13=17, S14=22;
  var S21=5, S22=9 , S23=14, S24=20;
  var S31=4, S32=11, S33=16, S34=23;
  var S41=6, S42=10, S43=15, S44=21;

  string = Utf8Encode(string);

  x = ConvertToWordArray(string);

  a = 0x67452301; b = 0xEFCDAB89; c = 0x98BADCFE; d = 0x10325476;

  for (k=0;k<x.length;k+=16) {
    AA=a; BB=b; CC=c; DD=d;
    a=FF(a,b,c,d,x[k+0], S11,0xD76AA478);
    d=FF(d,a,b,c,x[k+1], S12,0xE8C7B756);
    c=FF(c,d,a,b,x[k+2], S13,0x242070DB);
    b=FF(b,c,d,a,x[k+3], S14,0xC1BDCEEE);
    a=FF(a,b,c,d,x[k+4], S11,0xF57C0FAF);
    d=FF(d,a,b,c,x[k+5], S12,0x4787C62A);
    c=FF(c,d,a,b,x[k+6], S13,0xA8304613);
    b=FF(b,c,d,a,x[k+7], S14,0xFD469501);
    a=FF(a,b,c,d,x[k+8], S11,0x698098D8);
    d=FF(d,a,b,c,x[k+9], S12,0x8B44F7AF);
    c=FF(c,d,a,b,x[k+10],S13,0xFFFF5BB1);
    b=FF(b,c,d,a,x[k+11],S14,0x895CD7BE);
    a=FF(a,b,c,d,x[k+12],S11,0x6B901122);
    d=FF(d,a,b,c,x[k+13],S12,0xFD987193);
    c=FF(c,d,a,b,x[k+14],S13,0xA679438E);
    b=FF(b,c,d,a,x[k+15],S14,0x49B40821);
    a=GG(a,b,c,d,x[k+1], S21,0xF61E2562);
    d=GG(d,a,b,c,x[k+6], S22,0xC040B340);
    c=GG(c,d,a,b,x[k+11],S23,0x265E5A51);
    b=GG(b,c,d,a,x[k+0], S24,0xE9B6C7AA);
    a=GG(a,b,c,d,x[k+5], S21,0xD62F105D);
    d=GG(d,a,b,c,x[k+10],S22,0x2441453);
    c=GG(c,d,a,b,x[k+15],S23,0xD8A1E681);
    b=GG(b,c,d,a,x[k+4], S24,0xE7D3FBC8);
    a=GG(a,b,c,d,x[k+9], S21,0x21E1CDE6);
    d=GG(d,a,b,c,x[k+14],S22,0xC33707D6);
    c=GG(c,d,a,b,x[k+3], S23,0xF4D50D87);
    b=GG(b,c,d,a,x[k+8], S24,0x455A14ED);
    a=GG(a,b,c,d,x[k+13],S21,0xA9E3E905);
    d=GG(d,a,b,c,x[k+2], S22,0xFCEFA3F8);
    c=GG(c,d,a,b,x[k+7], S23,0x676F02D9);
    b=GG(b,c,d,a,x[k+12],S24,0x8D2A4C8A);
    a=HH(a,b,c,d,x[k+5], S31,0xFFFA3942);
    d=HH(d,a,b,c,x[k+8], S32,0x8771F681);
    c=HH(c,d,a,b,x[k+11],S33,0x6D9D6122);
    b=HH(b,c,d,a,x[k+14],S34,0xFDE5380C);
    a=HH(a,b,c,d,x[k+1], S31,0xA4BEEA44);
    d=HH(d,a,b,c,x[k+4], S32,0x4BDECFA9);
    c=HH(c,d,a,b,x[k+7], S33,0xF6BB4B60);
    b=HH(b,c,d,a,x[k+10],S34,0xBEBFBC70);
    a=HH(a,b,c,d,x[k+13],S31,0x289B7EC6);
    d=HH(d,a,b,c,x[k+0], S32,0xEAA127FA);
    c=HH(c,d,a,b,x[k+3], S33,0xD4EF3085);
    b=HH(b,c,d,a,x[k+6], S34,0x4881D05);
    a=HH(a,b,c,d,x[k+9], S31,0xD9D4D039);
    d=HH(d,a,b,c,x[k+12],S32,0xE6DB99E5);
    c=HH(c,d,a,b,x[k+15],S33,0x1FA27CF8);
    b=HH(b,c,d,a,x[k+2], S34,0xC4AC5665);
    a=II(a,b,c,d,x[k+0], S41,0xF4292244);
    d=II(d,a,b,c,x[k+7], S42,0x432AFF97);
    c=II(c,d,a,b,x[k+14],S43,0xAB9423A7);
    b=II(b,c,d,a,x[k+5], S44,0xFC93A039);
    a=II(a,b,c,d,x[k+12],S41,0x655B59C3);
    d=II(d,a,b,c,x[k+3], S42,0x8F0CCC92);
    c=II(c,d,a,b,x[k+10],S43,0xFFEFF47D);
    b=II(b,c,d,a,x[k+1], S44,0x85845DD1);
    a=II(a,b,c,d,x[k+8], S41,0x6FA87E4F);
    d=II(d,a,b,c,x[k+15],S42,0xFE2CE6E0);
    c=II(c,d,a,b,x[k+6], S43,0xA3014314);
    b=II(b,c,d,a,x[k+13],S44,0x4E0811A1);
    a=II(a,b,c,d,x[k+4], S41,0xF7537E82);
    d=II(d,a,b,c,x[k+11],S42,0xBD3AF235);
    c=II(c,d,a,b,x[k+2], S43,0x2AD7D2BB);
    b=II(b,c,d,a,x[k+9], S44,0xEB86D391);
    a=AddUnsigned(a,AA);
    b=AddUnsigned(b,BB);
    c=AddUnsigned(c,CC);
    d=AddUnsigned(d,DD);
  }
  var temp = WordToHex(a)+WordToHex(b)+WordToHex(c)+WordToHex(d);
  return temp.toLowerCase();
}

// Get the seat number of the dealer button
function getDealerPosition() {
  var position = -1;
  if(table_state.positions !== "undefined") {
    let positions = table_state.positions;
    position = positions.dealer;
  }
  return(position);
}

// Returns position string for specified seat
// Might be able to infer this from table_state
function getSeatPosition(seat) {
  var seats = $(".seat[ng-repeat='player in table.seats track by $index']");
  var dealer_pos = -1;
  var seated_array = [];

  // First determine which seats are occupied
  $(seats).each(function(index) {
    villain_name = $(this).find("md-card[ng-if='player.name']").attr("name");
    sitting_out = $(this).find("div[ng-if='player.sittingOut && !player.standing']").html();
    if(sitting_out != "Sitting Out" && typeof(villain_name) !== 'undefined') {
      seated_array.push(index);
    }
  });

  dealer_pos = getDealerPosition();
  return getPosition(seat, dealer_pos, seated_array);
}

function addToHistory(history, unique_code) {
  //var code_arr = unique_code.split("?")
  //hand_code = code_arr[1];
  hand_code = unique_code;
  var this_format = getMaxSeats();

  // Override table format if max-9 has insufficient players
  if(this_format == 9 && getNumberOfSeatedPlayers() < 7) {
    this_format = 6;
  }

  // Threshold 4 players for 6-max, 6 players for 9-max
  if(this_format == 6) {
    isShortHanded = getNumberOfSeatedPlayers() < 4 ? "1" : "0";
  } else {
    isShortHanded = getNumberOfSeatedPlayers() < 6 ? "1" : "0";
  }
  $.ajax({
    url: 'https://api.blockchainpokerhud.com/',
    type: 'POST',
    contentType: 'application/json',
    data: JSON.stringify(
      {
        data: JSON.parse(history),
        unique_code: hand_code,
        api_key: apiKey,
        short_handed: isShortHanded,
        table_format: getMaxSeats(),
        version: hud_version
      }
    ),
    dataType: 'json',
    success: function(msg, status, jqXHR) {
      Object.keys(msg).forEach(function(player) {
        villain_ev_map[player] = msg[player].ev;
        villain_vpip_map[player] = msg[player].vpip;
        villain_pfr_map[player] = msg[player].pfr;
        villain_bbd_map[player] = msg[player].bbd;
        villain_cb_map[player] = msg[player].cb_p;
        villain_hp_map[player] = msg[player].hp;
        villain_cb_hp_map[player] = msg[player].cb_hp;
        villain_bbd_hp_map[player] = msg[player].bbd_hp;
        villain_alias_map[player] = msg[player].aliases;
        villain_is_weekly_map[player] = msg[player].is_weekly;
      });
    }
  });
}

// Parse chipcount numbers
function getNumberContent(el) {
  // Strip HTML comments from element
  var raw = el.innerHTML;
  const regex = /<!--(.*?)-->/gm;
  raw = raw.replace(regex, "");
  const contentArr = raw.split("");

  // If the number ends in 'k', replace with three zeroes
  if (contentArr[contentArr.length - 1] === 'k') {
    contentArr[contentArr.length - 1] = "0";
    contentArr.push("0");
    contentArr.push("0");
  }
  const num = Number(contentArr.filter(c => c.trim() && !isNaN(c)).join(""));
  return num || 0;
}

// Get total from pot
function getPot() {
  return Array.from(document.getElementsByClassName("pot")).reduce(
    (total, e) => {
      const el = Array.from(e.getElementsByClassName("ng-binding ng-scope"));
      const s = el.reduce((a, el) => a + getNumberContent(el), 0);
      return total + s;
    },
    0
  );
}

// Get total from each person's bet
function getActiveBets() {
  return Array.from(document.getElementsByClassName("bet")).reduce(
    (total, e) => {
      const el = Array.from(e.getElementsByClassName("ng-binding ng-scope"));
      const s = el.reduce((a, el) => a + getNumberContent(el), 0);
      return total + s;
    },
    0
  );
}

// Get total from each person's stack
function getActiveStacks() {
  return Array.from(document.getElementsByClassName("stack")).reduce(
    (total, el) => total + getNumberContent(el),
    0
  );
}

// Get total chips in play
function getGrandTotalChipsInPlay() {
  const funcs = [getActiveBets, getActiveStacks, getPot];
  return funcs.reduce((s, f) => s + f(), 0);
}

// Returns all player names and stack sizes
function getPlayerNamesAndBalances() {
  return Array.from(document.getElementsByClassName("player")).map(el => {
    const name = el.getElementsByClassName("name")[0].innerHTML;
    const stack = el.getElementsByClassName("stack")[0];
    const value = getNumberContent(stack);
    return { name, value };
  });
}

// Returns hand ranking map for sorting
function loadRankingMap() {
  hand_rank["2"] = 1;
  hand_rank["3"] = 2;
  hand_rank["4"] = 3;
  hand_rank["5"] = 4;
  hand_rank["6"] = 5;
  hand_rank["7"] = 6;
  hand_rank["8"] = 7;
  hand_rank["9"] = 8;
  hand_rank["T"] = 9;
  hand_rank["J"] = 10;
  hand_rank["Q"] = 11;
  hand_rank["K"] = 12;
  hand_rank["A"] = 13;
}

// Returns array of starting hands with EV
function loadEVMap() {
  ev_map["AA"] = 2.32;
  ev_map["KK"] = 1.67;
  ev_map["QQ"] = 1.22;
  ev_map["JJ"] = 0.86;
  ev_map["AKs"] = 0.78;
  ev_map["AQs"] = 0.59;
  ev_map["TT"] = 0.58;
  ev_map["AK"] = 0.51;
  ev_map["AJs"] = 0.44;
  ev_map["KQs"] = 0.39;
  ev_map["99"] = 0.38;
  ev_map["ATs"] = 0.32;
  ev_map["AQ"] = 0.31;
  ev_map["KJs"] = 0.29;
  ev_map["88"] = 0.25;
  ev_map["QJs"] = 0.23;
  ev_map["KTs"] = 0.20;
  ev_map["A9s"] = 0.19;
  ev_map["AJ"] = 0.19;
  ev_map["QTs"] = 0.17;
  ev_map["KQ"] = 0.16;
  ev_map["77"] = 0.16;
  ev_map["JTs"] = 0.15;
  ev_map["A8s"] = 0.10;
  ev_map["K9s"] = 0.09;
  ev_map["AT"] = 0.08;
  ev_map["A5s"] = 0.08;
  ev_map["A7s"] = 0.08;
  ev_map["KJ"] = 0.08;
  ev_map["66"] = 0.07;
  ev_map["T9s"] = 0.05;
  ev_map["A4s"] = 0.05;
  ev_map["Q9s"] = 0.05;
  ev_map["J9s"] = 0.04;
  ev_map["QJ"] = 0.03;
  ev_map["A6s"] = 0.03;
  ev_map["55"] = 0.02;
  ev_map["A3s"] = 0.02;
  ev_map["K8s"] = 0.01;
  ev_map["KT"] = 0.01;
  ev_map["98s"] = 0.00;
  ev_map["T8s"] = -0.00;
  ev_map["K7s"] = -0.00;
  ev_map["A2s"] = 0.00;
  ev_map["87s"] = -0.02;
  ev_map["QT"] = -0.02;
  ev_map["Q8s"] = -0.02;
  ev_map["44"] = -0.03;
  ev_map["A9"] = -0.03;
  ev_map["J8s"] = -0.03;
  ev_map["76s"] = -0.03;
  ev_map["JT"] = -0.03;
  ev_map["97s"] = -0.04;
  ev_map["K6s"] = -0.04;
  ev_map["K5s"] = -0.05;
  ev_map["K4s"] = -0.05;
  ev_map["T7s"] = -0.05;
  ev_map["Q7s"] = -0.06;
  ev_map["K9"] = -0.07;
  ev_map["65s"] = -0.07;
  ev_map["T9"] = -0.07;
  ev_map["86s"] = -0.07;
  ev_map["A8"] = -0.07;
  ev_map["J7s"] = -0.07;
  ev_map["33"] = -0.07;
  ev_map["54s"] = -0.08;
  ev_map["Q6s"] = -0.08;
  ev_map["K3s"] = -0.08;
  ev_map["Q9"] = -0.08;
  ev_map["75s"] = -0.09;
  ev_map["22"] = -0.09;
  ev_map["J9"] = -0.09;
  ev_map["64s"] = -0.09;
  ev_map["Q5s"] = -0.09;
  ev_map["K2s"] = -0.09;
  ev_map["96s"] = -0.09;
  ev_map["Q3s"] = -0.10;
  ev_map["J8"] = -0.10;
  ev_map["98"] = -0.10;
  ev_map["T8"] = -0.10;
  ev_map["97"] = -0.10;
  ev_map["A7"] = -0.10;
  ev_map["T7"] = -0.10;
  ev_map["Q4s"] = -0.10;
  ev_map["Q8"] = -0.11;
  ev_map["J5s"] = -0.11;
  ev_map["T6"] = -0.11;
  ev_map["75"] = -0.11;
  ev_map["J4s"] = -0.11;
  ev_map["74s"] = -0.11;
  ev_map["K8"] = -0.11;
  ev_map["86"] = -0.11;
  ev_map["53s"] = -0.11;
  ev_map["K7"] = -0.11;
  ev_map["63s"] = -0.11;
  ev_map["J6s"] = -0.11;
  ev_map["85"] = -0.11;
  ev_map["T6s"] = -0.11;
  ev_map["76"] = -0.11;
  ev_map["A6"] = -0.12;
  ev_map["T2"] = -0.12;
  ev_map["95s"] = -0.12;
  ev_map["84"] = -0.12;
  ev_map["62"] = -0.12;
  ev_map["T5s"] = -0.12;
  ev_map["95"] = -0.12;
  ev_map["A5"] = -0.12;
  ev_map["Q7"] = -0.12;
  ev_map["T5"] = -0.12;
  ev_map["87"] = -0.12;
  ev_map["83"] = -0.12;
  ev_map["65"] = -0.12;
  ev_map["Q2s"] = -0.12;
  ev_map["94"] = -0.12;
  ev_map["74"] = -0.12;
  ev_map["54"] = -0.12;
  ev_map["A4"] = -0.12;
  ev_map["T4"] = -0.12;
  ev_map["82"] = -0.12;
  ev_map["64"] = -0.12;
  ev_map["42"] = -0.12;
  ev_map["J7"] = -0.12;
  ev_map["93"] = -0.12;
  ev_map["85s"] = -0.12;
  ev_map["73"] = -0.12;
  ev_map["53"] = -0.12;
  ev_map["T3"] = -0.12;
  ev_map["63"] = -0.12;
  ev_map["K6"] = -0.12;
  ev_map["J6"] = -0.12;
  ev_map["96"] = -0.12;
  ev_map["92"] = -0.12;
  ev_map["72"] = -0.12;
  ev_map["52"] = -0.12;
  ev_map["Q4"] = -0.13;
  ev_map["K5"] = -0.13;
  ev_map["J5"] = -0.13;
  ev_map["43s"] = -0.13;
  ev_map["Q3"] = -0.13;
  ev_map["43"] = -0.13;
  ev_map["K4"] = -0.13;
  ev_map["J4"] = -0.13;
  ev_map["T4s"] = -0.13;
  ev_map["Q6"] = -0.13;
  ev_map["Q2"] = -0.13;
  ev_map["J3s"] = -0.13;
  ev_map["J3"] = -0.13;
  ev_map["T3s"] = -0.13;
  ev_map["A3"] = -0.13;
  ev_map["Q5"] = -0.13;
  ev_map["J2"] = -0.13;
  ev_map["84s"] = -0.13;
  ev_map["82s"] = -0.14;
  ev_map["42s"] = -0.14;
  ev_map["93s"] = -0.14;
  ev_map["73s"] = -0.14;
  ev_map["K3"] = -0.14;
  ev_map["J2s"] = -0.14;
  ev_map["92s"] = -0.14;
  ev_map["52s"] = -0.14;
  ev_map["K2"] = -0.14;
  ev_map["T2s"] = -0.14;
  ev_map["62s"] = -0.14;
  ev_map["32"] = -0.14;
  ev_map["A2"] = -0.15;
  ev_map["83s"] = -0.15;
  ev_map["94s"] = -0.15;
  ev_map["72s"] = -0.15;
  ev_map["32s"] = -0.15;
}

// Function to add commas to big numbers
function displayNumber(x) {
  if(typeof x == "undefined") {
    return;
  }
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Position finding algorhythm
// Some of this is provided by table_state. We also
// do cutoff and utg, however
function getPosition(my_pos, dealer_pos, seats) {
  var positions = table_state.positions;
  if(typeof positions !== "undefined") {
    var real_bb_pos = positions.bigBlind;
    var real_sb_pos = positions.smallBlind;
    var real_btn_pos = positions.dealer;

    if(real_btn_pos == my_pos) {
      return "btn";
    }
    if(real_sb_pos == my_pos) {
      return "sb";
    }
    if(real_bb_pos == my_pos) {
      return "bb";
    }
  }

  var my_pos_str = "unknown";
  if(seats.length >= 3) {
    var arr_dealer_pos = -1;
    for (var i = 0; i < seats.length; i++) {
      if(seats[i] == dealer_pos) {
        arr_dealer_pos = i;
        break;
      }
    }

    var tmp_seats = seats.concat(seats);

    var arr_my_pos = -1;
    for (var i = 0; i < seats.length; i++) {
      if(seats[i] == my_pos) {
        arr_my_pos = i;
        break;
      }
    }

    var sb_pos = tmp_seats[arr_dealer_pos + 1]
    var bb_pos = tmp_seats[arr_dealer_pos + 2]
    var utg_pos = tmp_seats[arr_dealer_pos + 3]

    var steps_to_button = -1;
    var steps = 0;

    for (var i = arr_my_pos; i < tmp_seats.length; i++) {
      if(tmp_seats[i] == dealer_pos) {
        if(steps == 0) {
          my_pos_str = "btn";
        }
        if(steps == 1) {
          my_pos_str = "co";
        }
        steps_to_button = steps;
        break;
      }
      steps++;
    }

    if(my_pos == sb_pos) {
      my_pos_str = "sb";
    }
    if(my_pos == bb_pos) {
      my_pos_str = "bb";
    }
    if(my_pos == utg_pos) {
      my_pos_str = "utg";
    }
  }
  return(my_pos_str);
}

// Returns name of the table
function getTableName() {
  if(typeof table_state === "undefined" || typeof table_state.name === "undefined") {
    return "no_table"
  } else {
    return(table_state.name);
  }
}

// Return true if we are looking at a table, else return false
function atTable() {
  if(getTableName() === "no_table") {
    processed_hand = []; // Reset session array
    played_hand = [];    // Reset session array
    return false;
  } else {
    return true;
  }
}

// Currently unused. May be used for bb/100 calculations
function getBigBlindAmount() {
  if(typeof table_state.blinds !== "undefined") {
    return table_state.bigBlindAmount;
  }
  return(0);
}

// Appends a black box below blind levels to show total chips in play
function addTableDiv() {
  info_box = $(".table-info").find(".infobox");
  if (!$(info_box).is(":visible")) {
    $(".table-info").append("<div class='infobox' style='font-size: 12px; background: #000; padding: 2px 5px 2px;'></div>");
  }
}

// Little helper function to check if an element is visible
function isVisible(elm) {
  if ($(elm).is(":visible")) {
    return true;
  }
  else {
    return false;
  }
}

// Format hole cards in 4-colour deck to display in the top HUD bar
function getHoleCards() {
  var hole = [];
  var simple_hole = [];
  var simple_suits = [];
  var minhc = [];
  var full_rank = [];
  var mini_hole = [];
  if(typeof you_state.hand !== "undefined") {
    let cards = you_state.hand;
    for(card of cards) {
      suit = card.suit;
      rank = card.rank;
      suit_sym = "";
      mini_sym = "";
      switch(suit) {
        case "HEARTS":
          suit_sym = "<font color='red'>♥</font>"
          mini_sym = "♥";
          break;
        case "DIAMONDS":
          suit_sym = "<font color='blue'>♦</font>";
          mini_sym = "♦";
          break;
        case "CLUBS":
          suit_sym = "<font color='green'>♣</font>";
          mini_sym = "♣";
          break;
        case "SPADES":
          suit_sym = "<font color='#606060'>♠</font>";
          mini_sym = "♠";
          break;
      }
      hole.push(rank + suit_sym);
      mini_hole.push(rank + mini_sym);
      simple_hole.push(rank);
      simple_suits.push(suit_sym);
    }
  }
  return([hole, simple_hole, simple_suits, mini_hole.join("")]);
}

// Sorts a hand in order of rank
function getSortedStartingHand(simple_hole, simple_suits) {
  if (hand_rank[simple_hole[0]] < hand_rank[simple_hole[1]]) {
    hole_1 = simple_hole[0];
    hole_2 = simple_hole[1];
    suit_1 = simple_suits[0];
    suit_2 = simple_suits[1];
    simple_hole[0] = hole_2;
    simple_hole[1] = hole_1;
    simple_suits[0] = suit_2;
    simple_suits[1] = suit_1;
  }
  starting_hand = simple_hole[0] + simple_hole[1];
  if (simple_suits[0] == simple_suits[1]) {
    starting_hand = starting_hand + "s";
  }
  return starting_hand;
}

function getAdviceForHoleCards(starting_hand) {
  advice = ep_hands.includes(starting_hand) ? "early" : mp_hands.includes(starting_hand) ? "middle" : lp_hands.includes(starting_hand) ? "late" : bl_hands.includes(starting_hand) ? "blinds" : starting_hand.length == 3 ? "blinds" : "muck";
  return(advice);
}

// Update betting_action array
function updateBettingAction() {
  if(typeof table_state !== "undefined") {
    let round = table_state.round;
    if(round !== "SHOWDOWN") {
      if(typeof table_state.blinds !== "undefined") {
        let bigblind = table_state.bigBlindAmount;
        for(seat of table_state.seats) {
          let bet_size = seat.bet;
          let name = seat.name;
          if(bet_size > bigblind) {
            if(typeof betting_action[round] === "undefined") {
              betting_action[round] = "";
            }
            if(round === "PREFLOP") {
              if(bet_size > high_bet) {
                // If there is a re-raise preflop, re-set betting action
                // for this round as we have a new aggressor and want to
                // know if this particular villain c-bets
                high_bet = bet_size;
                betting_action[round] = "";
              }
            }
            if(betting_action[round].length == 0) {
              betting_action[round] = name;
            }
          }
        }
      }
    }
  }
}


// Get community cards from table state and render them
function getCommunityCards() {
  var board = [];
  var mini_board = [];
  if(typeof table_state !== "undefined" && typeof table_state.cards !== "undefined") {
    let cards = table_state.cards;
    for(card of cards) {
      var suit = card.suit;
      var rank = card.rank;
      var index = card.index;
      var suit_sym = "";
      var mini_sym = "";
      switch(suit) {
        case "HEARTS":
          suit_sym = "<font color='red'>♥</font>"
          mini_sym = "♥";
          break;
        case "DIAMONDS":
          suit_sym = "<font color='blue'>♦</font>";
          mini_sym = "♦";
          break;
        case "CLUBS":
          suit_sym = "<font color='green'>♣</font>";
          mini_sym = "♣";
          break;
        case "SPADES":
          suit_sym = "<font color='#808080'>♠</font>";
          mini_sym = "♠";
          break;
      }
      board.push(rank + suit_sym);
      mini_board.push(rank + mini_sym);
    }
  }
  return([board, mini_board]);
}

function getAdviceColor(advice) {
  advice_color = "";
  switch(advice) {
    case "early":
      advice_color = "green";
      break;
    case "middle":
      advice_color = "yellow";
      break;
    case "late":
      advice_color = "orange";
      break;
    case "blinds":
      advice_color = "red";
      break;
    case "muck":
      advice_color = "red";
      break;
  }
  return(advice_color);
}

// Create HUD stats boxes
function createStatsBoxes() {
  var seats = $(".seat[ng-repeat='player in table.seats track by $index']");
  $(seats).each(function(index) {
    stats_box = $(this).find(".stats");
    if (!$(stats_box).is(":visible")) {
      $(this).append("<div class='stats' style='font-size: 11px; background: #000; left:8px; position: relative; padding: 2px 5px 2px; text-align: center;'></div>");
    }
  });
}

// Returns an array of players at the table
function getPlayerList() {
  let players = [];
  if(table_state.seats !== "undefined") {
    let seats = table_state.seats;
    for(seat of seats) {
      let index = seat.index;
      let name = seat.name;
      let sitting_out = seat.sittingOut;
      let waiting = seat.waitingForBlind;
      if(!sitting_out && !waiting && typeof name !== "undefined" && name != null) {
        players[index] = name;
      }
    }
  }
  return(players);
}

// Gets and updates the our_name variable
function getId() {
  var seats = $(".seat[ng-repeat='player in table.seats track by $index']");
  $(seats).each(function(index) {
    villain_name = $(this).find("md-card[ng-if='player.name']").attr("name");
    you_button = $(this).find("button[aria-label='This is You']");
    if ($(you_button).is(":visible")) {
      our_name = villain_name;
      our_seat = index;
    }
  });
  return(our_name);
}

// Function that iterates over the seats and updates the game state
function getGameState() {
  var seats = $(".seat[ng-repeat='player in table.seats track by $index']");
  var state = [];
  var player_list = getPlayerList();
  var our_name = getId();

  var player_active = false;
  var in_pot = false;
  var raw_board = getCommunityCards();
  var board = raw_board[0];

  $(seats).each(function(index) {
    player_active = false;
    in_pot = false;
    var villain_name = player_list[index];
    if(typeof villain_name !== 'undefined') {
      villain_position = getSeatPosition(index);
      state[villain_name] = {}; 

      // Store villain ev in easy to use variable for convenience
      historical_ev = villain_ev_map[villain_name];
      historical_vpip = villain_vpip_map[villain_name];
      historical_pfr = villain_pfr_map[villain_name];
      historical_bbd = villain_bbd_map[villain_name];
      historical_cb = villain_cb_map[villain_name];
      historical_aliases = villain_alias_map[villain_name];
      historical_is_weekly = villain_is_weekly_map[villain_name];

      // Store sample sizes
      historical_hp = villain_hp_map[villain_name];
      historical_cb_hp = villain_cb_hp_map[villain_name];
      historical_bbd_hp = villain_bbd_hp_map[villain_name];

      // Find out if villain is in the pot
      is_in_pot = $(this).find("md-card[ng-class=':: {back: back, full: full}']");
      // Is villain showing cards?
      if ($(is_in_pot).is(":visible")) {
        // Are we past pre-flop and is villain not us ?
        if((typeof board !== "undefined") && board.length > 0 && villain_name != our_name) {
          in_pot = true;
        }
      }

      // Is the player active at the table?
      sitting_out = $(this).find("div[ng-if='player.sittingOut && !player.standing']").html();
      if(sitting_out != "Sitting Out" && typeof(villain_name) !== 'undefined') {
        player_active = true;
      }

      state[villain_name] = {
        in_pot: in_pot,
        active: player_active,
        position: villain_position,
        ev: historical_ev,
        cb: historical_cb,
        vpip: historical_vpip,
        pfr: historical_pfr,
        bbd: historical_bbd,
        hp: historical_hp,
        cb_hp: historical_cb_hp,
        bbd_hp: historical_bbd_hp,
        aliases: historical_aliases,
        is_weekly: historical_is_weekly
      };
    }
  });
  return(state);
}

// Initialization

var villain_ev = [];
var ur_seat = 1;
var our_name = "Bender";
var dealer_pos = 0;
var players_seated = 0;
var max_seats = 0;

// Load array with expected value per starting hand
loadEVMap();

// Load hand ranking map
loadRankingMap();

// Advice for playable hands based on position 
var ep_hands = ["AA", "KK", "QQ", "JJ", "TT", "99", "88", "AKs", "AQs", "AJs", "ATs", "KQs", "KJs", "QJs", "AK", "AQ"];
var mp_hands = ["77", "66", "55", "A9s", "KTs", "QTs", "JTs", "T9s", "98s", "AJ", "AT", "KQ", "KJ"];
var lp_hands = ["44", "33", "22", "A8s", "A7s", "A6s", "A5s", "A4s", "A3s", "A2s", "K9s", "Q9s", "J9s", "T8s", "87s", "76s", "65s", "54s", "A9", "KT", "QJ", "QT", "JT", "T9"];
var bl_hands = ["A8", "A7", "A6", "A5", "A4", "A3", "A2", "K9", "K8", "K7", "K6", "K5", "K4", "K3", "K2", "Q9", "J9", "J8", "T8", "98", "87", "76", "65", "54"];

/*
 * MAIN LOOP
 * Invoke updateGame() every second
 */
window.setInterval(function(){
  if(eula_agreed == true) {
    updateGame();
  }
}, 1000);

function getPlayerIdFromName(name) {
  if(table_state != null && typeof table_state.seats !== "undefined") {
    for (var i in table_state.seats) {
      player_id = table_state.seats[i].id;
      player_name = table_state.seats[i].name;
      if(typeof player_name !== "undefined") {
        if(player_name === name) {
          return player_id.toString();
        }
      }
    }
  }
  return("0")
}

function getPlayerIdFromSeat(index) {
  if(table_state != null && typeof table_state.seats !== "undefined") {
    for (var i in table_state.seats) {
      player_id = table_state.seats[i].id;
      player_name = table_state.seats[i].name;
      if(typeof player_name !== "undefined") {
        if(i === index) {
          return(player_id.toString());
        }
      }
    }
  }
  return("0")
}

// Function updates our game state every second
function updateGame() {
  // Get state of table and state of self
  window.postMessage({ type: 'table_state' });
  window.postMessage({ type: 'you_state' });
  var table_name = getTableName();
  if (atTable()) {
    // Reset variables 
    players_seated = 0;
    max_seats = 0;

    var seated_array = [];
    var hole = [];
    var board = [];
    var simple_hole = [];
    var simple_suits = [];
    var hud_display = [];
    var ev = -100;
    var advice = "";

    // Various element objects
    var search_button = $("button[aria-label='Play at higher stakes tables']");
    var messages = $("div[ng-if='::log.message']");
    var seats = $(".seat[ng-repeat='player in table.seats track by $index']");
    var fold_button = $("button[aria-label='Fold']");
    var check_button = $("button[aria-label='Check']");
    var call_button = $("button[aria-label='Call']");
    var call2_button = $("button[aria-label='Call Current Bet']");
    var villain_cards = $("card[ng-repeat='card in player.cards track by $index']");
    var players = $("md-card[ng-if='player.name']");

    // Inject our HUD if it's not already there
    hud = $(".benderhud");
    if (!$(hud).is(":visible")) {
      $(search_button).after("<div class='benderhud ng-binding ng-scope log-item' style='font-size: 12px; background: #000; padding: 5px;'></div>");
    }

    if(table_state.handId !== last_hand_id) {
      last_hand_id = table_state.handId;
      if(you_state.sittingOut == true) {
        window.postMessage({ type: 'anti_idle', text: table_state.id});
      }
    }
    updateBettingAction();

    // Check for finished hands and process them
    checkEndOfHandAndProcess();

    // Get our hole cards
    var our_cards = getHoleCards();
    hole = our_cards[0];
    simple_hole = our_cards[1];
    simple_suits = our_cards[2];
    minhc = our_cards[3];

    // When we have two hole cards, sort them high to low.
    // Then obtain EV for that hand and suggest position
    if (simple_suits.length == 2) {
      starting_hand = getSortedStartingHand(simple_hole, simple_suits);
      ev = ev_map[starting_hand];
      advice = getAdviceForHoleCards(starting_hand);
    }

    // Get the community cards to display in HUD
    raw_board = getCommunityCards();
    board = raw_board[0];

    // Add HUD stats boxes to all seats
    createStatsBoxes();

    game_state = getGameState();

    var id = stringToId(getId());
    var tid = stringToId(table_name);

    getUpdate(id, tid);

    // Render villain stats
    $(seats).each(function(index) {
      villain_name = $(this).find("md-card[ng-if='player.name']").attr("name");
      if(typeof villain_alias_map[villain_name] !== "undefined") {
        $(this).attr("title", "aliases: " + villain_alias_map[villain_name]);
      }

      var user_id = getPlayerIdFromName(villain_name);

      // Get state of villain
      var villain_state = game_state[villain_name]

      // Assign data to villain to display in HUD 
      if(typeof villain_state !== "undefined") {
        var historical_ev = villain_state.ev;         // average expected value hand
        var historical_vpip = villain_state.vpip;     // volunarily put in pot %
        var historical_pfr = villain_state.pfr;       // pre-flop raise %
        var historical_cb = villain_state.cb;         // c-bet %
        var historical_bbd = villain_state.bbd;       // big blind def
        var historical_hp = villain_state.hp;         // hands played
        var historical_cb_hp = villain_state.cb_hp;   // c-bet potential hands sample size
        var historical_bbd_hp = villain_state.bbd_hp; // bbdef potential hands sample size
        var aliases = villain_state.aliases;          // previous handles
        var is_in_pot = villain_state.in_pot;
        var position = villain_state.position;
        var active = villain_state.active;
        var is_weekly = villain_state.is_weekly;
      }

      if(typeof villain_name !== "undefined") {
        villain_id = stringToId(villain_name);
      } else {
        villain_id = "unknown";
      }

      max_seats++;
      sitting_out = $(this).find("div[ng-if='player.sittingOut && !player.standing']").html();
      if(sitting_out != "Sitting Out" && typeof(villain_name) !== 'undefined') {
        seated_array.push(index);
        players_seated++;
      }

      dealer_button = $(this).find("button[aria-label='This is the Dealer']");
      if ($(dealer_button).is(":visible")) {
        dealer_pos = index;
      }

      you_button = $(this).find("button[aria-label='This is You']");
      if ($(you_button).is(":visible")) {
        our_name = villain_name;
        our_seat = index;
      }

      villain_hud = [];

      ev_color = (historical_ev < 0) ? "red" : "green";

      var vpip_threshold = 25;
      if(getMaxSeats() == 6) {
        vpip_threshold = 35
      }
      vpip_color = (historical_vpip >= vpip_threshold) ? "red" : "green";

      pfr_color = (historical_pfr >= 21) ? "red" : "green";

      var is_fish = false;
      var is_calling_station = false
      var is_maniac = false;
      var is_clown = false;
      var is_top_earner = false;
      var has_note = false;

      if(typeof player_notes[villain_name] !== "undefined") {
        has_note = true;
      }

      if(top_earners.includes(parseInt(user_id))) {
        is_top_earner = true;
      }

      last_showdown_string = "";
      if(typeof hand_history_map[user_id.toString()] !== "undefined") {
        last_showdown_string = "<br /><hr />Previous strength: " + hand_history_map[user_id.toString()]; 
      }

      if(typeof historical_vpip !== "undefined") {
        if(historical_vpip >= (vpip_threshold+10)) {
          is_fish = true;
        }
        if(historical_vpip >= 50) {
          if(typeof historical_pfr !== "undefined") {
            // If villain has high PFR and a high vpip then he's LAG or clown
            if(historical_pfr >= 20) {
              if(typeof historical_ev !== "undefined") {
                if(historical_ev < 0) {
                  is_clown = true; // Showdown bad hands
                } else {
                  is_maniac = true; // Showdown good hands
                }
              }
            } else {
              if(typeof historical_ev !== "undefined") {
                if(historical_ev < 0) {
                  is_clown = true; // Showdown bad hands
                }
              }
            }
          }
          is_calling_station = true;
        }
        villain_hud.push("<div class='tooltip'>vpip<span class='tooltiptext'>Voluntarily Put in Pot %</span></div>: <font color='" + vpip_color + "'>" + Number(historical_vpip).toFixed(1) + "</font>");
      }
      if(typeof historical_pfr !== "undefined") {
        if(historical_pfr >= 25) {
          is_fish = true;
        }
        villain_hud.push("<div class='tooltip'>pfr<span class='tooltiptext'>Preflop Raise %</span></div>: <font color='" + pfr_color + "'>" + Number(historical_pfr).toFixed(1) + "</font>");
      }
      if(typeof historical_ev !== "undefined") {
        villain_hud.push("<br /><div class='tooltip'>ev<span class='tooltiptext'>Average Expected Value of starting hand at showdown</span></div>: <font color='" + ev_color + "'>" + Number(historical_ev).toFixed(2) + "</font>");
      }

      // Show c-bet stats only when relevant
      if(typeof historical_cb !== "undefined") {
        if(typeof betting_action["PREFLOP"] !== "undefined" && typeof betting_action["FLOP"] !== "undefined") {
          let preflop_aggressor = betting_action["PREFLOP"];
          if(preflop_aggressor == villain_name) {
            villain_hud.push("<br /><div class='tooltip'>cb<span class='tooltiptext'>Continuation Bet %. A good value is around 70%, and significantly lower for high stake games.</span></div>: " + Number(historical_cb).toFixed(1));
          }
        }
      }

      // Only show bb defence stats when relevant
      if(position == "bb") {
        if(typeof historical_bbd !== "undefined") {
          villain_hud.push("<div class='tooltip'>bbdef<span class='tooltiptext'>Big Blind Defended %</span></div>: " + Number(historical_bbd).toFixed(1) + "");
        }
      }

      var is_newbie = true;
      if(typeof historical_hp !== "undefined") {
        if(Number(historical_hp) >= 100) {
          is_newbie = false;
        }
      }

      var is_shark = false;
      var is_turtle = false;
      if(typeof historical_vpip !== "undefined" && typeof historical_pfr !== "undefined" && typeof historical_ev !== "undefined") {
        if(vpip_color == "green" && pfr_color == "green" && Number(historical_pfr) >= 10) {
          is_shark = true;
        } else if (vpip_color == "green" && pfr_color == "green" && Number(historical_pfr) < 8) {
          is_turtle = true;
        }
      }

      for(item of hud_components) {
        var elm = item.id.split("_");
        var t_id = elm[0];
        var t_tid = elm[1];
        if(t_id == villain_id) {
          villain_hud.push(item.stats);
        }
      }

      if(villain_hud.length == 0) {
        if(typeof villain_name !== "undefined") {
          $(this).find(".stats").html("Waiting for data");
          $(this).find(".stats").attr("style","font-size: 11px; background: #000; left:8px; position: relative; padding: 2px 5px 2px; text-align: center");
        } else {
          $(this).find(".stats").attr("style","");
          $(this).find(".stats").html("");
        }
      } else {
        var postpend = "";
        var sample_sizes = "";
        if(typeof historical_cb_hp !== "undefined" && typeof historical_bbd_hp !== "undefined" && typeof historical_hp !== "undefined") {
          // Little info box with sample sizes for the hover text
          if(is_weekly == true) {
            weekly_str = " during the last two weeks.";
          } else {
            weekly_str = " since the beginning of time."
          }
          sample_sizes = "<hr>Stats are based on " + historical_hp + " hands played" + weekly_str;
        }

        var badge = "";
        var badge_txt = "";

        if(is_top_earner) {
          badge = earner_icon;
          badge_txt = "<hr>This player is in the top 100 earners this week!";
        }

        var note = "";
        var note_txt = "";
        if(has_note) {
          note = note_icon;
          note_txt = "<br /><hr><b>Notes</b>: " + player_notes[villain_name];
          note_txt = note_txt.replace(/(?:\r\n|\r|\n)/g, '<br>');

        }

        if(villain_name == our_name) {
          postpend = " <div class='tooltip'>" + king_icon + "<span class='tooltiptext'>" + villain_name + " is a king! Hello, your grace.</span></div>";
        } else if(is_newbie === true) {
          postpend = " <div class='tooltip'>" + newbie_icon + badge + note + "<span class='tooltiptext'>" + villain_name + " does not have a significant hand history! Take these stats with a grain of salt. These stats are based on the following number of hands per category: " + sample_sizes + badge_txt + note_txt + last_showdown_string + "</span></div>";
        } else if(is_clown === true) {
          postpend = " <div class='tooltip'>" + clown_icon + badge + note + "<span class='tooltiptext'>" + villain_name + " is a clown! Prepare to be donked." + sample_sizes + badge_txt + note_txt + last_showdown_string + " </span></div>";
        } else if(is_maniac === true) {
          postpend = " <div class='tooltip'>" + maniac_icon + badge + note + "<span class='tooltiptext'>" + villain_name + " is very aggressive. Trap this maniac." + sample_sizes + badge_txt + note_txt + last_showdown_string + "</span></div>";
        } else if(is_calling_station === true) {
          postpend = " <div class='tooltip'>" + robot_icon + badge + note + "<span class='tooltiptext'>" + villain_name + " is a calling station! Value bet all the way." + sample_sizes + badge_txt + note_txt + last_showdown_string + "</span></div>";
        } else if(is_fish === true) {
          postpend = " <div class='tooltip'>" + fish_icon + badge + note + "<span class='tooltiptext'>" + villain_name + " is a fish! Happy fishing." + sample_sizes + badge_txt + note_txt + last_showdown_string + " </span></div>";
        } else if (is_shark === true) {
          postpend = " <div class='tooltip'>" + shark_icon + badge + note + "<span class='tooltiptext'>" + villain_name + " is a shark! Be careful." + sample_sizes + badge_txt + note_txt + last_showdown_string + "</span></div>";
        } else if (is_turtle === true) {
          postpend = " <div class='tooltip'>" + turtle_icon + badge + note + "<span class='tooltiptext'>" + villain_name + " is a turtle! They don't raise often." + sample_sizes + badge_txt + note_txt + last_showdown_string + "</span></div>";
        } else {
          postpend = " <div class='tooltip'>" + rainbow_icon + badge + note + "<span class='tooltiptext'>" + villain_name + " is diverse! It is hard to pin this player down." + sample_sizes + badge_txt + note_txt + last_showdown_string + "</span></div>";
        }
        $(this).find(".stats").html(villain_hud.join(", ") + postpend);
        $(this).find(".stats").attr("style","font-size: 11px; background: #000; left:8px; position: relative; padding: 2px 5px 2px; text-align: center");
      }
    });

    addTableDiv();
    var chips_in_play = getGrandTotalChipsInPlay();

    var profit_loss = 0;
    var profit_loss_string = "Winnings";
    var profit_loss_colour = "green";
    var quantity = "";
    if(typeof transaction_history !== "undefined") {
      if(typeof you_state !== "undefined") {
        profit_loss += you_state.balance;
        profit_loss += you_state.inPlay[table_state.currency];
        if(typeof transaction_history["transactions"] !== "undefined") {
          for (t of transaction_history["transactions"]) {
            if(t.type == "DEPOSIT") {
              profit_loss -= t.amount;
            }
            if(t.type == "WITHDRAWAL") {
              profit_loss += t.amount;
            }
          }
        }
      }
      if(profit_loss >= 1000000 || profit_loss <= -1000000) {
        var q = 1000000;
        quantity = "M";
      } else if(profit_loss >= 1000 || profit_loss <= -1000) {
        var q = 1000;
        quantity = "K";
      } else {
        var q = 1;
      }
      if(profit_loss < 0) {
        profit_loss_string = "Losses"
        profit_loss_colour = "red"
        profit_loss = Math.abs((profit_loss / q).toFixed(2));
      } else {
        profit_loss = (profit_loss / q).toFixed(2);
      }
    }

    var open_tables_summary = [];

    if (typeof open_tables !== "undefined") {
      for (t of open_tables) {
        // Limit to >= 1K BB, public tables, 6-max or higher with at least 2 active players
        if(t.seatsTaken < 2 || t.numSeats < 6 || t.currency != table_state.currency || t.smallBlindAmount < 500 || t.isPrivate == true) {
          continue;
        }
        if(table_state.name != t.name)
        {
          open_tables_summary.push("<a href='https://blockchain.poker/#/?table=" + t.id + "' target='_new' style='color: #fff; text-decoration: none;'>" + t.name + "</a> " + (displayNumber((t.smallBlindAmount*2)/1000)) + "k [" + t.seatsTaken + "/" + t.numSeats + "] <a href='https://blockchain.poker/#/?table=" + t.id + "' target='_new' style='color: #fff; text-decoration: none;'>&#128279;</a>");
        }
      }
    }

    var tournament_tables_summary = [];
    if(typeof tournament_tables !== "undefined") {
      for (t of tournament_tables) {
        var startTime = Date.parse(t.startTime) / 1000;
        var myts = Math.round((new Date()).getTime() / 1000);

        if(t.isPrivate == true || t.buyInCost == 0 || t.isRegistrationOpen == false) {
          continue;
        }

        if (startTime <= myts) {
          var inMinutes = "LATEREG"
        } else {
          var startTimeSeconds = startTime - myts;
          var inMinutes = Math.floor(startTimeSeconds / 60);
        }

        tournament_tables_summary.push("<a href='https://blockchain.poker/?tournament=" + t.id + "&affiliate=d4dff027c362ce10bba1669a592896a6" + "' target='_new' style='color: #fff; text-decoration: none;'>" + t.currency + "</a> " + (displayNumber((t.buyInCost)/1000)) + "/" + (displayNumber((t.prizePool)/1000)) + "k <a href='https://blockchain.poker/?tournament=" + t.id + "&affiliate=d4dff027c362ce10bba1669a592896a6" + t.id + "' target='_new' style='color: #fff; text-decoration: none;'>[" + inMinutes + "min] &#128279;</a>");
      }
    }

    $(".infobox").html("In play: " + displayNumber(chips_in_play.toFixed(2)) + "<br />Rewards: " + displayNumber(rewards_balance) + "<br />" + profit_loss_string + ": <font color='" + profit_loss_colour + "'>" + profit_loss + quantity + "</font><br /><hr/ ><b>Cash games:</b><br />" + open_tables_summary.join("<br />") + "<hr /><b>Tournaments:</b><br />" + tournament_tables_summary.join("<br />"));

    getHandStrength(id, tid);

    var hud_prefix = "";

    // Extract last hand value from hand history
    if(typeof hand_history.seats !== "undefined") {
      for(x of hand_history.seats) {
        // Not sure if this is intentional, but the blockchain.poker
        // getHistory() command returns the eventual hand strength
        // for each player, regardless whether or not the hand
        // went to showdown.
        hand_history_map[x.account.toString()] = x.handRank;
      }
    }

    if(autotopup == true) {
      if(typeof table_state !== "undefined" && typeof you_state !== "undefined") {
        topup_btn = $("button[ng-disabled='pendingOptions.topUp']");
        if($(topup_btn).is(":visible")) {
          let max_buyin = table_state.maxBuyIn;
          let blind_size = table_state.bigBlindAmount;
          let my_stack = you_state.stack;
          // Only top up when at least 2 big blinds below max
          if(my_stack < (max_buyin - blind_size)) {
            topup_btn.click();
          }
        }
      }
    }

    // Add our hole cards
    if(hole.length > 0) {
      hud_display.push("<font color='white'>hero</font>: " + hole.join(" "));
    }

    // Add EV of our starting hand. Only add for valid hands (> - 100)
    if (ev > -100) {
      if(ev < 0) {
        hud_display.push("<font color='red'>EV: " + ev + "</font>");
      } else {
        hud_display.push("<font color='green'>EV: " + ev + "</font>");
      }
    }

    // Add community cards
    if((typeof board !== "undefined") && board.length > 0) {
      hud_display.push("<font color='white'>board</font>: " + board.join(" "));
    }

    // Display positional advice for the starting hand
    if (advice.length > 0) {
      advice_color = getAdviceColor(advice);
      hud_display.push("<font color='white'>play from</font>: <font color='" + advice_color + "'>" + advice + "</font>");
    }

    // Display the current pot size (including current bets made)
    hud_display.push("<font color='white'>pot</font>: " + displayNumber((getPot() + getActiveBets())));

    if(hand_strength != "undefined") {
      hud_display.push('(<font color="yellow">' + hand_strength + '</font>)');
    }

    $(".benderhud").html(hud_display.join(", "));
  }
}
