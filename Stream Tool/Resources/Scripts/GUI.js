'use strict';

const fs = require('fs');
const path = require('path');
const electron = require('electron');
const ipc = electron.ipcRenderer;

// yes we all like global variables
const textPath = __dirname + '/Texts';
const charPath = __dirname + '/Characters';
const charPathWork = __dirname + '/Characters/_Workshop';
const charPathRandom = __dirname + '/Characters/Random';

const colorList = getJson(textPath + "/Color Slots");
let colorL, colorR;

let currentP1WL = "Nada";
let currentP2WL = "Nada";
let currentBestOf = "Bo5";

let gamemode = 1;

let movedSettings = false;
let charP1Active = false;

let inPF = false;
let currentFocus = -1;

const maxPlayers = 4; //change this if you ever want to remake this into singles only or 3v3 idk


//preload  e v e r y t h i n g
const viewport = document.getElementById('viewport');
const overlayDiv = document.getElementById('overlay');
const goBackDiv = document.getElementById('goBack');

const tNameInps = document.getElementsByClassName("teamName");

//we want the correct order, we cant use getClassName here
function pushArrayInOrder(array, string1, string2 = "") {
    for (let i = 0; i < maxPlayers; i++) {
        let element = document.getElementById(string1+(i+1)+string2);
        if (element !== null){
            array.push(document.getElementById(string1+(i+1)+string2));
        }
    }
}
const pNameInps = [], pTagInps = [], pFinders = [], charLists1 = [], charLists2 = [], charDivLists = [], skinDivLists = [], skinLists = [], charImgs = [], coinImgs = [], coinAmts = [], scores = [], influences1 = [], influences2 = [];
pushArrayInOrder(pNameInps, "p", "Name");
pushArrayInOrder(pTagInps, "p", "Tag");
pushArrayInOrder(pFinders, "pFinder");
pushArrayInOrder(charLists1, "p", "CharSelector1");
pushArrayInOrder(charLists2, "p", "CharSelector2");
pushArrayInOrder(charDivLists, "p", "CharSelectorDiv");
pushArrayInOrder(skinDivLists, "skinSelectorP", "");
pushArrayInOrder(skinLists, "skinListP", "");
pushArrayInOrder(charImgs, "p", "CharImg");
pushArrayInOrder(coinImgs, "p", "CoinImg");
pushArrayInOrder(coinAmts, "p", "CoinAmt");
pushArrayInOrder(scores, "p", "ScoreInput");
pushArrayInOrder(influences1, "p", "InfluenceCheck1");
pushArrayInOrder(influences2, "p", "InfluenceCheck2");

const p1Win1 = document.getElementById('winP1-1');
const p1Win2 = document.getElementById('winP1-2');
const p1Win3 = document.getElementById('winP1-3');
const p2Win1 = document.getElementById('winP2-1');
const p2Win2 = document.getElementById('winP2-2');
const p2Win3 = document.getElementById('winP2-3');

const checks = document.getElementsByClassName("scoreCheck");

const wlButtons = document.getElementsByClassName("wlButtons");
const p1W = document.getElementById('p1W');
const p1L = document.getElementById('p1L');
const p2W = document.getElementById('p2W');
const p2L = document.getElementById('p2L');

const bo3Div = document.getElementById("bo3Div");
const bo5Div = document.getElementById("bo5Div");

const roundInp = document.getElementById('roundName');
const tournamentInp = document.getElementById('tournamentName');
const fetchButton = document.getElementById('fetchButton');

const casters = document.getElementsByClassName("caster");

const forceWL = document.getElementById('forceWLToggle');


init();

function init() {
    //first, add listeners for the bottom bar buttons
    document.getElementById('updateRegion').addEventListener("click", writeScoreboard);
    document.getElementById('settingsRegion').addEventListener("click", moveViewport);

    //if the viewport is moved, click anywhere on the center to go back
    document.getElementById('goBack').addEventListener("click", goBack);

    /* SETTINGS */

    //set listeners for the settings checkboxes
    document.getElementById("allowIntro").addEventListener("click", saveGUISettings);
    document.getElementById("alwaysOnTop").addEventListener("click", alwaysOnTop);

    // load GUI settings
    const guiSettings = JSON.parse(fs.readFileSync(textPath + "/GUI Settings.json", "utf-8"));
    if (guiSettings.allowIntro) {document.getElementById("allowIntro").checked = true};
    if (guiSettings.alwaysOnTop) {document.getElementById("alwaysOnTop").click()};


    //load the character list for all players on startup
    loadCharacters();
    createCharRoster();
    document.getElementById('charRoster').addEventListener("click", hideChars);

    //set listeners that will trigger when character or skin changes
    for (let i = 0; i < charLists1.length; i++) {
        charLists1[i].addEventListener("change", charChangeL);
        charLists2[i].addEventListener("change", charChangeL);
    }

    fetchButton.addEventListener("click", fetchGameData);
}

function isPresetOpen() {
    let theBool = false;
    for (let i = 0; i < pFinders.length; i++) {
        if (pFinders[i].style.display == "block") {
            theBool = true;
        }
    }
    return theBool;
}

function moveViewport() {
    if (!movedSettings) {
        viewport.style.transform = "translateX(calc(-140% / 3))";
        overlayDiv.style.opacity = ".25";
        goBackDiv.style.display = "block"
        movedSettings = true;
    }
}

