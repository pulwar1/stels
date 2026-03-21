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

function findRowNumberByLabelsForWeight(labels) {
    const transportSummary = document.querySelector('#transportSummary');
    const rows = transportSummary.querySelectorAll('tr');

    for (let i = 0; i < rows.length; i++) {
        const labelCell = rows[i].querySelector('.label');
        if (labelCell) {
            const cellText = labelCell.textContent.trim();
            // Проверяем, содержит ли текст ячейки любое из искомых значений
            if (labels.some(label => cellText.includes(label))) {
                return i;
            }
        }
    }

    return -1; // Если ни одно значение не найдено
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

function convertWeightString(weightString) {
    return weightString;
    // Step 1: Remove the "kg" suffix and commas
    let cleanedString = weightString.replace(/[^\d,.]/g, '').replace(',', '.');

    // Step 2: Parse the number
    let number = parseFloat(cleanedString);

    // Step 3: Round the number to the nearest integer
    let roundedNumber = Math.round(number);

    // Step 4: Convert the number back to a string and append " kg"
    let result = roundedNumber.toString() + ' kg';

    return result;
}

function getTableValuesString(searchValues, targetColumn, tableSelector = '.uniqueStationsTable') {
    const table = document.querySelector(tableSelector);
    if (!table || !Array.isArray(searchValues) || searchValues.length === 0) return '';

    const rows = table.querySelectorAll('tbody:last-child tr');
    const results = [];

    for (const row of rows) {
        const firstCell = row.querySelector('td:first-child');
        if (firstCell) {
            const cellText = firstCell.textContent.trim();
            if (searchValues.includes(cellText)) {
                const targetCell = row.querySelectorAll('td')[targetColumn];
                if (targetCell) {
                    results.push(targetCell.textContent.trim());
                }
            }
        }
    }

    return results.length === 0 ? '' : results.join('\n');
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("Recv. Send response = " + document.title);
    if (document.querySelector('#transportSummary')) {
        var data = {
            'id': document.querySelector('#transportSummary').querySelector('tr').querySelectorAll('td')[1].innerText,
            'from': getTableValuesString(['Место загрузки', 'Loading station', 'Miejsce załadunku', 'Místo nakládky', 'Origin'], 2),
            'to': getTableValuesString(['Место разгрузки', 'Unloading station', 'Miejsce rozładunku', 'Místo vykládky', 'Destination'], 2),
            //'to': document.querySelector('table.uniqueStationsTable').querySelectorAll('tr')[2].querySelectorAll('td')[2].innerText,
            'name': document.querySelector('#shipperTable td div span').textContent,
            'weight': (function() {
                const rowIndex = findRowNumberByLabelsForWeight(['Вес', 'Weight', 'Waga', 'Hmotnost']);
                console.log('rowIndex', rowIndex);
                return rowIndex === -1 ? '' : convertWeightString(
                    document.querySelector('#transportSummary')
                        .querySelectorAll('tr')[rowIndex]
                        .querySelectorAll('td')[1]
                        .innerText
                );
            })(),
            //'weight': convertWeightString(document.querySelector('#transportSummary').querySelectorAll('tr')[findRowNumberByLabels(['Вес', 'Weight'])].querySelectorAll('td')[1].innerText),
            //'weight': convertWeightString(document.querySelector('#transportSummary').querySelectorAll('tr')[1].querySelectorAll('td')[1].innerText),
            'start': document.querySelector('table.uniqueStationsTable').querySelectorAll('tr')[1].querySelectorAll('td')[3].innerText,
            'end': document.querySelector('table.uniqueStationsTable').querySelectorAll('tr')[2].querySelectorAll('td')[3].innerText,

        }
        console.log('data', data)
    } else if (document.querySelector('#transportListTable')) {
        var data = {
            'id': document.querySelector('table.common-grid-table').querySelector('tr').querySelectorAll('td')[1].innerText,
            'from': document.querySelector('table#transportListTable').querySelectorAll('tr')[1].querySelectorAll('td')[6].querySelector('div').innerText.split('\n')[0],
            'to': document.querySelector('table#transportListTable').querySelectorAll('tr')[1].querySelectorAll('td')[6].querySelector('div').innerText.split('\n')[1],
            'name': '',//document.querySelector('table#loadDetailHead').querySelectorAll('tr')[1].querySelectorAll('td')[1].querySelector('#elmtKopfLadName').value,
            'weight': document.querySelector('table#transportListTable').querySelectorAll('tr')[1].querySelectorAll('td')[9].querySelector('div').innerText.split('\n')[0],
            'start': document.querySelector('table#transportListTable').querySelectorAll('tr')[1].querySelectorAll('td')[7].querySelector('div').innerText.split('\n')[0],
            'end': document.querySelector('table#transportListTable').querySelectorAll('tr')[1].querySelectorAll('td')[7].querySelector('div').innerText.split('\n')[1],
        }
    } else {
        var data = {
            'id': document.querySelector('table.common-grid-table').querySelector('tr').querySelectorAll('td')[1].innerText,
            'from': document.querySelector('table.content-padding.table-list').querySelectorAll('tr')[1].querySelectorAll('td')[findCountryCellIndex("Country")].querySelector('div').innerText.split('\n')[0],
            'to': addRecipients(),
            'name': document.querySelector('table.common-grid-table').querySelectorAll('tr')[1].querySelectorAll('td')[1].innerText,
            'weight': extractWholeNumber(extractWeight(document.querySelector('table.common-grid-table').querySelectorAll('tr')[2].querySelectorAll('td')[4].innerText)),
            'start': document.querySelector('table.content-padding.table-list').querySelectorAll('tr')[1].querySelectorAll('td')[findCountryCellIndex("Pickup")].querySelector('div').innerText.split('\n')[0],
            'end': returnEnd(),
        }
    }

    console.log('data', data)
    sendResponse(data);
    return true;
});
