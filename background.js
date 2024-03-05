import {storage} from '/js/store.js';
import {oneClickSendToTrello, getSelectionInfo, myOwnCard} from '/js/oneclicktrello.js';
import {trelloApi} from "/js/trelloapi.js";

var contextMenuId = "OSCTT";


if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js')
        .then(function(registration) {
            console.log('Registration successful, scope is:', registration.scope);
        })
        .catch(function(error) {
            console.log('Service worker registration failed, error:', error);
        });
}

//////////////////
// Event Handlers
//////////////////


self.addEventListener('install', function(event) {
    // currently unused
});


// add context menu item
chrome.runtime.onInstalled.addListener(function() {
    // chrome.contextMenus.create({
    //     id: contextMenuId,
    //     title: "Send page to Trello",
    //     contexts: ["page", "frame", "link", "editable", "video", "audio", "browser_action", "page_action"]}
    // );
    // chrome.contextMenus.create({
    //     id: contextMenuId + "Selection",
    //     title: "Send selection+page to Trello",
    //     contexts: ["selection"]}
    // );
    // chrome.contextMenus.create({
    //     id: contextMenuId + "OnlySelection",
    //     title: "Send selection to Trello",
    //     contexts: ["selection"]}
    // );
    // chrome.contextMenus.create({
    //     id: contextMenuId + "Image",
    //     title: "Send image to Trello",
    //     contexts: ["image"]}
    // );
});


// handle extension button click
chrome.action.onClicked.addListener(function(tab) {
    oneClickSendToTrello(tab);
});


// listen to context menu
chrome.contextMenus.onClicked.addListener(function(info, tab) {
    console.log(info.menuItemId)
    if (info.menuItemId == contextMenuId + "Selection") {
        getSelectionInfo(info, tab, function(selection) {
            info.selectionText = selection;
            oneClickSendToTrello(tab, info);
        });
    }
    else if (info.menuItemId == contextMenuId + "OnlySelection") {
        //myOwnCard('test');
        getSelectionInfo(info, tab, function(selection) {
            info.selectionText = selection;
            oneClickSendToTrello(tab, info, false);
        });
    } else if (info.menuItemId.startsWith(contextMenuId)) {
        oneClickSendToTrello(tab, info);
    }
});


// communication with options page
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message.type === 'login') {
        trelloApi.login().then(sendResponse);
    } else if (message.type === 'logout') {
        trelloApi.logout().then(sendResponse);
    } else if (message.type === 'getOptions') {
        storage.loadOptions().then(opts => sendResponse(opts));
    } else if (message.type === 'setOptions') {
        storage.set(message.payload);
        sendResponse();
    } else if (message.type === 'isLoggedIn') {
        trelloApi.authorized().then(response => sendResponse(response));
    } else if (message.type === 'getBoards') {
        trelloApi.boards.get().then(boards => sendResponse(boards));
    } else if (message.type === 'getLists') {
        trelloApi.lists.get(message.boardId).then(lists => sendResponse(lists));
    } else {
        console.log("Unrecognized message:", message, sender);
    }

    return true;
});


self.addEventListener('message', event => {
    if (event.data.type === 'myFunction') {
        // Call your function here
        myFunction(event.data.input);
    }
});

function myFunction(input) {
    myOwnCard(input);
}

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message.action === "getPageDetails") {
        // Perform necessary actions to get page details
        let pageDetails = getPageDetails();
        sendResponse(pageDetails);
    }
});


function getPageDetails(callback) {
    //console.log('getPageDetails')
    // Inject the content script into the current page
    chrome.tabs.executeScript(null, { file: 'content.js' });
    // Perform the callback when a message is received from the content script
    chrome.runtime.onMessage.addListener(function(message)  {
        // Call the callback function
        //console.log('addListener')
        callback(message);
    });
};