function goBack() {
    viewport.style.transform = "translateX(calc(-100% / 3))";
    overlayDiv.style.opacity = "1";
    goBackDiv.style.display = "none";
    movedSettings = false;
}


//called whenever we need to read a json file
function getJson(jPath) {
    try {
        return JSON.parse(fs.readFileSync(jPath + ".json"));
    } catch (error) {
        return null;
    }
}

function loadCharacters() {
    //for each player
    for (let i=0; i < charLists1.length; i++) {
        charLists1[i].setAttribute('src', charPath + '/PM/DUKE.png');
        charLists1[i].setAttribute('title', 'DUKE');
        charLists1[i].addEventListener("click", openChars);
        charImgChange(charLists1[i], "DUKE");

        charLists2[i].setAttribute('src', charPath + '/PM/DUKE.png');
        charLists2[i].setAttribute('title', 'DUKE');
        charLists2[i].addEventListener("click", openChars);
        charImgChange(charLists2[i], "DUKE");

        coinImgs[i].setAttribute('src', charPath + '/sdcoin.png');
    }
}


//whenever we click on the character change button
function openChars() {
    let pnum = this.id.substring(this.id.search(/p[0-9]/i) + 1, this.id.search(/p[0-9]/i) + 2);
    let cnum = this.id.substring(this.id.length-1);
    document.getElementById('charRoster').setAttribute('title', pnum + cnum);

    document.getElementById('charRoster').style.display = "flex"; //show the thing
    setTimeout( () => { //right after, change opacity and scale
        document.getElementById('charRoster').style.opacity = 1;
        document.getElementById('charRoster').style.transform = "scale(1)";
    }, 0);
}

//to hide the character grid
function hideChars() {
    document.getElementById('charRoster').style.opacity = 0;
    document.getElementById('charRoster').style.transform = "scale(1.2)";
    setTimeout(() => {
        document.getElementById('charRoster').style.display = "none";
    }, 200);
}

//called whenever clicking an image in the character roster
function changeCharacter() {
    let pnum = document.getElementById('charRoster').title.substring(0,1);
    let cnum = document.getElementById('charRoster').title.substring(1,2);

    if (cnum == 1) {
      charLists1[pnum - 1].setAttribute('title', this.id);
      charLists1[pnum - 1].setAttribute('src', charPath + '/PM/' + this.id + '.png');
      charImgChange(charLists1[pnum - 1], this.id);
    } else if (cnum == 2) {
      charLists2[pnum - 1].setAttribute('title', this.id);
      charLists2[pnum - 1].setAttribute('src', charPath + '/PM/' + this.id + '.png');
      charImgChange(charLists2[pnum - 1], this.id);
    }
}

//same as above but for the swap button
function changeCharacterManual(char, pNum) {
    let tempP1Char;
    let tempP1Skin;

    document.getElementById('p'+pNum+'CharSelector').setAttribute('src', charPath + '/' + char + '/CSS.png');
    if (pNum == 1) {
        charP1 = char;
        skinP1 = `${charP1} (1)`;
        charImgChange(charImgP1, char);
        addSkinIcons(1);
    } else {
        charP2 = char;
        skinP2 = `${charP2} (1)`;
        charImgChange(charImgP2, char);
        addSkinIcons(2);
    }
}

//also called when we click those images
function addSkinIcons(pNum) {
    document.getElementById('skinListP'+pNum).innerHTML = ''; //clear everything before adding

    // TODO: Here is ex for skin info
    let charInfo = getJson(charPath + '/' + charLists[pNum - 1].title + '/_Info');
    if (charInfo != undefined) { //if character doesnt have a list (for example: Random), skip this
        //add an image for every skin on the list
        for (let i = 0; i < charInfo.skinList.length; i++) {

            let newImg = document.createElement('img');
            newImg.className = "skinIcon";
            newImg.id = 'p' + pNum + ' ' + charLists[pNum - 1].title;
            newImg.title = charInfo.skinList[i];

            newImg.setAttribute('src', charPath + '/' + charLists[pNum - 1].title + '/Stocks/' +charInfo.skinList[i] + '.png');
            newImg.addEventListener("click", changeSkinListener);

            document.getElementById('skinListP'+pNum).appendChild(newImg);
        }

    }

    //if the list only has 1 skin or none, hide the skin list
    if (document.getElementById('skinListP'+pNum).children.length <= 1) {
        document.getElementById('skinSelectorP'+pNum).style.opacity = 0;
    } else {
        document.getElementById('skinSelectorP'+pNum).style.opacity = 1;
    }
}
//whenever clicking on the skin images
function changeSkinListener() {
    let pNum = this.id.substring(this.id.search(/p[0-9]/i) + 1, this.id.search(/p[0-9]/i) + 2);
    let char = this.id.substring(this.id.search(/p[0-9]/i) + 3);
    charImgChange(charImgs[pNum-1], char, this.title);
}

function createCharRoster() {
    //checks the character list which we use to order stuff
    const guiSettings = getJson(textPath + "/InterfaceInfo");
    //first row
    for (let i = 0; i < guiSettings.charactersBase.length; i++) {
        let newImg = document.createElement('img');
        newImg.className = "charInRoster";
        newImg.setAttribute('src', charPath + '/PM/' + guiSettings.charactersBase[i] + '.png');

        newImg.id = guiSettings.charactersBase[i]; //we will read this value later
        newImg.addEventListener("click", changeCharacter);

        document.getElementById("charRoster").appendChild(newImg);
    }
}

