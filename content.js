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

/**
 * Global variables
 **/

var apiKey = "unset";
var autotopup = false;
var betting_action = [];
var eula_agreed = false;
var ev_map = [];
var hand_rank = [];
var hand_strength = "undefined";
var high_bet = 0;
var hud_components = [];
var last_round = "";
var played_hand = [];
var processed_hand = [];
var table_state = {};
var villain_alias_map = [];
var villain_bbd_hp_map = [];
var villain_bbd_map = [];
var villain_cb_hp_map = [];
var villain_cb_map = [];
var villain_ev_map = [];
var villain_hands = [];
var villain_hp_map = [];
var villain_mucked = [];
var villain_pfr_map = [];
var villain_vpip = [];
var villain_vpip_map = [];
var vpip_hand = [];
var vpip_map = [];
var you_state = {};

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
 * Listener for table_state passed data
 **/
document.addEventListener('RW759_connectExtension', function(e) {
  data = e.detail;
  table_state = data.table;
  you_state = data.you;
});

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

/**
 **/
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

// Extract hand history when hand concludes
function checkEndOfHandAndProcess() {
  var review_button = $(".log-button[target='history']:not([processed])");
  if ($(review_button).is(":visible")) {
    var unique_code = $(review_button).attr("ng-href");
    $(review_button).attr("processed", "true")
    $("md-list-item[ng-repeat='log in logs']:not([processed])").each(function() {
      is_chat = $(this).find('div[ng-if="::log.type === \'chat\'"]');
      if (!$(is_chat).is(":visible")) {
        player_name = $(this).find("button[ng-if='::log.player']").html();
        player_id = getPlayerIdFromName(player_name);
        villain_vpip[player_name] = false;
        villain_mucked[player_name] = false;
      }
    });

    // Find out who is the big blind
    var acted = [];
    var last_act = [];
    var preflop_raiser = [];

    $("md-list-item[ng-repeat='log in logs']:not([processed])").each(function() {
      is_chat = $(this).find('div[ng-if="::log.type === \'chat\'"]');
      if (!$(is_chat).is(":visible")) {
        player_name = $(this).find("button[ng-if='::log.player']").html();
        message = $(this).find('div[ng-if="log.message && log.message !== \'Community Cards \'"]');
        if(!acted.includes(player_name)) {
          if(typeof player !== 'undefined') {
            if (typeof $(message).html() !== 'undefined') {
              var action = $(message).html().split(" ");
              last_act[player_name] = action[1];
              if(["raised", "raises", "bet", "bets"].includes(action[1])) {
                preflop_raiser.push(player_name);
              }
            }
          }
          if(typeof player_name !== "undefined") {
            acted.push(player_name);
          }
        }
        if(typeof player !== 'undefined') {
          if (typeof $(message).html() !== 'undefined') {
            var action = $(message).html().split(" ");
            if(action[1].includes("fold")) {
              villain_mucked[player_name] = true;
            }
          }
        }
      }
    });

    big_blind = acted.pop();
    big_blind_checked = false;
    big_blind_defended = false;
    if(typeof last_act[big_blind] !== "undefined") {
      last_act[big_blind] = last_act[big_blind].replace("&nbsp;", "");
    }

    if(last_act[big_blind] == "checked") {
      big_blind_checked = true;
    } else {
      if(last_act[big_blind] == "called") {
        big_blind_defended = true;
      }
    }

    var consecutive_actions = [];

    // c-bet detection
    var cbet_player = "";
    var aggressor_player = "";

    if(typeof betting_action["PREFLOP"] !== "undefined" && typeof betting_action["FLOP"] !== "undefined") {
      let preflop_aggressor = betting_action["PREFLOP"];
      let flop_aggressor = betting_action["FLOP"];
      if(preflop_aggressor === flop_aggressor) {
        cbet_player = preflop_aggressor;
      }
      aggressor_player = preflop_aggressor;
    }

    $("md-list-item[ng-repeat='log in logs']:not([processed])").each(function() {
      $(this).attr("processed", "true");
      is_chat = $(this).find('div[ng-if="::log.type === \'chat\'"]');
      if (!$(is_chat).is(":visible")) {
        player = $(this).find("button[ng-if='::log.player']");
        message = $(this).find('div[ng-if="log.message && log.message !== \'Community Cards \'"]');
        if(typeof player !== 'undefined') {
          if (typeof $(message).html() !== 'undefined') {
            var action = $(message).html().split(" ");
            if(typeof action !== "undefined") {
              action[1] = action[1].replace("&nbsp;","");
            }
            var player_name = player.html();
            switch(action[1]) {
              case "bet":
                villain_vpip[player_name] = true;
                break;
              case "bets":
                villain_vpip[player_name] = true;
                break;
              case "calls":
                villain_vpip[player_name] = true;
                break;
              case "called":
                villain_vpip[player_name] = true;
                break;
              case "checked":
                break;
              case "folded":
                villain_mucked[player_name] = true;
                break;
              case "folds":
                villain_mucked[player_name] = true;
                break;
              case "raised":
                villain_vpip[player_name] = true;
                break;
              case "raises":
                villain_vpip[player_name] = true;
                break;
            }
          }
        }
      }
      card = $(this).find("div[ng-repeat='card in ::log.hand track by $index']");
      $(card).each(function() {
        rank = $(this).find(".rank").html();
        suit_class = $(this).attr("class");
        suit_arr = suit_class.split(" ");
        if (typeof suit_class !== "undefined") {
          var suit = "";
          if (suit_arr.includes("HEARTS")) {
            suit = "h";
          }
          if (suit_arr.includes("DIAMONDS")) {
            suit = "d";
          }
          if (suit_arr.includes("SPADES")) {
            suit = "s";
          }
          if (suit_arr.includes("CLUBS")) {
            suit = "c";
          }
          if (typeof player !== "undefined") {
            if(typeof villain_hands[player.html()] === "undefined") {
              villain_hands[player.html()] = [];
            }
            villain_hands[player.html()].push(rank + suit);
          }
        }
      });
    });

    non_vpip = [];
    yes_vpip = [];
    was_bb_def = false;

    // Get list of players at table
    var player_list = getPlayerList();

    var mucked_players = [];
    for (const [name, mucked] of Object.entries(villain_mucked)) {
      if(mucked == true) {
        if(player_list.includes(name)) {
          mucked_players.push(name);
        }
      }
    }

    for (const [name, vpiped] of Object.entries(villain_vpip)) {
      if(player_list.includes(name)) {
        if(vpiped == true) {
          if(big_blind != name) {
            // If player was not bb, player definitely vpiped
            yes_vpip.push(name);
          } else {
            if(big_blind_checked == true) {
              // If the bb checked, he did not vpip
              non_vpip.push(name);
            } else {
              // Here, villain is bb. BB either raised or called
              // We should assume villain defended his blind here.
              // We only count blind defends if villain flat called
              // a preflop raise here though
              if(big_blind_defended == true) {
                was_bb_def = true;
              } else {
                was_bb = name;
                was_bb_def = false;
              }
              yes_vpip.push(name);
            }
          }
        } else {
          if(name != 'undefined') {
            non_vpip.push(name);
          }
        }
      }
    }

    var showdowns = [];

    for (const [name, cards] of Object.entries(villain_hands)) {
      card_1 = cards[0];
      card_2 = cards[1];
      rank_1 = card_1[0];
      rank_2 = card_2[0];
      suit_1 = card_1[1];
      suit_2 = card_2[1];
      actual_hand = rank_1 + rank_2;

      if (name !== "undefined") {
        actual_hand = getSortedStartingHand([rank_1, rank_2], [suit_1, suit_2]);
        seat_no = getPlayerSeat(name);
        seat_pos = getSeatPosition(seat_no);

        // Exclude villains who folded and showed their hand
        if(!mucked_players.includes(name)) {
          showdowns.push(name + "###" + seat_pos + "###" + actual_hand);
        }
      }
    }

    var player_id_map = {};
    var concatted_names = non_vpip.concat(yes_vpip);
    for(i in concatted_names) {
      this_name = concatted_names[i];
      this_id = getPlayerIdFromName(this_name);
      player_id_map[this_name] = this_id;
    }

    result = {
      pfr_players: preflop_raiser,
      aggressor_player: aggressor_player,
      cbet_player: cbet_player,
      showdowns: showdowns,
      vpip: yes_vpip.join(","),
      in_hand: non_vpip.concat(yes_vpip),
      bb: big_blind,
      bb_def: was_bb_def,
      id_list: player_id_map
    }
    villain_hands = [];
    villain_vipip = [];
    betting_action = [];
    high_bet = 0;
    addToHistory(result, unique_code);
    return(result);
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
      $.ajax({
        url: 'https://api.blockchainpokerhud.com/gethandstrength/',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(
          {
            evaluate: [evaluate_a, evaluate_b],
            api_key: apiKey + '_' + id + '_' + tid,
          }
        ),
        dataType: 'json',
        success: function(msg, status, jqXHR) {
          hand_strength = msg; 
        }
      });
    } else {
      hand_strength = "undefined";
      // There is no current hand strength to evaluate
    }
  }
}

