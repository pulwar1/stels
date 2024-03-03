// This callback function is called when the content script has been 
// injected and returned its results
function onPageDetailsReceived(pageDetails)  {
    document.getElementById('from').value = pageDetails.from;
    document.getElementById('to').value = pageDetails.to;
    document.getElementById('id').value = pageDetails.id;
    //document.getElementById('name').value = pageDetails.name;
    document.getElementById('weight').value = pageDetails.weight;
    document.getElementById('start').value = pageDetails.start;
    document.getElementById('end').value = pageDetails.end;
} 

// Global reference to the status display SPAN
var statusDisplay = null;

// POST the data to the server using XMLHttpRequest
function addBookmark() {
    console.log('addBookmark');
    // Cancel the form submit
    event.preventDefault();


    var from = document.getElementById('from').value;
    var to = document.getElementById('to').value;
    var id = document.getElementById('id').value;
    //var name = document.getElementById('name').value;
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

// When the popup HTML has loaded
window.addEventListener('load', function(evt) {


    console.log('page loaded');
    $( '.select-field' ).select2( {
        theme: 'bootstrap-5',
        width: $( this ).data( 'width' ) ? $( this ).data( 'width' ) : $( this ).hasClass( 'w-100' ) ? '100%' : 'style',
        openOnEnter: false
    } );

    document.getElementById('addbookmark').addEventListener('submit', addBookmark);

    // Get the event page
    chrome.runtime.getBackgroundPage(function(eventPage) {
        eventPage.getPageDetails(onPageDetailsReceived);
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


    var inputElements = document.querySelectorAll('input.form-control');

    // Add event listener for focus event to each input element
    inputElements.forEach(function(inputElement) {
        inputElement.addEventListener('focus', function(event) {
            // Your event handling code here
            console.log('Input element focused:', inputElement.id);
        });
    });

});