//called whenever we want to change the character
function charChange(list) {
    const currentChar = list.selectedOptions[0].text; //character that has been selected

    //we need to know from what player is this coming from somehow
    const pNum = list.id.substring(1, 2); //yes this is hella dirty
    const skinList = skinLists[pNum-1];

    //load a new skin list
    loadSkins(skinList, currentChar);

    //change the character image of the interface (only for first 2 players)
    if (pNum < 3) {
        //check if skinlist exists first so we dont bug the code later
        let currentSkin;
        if (skinList.selectedOptions[0]) {
            currentSkin = skinList.selectedOptions[0].text;
        }
        charImgChange(charImgs[pNum-1], currentChar, currentSkin);
    }

    //hide the skin dropdown if the list has 1 or less entries
    if (gamemode == 1 && (pNum == 3 || pNum == 4)) {
        //dont do this for players 3 and 4 if the gamemode is singles
    } else {
        if (skinList.options.length <= 1) {
            skinList.style.display = "none";
        } else {
            skinList.style.display = "inline";
        }
    }


    //check if the current player name has a custom skin for the character
    checkCustomSkin(pNum);

    //change the width of the box depending on the current text
    changeListWidth(list);

    //do the same for the skin
    changeListWidth(skinList);

}
//same but for listeners
function charChangeL() {
    charChange(this)
}

//for when skin changes, same logic as above
function skinChange(list) {

    //which player is it?
    const pNum = list.id.substring(1, 2);

    //which character is it?
    const currentChar = charLists[pNum-1].selectedOptions[0].text;

    //which skin is it?
    let currentSkin;
    try { //this is necessary when reading from random, wich has no skins
        currentSkin = list.selectedOptions[0].text;
    } catch (error) {
        currentSkin = null;
    }

    //change the image with the current skin (if player 1 or 2)
    if (pNum < 3) {
        charImgChange(charImgs[pNum-1], currentChar, currentSkin);
    }

    //change the width of the combo box depending on the text
    changeListWidth(list);

}
//for listeners
function skinChangeL() {
    skinChange(this);
}
//change the image path depending on the character and skin
function charImgChange(charImg, charName, skinName) {
  /*
    charImg.setAttribute('title', skinName);
    charImg.setAttribute('src', charPath + '/' + charName + '/Renders/' + skinName + '.png');
*/
}

//change the image path depending on the character and skin
function charImgChange(charImg, cardName) {
    charImg.setAttribute('title', cardName);
    charImg.setAttribute('src', charPath + '/PM/' + cardName + '.png');
}

//will load the skin list of a given character
function loadSkins(comboList, character) {
    const charInfo = getJson(charPath + "/" + character + "/_Info");

    clearList(comboList); //clear the past character's skin list
    if (charInfo) { //if character doesnt have a list (for example: Random), skip this
        addEntries(comboList, charInfo.skinList); //will add everything on the skin list
    }
}

//will add entries to a combo box with a given array
function addEntries(comboList, list) {
    for (let i = 0; i < list.length; i++) {
        const option = document.createElement('option'); //create new entry
        option.text = list[i]; //set the text of entry
        option.className = "theEntry";
        comboList.add(option); //add the entry to the combo list
    }
}

//deletes all entries of a given combo list
function clearList(comboList) {
    for(let i = comboList.length; i >= 0; i--) {
        comboList.remove(i);
    }
}

//used to change the width of a combo box depending on the current text
function changeListWidth(list) {
    try { //this is to fix a bug that happens when trying to read from a hidden list
        list.style.width = getTextWidth(list.selectedOptions[0].text,
            window.getComputedStyle(list).fontSize + " " +
            window.getComputedStyle(list).fontFamily
            ) + 12 + "px";
    } catch (error) {
        //do absolutely nothing
    }
}


//will load the color list to a color slot combo box
function loadColors() {

    //for each color on the list, add them to the color dropdown
    for (let i = 0; i < colorList.length; i++) {

        //create a new div that will have the color info
        const newDiv = document.createElement('div');
        newDiv.title = "Also known as " + colorList[i].hex;
        newDiv.className = "colorEntry";

        //create the color's name
        const newText = document.createElement('div');
        newText.innerHTML = colorList[i].name;

        //create the color's rectangle
        const newRect = document.createElement('div');
        newRect.style.width = "13px";
        newRect.style.height = "13px";
        newRect.style.margin = "5px";
        newRect.style.backgroundColor = colorList[i].hex;

        //add them to the div we created before
        newDiv.appendChild(newRect);
        newDiv.appendChild(newText);

        //now add them to the actual interface
        document.getElementById("dropdownColorL").appendChild(newDiv);

        //copy the div we just created to add it to the right side
        const newDivR = newDiv.cloneNode(true);
        document.getElementById("dropdownColorR").appendChild(newDivR);

        //if the divs get clicked, update the colors
        newDiv.addEventListener("click", updateColor);
        newDivR.addEventListener("click", updateColor);

    }

    //set the initial colors for the interface (the first color for p1, and the second for p2)
    document.getElementById('dropdownColorL').children[0].click();
    document.getElementById('dropdownColorR').children[1].click();
}

