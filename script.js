// Requiring Monaco ------------------------------------------------------------
// From https://jsfiddle.net/developit/bwgkr6uq/

require.config({ paths: { 'vs': 'https://unpkg.com/monaco-editor@0.8.3/min/vs' }});
window.MonacoEnvironment = { getWorkerUrl: () => proxy };

let proxy = URL.createObjectURL(new Blob([`
	self.MonacoEnvironment = {
		baseUrl: 'https://unpkg.com/monaco-editor@0.8.3/min/'
	};
	importScripts('https://unpkg.com/monaco-editor@0.8.3/min/vs/base/worker/workerMain.js');
`], { type: 'text/javascript' }));

require(["vs/editor/editor.main"], setupEditors);

// -----------------------------------------------------------------------------

const ENDPOINT = "https://sord-server.herokuapp.com";

function getOptions() {
    const mode = document.querySelector("input[name='output-format']:checked").value;

    return { mode }
}

async function sendConversionRequest(body) {
    return fetch(`${ENDPOINT}/run`, {
        method: "POST",
        body: typeof body === "string" ? body : JSON.stringify(body)
    });
}

function setupEditors() {
    const inputEditor = monaco.editor.create(document.getElementById("input-code"), {
        theme: "vs-dark",
        language: "ruby",
        fixedOverflowWidgets: true,
        automaticLayout: true,
    });
    const outputEditor = monaco.editor.create(document.getElementById("output-code"), {
        theme: "vs-dark",
        language: "ruby",
        fixedOverflowWidgets: true,
        automaticLayout: true,
        readOnly: true,
    });
    
    document.getElementById("convert-button").onclick = async () => {
        const inputCode = inputEditor.getValue();

        // Start the loading spinner
        document.querySelector("#convert-button > span").style.display = "none";
        document.querySelector("#convert-button > svg").style.display = "inline";
        document.getElementById("convert-button").enabled = false;

        const response = await sendConversionRequest({
            code: inputCode,
            options: getOptions(),
        });

        // Stop the loading spinner
        document.querySelector("#convert-button > span").style.display = "inline";
        document.querySelector("#convert-button > svg").style.display = "none";     

        if (response.status === 200) {
            const responseBody = await response.json();
            outputEditor.setValue(responseBody.code);
        } else {
            outputEditor.setValue("Error");
        }
    };
}
