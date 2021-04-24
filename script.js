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
        const response = await sendConversionRequest({
            code: inputCode,
            options: {
                mode: "rbs",
                break_params: 4,
                replace_errors_with_untyped: true,
                replaced_unresolved_with_untyped: true,
                comments: false,
            },
        });

        if (response.status === 200) {
            const responseBody = await response.json();
            outputEditor.setValue(responseBody.code);
        } else {
            outputEditor.setValue("Error");
        }
    };
}
