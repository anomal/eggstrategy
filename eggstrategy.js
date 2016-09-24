var totalKmWalked = null;
var distanceTravelledToGetNewIncubator = null; 

var chance10kmDistribMax = null;
var chance2kmDistribMax = null;

var ALL_EGG_TYPES = [2, 5, 10];

var combinations = findCombinations(ALL_EGG_TYPES);

var permutations = [];
var c = 0;
for (c = 0; c < combinations.length; c++) {
	permutations = permutations.concat(findPermutations(combinations[c]));
}

var testCases = [];
var numPermutations = permutations.length;
var p = 0;
for (p = 0; p < numPermutations; p++) {
	var q = 0;
	for (q = 0; q < numPermutations; q++) {
		var permutationBlue = permutations[p];
		var permutationOrange = permutations[q];
		var merged = permutationBlue.concat(permutationOrange);
		if (accountsForAllEggTypes(merged)) {
			testCases[testCases.length] = { blueStrategy : permutationBlue, orangeStrategy : permutationOrange };
		}
	}
}
var TOTAL_EGG_SLOTS = 9;
var bestFor10kmHatching = [];
var eggCache = [];
var tenKmHatches = 0;

function accountsForAllEggTypes(merged) {
	return contains(merged, 10) && contains(merged, 5) && contains(merged, 2);
}

function contains(a, obj) {
    var i = a.length;
    while (i--) {
       if (a[i] === obj) {
           return true;
       }
    }
    return false;
}

function run() {
	try {
		totalKmWalked = document.getElementById("totalKmWalked").value;
		distanceTravelledToGetNewIncubator = document.getElementById("kmPerNewIncubator").value; 
		var chance10km = document.getElementById("chance10km").value / 100;
		var chance2km = document.getElementById("chance2km").value / 100;
		var chance5km = 1 - chance10km - chance2km;

		document.getElementById("calculatedChance5km").innerHTML = "Chance of 5 km egg (%): " + (chance5km * 100);

		chance10kmDistribMax = chance10km;
		chance2kmDistribMax = chance10km + chance2km;

		var results = document.getElementById("results");
		results.innerHTML = "";

		// use same initial eggs for every strategy
		eggCache = [];
		var initEggs = [];
		var i = 0;
		for (i = 0; i < TOTAL_EGG_SLOTS; i++) {
			initEggs[initEggs.length] = generateRandomEgg();
		}

		bestFor10kmHatching = [];
		var bestTotalHatches = 0;
		var totalTestCases = testCases.length;
		var c = 0;
		for (c = 0; c < totalTestCases; c++) {
			var testCase = testCases[c];
			testCase.eggSlots = [];
			testCase.blueIncubators = [];
			testCase.orangeIncubator = { remUses : Infinity, isOccupied : false };
			testCase.hatchedEggs = [];

			var id = getTestCaseId(testCase);
			tenKmHatches = 0;
			createTestCaseHeaderDesc(results, id, testCase.blueStrategy, testCase.orangeStrategy);

			var table = document.createElement("table");
			table.id = "eggSlots" + (c+1);
			results.appendChild(table);

			var tableInner = "<tr><th>Distance walked (km)</th>";

			var i = 0;
			for (i = 0; i < TOTAL_EGG_SLOTS; i++) {
				var egg = { type : initEggs[i].type, remIncubation : initEggs[i].remIncubation };
				testCase.eggSlots[i] = {egg : egg, incubator : null};

				// create headings in eggSlots tables
				tableInner += "<th>Egg Slot " + (i+1) + "</th>";
			}
			tableInner += "<th>Blue Incubators</th><th>10km hatches</th><th>Total Hatches</th></tr>";
			var km = 0;
			var eggIndex = 0;
			var totalBlueIncubators = 0;
			var blueStrategyLength = testCase.blueStrategy.length;
			var orangeStrategyLength = testCase.blueStrategy.length;
			for (km = 0; km < totalKmWalked; km++) {
				var newInc = 0;
				if (km % distanceTravelledToGetNewIncubator == 0) {
					newInc = 1;
					testCase.blueIncubators[testCase.blueIncubators.length] = { remUses : 3, isOccupied : false };
				}
				tableInner += printDetails(testCase.eggSlots, km, testCase.blueIncubators.length, testCase.hatchedEggs.length);
				useBlueIncubatorStrategy(testCase.blueIncubators, testCase.eggSlots, testCase.blueStrategy, blueStrategyLength);
				useStrategy(testCase.orangeIncubator, testCase.eggSlots, testCase.orangeStrategy, orangeStrategyLength);
				var s = 0;
				for (s = 0; s < TOTAL_EGG_SLOTS; s++) {
					if (testCase.eggSlots[s] == null) {
						testCase.eggSlots[s] = { egg : getNextEgg(eggIndex), incubator : null };
						eggIndex++;
					}
				}
				incrementIncubationTime(testCase.eggSlots);
				findHatchedEggs(testCase.hatchedEggs, testCase.eggSlots);
			}
			table.innerHTML = tableInner;

			var hatched10kmCount = 0;
			var hatched5kmCount = 0;
			var hatched2kmCount = 0;
			var h = 0;
			for (h = 0; h < testCase.hatchedEggs.length; h++) {
				var pokemon = testCase.hatchedEggs[h];
				if (pokemon.type == 10) {
					hatched10kmCount++;
				} else if (pokemon.type == 5) {
					hatched5kmCount++;
				} else if (pokemon.type == 2) {
					hatched2kmCount++;
				} 
			}

			var totalHatched = testCase.hatchedEggs.length;
			createTestCaseFooter(c, results, hatched10kmCount, hatched5kmCount, hatched2kmCount, totalHatched, testCase.blueIncubators);

			var inserted = false;
			var count = bestFor10kmHatching.length;
			var m = 0;
// try binary search instead
			while (!inserted && m < count) {
				if (isBetter(hatched10kmCount, totalHatched, bestFor10kmHatching[m].hatched10kmCount, bestFor10kmHatching[m].totalHatched)) {
					bestFor10kmHatching.splice(m, 0, { hatched10kmCount : hatched10kmCount, totalHatched : totalHatched, testCase : testCase, id : id });
					inserted = true;
				}
				m++;
			}
			if (!inserted) {
				bestFor10kmHatching[count] = { hatched10kmCount : hatched10kmCount, totalHatched : totalHatched, testCase : testCase, id : id };
			}
			if (totalHatched > bestTotalHatches) {
				bestTotalHatches = totalHatched;
			}
		}
		printBestResultsDesc(bestTotalHatches);

	} catch (err) {
		document.getElementById("errors").innerHTML = err.message; 
	}
}

