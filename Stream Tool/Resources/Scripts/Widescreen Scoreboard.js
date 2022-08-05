'use strict';

//to store the current character info
let prevScInfo;

//the characters image file path will change depending if they're workshop or not
const charPath = "Resources/Characters/";;
const charPathBase = "Resources/Characters/";

function pushArrayInOrder(array, string) {
    for (let i = 0; i < 4; i++) {
        array.push(document.getElementById("p"+(i+1)+string));
    }
}

const pWins = [], pCardDiv1 = [], pCardDiv2 = [], pCard1 = [], pCard2 = [], pCoins = [], pName = [], pPros = [];
pushArrayInOrder(pWins, "Win");
pushArrayInOrder(pCardDiv1, "CardDiv1");
pushArrayInOrder(pCardDiv2, "CardDiv2");
pushArrayInOrder(pCard1, "Card1");
pushArrayInOrder(pCard2, "Card2");
pushArrayInOrder(pCoins, "CoinsNum");
pushArrayInOrder(pName, "Name");
pushArrayInOrder(pPros, "Pronouns");

/* script begin */
async function mainLoop() {
	const scInfo = await getInfo();
	getData(scInfo);
}
mainLoop();
setInterval( () => { mainLoop(); }, 500); //update interval

async function getData(scInfo) {

  if (scInfo != prevScInfo){
    prevScInfo = scInfo;

  	const player = scInfo['player'];

    for(let i = 0; i < 4; i++){
      updateWins(player[i].score, pWins[i]);
      updateCardInfluence(player[i].influences, pCardDiv1[i], pCardDiv2[i]);
      updateCards(player[i].cards, pCard1[i], pCard2[i]);
      updateCoins(player[i].coins, pCoins[i]);
      updateNames(player[i].name, pName[i]);
      updatePronouns(player[i].pronouns, pPros[i]);
    }
  }
}

async function updateWins(pScore, pWins){
  console.log(pScore);
  console.log(pScore > 0);
  if (pScore > 0){
    pWins.style.opacity = "1";
  } else {
    pWins.style.opacity = "0.0";
  }
}

async function updateCardInfluence(pInfs, pCardDiv1, pCardDiv2){
    if (pInfs[0] == true){
      pCardDiv1.style.opacity = "0.3";
    } else {
      pCardDiv1.style.opacity = "1";
    }

    if (pInfs[1] == true){
      pCardDiv2.style.opacity = "0.3";
    } else {
      pCardDiv2.style.opacity = "1";
    }
}

async function updateCards(pCards, pCard1, pCard2){
  pCard1.src = charPath +'/PM/' + pCards[0] + '.png';
  pCard2.src = charPath +'/PM/' + pCards[1] + '.png';
}

async function updateCoins(pCoins, pCoinsD){
  pCoinsD.textContent = pCoins;
}

async function updateNames(pNames, pNamesD){
  pNamesD.textContent = pNames;
}

async function updatePronouns(pPros, pProsD){
  pProsD.textContent = pPros;
}

//searches for the main json file
function getInfo() {
	return new Promise(function (resolve) {
		const oReq = new XMLHttpRequest();
		oReq.addEventListener("load", reqListener);
		oReq.open("GET", 'Resources/Texts/ScoreboardInfo.json');
		oReq.send();

		//will trigger when file loads
		function reqListener () {
			resolve(JSON.parse(oReq.responseText))
		}
	})
	//i would gladly have used fetch, but OBS local files wont support that :(
}
