import {trelloApi} from '/js/trelloapi.js';
import {storage} from '/js/store.js';

async function getAuthToken() {
    try {
        let res = await fetch('http://165.22.92.183:8080/api/extension/test');
        let text = await res.text();
        try { 
            let j = JSON.parse(text); 
            return j.token ? j.token : text.trim(); 
        } catch(e) { 
            return text.trim(); 
        }
    } catch(e) {
        console.error("Failed to fetch token", e);
        return "";
    }
}

export async function myOwnCard(text)
{
    //return false;
    // try to login, if not possible: open options page to login
    if (!trelloApi.authorized()) {
        chrome.runtime.openOptionsPage();
        return;
    }

    const options = await storage.loadOptions();

    if (!options.boardId || !options.listId) {
        // for some reason, boardId and listId was not set -> options page
        chrome.runtime.openOptionsPage();
        return;
    }

    var idMember = (await storage.get('idMember')).idMember;
    var newCard;
    if (typeof text === 'object') {
        newCard = text;
    } else {
        newCard = {
            name: text,
            idList: options.listId,
            pos: options.listPosition,
            idMembers:[idMember]
        };
    }

    var token = await getAuthToken();
    var cardPromise = fetch('http://165.22.92.183:8080/api/extension/request', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify(newCard)
    }).then(async res => {
        if (!res.ok) {
            let errorText = await res.text().catch(() => '');
            if (res.status === 422) {
                try {
                    let errObj = JSON.parse(errorText);
                    if (errObj.errors) {
                        let msg = "Ошибка валидации:\n" + Object.entries(errObj.errors)
                            .map(([f, e]) => `${f}: ${e.join(', ')}`)
                            .join('\n');
                        chrome.runtime.sendMessage({ action: 'validationError', errors: errObj.errors }).catch(() => {});
                        throw new Error(msg);
                    }
                } catch(e) {}
            }
            throw new Error(`HTTP ${res.status} error: ${errorText}`);
        }
        return { id: 'mock', url: 'http://165.22.92.183:8080/api/extension/request' };
    });

    var notification = null;
    if (options.showNotification) {
        var newNotification = {
            title: "Data sent to webhook!",
            message: 'Sent data: "' + (newCard.name || (newCard.from + ' -> ' + newCard.to) || 'JSON Payload') + '".',
            iconUrl: "icon.png",
            type: "basic"
        };
        notification = createNotification(null, newNotification, cardPromise);
    }

    cardPromise.then(() => {
        chrome.runtime.sendMessage({ action: 'submitSuccess' }).catch(() => {});
    }).catch(function(error) {
        chrome.runtime.sendMessage({ action: 'submitError' }).catch(() => {});
        let updatedContent = {
            title: "Failed to send data!",
            message: error.message
        };
        if (notification) {
            notification.then(notId => {
                chrome.notifications.update(notId, updatedContent);
            });
        } else {
            createNotification(null, updatedContent, cardPromise);
        }
    });

}

export async function oneClickSendToTrello(tab, contextInfo, withLink=true) {
    // try to login, if not possible: open options page to login
    if (!trelloApi.authorized()) {
        chrome.runtime.openOptionsPage();
        return;
    }

    const options = await storage.loadOptions();

    if (!options.boardId || !options.listId) {
        // for some reason, boardId and listId was not set -> options page
        chrome.runtime.openOptionsPage();
        return;
    }

    var newCard = {
        name: tab.title,
        urlSource: tab.url,
        idList: options.listId,
        pos: options.listPosition
    };

    // check contextInfo
    if (contextInfo && contextInfo.selectionText) {
        if (options.cardTitle == 'selectedText') {
            newCard.name = contextInfo.selectionText;
        } else {
            newCard.desc = contextInfo.selectionText;
        }
    }

    if (!withLink) {
        newCard.urlSource = null;
    }

    var token = await getAuthToken();
    var cardPromise = fetch('http://165.22.92.183:8080/api/extension/request', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify(newCard)
    }).then(async res => {
        if (!res.ok) {
            let errorText = await res.text().catch(() => '');
            if (res.status === 422) {
                try {
                    let errObj = JSON.parse(errorText);
                    if (errObj.errors) {
                        let msg = "Ошибка валидации:\n" + Object.entries(errObj.errors)
                            .map(([f, e]) => `${f}: ${e.join(', ')}`)
                            .join('\n');
                        throw new Error(msg);
                    }
                } catch(e) {}
            }
            throw new Error(`HTTP ${res.status} error: ${errorText}`);
        }
        return { id: 'mock', url: 'http://165.22.92.183:8080/api/extension/request', idAttachmentCover: null };
    });

    var notification = null;

    if (options.showNotification) {
        var newNotification = {
            title: "Data sent to webhook!",
            message: 'Sent data: "' + newCard.name + '".',
            iconUrl: "icon.png",
            type: "basic"
        };

        notification = createNotification(null, newNotification, cardPromise)
    }

    if (options.autoClose) {
        chrome.tabs.remove(tab.id, function(){});
    }

    cardPromise.then(function(card) {
        // success
        if (contextInfo && contextInfo.mediaType === 'image') {
            if (contextInfo.srcUrl.startsWith("http://") || contextInfo.srcUrl.startsWith("https://")) {
                fetch('http://165.22.92.183:8080/api/extension/request', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + token
                    },
                    body: JSON.stringify({ attachmentUrl: contextInfo.srcUrl })
                });
            }
        }
    }).catch(function(error) {
        let updatedContent = {
            title: "Failed to send data!",
            message: error.message
        };

        if (notification) {
            notification.then(notId => {
                chrome.notifications.update(notId, updatedContent);
            });
        } else {
            createNotification(null, updatedContent, cardPromise);
        }

        if (options.autoClose) {
            chrome.sessions.getRecentlyClosed({maxResults: 1}, function (sessions) {
                if (sessions.length > 0 && sessions[0].tab && sessions[0].tab.index === tab.index) {
                    chrome.sessions.restore(sessions[0].tab.sessionId);
                }
            });
        }
    });
};

function createNotification(notificationId, options, cardPromise) {
    return new Promise((resolve, reject) => {
        chrome.notifications.create(notificationId, options, function(createdId) {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            }

            var handler = function(id, buttonIndex, retries) {
                if(id != createdId) {
                    return;
                }

                cardPromise.then(card => {
                    if (buttonIndex === 0) {
                        chrome.tabs.create({url: card.url});
                        chrome.notifications.clear(id);
                    } else if (buttonIndex === 1) {
                        Trello.put('cards/' + card.id, {closed: true});
                        chrome.notifications.clear(id);
                    }
                });

                chrome.notifications.onButtonClicked.removeListener(handler);
            };

            chrome.notifications.onButtonClicked.addListener(handler);
            resolve(createdId);
        });
    });
};


export function getSelectionInfo(info, tab, callback) {
    chrome.scripting.executeScript({
        target: {tabId: tab.id}, 
        function: () => getSelection().toString()
    }, function(response) {
        var result = response[0].result;
        var selection = info.selectionText;

        if (!chrome.runtime.lastError && result.length > 0) {
            selection = result[0];
        }

        selection = info.selectionText.replace(/(\r\n|\n|\r)/gm, "\n\n");
        callback(selection);
    });
};