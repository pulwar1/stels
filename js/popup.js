// POST the data to the server using XMLHttpRequest
function addBookmark() {
    console.log('addBookmark');
    // Cancel the form submit
    event.preventDefault();


    var from = document.getElementById('from').value;
    var to = document.getElementById('to').value;
    var id = document.getElementById('id').value;
    var weight = document.getElementById('weight').value;
    var start = document.getElementById('start').value;
    var end = document.getElementById('end').value;
    var type = document.getElementById('type').value;
    var special = document.getElementById('special').value;
    var ltl = document.getElementById('ltl').value;
    var req = document.getElementById('req').value;
    var comment = document.getElementById('comment').value;
    var company = document.getElementById('company').value;
    var fromCode = from.substring(0, 2);
    var toCode = to.substring(0, 2);


    if(special == 0) {
        special = '';
    }

    var params = fromCode + '-' + toCode + '/ID ' + id + ' ' + company + '/' + from + '/' + to + '/' + start + ' --> ' + end + '/' + type + '/' + req + '/' + special + '/' + weight + '/' + ltl;

    if (ltl) {
        params += ' ldm'
    }
    params +=  '/' + comment;

    document.getElementById('result').value = params;

    navigator.clipboard.writeText(params)
        .then(() => {
            console.log('Text copied to clipboard');
        })
        .catch(err => {
            console.error('Failed to copy text: ', err);
        });
}


chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    console.log("Send");
    chrome.tabs.sendMessage(tabs[0].id, "message", (pageDetails) => {
        console.log(pageDetails)
        document.getElementById('from').value = pageDetails.from;
        document.getElementById('to').value = pageDetails.to;
        document.getElementById('id').value = pageDetails.id;
        document.getElementById('weight').value = pageDetails.weight;
        document.getElementById('start').value = pageDetails.start;
        document.getElementById('end').value = pageDetails.end;
    });
});
// When the popup HTML has loaded
window.addEventListener('load', function(evt) {
    console.log('page loaded');
    $( '.select-field' ).select2( {
        theme: 'bootstrap-5',
        width: $( this ).data( 'width' ) ? $( this ).data( 'width' ) : $( this ).hasClass( 'w-100' ) ? '100%' : 'style',
        openOnEnter: false
    } );
    document.getElementById('addbookmark').addEventListener('submit', addBookmark);

    document.getElementById('sendToTrello').addEventListener('click', function(event) {
        event.preventDefault(); // Prevent the default form submission
        var inputValue = document.getElementById('result').value
        console.log(inputValue);
        navigator.serviceWorker.controller.postMessage({ type: 'myFunction', input: inputValue});
    });
});



$(document).ready(function() {
    $(document).on('change', '#type', function() {
        var selectedValue = $(this).val();
        var ltlInput = $('#ltl');

        if (selectedValue === 'FTL') {
            ltlInput.prop('disabled', true);
            ltlInput.prop('required', false);
            ltlInput.val('')
        } else {
            ltlInput.prop('disabled', false);
            ltlInput.prop('required', true);
        }
    });

});