function getUpdate(id, tid) {
  if(typeof apiKey !== "undefined" && apiKey !== "unset") {
    $.ajax({
      url: 'https://api.blockchainpokerhud.com/',
      type: 'POST',
      contentType: 'application/json',
      data: JSON.stringify(
        {
          getupdate: "true",
          api_key: apiKey + '_' + id + '_' + tid,
        }
      ),
      dataType: 'json',
      success: function(msg, status, jqXHR) {
        hud_components = msg;
      }
    });
  } else {
    chrome.storage.sync.get({
      apiKey: 'unset'
    }, function(items) {
      apiKey = items.apiKey;
      if(typeof apiKey !== "undefined" && apiKey !== "unset") {
        $.ajax({
          url: 'https://api.blockchainpokerhud.com/',
          type: 'POST',
          contentType: 'application/json',
          data: JSON.stringify(
            {
              getupdate: "true",
              api_key: apiKey + '_' + id + '_' + tid,
            }
          ),
          dataType: 'json',
          success: function(msg, status, jqXHR) {
            hud_components = msg;
          }
        });
      }
    });
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
  var code_arr = unique_code.split("?")
  hand_code = code_arr[1];
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
        data: history,
        unique_code: hand_code,
        api_key: apiKey,
        short_handed: isShortHanded,
        table_format: getMaxSeats()
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
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Position finding algorhythm
// Some of this is provided by table_state. We also
// do cutoff and utg, however
function getPosition(my_pos, dealer_pos, seats) {
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
    return table_state.blinds.big;
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
        let bigblind = table_state.blinds.big;
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
        aliases: historical_aliases
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
          sample_sizes = "<hr>Sample sizes:<br /><br />Hands: " + historical_hp + "<br />bbd%: " + historical_bbd_hp + "<br />cb%: " + historical_cb_hp;
        }

        if(villain_name == our_name) {
          postpend = " <div class='tooltip'>" + king_icon + "<span class='tooltiptext'>" + villain_name + " is a king! Hello, your grace.</span></div>";
        } else if(is_newbie === true) {
          postpend = " <div class='tooltip'>" + newbie_icon + "<span class='tooltiptext'>" + villain_name + " does not have a significant hand history! Take these stats with a grain of salt." + sample_sizes + "</span></div>";
        } else if(is_clown === true) {
          postpend = " <div class='tooltip'>" + clown_icon + "<span class='tooltiptext'>" + villain_name + " is a clown! Prepare to be donked." + sample_sizes + " </span></div>";
        } else if(is_maniac === true) {
          postpend = " <div class='tooltip'>" + maniac_icon + "<span class='tooltiptext'>" + villain_name + " is very aggressive. Trap this maniac." + sample_sizes + "</span></div>";
        } else if(is_calling_station === true) {
          postpend = " <div class='tooltip'>" + robot_icon + "<span class='tooltiptext'>" + villain_name + " is a calling station! Value bet all the way." + sample_sizes + "</span></div>";
        } else if(is_fish === true) {
          postpend = " <div class='tooltip'>" + fish_icon + "<span class='tooltiptext'>" + villain_name + " is a fish! Happy fishing." + sample_sizes + " </span></div>";
        } else if (is_shark === true) {
          postpend = " <div class='tooltip'>" + shark_icon + "<span class='tooltiptext'>" + villain_name + " is a shark! Be careful." + sample_sizes + "</span></div>";
        } else if (is_turtle === true) {
          postpend = " <div class='tooltip'>" + turtle_icon + "<span class='tooltiptext'>" + villain_name + " is a turtle! They don't raise often." + sample_sizes + "</span></div>";
        } else {
          postpend = " <div class='tooltip'>" + rainbow_icon + "<span class='tooltiptext'>" + villain_name + " is diverse! It is hard to pin this player down." + sample_sizes + "</span></div>";
        }
        $(this).find(".stats").html(villain_hud.join(", ") + postpend);
        $(this).find(".stats").attr("style","font-size: 11px; background: #000; left:8px; position: relative; padding: 2px 5px 2px; text-align: center");
      }
    });

    addTableDiv();
    var chips_in_play = getGrandTotalChipsInPlay();
    $(".infobox").html("In play: " + displayNumber(chips_in_play.toFixed(2)));

    getHandStrength(id, tid);

    var hud_prefix = "";

    if(autotopup == true) {
      if(typeof table_state !== "undefined" && typeof you_state !== "undefined") {
        topup_btn = $("button[ng-disabled='pendingOptions.topUp']");
        if($(topup_btn).is(":visible")) {
          let max_buyin = table_state.maxBuyIn;
          let blind_size = table_state.blinds.big;
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
