// Send a message containing the page details back to the event page
function findCountryCellIndex(str) {
    // Get all table rows within the specified table
    var tableRows = document.querySelectorAll('table.content-padding.table-list tr');

    // Find the first row
    var firstRow = tableRows[0];

    // Initialize variable to store the index of the <td> containing "Country"
    var countryCellIndex = -1;

    // Loop through all cells in the first row
    for (var i = 0; i < firstRow.cells.length; i++) {
        // Check if the text content of the cell contains "Country"
        if (firstRow.cells[i].textContent.includes(str)) {
            countryCellIndex = i; // Store the index of the <td> containing "Country"
            break; // Exit the loop once the <td> containing "Country" is found
        }
    }

    return countryCellIndex;
}

function extractWeight(str) {
    // Find the index of the first slash (/)
    var firstSlashIndex = str.indexOf('/');

    // Extract the substring before the first slash (/)
    var weight = str.substring(0, firstSlashIndex).trim();

    return weight;
}

function returnEnd() {
    var trElements = document.querySelector('table.content-padding.table-list').querySelectorAll('tr');
    var lastTrElement = trElements.item(trElements.length - 1);
    return lastTrElement.querySelectorAll('td')[findCountryCellIndex("Pickup")].querySelector('div').innerText.split('\n')[1]
}

function addRecipients() {
    var trElements = document.querySelector('table.content-padding.table-list').querySelectorAll('tr');
    var result = "";
    var arr = [];
    for (var i = 1; i < trElements.length; i++) {

        var element = trElements[i].querySelectorAll('td')[findCountryCellIndex("Country")].querySelector('div').innerText.split('\n')[1];
        if(!arr.includes(element)) {
            if (result !== "") {
                result += " + "; // Add '+' if result is not empty
            }
            result += element;
            arr.push(element);
        }
    }

    return result;
}

function extractWholeNumber(weightString) {
    var parts = weightString.split(" ");
    return parseInt(parts[0]) + ' ' + parts[1];
}

// chrome.runtime.sendMessage({
//     'id': document.querySelector('table.common-grid-table').querySelector('tr').querySelectorAll('td')[1].innerText,
//     'from': document.querySelector('table.content-padding.table-list').querySelectorAll('tr')[1].querySelectorAll('td')[findCountryCellIndex("Country")].querySelector('div').innerText.split('\n')[0],
//     'to': addRecipients(),
//     'name': document.querySelector('table.common-grid-table').querySelectorAll('tr')[1].querySelectorAll('td')[1].innerText,
//     'weight': extractWholeNumber(extractWeight(document.querySelector('table.common-grid-table').querySelectorAll('tr')[2].querySelectorAll('td')[4].innerText)),
//     'start': document.querySelector('table.content-padding.table-list').querySelectorAll('tr')[1].querySelectorAll('td')[findCountryCellIndex("Pickup")].querySelector('div').innerText.split('\n')[0],
//     'end': returnEnd(),
// });

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("Recv. Send response = " + document.title);
    var data = {
        'id': document.querySelector('table.common-grid-table').querySelector('tr').querySelectorAll('td')[1].innerText,
        'from': document.querySelector('table.content-padding.table-list').querySelectorAll('tr')[1].querySelectorAll('td')[findCountryCellIndex("Country")].querySelector('div').innerText.split('\n')[0],
        'to': addRecipients(),
        'name': document.querySelector('table.common-grid-table').querySelectorAll('tr')[1].querySelectorAll('td')[1].innerText,
        'weight': extractWholeNumber(extractWeight(document.querySelector('table.common-grid-table').querySelectorAll('tr')[2].querySelectorAll('td')[4].innerText)),
        'start': document.querySelector('table.content-padding.table-list').querySelectorAll('tr')[1].querySelectorAll('td')[findCountryCellIndex("Pickup")].querySelector('div').innerText.split('\n')[0],
        'end': returnEnd(),
    }
    sendResponse(data);
    //sendResponse({ title: document.title});

    return true;
});
