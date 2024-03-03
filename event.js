// This function is called onload in the popup code
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