function createTestCaseFooter(c, results, hatched10kmCount, hatched5kmCount, hatched2kmCount, totalHatched, blueIncubators) {
	var stratResults = document.createElement("div");
	stratResults.id = "strategy" + (c+1);
	results.appendChild(stratResults);
	var leftovers = document.createElement("div");
	leftovers.id = "leftovers" + (c+1);
	results.appendChild(leftovers);

	stratResults.innerHTML = "<h3>Hatches:</h3><strong>10km: " + hatched10kmCount + "</strong><br/>5km: " + hatched5kmCount + "<br/>2km: " + hatched2kmCount + "<br/><strong>Total: " + totalHatched + "</strong>";
	printLeftoverBlueIncubators("leftovers" + (c+1), blueIncubators);
}

function createTestCaseHeaderDesc(results, id, blueStrategy, orangeStrategy) {
	var anchor = document.createElement("a");
	anchor.id = id;
	results.appendChild(anchor);
	var h2 = document.createElement("h2");
	h2.innerHTML = "Strategy " + id + ": " + blueStrategy + " / " + orangeStrategy;
	anchor.appendChild(h2);
	var backtotop = document.createElement("p");
	backtotop.innerHTML = "<a href='#'>Back to top</a>";
	results.appendChild(backtotop);
	var desc = document.createElement("p");
	desc.innerHTML = "Blue incubator strategy: " + blueStrategy + "; orange incubator strategy: " + orangeStrategy + ". ";
	results.appendChild(desc);
}

function getTestCaseId(testCase) {
	var id = "";
	var i = 0;
	for (i = 0; i < 3; i++) {
		var digit = testCase.blueStrategy[i];
		if (digit == null) {
			digit = 0;
		} else if (digit == 10) {
			digit = 'a';
		}
		id += digit;
	}
	i = 0;
	for (i = 0; i < 3; i++) {
		var digit = testCase.orangeStrategy[i];
		if (digit == null) {
			digit = 0;
		} else if (digit == 10) {
			digit = 'a';
		}
		id += digit;
	}
	return id;
}