function updateColor() {

    const side = this.parentElement.parentElement.id.substring(0, 1);;
    const clickedColor = this.textContent;

    //search for the color we just clicked
    for (let i = 0; i < colorList.length; i++) {
        if (colorList[i].name == clickedColor) {

            const colorRectangle = document.getElementById(side+"ColorRect");
            const colorGrad = document.getElementById(side+"Side");

            //change the variable that will be read when clicking the update button
            if (side == "l") {
                colorL = colorList[i].name;
            } else {
                colorR = colorList[i].name;
            }

            //then change both the color rectangle and the background gradient
            colorRectangle.style.backgroundColor = colorList[i].hex;
            colorGrad.style.backgroundImage = "linear-gradient(to bottom left, "+colorList[i].hex+"50, #00000000, #00000000)";
        }
    }

    //remove focus from the menu so it hides on click
    this.parentElement.parentElement.blur();
}


//whenever clicking on the first score tick
function changeScoreTicks1() {
    const pNum = this == p1Win1 ? 1 : 2;

    //deactivate wins 2 and 3
    document.getElementById('winP'+pNum+'-2').checked = false;
    document.getElementById('winP'+pNum+'-3').checked = false;
}
//whenever clicking on the second score tick
function changeScoreTicks2() {
    const pNum = this == p1Win2 ? 1 : 2;

    //deactivate win 3, activate win 1
    document.getElementById('winP'+pNum+'-1').checked = true;
    document.getElementById('winP'+pNum+'-3').checked = false;
}
//something something the third score tick
function changeScoreTicks3() {
    const pNum = this == p1Win3 ? 1 : 2;

    //activate wins 1 and 2
    document.getElementById('winP'+pNum+'-1').checked = true;
    document.getElementById('winP'+pNum+'-2').checked = true;
}

//returns how much score does a player have
function checkScore(tick1, tick2, tick3) {
    let totalScore = 0;

    if (tick1.checked) {
        totalScore++;
    }
    if (tick2.checked) {
        totalScore++;
    }
    if (tick3.checked) {
        totalScore++;
    }

    return totalScore;
}

//gives a victory to player 1
function giveWinP1() {
    if (p1Win2.checked) {
        p1Win3.checked = true;
    } else if (p1Win1.checked) {
        p1Win2.checked = true;
    } else if (!p1Win1.checked) {
        p1Win1.checked = true;
    }
}
//same with P2
function giveWinP2() {
    if (p2Win2.checked) {
        p2Win3.checked = true;
    } else if (p2Win1.checked) {
        p2Win2.checked = true;
    } else if (!p2Win1.checked) {
        p2Win1.checked = true;
    }
}


function setWLP1() {
    if (this == p1W) {
        currentP1WL = "W";
        this.style.color = "var(--text1)";
        p1L.style.color = "var(--text2)";
        this.style.backgroundImage = "linear-gradient(to top, #575757, #00000000)";
        p1L.style.backgroundImage = "var(--bg4)";
    } else {
        currentP1WL = "L";
        this.style.color = "var(--text1)";
        p1W.style.color = "var(--text2)";
        this.style.backgroundImage = "linear-gradient(to top, #575757, #00000000)";
        p1W.style.backgroundImage = "var(--bg4)";
    }
}
function setWLP2() {
    if (this == p2W) {
        currentP2WL = "W";
        this.style.color = "var(--text1)";
        p2L.style.color = "var(--text2)";
        this.style.backgroundImage = "linear-gradient(to top, #575757, #00000000)";
        p2L.style.backgroundImage = "var(--bg4)";
    } else {
        currentP2WL = "L";
        this.style.color = "var(--text1)";
        p2W.style.color = "var(--text2)";
        this.style.backgroundImage = "linear-gradient(to top, #575757, #00000000)";
        p2W.style.backgroundImage = "var(--bg4)";
    }
}

function deactivateWL() {
    currentP1WL = "Nada";
    currentP2WL = "Nada";

    const pWLs = document.getElementsByClassName("wlBox");
    for (let i = 0; i < pWLs.length; i++) {
        pWLs[i].style.color = "var(--text2)";
        pWLs[i].style.backgroundImage = "var(--bg4)";
    }
}


//player presets setup
function preparePF(pNum) {
    const pFinderEL = pFinders[pNum-1];

    //if the mouse is hovering a player preset, let us know
    pFinderEL.addEventListener("mouseenter", () => { inPF = true });
    pFinderEL.addEventListener("mouseleave", () => { inPF = false });

    //hide the player presets menu if text input loses focus
    pNameInps[pNum-1].addEventListener("focusout", () => {
        if (!inPF) { //but not if the mouse is hovering a player preset
            pFinderEL.style.display = "none";
        }
    });
}

