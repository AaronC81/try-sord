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

const exampleCode =
`module Example
  class Person
    # @param name [String] The name of the Person to create.
    # @param age [Integer] The age of the Person to create.
    # @return [Example::Person]
    def initialize(name, age)
      @name = name
      @age = age
    end

    # @return [String]
    attr_accessor :name

    # @return [Integer]
    attr_accessor :age

    # @param possible_names [Array<String>] An array of potential names to choose from.
    # @param possible_ages [Array<Integer>] An array of potential ages to choose from.
    # @return [Example::Person]
    def self.construct_randomly(possible_names, possible_ages)
      Person.new(possible_names.sample, possible_ages.sample)
    end
  end
end
`;

function setupEditors() {
    const inputEditor = monaco.editor.create(document.getElementById("input-code"), {
        theme: "vs-dark",
        language: "ruby",
        fixedOverflowWidgets: true,
        automaticLayout: true,
    });
    inputEditor.getModel().updateOptions({ tabSize: 2 });
    inputEditor.setValue(exampleCode);
    
    const outputEditor = monaco.editor.create(document.getElementById("output-code"), {
        theme: "vs-dark",
        language: "ruby",
        fixedOverflowWidgets: true,
        automaticLayout: true,
        readOnly: true,
    });
    
    const convert = async () => {
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

    document.getElementById("convert-button").onclick = convert;
    convert();
}
