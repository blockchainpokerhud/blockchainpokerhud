var prevCards = [];
var revealMap = {};
var valueMap = {};
var winMap = {};
var had_bet = false;

function suitNameToLetter(suit) {
  switch(suit) {
    case "HEARTS":
      return("h");
    case "DIAMONDS":
      return("d");
    case "CLUBS":
      return("c");
    case "SPADES":
      return("s");
    default:
      return("?");
  }
}

function parseCards(street, cards) {
  let response = []
  let thisCards = [];

  response.push(street + ":");
  for(card of cards) {
    thisCards.push(card.rank + suitNameToLetter(card.suit));
  }

  prevCards.push("[" + thisCards.join(" ") + "]");
  response.push("*** " + street + " *** " + prevCards.join(" "));
  had_bet = false;
  return(response.join("\n"));
}

function getPlayerList(seats) {
  let player_list = [];

  let seat_num = 0;
  for(player of seats) {
    seat_num++;
    player_list.push("Seat " + seat_num + ": " + player.name + " (" + (player.stack + player.potContributions + player.rakeTaken) + " in chips)");
  }
  return(player_list.join("\n"));
}

function getButton(seats) {
  let seat_num = 0;
  for(player of seats) {
    seat_num++;
    if(player.isDealer == true) {
      return(seat_num);
    }
  }
  return(0);
}

function handRankToName(name) {
  return(name.charAt(0).toUpperCase() + name.slice(1).toLowerCase().replace(/_/g, " "));
}

function convertHand(handhistory, handId, hc = []) {
  response = [];
  prevCards = [];
  revealMap = {};
  valueMap = {};
  winMap = {};

  // Determine until which street this hand was played
  let last_round = 0;
  let round_map = {};
  let id_list = {};
  let action_map = [];
  let community_cards = {};
  let table_name = handhistory["name"];
  let num_seats = handhistory["numSeats"];
  let button_seat = getButton(handhistory["seats"]);

  let hand_ts = "";
  for(const[i, round] of handhistory["rounds"].entries()) {
    last_round = i;
    round_map[i] = Date.parse(round.time);
    if(hand_ts == "") {
      hand_ts = round.time;
    }
    community_cards[i] = round.community;
  }

  let big_blind_amount = handhistory["blinds"].big;
  response.push("Blockchain Poker Hand #" + handId + ":  Hold'em No Limit (" + (big_blind_amount/2) + "/" + big_blind_amount + ") - " + hand_ts);
  response.push("Review the hand online at: https://blockchain.poker/#/history?hand=" + hand_id);
  response.push("Generated with Blockchain Poker HUD https://blockchainpokerhud.com/");
  response.push("Table '" + table_name + "' " + num_seats + "-max Seat #" + button_seat + " is the button");
  response.push(getPlayerList(handhistory["seats"]));
  if(hc[3]) {
    response.push("Dealt to hero: " + hc[3]);
  }

  // Determine if it is a tourney hand or cash game hand
  var is_tourney = true;
  for (action of handhistory["seats"]) {
    if(action.rakeTaken > 0) {
      is_tourney = false;
    }
  }

  for (action of handhistory["seats"]) {
    let seat = action.index;
    let name = action.name;
    let amount = action.amount;
    let money_won = action.winnings - action.rakeTaken;
    let account = action.account;
    let rounds = action.rounds;
    let isBigBlind = action.isBigBlind;
    let isSmallBlind = action.isSmallBlind;
    let isButton = action.isDealer;

    if(isButton == true) {
      response.push(name + " has the button");
    }
    if(isBigBlind == true) {
      response.push(name + " posts the big blind (" + big_blind_amount + ")")
    }
    if(isSmallBlind == true) {
      response.push(name + " posts the small blind (" + (big_blind_amount/2) + ")")
    }

    if(money_won > 0 && typeof money_won[action.name] == "undefined") {
      winMap[action.name] = money_won;
    }

    id_list[name] = account.toString();
    if(typeof action["handRank"] !== "undefined") {
      valueMap[action.name] = handRankToName(action["handRank"]);
    }
    for(card of action["cards"]) {
      if(card.holeCard == true && card.isRevealed == true) {
        if(typeof revealMap[action.name] == "undefined") {
          revealMap[action.name] = [];
        }
        revealMap[action.name].push("[" + card.rank + suitNameToLetter(card.suit) + "]");
      }
    }
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

  //response.push(action_keys);

  var show_flop = false;
  var show_turn = false;
  var show_river = false;

  for(k of action_keys) {
    let actions = action_map[k];
    let ts = k;
    let preflop = round_map[0];
    let flop = round_map[1];
    let turn = round_map[2];
    let river = round_map[3];
    let street = "";

    if(typeof river !== "undefined" && ts > river) {
      if(show_river == false) {
        response.push(parseCards("RIVER", community_cards[3]));
        show_river = true;
      }
    } else if(typeof turn !== "undefined" && ts > turn) {
      if(show_turn == false) {
        response.push(parseCards("TURN", community_cards[2]));
        show_turn = true;
      }
    } else if(typeof flop !== "undefined" && ts > flop) {
      if(show_flop == false) {
        response.push(parseCards("FLOP", community_cards[1]));
        show_flop = true;
      }
    } else {
      street = "preflop";
    }
    switch(actions.type) {
      case "FOLD":
        response.push(actions.name + " folds");
        break;
      case "RAISE":
        if(had_bet == false) {
          had_bet = true;
          response.push(actions.name + " bets " + actions.amount);
        } else {
          response.push(actions.name + " raises to " + actions.amount);
        }
        break;
      case "CALL":
        response.push(actions.name + " calls " + actions.amount);
        break;
      case "CHECK":
        response.push(actions.name + " checks");
        break;
      case "POST_BLIND":
        // we track this in another way
        break;
      default:
        response.push(actions.name + " ??? " + actions.type);
        break;
    }
  }
  if(show_flop == false && community_cards[1]) {
    show_flop = true;
    response.push(parseCards("FLOP", community_cards[1]));
  }
  if(show_turn == false && community_cards[2]) {
    show_turn = true;
    response.push(parseCards("TURN", community_cards[2]));
  }
  if(show_river == false && community_cards[3]) {
    show_river = true;
    response.push(parseCards("RIVER", community_cards[3]));
  }

  for(player of Object.keys(revealMap)) {
    let handValue = "";
    if(typeof valueMap[player] !== "undefined") {
      handValue = " (" + valueMap[player] + ")";
    }
    response.push(player + " reveals " + revealMap[player].join(" ") + handValue);
  }
  for(player of Object.keys(winMap)) {
    response.push(player + " won " + winMap[player] + " chips.");
  }
  return(response.join("\n"));
}