//called whenever the user types something in the player name box
function checkPlayerPreset() {

    //remove the "focus" for the player presets list
    currentFocus = -1;

    //player check once again
    const pNum = this.id.substring(1, 2);
    const pFinderEL = pFinders[pNum-1];

    //clear the current list each time we type
    pFinderEL.innerHTML = "";

    //if we typed at least 3 letters
    if (this.value.length >= 3) {

        //check the files in that folder
        const files = fs.readdirSync(textPath + "/Player Info/");
        files.forEach(file => {

            //removes ".json" from the file name
            file = file.substring(0, file.length - 5);

            //if the current text matches a file from that folder
            if (file.toLocaleLowerCase().includes(this.value.toLocaleLowerCase())) {

                //un-hides the player presets div
                pFinderEL.style.display = "block";

                //go inside that file to get the player info
                const playerInfo = getJson(textPath + "/Player Info/" + file);
                //for each character that player plays
                playerInfo.characters.forEach(char => {

                    //this will be the div to click
                    const newDiv = document.createElement('div');
                    newDiv.className = "finderEntry";
                    newDiv.addEventListener("click", playerPreset);

                    //create the texts for the div, starting with the tag
                    const spanTag = document.createElement('span');
                    //if the tag is empty, dont do anything
                    if (playerInfo.tag != "") {
                        spanTag.innerHTML = playerInfo.tag;
                        spanTag.className = "pfTag";
                    }

                    //player name
                    const spanName = document.createElement('span');
                    spanName.innerHTML = playerInfo.name;
                    spanName.className = "pfName";

                    //player character
                    const spanChar = document.createElement('span');
                    spanChar.innerHTML = char.character;
                    spanChar.className = "pfChar";

                    //we will use css variables to store data to read when clicked
                    newDiv.style.setProperty("--tag", playerInfo.tag);
                    newDiv.style.setProperty("--name", playerInfo.name);
                    newDiv.style.setProperty("--char", char.character);
                    newDiv.style.setProperty("--skin", char.skin);

                    //add them to the div we created before
                    newDiv.appendChild(spanTag);
                    newDiv.appendChild(spanName);
                    newDiv.appendChild(spanChar);

                    //now for the character image, this is the mask/mirror div
                    const charImgBox = document.createElement("div");
                    charImgBox.className = "pfCharImgBox";

                    //actual image
                    const charImg = document.createElement('img');
                    charImg.className = "pfCharImg";
                    charImg.setAttribute('src', charPath+'/'+char.character+'/'+char.skin+'.png');
                    //we have to position it
                    positionChar(char.character, char.skin, charImg);
                    //and add it to the mask
                    charImgBox.appendChild(charImg);

                    //add it to the main div
                    newDiv.appendChild(charImgBox);

                    //and now add the div to the actual interface
                    pFinderEL.appendChild(newDiv);
                });
            }
        });
    }
}

//now the complicated "change character image" function!
async function positionChar(character, skin, charEL) {

    //get the character positions
    const charInfo = getJson(charPath + "/" + character + "/_Info");

	//               x, y, scale
	const charPos = [0, 0, 1];
	//now, check if the character and skin exist in the database down there
	if (charInfo) {
		if (charInfo.gui[skin]) { //if the skin has a specific position
			charPos[0] = charInfo.gui[skin].x;
			charPos[1] = charInfo.gui[skin].y;
			charPos[2] = charInfo.gui[skin].scale;
		} else { //if none of the above, use a default position
			charPos[0] = charInfo.gui.neutral.x;
			charPos[1] = charInfo.gui.neutral.y;
			charPos[2] = charInfo.gui.neutral.scale;
		}
	} else { //if the character isnt on the database, set positions for the "?" image
		charPos[0] = 0;
        charPos[1] = 0;
        charPos[2] = 1.2;
	}

    //to position the character
    charEL.style.left = charPos[0] + "px";
    charEL.style.top = charPos[1] + "px";
    charEL.style.transform = "scale(" + charPos[2] + ")";

    //if the image fails to load, we will put a placeholder
	charEL.addEventListener("error", () => {
        charEL.setAttribute('src', charPathRandom + '/P2.png');
        charEL.style.left = "0px";
        charEL.style.top = "-2px";
        charEL.style.transform = "scale(1.2)";
	});
}

//called when the user clicks on a player preset
function playerPreset() {

    //we all know what this is by now
    const pNum = this.parentElement.id.substring(this.parentElement.id.length - 1) - 1;

    pTagInps[pNum].value = this.style.getPropertyValue("--tag");
    changeInputWidth(pTagInps[pNum]);

    pNameInps[pNum].value = this.style.getPropertyValue("--name");
    changeInputWidth(pNameInps[pNum]);

    changeListValue(charLists[pNum], this.style.getPropertyValue("--char"));
    charChange(charLists[pNum]);

    changeListValue(skinLists[pNum], this.style.getPropertyValue("--skin"));
    skinChange(skinLists[pNum]);

    checkCustomSkin(pNum+1);

    pFinders[pNum].style.display = "none";
}


//visual feedback to navigate the player presets menu
function addActive(x) {
    //clears active from all entries
    for (let i = 0; i < x.length; i++) {
        x[i].classList.remove("finderEntry-active");
    }

    //if end of list, cicle
    if (currentFocus >= x.length) currentFocus = 0;
    if (currentFocus < 0) currentFocus = (x.length - 1);

    //add to the selected entry the active class
    x[currentFocus].classList.add("finderEntry-active");
}


