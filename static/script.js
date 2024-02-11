let autocompletion_list = [];
let last_completion_fetch = new Date();
let completion_timeout;
const completion_interval = 2000;

async function fetch_completions( text ) {
    const response = await fetch( "/complyte", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify( { message: text } ),
    } );

    const json = await response.json();
    return json.completions;
}

async function update_completions( text, div, textarea, really ) {
    clearTimeout( completion_timeout );
    if( ! really ) {
        completion_timeout = setTimeout( () => {
            update_completions( text, div, textarea, true );
        }, 500 );
    }

    if( ! really && last_completion_fetch > new Date() - completion_interval ) {
        return;
    }

    last_completion_fetch = new Date();

    autocompletion_list = await fetch_completions( text );

    do_autocomplete( div, textarea, false );
}

function get_autocompletion( text ) {
    text = text.toLowerCase();
    text = text.replace( /\s/g, " " );

    for( let sentence of autocompletion_list ) {
        const sentence_lower = sentence.toLowerCase();

        for( let i = 0; i <= sentence.length-2; i++ ) {
            const start = sentence_lower.slice( 0, sentence.length-i );
            const end = sentence.slice( sentence.length-i, sentence.length );

            if( text.endsWith( start ) ) {
                return end;
            }
        }
    }

    return null;
}

function getCaretPosition(element) {
    var caretOffset = 0;
    var doc = element.ownerDocument || element.document;
    var win = doc.defaultView || doc.parentWindow;
    var sel;
    if (typeof win.getSelection != "undefined") {
        sel = win.getSelection();
        if (sel.rangeCount > 0) {
            var range = win.getSelection().getRangeAt(0);
            var preCaretRange = range.cloneRange();
            preCaretRange.selectNodeContents(element);
            preCaretRange.setEnd(range.endContainer, range.endOffset);
            caretOffset = preCaretRange.toString().length;
        }
    } else if ( (sel = doc.selection) && sel.type != "Control") {
        var textRange = sel.createRange();
        var preCaretTextRange = doc.body.createTextRange();
        preCaretTextRange.moveToElementText(element);
        preCaretTextRange.setEndPoint("EndToEnd", textRange);
        caretOffset = preCaretTextRange.text.length;
    }
    return caretOffset;
}

function append_element_to_selection( element, after ) {
    const sel = window.getSelection();
    if (sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);

        range.insertNode(element);

        if( after ) {
            range.setStartAfter(element);
            range.setEndAfter(element);
        } else {
            range.setStartBefore(element);
            range.setEndBefore(element);
        }

        sel.removeAllRanges();
        sel.addRange(range);
    }
}

async function do_autocomplete( div, textarea, update ) {
    div.querySelector( ".autocompletion" )?.remove();

    textarea.value = div.textContent;

    if( update !== false ) {
        update_completions( div.textContent, div, textarea );
    }

    // get cursror position
    const position = getCaretPosition( div );
    const text = div.textContent.slice( 0, position );

    const autocompletion = get_autocompletion( text );
    div.setAttribute( "data-autocompletion", autocompletion );

    if( autocompletion ) {
        console.log( "adding autocompletion" );

        const autocompletion_container = document.createElement( "span" );
        autocompletion_container.classList.add( "autocompletion" );
        autocompletion_container.textContent = autocompletion.replace( / /g, "\u00a0" );
        autocompletion_container.contentEditable = false;

        append_element_to_selection( autocompletion_container );
    } else {
        console.log( "removed autocompletion" );
    }
}

function init_autocomplete( element ) {
    const div = document.createElement( "div" );
    div.classList.add( "autocomplete-div" );
    div.contentEditable = true;
    div.textContent = element.value;

    div.addEventListener( "keyup", function(e) {
        if( ! e.ctrlKey && ! e.altKey && ! e.shiftKey && ! e.metaKey ) {
            do_autocomplete( this, element );
        }
    } );

    div.addEventListener( "keydown", function(e) {
        if( e.key === "Tab" || e.key === "ArrowRight" ) {
            e.preventDefault();
            const autocompletion = this.getAttribute( "data-autocompletion" );
            if( autocompletion ) {
                append_element_to_selection( document.createTextNode( autocompletion ), true );
            }
        }
    } );

    div.style.width = element.offsetWidth + "px";
    div.style.height = element.offsetHeight + "px";

    // copy the border of the textarea
    div.style.border = window.getComputedStyle( element ).border;
    div.style.borderRadius = window.getComputedStyle( element ).borderRadius; // TODO: doesn't work

    element.insertAdjacentElement( "afterend", div );
    element.style.display = "none";
}

document.querySelectorAll(".autocomplete").forEach( e => {
    init_autocomplete( e );
} );
