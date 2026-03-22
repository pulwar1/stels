

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
        var temperature = document.getElementById('temperature').value;

        var jsonPayload = {
            "from": from,
            "to": to,
            "customerReference": id,
            "customerName": company,
            "startDate": start,
            "endDate": end,
            "shipmentType": type,
            "transportType": req,
            "temperature": temperature,
            "dangerous": special === "ADR",
            "weight": weight,
            "loadingMeter": ltl,
            "comments": comment
        };
        
        console.log(jsonPayload);
        navigator.serviceWorker.controller.postMessage({ type: 'myFunction', input: jsonPayload});
        var btn = document.getElementById('sendToTrello');
        btn.disabled = true;
        btn.innerText = 'Sending...';
        btn.classList.remove('btn-info', 'btn-danger');
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

    $(document).on('change', '#req', function() {
        var selectedValue = $(this).val();
        var tempInput = $('#temperature');

        if (selectedValue === 'REF') {
            tempInput.prop('disabled', false)
                .prop('required', true);
        } else {
            tempInput.prop('disabled', true)
                .prop('required', false)
                .val('');
        }
    });

    // Initialize initial state on load
    $('#req').trigger('change');

});

chrome.runtime.onMessage.addListener(function(msg) {
    if (msg.action === 'validationError') {
        var btn = document.getElementById('sendToTrello');
        btn.disabled = false;
        btn.innerText = 'Send to webhook';
        btn.classList.remove('btn-success', 'btn-info', 'btn-danger');
        btn.classList.add('btn-info');
        
        var fieldMap = {
            "fromLocations": ["from"],
            "toLocations": ["to"],
            "customerReference": ["id"],
            "customerName": ["company"],
            "startDate": ["start"],
            "endDate": ["end"],
            "shipmentType": ["inlineRadio1", "inlineRadio2"],
            "transportType": ["req"],
            "temperature": ["temperature"],
            "dangerous": ["inlineCheckbox4"],
            "weight": ["weight"],
            "loadingMeter": ["ltl"],
            "comments": ["comment"]
        };
        
        document.querySelectorAll('.is-invalid').forEach(el => {
            el.classList.remove('is-invalid');
            el.style.border = '';
            el.title = '';
            el.style.boxShadow = '';
        });

        for (let key in msg.errors) {
            let ids = fieldMap[key] || [key];
            let errorMsg = msg.errors[key].join(', ');
            ids.forEach(id => {
                let el = document.getElementById(id);
                if (el) {
                    el.classList.add('is-invalid');
                    el.style.border = '2px solid red';
                    el.style.boxShadow = '0 0 5px red';
                    el.title = errorMsg;
                }
            });
        }
    } else if (msg.action === 'submitSuccess') {
        var btn = document.getElementById('sendToTrello');
        btn.innerText = 'Successfully sent!';
        btn.classList.remove('btn-info', 'btn-danger');
        btn.classList.add('btn-success');
        
        document.querySelectorAll('.is-invalid').forEach(el => {
            el.classList.remove('is-invalid');
            el.style.border = '';
            el.title = '';
            el.style.boxShadow = '';
        });
    } else if (msg.action === 'submitError') {
        var btn = document.getElementById('sendToTrello');
        btn.disabled = false;
        btn.innerText = 'Error! Try again';
        btn.classList.remove('btn-success', 'btn-info');
        btn.classList.add('btn-danger');
    }
});