function checkCustomSkin(pNum) {

    pNum -= 1

    //get the player preset list for the current text
    const playerList = getJson(textPath + "/Player Info/" + pNameInps[pNum].value);

    if (playerList) { //safety check

        playerList.characters.forEach(char => { //for each possible character

            //if the current character is on the list
            if (char.character == charLists[pNum].selectedOptions[0].text) {

                //first, check if theres a custom skin already
                if (skinLists[pNum].selectedOptions[0].className == "playerCustom") {
                    skinLists[pNum].remove(skinLists[pNum].selectedIndex);
                }

                const option = document.createElement('option'); //create new entry
                option.className = "playerCustom"; //set class so the background changes
                option.text = char.skin; //set the text of entry
                skinLists[pNum].add(option, 0); //add the entry to the beginning of the list
                skinLists[pNum].selectedIndex = 0; //leave it selected
                skinChange(skinLists[pNum]); //update the image
            }

        });

    }
}


//changes the width of an input box depending on the text
function changeInputWidth(input) {
    input.style.width = getTextWidth(input.value,
        window.getComputedStyle(input).fontSize + " " +
        window.getComputedStyle(input).fontFamily
        ) + 12 + "px";
}
//same code as above but just for listeners
function resizeInput() {
    changeInputWidth(this);
}


//used to get the exact width of a text considering the font used
function getTextWidth(text, font) {
    const canvas = getTextWidth.canvas || (getTextWidth.canvas = document.createElement("canvas"));
    const context = canvas.getContext("2d");
    context.font = font;
    const metrics = context.measureText(text);
    return metrics.width;
}


//used when clicking on the "Best of" buttons
function changeBestOf() {
    let theOtherBestOf; //we always gotta know
    if (this == bo5Div) {
        currentBestOf = "Bo5";
        theOtherBestOf = bo3Div;
        p1Win3.style.display = "block";
        p2Win3.style.display = "block";
    } else {
        currentBestOf = "Bo3";
        theOtherBestOf = bo5Div;
        p1Win3.style.display = "none";
        p2Win3.style.display = "none";
    }

    //change the color and background of the buttons
    this.style.color = "var(--text1)";
    this.style.backgroundImage = "linear-gradient(to top, #0e3131, #0e3131)";
    theOtherBestOf.style.color = "var(--text2)";
    theOtherBestOf.style.backgroundImage = "var(--bg4)";
}


//for checking if its "Grands" so we make the WL buttons visible
function checkRound() {
    if (!forceWL.checked) {
        if (roundInp.value.toLocaleUpperCase().includes("Grand".toLocaleUpperCase())) {
            for (let i = 0; i < wlButtons.length; i++) {
                wlButtons[i].style.display = "flex";
            }
        } else {
            for (let i = 0; i < wlButtons.length; i++) {
                wlButtons[i].style.display = "none";
                deactivateWL();
            }
        }
    }
}

function setSingles() {
    //show doubles icon
    gmIcon2.style.opacity = 1;
    gmIcon1.style.left = "4px";
    gmIcon2.style.left = "17px";

    //remove color button margin, change border radius
    const lColor = document.getElementById("lColor");
    lColor.style.marginLeft = "0px";
    lColor.style.borderTopLeftRadius = "0px";
    lColor.style.borderBottomLeftRadius = "0px";
    const rColor = document.getElementById("rColor");
    rColor.style.marginLeft = "0px";
    rColor.style.borderTopLeftRadius = "0px";
    rColor.style.borderBottomLeftRadius = "0px";

    //move everything back to normal
    charImgs[2].style.opacity = 0;
    charImgs[3].style.opacity = 0;
    for (let i = 0; i < 2; i++) {
        pNameInps[i].style.display = "block";
        pTagInps[i].style.display = "block";
        tNameInps[i].style.display = "none";
    }

    for (let i = 2; i < skinLists.length; i++) {
        charLists[i].style.display = "none";
        skinDivLists[i].style.display = "none";
        charDivLists[i].style.display = "none";
    }

    document.getElementById('gamemode').setAttribute('title', "Change the gamemode to Doubles");
    document.getElementById('gamemode').removeEventListener('click', setSingles);
    document.getElementById('gamemode').addEventListener('click', setDoubles);
}