function isBetter(aHatched10kmCount, aTotalHatched, bHatched10kmCount, bTotalHatched) {
	if (aHatched10kmCount - bHatched10kmCount == 0) {
		return aTotalHatched > bTotalHatched;
	} else {
		return aHatched10kmCount > bHatched10kmCount;
	}
}

function printBestResultsDesc(maxTotalHatches) {
	var text = "<table><tr><th style='width: 2em'>#</th><th style='width: 20em'>Prioritization strategy</th><th>10km hatches</th><th>Total hatches</th></tr>";
	var i = 0;
	var length = bestFor10kmHatching.length;
	for (i = 0; i < length; i++) {
		var item = bestFor10kmHatching[i];
		var styleClass10km = "";
		if (item.hatched10kmCount == 0) {
			styleClass10km = "bad";
		} else if ( item.hatched10kmCount == bestFor10kmHatching[0].hatched10kmCount ) {
			styleClass10km = "good";
		}
		var styleClassAll = "";
		if (item.totalHatched == 0) {
			styleClassAll = "bad";
		} else if ( item.totalHatched == maxTotalHatches ) {
			styleClassAll = "good";
		}
		text += "<td><a href='#" + item.id + "'>" + item.id + "</a></td><td>Blue: " + item.testCase.blueStrategy + "; Orange (∞): " + item.testCase.orangeStrategy + "</td><td class='" + styleClass10km + "'>" + item.hatched10kmCount + "</td><td class='" + styleClassAll + "'>" + item.totalHatched +"</td></tr>";
	}
	var best = document.getElementById("best");
	best.innerHTML = text + "</table>";
}

/*
* take [1, 2] and return [ [1,2], [1], [2] ]
*/
function findCombinations(array) {
	var combo = [ array[0] ];
	var combinations = [];
	combinations[0] = combo;
	if (array.length > 1) {
		var remaining = exclude(array[0], array);
		var subcombos = findCombinations(remaining);
		var i = 0;
		for (i = 0; i < subcombos.length; i++) {
			var subcombo = subcombos[i];
			combinations[combinations.length] = subcombo;
			var combo = [];
			combo[0] = array[0];
			var j = 0;
			for (j = 0; j < subcombo.length; j++) {
				combo[j + 1] = subcombo[j];
			}
			combinations[combinations.length] = combo;
		}
		
	}

	return combinations;
}

function findPermutations(eggTypes) {
	var permutations = [];
	if (eggTypes.length == 1) {
		var permutation = [];
		permutation[0] = eggTypes[0]; 
		permutations[0] = permutation;
	} else {

		var t = 0;
		for (t = 0; t < eggTypes.length; t++) {
			var remainingEggTypes = exclude(eggTypes[t], eggTypes);
			var suffixes = findPermutations(remainingEggTypes);
			var s = 0;
			for (s = 0; s < suffixes.length; s++) {
				var permutation = suffixes[s].slice();
				permutation.unshift(eggTypes[t]);
				permutations[permutations.length] = permutation;
			}
		}
	}
	return permutations;
}

function exclude(excluded, eggTypes) {
	var newArray = [];
	var e = 0;
	for (e = 0; e < eggTypes.length; e++) {
		if (eggTypes[e] != excluded) {
			newArray[newArray.length] = eggTypes[e];
		}
	}
	return newArray;
}

function useBlueIncubatorStrategy(incubators, eggSlots, eggTypes, strategyLength) {
	var totalBlueIncubators = incubators.length;
	var b = 0;
	for (b = 0; b < totalBlueIncubators; b++) {
		var blueIncubator = incubators[b];
		if (blueIncubator.remUses == 0) {
			// remove item from array
			incubators.splice(b, 1);
			totalBlueIncubators--;
			b--;
		} else {
			useStrategy(blueIncubator, eggSlots, eggTypes, strategyLength);
		}
	}
}

function useStrategy(incubator, eggSlots, eggTypes, strategyLength) {
	if (isUsable(incubator)) {
		var t = 0;
		for (t = 0; t < strategyLength; t++) {
			if (incubateFirstEggOfType(incubator, eggSlots, eggTypes[t])) {
				return true;
			}
		}
	}
}

function printLeftoverBlueIncubators(elementId, blueIncubators) {
	var text = "";
	var totalCharges = 0;
	for (i = 0; i < blueIncubators.length; i++) {
		var incubator = blueIncubators[i];
		if (incubator.remUses > 0) {
			totalCharges += incubator.remUses;
		}
	}
	text += "<h3>Unused blue incubator uses</h3>";
	text += totalCharges;
	document.getElementById(elementId).innerHTML = text; 
}

