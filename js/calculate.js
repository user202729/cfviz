'use strict';

function getEloWinProbability(ra, rb) {
  return 1.0 / (1.0 + Math.pow(10.0, (rb - ra) / 400.0));
}

/**
 * Compute the expected rank of user A assuming A and all users in contestants
 * compete in a contest and A has rating = rating.
 *
 * If A is included in contestants (at index i), then subtract
 * getEloWinProbability(contestants.content[i], rating) from the result.
 */
function getSeed(contestants, rating) {
  if (rating in contestants.memSeed) {
    return contestants.memSeed[rating];
  }
  var result = 1.0;
  for (var i = 0; i < contestants.content.length; i++) {
    result += getEloWinProbability(contestants.content[i].rating, rating);
  }
  contestants.memSeed[rating] = result;
  return result;
}

/**
 * Given rank, return the rating r such that the expected rank of the user is rank
 * when they have rating = r instead of realRating.
 */
function getRatingToRank(contestants, realRating, rank) {
  var left = 1;
  var right = 8000;
  while (right - left > 1) {
    var mid = parseInt((left + right) / 2);
    if (getSeed(contestants, mid) - getEloWinProbability(realRating, mid) < rank) {
      right = mid;
    } else {
      left = mid;
    }
  }
  return left;
}

/**
 * Assume contestants are sorted by increasing rank, reassign the rank such that if
 * there are multiple people with equal rank, the largest one will be chosen.
 *
 * Ranks start from 1.
 *
 * Example: (list of ranks)
 *
 * Input: [1, 1, 3, 4, 5, 6, 6]
 * Output: [2, 2, 3, 4, 5, 7, 7]
 */
function reassignRanks(contestants) {
  var first  = 0;
  var rank = contestants.content[0].rank;
  for (var i = 1; i < contestants.content.length; i++) {
    if (contestants.content[i].rank > rank) {
      for (var j = first; j < i; j++) {
        contestants.content[j].rank = i;
      }
      first = i;
      rank = contestants.content[i].rank;
    }
  }
  for (var i = first; i < contestants.content.length; i++) {
    contestants.content[i].rank = contestants.content.length;
  }
}

function process(contestants) {
  if (contestants.content.length == 0) {
    return;
  }
  reassignRanks(contestants);
  for (var i = 0; i < contestants.content.length; i++) {
    var contestant = contestants.content[i];
    var rating = contestant.rating;
    contestant.seed = getSeed(contestants, rating) - 0.5;
    var midRank = Math.sqrt(contestant.rank * contestant.seed);
    contestant.needRating = parseInt(getRatingToRank(contestants, rating, midRank));
    contestant.delta      = parseInt((contestant.needRating - contestant.rating) / 2);
  }

  contestants.content.sort(function(a, b) { return b.rating-a.rating; });

  {
    var sum = 0;
    for (var i = 0; i < contestants.content.length; i++) {
      sum += parseInt(contestants.content[i].delta);
    }
    var inc = parseInt(-sum / contestants.content.length) - 1;
    for (var i = 0; i < contestants.content.length; i++) {
      contestants.content[i].delta += inc;
    }
  }


  var sum = 0;
  var zeroSumCount = parseInt(Math.min((parseInt(4 * Math.round(Math.sqrt(contestants.content.length)))), contestants.content.length));
  for (var i = 0; i < zeroSumCount; i++) {
    sum += contestants.content[i].delta;
  }
  var inc = parseInt(Math.min(Math.max(parseInt(-sum / zeroSumCount), -10), 0));
  for (var i = 0; i < contestants.content.length; i++) {
    contestants.content[i].delta += inc;
  }
}


function CalculateRatingChanges(previousRatings, standingsRows, userId) {
  var arr = [];
  for (var i = 0; i < standingsRows.length; i++) {
    var currentContestant = {party: userId[i], rank: standingsRows[i], rating: previousRatings[i], seed : 0.0, needRating : 0.0, delta : 0};
    arr.push(currentContestant);
  }
  var memTmp = [];
  var contestants = {
    content : arr,
    memSeed : memTmp
  };
  process(contestants);   
  var result = {};
  for (var i = 0; i < contestants.content.length; i++) {
    result[contestants.content[i].party] = contestants.content[i].delta;
  }
  return contestants.content;
}


function rl(){
  var x=document.createElement('script')
  x.src='js/calculate.js'
  document.body.appendChild(x)
  document.body.removeChild(x)
}

function ts(x){
  handleDiv.children[0].value=x;
  ratingDiv.children[0].value=ratingsDict[x]
  pointsDiv.children[0].value=rows.find(y=>y.party.members[0].handle==x).points
  var results = CalculateRatingChanges(ratings, places, handles);
  showResult(results);
  // console.log(cd[x],cd[x]-ratingsDict[x])
}