function setDoubles() {
    //show singles icon
    gmIcon2.style.opacity = 0;
    gmIcon1.style.left = "11px";

    //add some margin to the color buttons, change border radius
    const lColor = document.getElementById("lColor");
    lColor.style.marginLeft = "5px";
    lColor.style.borderTopLeftRadius = "3px";
    lColor.style.borderBottomLeftRadius = "3px";
    const rColor = document.getElementById("rColor");
    rColor.style.marginLeft = "5px";
    rColor.style.borderTopLeftRadius = "3px";
    rColor.style.borderBottomLeftRadius = "3px";


    charImgs[2].style.opacity = 1;
    charImgs[3].style.opacity = 1;

    // Edit inputs from players to teams
    for (let i = 0; i < 2; i++) {
        pNameInps[i].style.display = "none";
        pTagInps[i].style.display = "none";
        tNameInps[i].style.display = "block";
    }

    for (let i = 2; i < skinLists.length; i++) {
        charLists[i].style.display = "block";
        skinDivLists[i].style.display = "block";
        charDivLists[i].style.display = "block";
    }

    /*
    for (let i = 2; i < skinLists.length; i++) {
        console.log(skinLists[i]);
        console.log(charDivLists[i]);
        charLists[i].style.display = "none";
        skinDivLists[i].style.display = "none";
        charDivLists[i].style.display = "none";
    }
    for (let i = 1; i < 3; i++) {
        document.getElementById("row1-"+i).insertAdjacentElement("afterbegin", wlButtons[i-1]);
        document.getElementById("row1-"+i).insertAdjacentElement("afterbegin", document.getElementById('scoreBox'+i));

        document.getElementById("scoreText"+i).style.display = "none";

        tNameInps[i-1].style.display = "block";

        document.getElementById("row1-"+i).insertAdjacentElement("afterbegin", tNameInps[i-1]);

        document.getElementById('row2-'+i).insertAdjacentElement("beforeend", document.getElementById('pInfo'+i));

        charLists[i+1].style.display = "block";
        if (skinLists[i+1].options.length <= 1) {
            skinLists[i+1].style.display = "none";
        } else {
            skinLists[i+1].style.display = "block";
        }

        document.getElementById('pInfo'+(i+2)).style.display = "block";
    }

    //add some left margin to the name/tag inputs, add border radius, change max width
    for (let i = 0; i < maxPlayers; i++) {
        pTagInps[i].style.marginLeft = "5px";

        pNameInps[i].style.borderTopRightRadius = "3px";
        pNameInps[i].style.borderBottomRightRadius = "3px";

        pTagInps[i].style.maxWidth = "45px"
        pNameInps[i].style.maxWidth = "94px"

        charLists[i].style.maxWidth = "65px";
        skinLists[i].style.maxWidth = "65px";
    }

    //dropdown menus for the right side will now be positioned to the right
    for (let i = 1; i < 5; i+=2) {
        pFinders[i].style.right = "0px";
        pFinders[i].style.left = "";
    }
    */

    document.getElementById("dropdownColorR").style.right = "0px";
    document.getElementById("dropdownColorR").style.left = "";

    document.getElementById('gamemode').setAttribute('title', "Change the gamemode to Singles");
    document.getElementById('gamemode').removeEventListener('click', setDoubles);
    document.getElementById('gamemode').addEventListener('click', setSingles);
}


function swap() {

    //team name
    const teamStore = tNameInps[0].value;
    tNameInps[0].value = tNameInps[1].value;
    tNameInps[1].value = teamStore;

    for (let i = 0; i < maxPlayers; i+=2) {

        //names
        const nameStore = pNameInps[i].value;
        pNameInps[i].value = pNameInps[i+1].value;
        pNameInps[i+1].value = nameStore;
        changeInputWidth(pNameInps[i]);
        changeInputWidth(pNameInps[i+1]);

        //tags
        const tagStore = pTagInps[i].value;
        pTagInps[i].value = pTagInps[i+1].value;
        pTagInps[i+1].value = tagStore;
        changeInputWidth(pTagInps[i]);
        changeInputWidth(pTagInps[i+1]);


        //characters and skins
        const tempP1Char = charLists[i].selectedOptions[0].text;
        const tempP2Char = charLists[i+1].selectedOptions[0].text;

        //we need to perform this check since the program would halt when reading from null
        let p1RealSkin, p2RealSkin;
        try {
            p1RealSkin = skinLists[i].selectedOptions[0].text
        } catch (error) {
            p1RealSkin = "";
        }
        try {
            p2RealSkin = skinLists[i+1].selectedOptions[0].text
        } catch (error) {
            p2RealSkin = "";
        }

        const tempP1Skin = p1RealSkin;
        const tempP2Skin = p2RealSkin;

        changeListValue(charLists[i], tempP2Char);
        changeListValue(charLists[i+1], tempP1Char);
        //the change event doesnt fire up on its own so we have to change the image ourselves
        charChange(charLists[i]);
        charChange(charLists[i+1]);

        //same but for skins
        changeListValue(skinLists[i], tempP2Skin);
        changeListValue(skinLists[i+1], tempP1Skin);
        skinChange(skinLists[i]);
        skinChange(skinLists[i+1]);

        //find out if the swapped skin is a custom one
        checkCustomSkin(i+1);
        checkCustomSkin(i+2);
    }

    //scores
    const tempP1Score = checkScore(p1Win1, p1Win2, p1Win3);
    const tempP2Score = checkScore(p2Win1, p2Win2, p2Win3);
    setScore(tempP2Score, p1Win1, p1Win2, p1Win3);
    setScore(tempP1Score, p2Win1, p2Win2, p2Win3);

    //W/K, only if they are visible
    if (p1W.style.display = "flex") {
        const previousP1WL = currentP1WL;
        const previousP2WL = currentP2WL;

        if (previousP2WL == "W") {
            p1W.click();
        } else if (previousP2WL == "L") {
            p1L.click();
        }

        if (previousP1WL == "W") {
            p2W.click();
        } else if (previousP1WL == "L") {
            p2L.click();
        }
    }
}

function clearPlayers() {

    //crear the team names
    for (let i = 0; i < tNameInps.length; i++) {
        tNameInps[i].value = "";
    }

    for (let i = 0; i < maxPlayers; i++) {

        //clear player texts and tags
        pNameInps[i].value = "";
        changeInputWidth(pNameInps[i]);
        pTagInps[i].value = "";
        changeInputWidth(pTagInps[i]);

        //reset characters to random
        clearList(charLists[i]);

    }

    //reset the character lists
    loadCharacters();

    //dont forget to clear the skin list!
    for (let i = 0; i < maxPlayers; i++) {
        clearList(skinLists[i]);
        skinLists[i].style.display = "none";
    }

    //clear player scores
    for (let i = 0; i < checks.length; i++) {
        checks[i].checked = false;
    }
}