function isUsable(incubator) {
	return !(incubator.isOccupied) && (incubator.remUses != 0);
}

function printDetails(eggSlots, km, numInc, hatchedEggsCount) {
	var text = '<tr><th>' + km + '</th>';
	var i = 0;
	for (i = 0; i < TOTAL_EGG_SLOTS; i++) {
		var eggSlot = eggSlots[i];
		if (eggSlot == null) {
			text += '<td class="hatched">Hatched</td>';
		} else {
			var styleClass = '';
			if (eggSlot.incubator != null) {
				styleClass = getDetailsCellStyleClass(eggSlot.incubator.remUses);
			}
			text += '<td class="' + styleClass + '">' + getEggIncubationCompletionText(eggSlot.egg) + '</td>';
		}
	}
	return text + '<td>' + numInc + '</td><td>' + tenKmHatches + '</td><td>' + hatchedEggsCount + '</td></tr>';
}

function getDetailsCellStyleClass(remainingUses) {
	if (remainingUses == Infinity) {
		return 'infinity';
	} else if (remainingUses == 3) {
		return 'threeUses';
	} else if (remainingUses == 2) {
		return 'twoUses';
	} else if (remainingUses == 1){
		return 'oneUse';
	} else {
		return '';
	}
}

function getEggIncubationCompletionText(egg) {
	var eggType = egg.type;
	var completion = eggType - egg.remIncubation;
	return completion + "/" + eggType + "km";
}

function incrementIncubationTime(eggSlots) {
	var i = 0;
	for (i = 0; i < TOTAL_EGG_SLOTS; i++) {
		var eggSlot = eggSlots[i];
		if (eggSlot != null && eggSlot.incubator != null && eggSlot.egg != null) {
			eggSlot.egg.remIncubation--;
		}
	}
}

function findHatchedEggs(hatchedEggs, eggSlots) {
	var numHatchedEggs = hatchedEggs.length;
	for (i = 0; i < TOTAL_EGG_SLOTS; i++) {
		var eggSlot = eggSlots[i];
		if (eggSlot != null) {
			if (eggSlot.egg != null && eggSlot.egg.remIncubation <= 0) {
				hatchedEggs[numHatchedEggs] = eggSlot.egg;
				numHatchedEggs++;
				if (eggSlot.egg.type == 10) {
					tenKmHatches++;
				}

				var incubator = eggSlot.incubator;
				incubator.isOccupied = false;
				if (incubator.remUses != Infinity) {
					incubator.remUses--;
				}
				eggSlots[i] = null;
			}
		}				
	}
}

function incubateFirstEggOfType(incubator, eggSlots, eggType) {
	var eggSlot = null;
	var i = 0;
	for (i = 0; i < TOTAL_EGG_SLOTS; i++) {
		eggSlot = eggSlots[i];
		if (eggSlot != null && eggSlot.incubator == null && eggSlot.egg != null && eggSlot.egg.type == eggType) {
			incubator.isOccupied = true;
			eggSlot.incubator = incubator;
			return true;
		}
	}
  	return false;
}

function getNextEgg(i) {
	var egg = eggCache[i];
	if (egg == null) {
		egg = generateRandomEgg();
		eggCache[i] = egg;
	}
	return { type : egg.type, remIncubation : egg.remIncubation };
}

function generateRandomEgg() {
	var random = Math.random();
	var eggType;
	var remainingIncubationTime;
	if (random < chance10kmDistribMax) {
		eggType = 10;
		remainingIncubationTime = 10;
	} else if (random < chance2kmDistribMax) {
		eggType = 2;
		remainingIncubationTime = 2;
	} else {
		eggType = 5;
		remainingIncubationTime = 5;
	}
	var egg = {
		type : eggType,
		remIncubation : remainingIncubationTime
	}
	return egg;
}

function printArray(array, offset) {
	console.log(" ".repeat(offset) + "[");
	var i = 0;
	for (i = 0; i < array.length; i++) {
		if (Array.isArray(array[i])) {
			printArray(array[i], offset+1);
		} else {
			console.log(" ".repeat(offset+1) + array[i]);
		}
	}
	console.log(" ".repeat(offset) + "]");
}

