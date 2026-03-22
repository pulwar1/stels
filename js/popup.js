

function replaceOnlyNewlines(text) {
    return text.replace(/\r?\n/g, ' + ');
}

chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    console.log("Send");
    chrome.tabs.sendMessage(tabs[0].id, "message", (pageDetails) => {
        console.log(pageDetails)
        document.getElementById('from').value = pageDetails.from;
        document.getElementById('to').value = pageDetails.to;
        document.getElementById('company').value = pageDetails.name;
        document.getElementById('id').value = pageDetails.id;
        document.getElementById('weight').value = pageDetails.weight;
        document.getElementById('start').value = pageDetails.start;
        document.getElementById('end').value = pageDetails.end;
    });
});
// When the popup HTML has loaded
window.addEventListener('load', function(evt) {
    // console.log('page loaded');
    // $( '.select-field' ).select2( {
    //     theme: 'bootstrap-5',
    //     width: $( this ).data( 'width' ) ? $( this ).data( 'width' ) : $( this ).hasClass( 'w-100' ) ? '100%' : 'style',
    //     openOnEnter: false
    // } );
    document.getElementById('addbookmark').addEventListener('submit', function(event) {
        event.preventDefault(); // Prevent the default form submission
        
        var from = replaceOnlyNewlines(document.getElementById('from').value);
        var to = replaceOnlyNewlines(document.getElementById('to').value);
        var id = document.getElementById('id').value;
        var weight = document.getElementById('weight').value;
        var start = document.getElementById('start').value;
        var end = document.getElementById('end').value;
        var typeElement = document.querySelector('input[name="type"]:checked');
        var type = typeElement ? typeElement.value : '';
        var specialElement = document.querySelector('input[name="special"]:checked');
        var special = specialElement ? specialElement.value : '';
        var ltl = document.getElementById('ltl').value;
        var req = document.getElementById('req').value;
        var comment = document.getElementById('comment').value;
        var company = document.getElementById('company').value;

        var jsonPayload = {
            "from": from,
            "to": to,
            "customerReference": id,
            "customerName": company,
            "startDate": start,
            "endDate": end,
            "shipmentType": type,
            "transportType": req,
            "temperature": "",
            "dangerous": special === "ADR",
            "weight": weight,
            "loadingMeter": ltl,
            "comments": comment
        };
        
        console.log(jsonPayload);
        navigator.serviceWorker.controller.postMessage({ type: 'myFunction', input: jsonPayload});
        var btn = document.getElementById('sendToTrello');
        btn.disabled = true;
        btn.innerText = 'Successfully sent!';
        btn.classList.remove('btn-info');
        btn.classList.add('btn-success');
    });
});



$(document).ready(function() {
    $(document).on('change', 'input[name="type"]', function() {
        var selectedValue = $(this).val();
        var ltlInput = $('#ltl');

        if (selectedValue === 'FTL') {
            ltlInput.prop('disabled', true)
                .prop('required', false)
                .val('');
        } else if (selectedValue === 'LTL') {
            ltlInput.prop('disabled', false)
                .prop('required', true);
        }
    });

});