//to force the list to use a specific entry
function changeListValue(list, name) {
    for (let i = 0; i < list.length; i++) {
        if (list.options[i].text == name) {
            list.selectedIndex = i;
        }
    }
}

//manually sets the player's score
function setScore(score, tick1, tick2, tick3) {
    tick1.checked = false;
    tick2.checked = false;
    tick3.checked = false;
    if (score > 0) {
        tick1.checked = true;
        if (score > 1) {
            tick2.checked = true;
            if (score > 2) {
                tick3.checked = true;
            }
        }
    }
}

function fetchGameData(){

}


// whenever the user clicks on the force W/L checkbox
function forceWLtoggle() {

    // forces the W/L buttons to appear, or unforces them
    if (forceWL.checked) {
        for (let i = 0; i < wlButtons.length; i++) {
            wlButtons[i].style.display = "flex";
        }
    } else {
        for (let i = 0; i < wlButtons.length; i++) {
            wlButtons[i].style.display = "none";
            deactivateWL();
        }
    }

    // save current checkbox value to the settings file
    saveGUISettings();

}


// sends the signal to electron to activate always on top
function alwaysOnTop() {
    ipc.send('alwaysOnTop', this.checked);
    saveGUISettings();
}

//will copy the current match info to the clipboard
// Format: "Tournament Name - Round - Player1 (Character1) VS Player2 (Character2)"
function copyMatch() {

    //initialize the string
    let copiedText = tournamentInp.value + " - " + roundInp.value + " - ";

    if (gamemode == 1) { //for singles matches
        //check if the player has a tag to add
        if (pTagInps[0].value) {
            copiedText += pTagInps[0].value + " | ";
        }
        copiedText += pNameInps[0].value + " (" + charLists[0].selectedOptions[0].text +") VS ";
        if (pTagInps[1].value) {
            copiedText += pTagInps[1].value + " | ";
        }
        copiedText += pNameInps[1].value + " (" + charLists[1].selectedOptions[0].text +")";
    } else { //for team matches
        copiedText += tNameInps[0].value + " VS " + tNameInps[1].value;
    }

    //send the string to the user's clipboard
    navigator.clipboard.writeText(copiedText);
}

// called whenever the used clicks on a settings checkbox
function saveGUISettings() {

    // read the file
    const guiSettings = JSON.parse(fs.readFileSync(textPath + "/GUI Settings.json", "utf-8"));

    // update the settings to current values
    guiSettings.allowIntro = document.getElementById("allowIntro").checked;
    guiSettings.forceAlt = document.getElementById("forceAlt").checked;
    guiSettings.forceHD = document.getElementById("forceHD").checked;
    guiSettings.forceWL = forceWL.checked;
    guiSettings.alwaysOnTop = document.getElementById("alwaysOnTop").checked;

    // save the file
    fs.writeFileSync(textPath + "/GUI Settings.json", JSON.stringify(guiSettings, null, 2));

}


//time to write it down
function writeScoreboard() {
    //this is what's going to be in the json file
    const scoreboardJson = {
        player: [],
        round: roundInp.value,
        tournamentName: tournamentInp.value,
        caster: [],
        allowIntro: document.getElementById('allowIntro').checked
    };
    //add the player's info to the player section of the json
    for (let i = 0; i < maxPlayers; i++) {
        //we need to perform this check since the program would halt when reading from null
        let card1 = charLists1[i].title;
        let card2 = charLists2[i].title;

        scoreboardJson.player.push({
            name: pNameInps[i].value,
            pronouns: pTagInps[i].value,
            cards: [card1, card2],
            influences: [influences1[i].checked, influences2[i].checked],
            coins: coinAmts[i].value,
            score: scores[i].value,
        })
    }
    //do the same for the casters
    for (let i = 0; i < casters.length; i++) {
        scoreboardJson.caster.push({
            name: document.getElementById('cName'+(i+1)).value,
            twitter: document.getElementById('cTwitter'+(i+1)).value,
            twitch: document.getElementById('cTwitch'+(i+1)).value,
        })
    }

    //now convert it to a text we can save intro a file
    const data = JSON.stringify(scoreboardJson, null, 2);
    fs.writeFileSync(textPath + "/ScoreboardInfo.json", data);


    //simple .txt files
    for (let i = 0; i < maxPlayers; i++) {
        fs.writeFileSync(textPath + "/Simple Texts/Player "+(i+1)+".txt", pNameInps[i].value);
    }

    fs.writeFileSync(textPath + "/Simple Texts/Round.txt", roundInp.value);
    fs.writeFileSync(textPath + "/Simple Texts/Tournament Name.txt", tournamentInp.value);

    for (let i = 0; i < casters.length; i++) {
        fs.writeFileSync(textPath + "/Simple Texts/Caster "+(i+1)+" Name.txt", document.getElementById('cName'+(i+1)).value);
        fs.writeFileSync(textPath + "/Simple Texts/Caster "+(i+1)+" Twitter.txt", document.getElementById('cTwitter'+(i+1)).value);
        fs.writeFileSync(textPath + "/Simple Texts/Caster "+(i+1)+" Twitch.txt", document.getElementById('cTwitch'+(i+1)).value);
    }

}
