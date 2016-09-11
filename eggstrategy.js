var totalKmWalked = null;
var distanceTravelledToGetNewIncubator = null; 

var chance10kmDistribMax = null;
var chance2kmDistribMax = null;

var input = ["2km", "5km", "10km"];

var combinations = findCombinations(input);

var permutations = [];
var c = 0;
for (c = 0; c < combinations.length; c++) {
	permutations = permutations.concat(findPermutations(combinations[c]));
}

//printArray(permutations,0);
var testCases = [];
var numPermutations = permutations.length;
console.log(numPermutations);
var p = 0;
for (p = 0; p < numPermutations; p++) {
	var q = 0;
	for (q = 0; q < numPermutations; q++) {
		testCases[testCases.length] = { blueStrategy : permutations[p], orangeStrategy : permutations[q] };
	}
}
console.log(testCases.length);
var TOTAL_EGG_SLOTS = 9;

function run() {

	try {
//console.profile('myProfiler');
		totalKmWalked = document.getElementById("totalKmWalked").value;
		distanceTravelledToGetNewIncubator = document.getElementById("kmPerNewIncubator").value; 
		var chance10km = document.getElementById("chance10km").value;
		var chance2km = document.getElementById("chance2km").value;
		var chance5km = 1 - chance10km - chance2km;

		document.getElementById("calculatedChance5km").innerHTML = "Chance of 5 km egg: " + chance5km;

		chance10kmDistribMax = chance10km;
		chance2kmDistribMax = chance10km + chance2km;

		var results = document.getElementById("results");
		results.innerHTML = "";

		// use same initial eggs for every strategy
		var initEggs = [];
		var i = 0;
		for (i = 0; i < TOTAL_EGG_SLOTS; i++) {
			initEggs[initEggs.length] = generateRandomEgg();
		}
		var bestFor10kmHatching = [];
		var totalTestCases = testCases.length;
		var c = 0;
		for (c = 0; c < totalTestCases; c++) {
			var testCase = testCases[c];
			testCase.eggSlots = [];
			testCase.blueIncubators = [];
			testCase.orangeIncubator = { remUses : Infinity, isOccupied : false };
			testCase.hatchedEggs = [];

			var h2 = document.createElement("h2");
			h2.innerHTML = "Strategy " + (c+1) + ": " + testCase.blueStrategy + " / " + testCase.orangeStrategy;
			results.appendChild(h2);
			var desc = document.createElement("span");
			desc.innerHTML = "Blue incubator strategy: " + testCase.blueStrategy + "; orange incubator strategy: " + testCase.orangeStrategy + ". ";
			results.appendChild(desc);
			var showHideLink = document.createElement("span");
			showHideLink.innerHTML = '<a href="#" onclick="toggle(\'eggSlots' + (c+1) + '\');return false;">Show/Hide details</a><br/>';
			results.appendChild(showHideLink);
			var table = document.createElement("table");
			table.id = "eggSlots" + (c+1);
			table.style = "display:none";
			results.appendChild(table);
			var stratResults = document.createElement("div");
			stratResults.id = "strategy" + (c+1);
			results.appendChild(stratResults);
			var leftovers = document.createElement("div");
			leftovers.id = "leftovers" + (c+1);
			results.appendChild(leftovers);	

			var tr = table.insertRow();
			var th = document.createElement("th");
			th.innerHTML = "Distance walked (km)";
			tr.appendChild(th);
			var i = 0;
			for (i = 0; i < TOTAL_EGG_SLOTS; i++) {
				var egg = { type : initEggs[i].type, remIncubation : initEggs[i].remIncubation };
				testCase.eggSlots[i] = {egg : egg, incubator : null};

				// create headings in eggSlots tables
				th = document.createElement("th");
				th.innerHTML = "Egg Slot " + (i+1);
				tr.appendChild(th);
			}
			th = document.createElement("th");
			th.innerHTML = "New Incubators";
			tr.appendChild(th);
			var km = 0;
			for (km = 0; km < totalKmWalked; km++) {
				var newInc = 0;
				if (km % distanceTravelledToGetNewIncubator == 0) {
					newInc = 1;
					testCase.blueIncubators[testCase.blueIncubators.length] = { remUses : 3, isOccupied : false };
				}
				printEggSlots("eggSlots" + (c+1), testCase.eggSlots, km, newInc);
				useBlueIncubatorStrategy(testCase.blueIncubators, testCase.eggSlots, testCase.blueStrategy);
				useStrategy(testCase.orangeIncubator, testCase.eggSlots, testCase.orangeStrategy);
				for (s = 0; s < TOTAL_EGG_SLOTS; s++) {
					if (testCase.eggSlots[s] == null) {
						testCase.eggSlots[s] = { egg : generateRandomEgg(), incubator : null };
					}
				}
				incrementIncubationTime(testCase.eggSlots);
				findHatchedEggs(testCase.hatchedEggs, testCase.eggSlots);
			}

			var hatched10kmCount = 0;
			var hatched5kmCount = 0;
			var hatched2kmCount = 0;
			var h = 0;
			for (h = 0; h < testCase.hatchedEggs.length; h++) {
				var pokemon = testCase.hatchedEggs[h];
				if (pokemon.type == "10km") {
					hatched10kmCount++;
				} else if (pokemon.type == "5km") {
					hatched5kmCount++;
				} else if (pokemon.type == "2km") {
					hatched2kmCount++;
				} 
			}
			stratResults.innerHTML = "<h3>Hatches:</h3><strong>10km: " + hatched10kmCount + "</strong><br/>5km: " + hatched5kmCount + "<br/>2km: " + hatched2kmCount + "<br/><strong>Total: " + testCase.hatchedEggs.length + "</strong>";
			printLeftoverBlueIncubators("leftovers" + (c+1), testCase.blueIncubators);
			var inserted = false;
			var count = bestFor10kmHatching.length;
			var m = 0;
// try binary search instead
			while (!inserted && m < count) {
				if (hatched10kmCount > bestFor10kmHatching[m].hatched10kmCount) {
					bestFor10kmHatching.splice(m, 0, { hatched10kmCount : hatched10kmCount, testCase : testCase, index : c});
					inserted = true;
				}
				m++;
			}
			if (!inserted) {
				bestFor10kmHatching[count] = {hatched10kmCount : hatched10kmCount, testCase : testCase, index : c};
			}
console.log('total blue incubators: ' + testCase.blueIncubators.length);
		}
		var n = 0;
		for (n = 0; n < bestFor10kmHatching.length; n++) {
			var item = bestFor10kmHatching[n];
			console.log(item.hatched10kmCount + " #" + item.index + ": " + item.testCase.blueStrategy + " , " + item.testCase.orangeStrategy);
		}

//console.profileEnd('myProfiler');
	} catch (err) {
		document.getElementById("errors").innerHTML = err.message; 
	}

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

function useBlueIncubatorStrategy(incubators, eggSlots, eggTypes) {
	var totalBlueIncubators = incubators.length;
	var b = 0;
	for (b = 0; b < totalBlueIncubators; b++) {
		useStrategy(incubators[b], eggSlots, eggTypes);
	}
}

function useStrategy(incubator, eggSlots, eggTypes) {
	if (isUsable(incubator)) {
		var numEggTypes = eggTypes.length;
		var t = 0;
		for (t = 0; t < numEggTypes; t++) {
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
	return !(incubator.isOccupied) && (incubator.remUses == Infinity || incubator.remUses > 0);
}

function printEggSlots(elementId, eggSlots, km, numNewInc) {
	var tr = document.getElementById(elementId).insertRow();
	var th = document.createElement("th");
	th.innerHTML = km;
	tr.appendChild(th);
	var td;
	var i = 0;
	for (i = 0; i < TOTAL_EGG_SLOTS; i++) {
		var eggSlot = eggSlots[i];
		td = tr.insertCell();
		if (eggSlot == null) {
			text = "Hatched";
			td.style.backgroundColor = "lime";
		} else {
			var egg = eggSlot.egg;
			var text = getEggIncubationCompletionText(egg);
			var incubator = eggSlot.incubator;
			if (incubator != null) {
				if (incubator.remUses == Infinity) {
					td.style.backgroundColor = "orange";
				} else if (incubator.remUses == 3) {
					td.style.backgroundColor = "#6666ff";
				} else if (incubator.remUses == 2) {
					td.style.backgroundColor = "#9999ff";
				} else if (incubator.remUses == 1){
					td.style.backgroundColor = "#ccccff";
				} else {
					td.style.backgroundColor = "red";
				}				
			}
		}
        	td.appendChild(document.createTextNode(text));
	}
	td = tr.insertCell();
        td.appendChild(document.createTextNode(numNewInc));
}

function getEggIncubationCompletionText(egg) {
	var eggType = egg.type;
	//var eggTypeLength = eggType.length;
	var completion = eggType.slice(0, eggType.length - 2) - egg.remIncubation;
	return completion + "/" + eggType;
}

function incrementIncubationTime(eggSlots) {
	for (i = 0; i < TOTAL_EGG_SLOTS; i++) {
		if (eggSlots[i] != null) {
			var eggSlot = eggSlots[i];
			var egg = eggSlot.egg;
			var incubator = eggSlot.incubator;
			if (eggSlot != null && egg != null && incubator != null) {
				egg.remIncubation--;
			}
		}
	}
}

function findHatchedEggs(hatchedEggs, eggSlots) {
	for (i = 0; i < TOTAL_EGG_SLOTS; i++) {
		if (eggSlots[i] != null) {
			var egg = eggSlots[i].egg;
			if (egg != null && egg.remIncubation <= 0) {
				var index = hatchedEggs.length;
				hatchedEggs[index] = egg;
				var incubator = eggSlots[i].incubator;
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
	var egg = null;
	var i = 0;
	for (i = 0; i < TOTAL_EGG_SLOTS; i++) {
		eggSlot = eggSlots[i];
		if (eggSlot != null) {	
			egg = eggSlot.egg;
			if (egg != null && eggSlot.incubator == null && egg.type == eggType) {
				incubator.isOccupied = true;
				eggSlot.incubator = incubator;
				return true;
			}
		}
	}
  	return false;
}

function generateRandomEgg() {
	var random = Math.random();
	var eggType;
	var remainingIncubationTime;
	if (random < chance10kmDistribMax) {
		eggType = "10km";
		remainingIncubationTime = 10;
	} else if (random < chance2kmDistribMax) {
		eggType = "2km";
		remainingIncubationTime = 2;
	} else {
		eggType = "5km";
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

