// https://javascript.info/async-await
// https://stackoverflow.com/questions/48617486/why-async-await-doesnt-work-in-my-case
// https://javascript.info/callbacks
// https://stackoverflow.com/questions/46399223/async-await-in-image-loading
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/then
// https://codeburst.io/javascript-async-await-with-foreach-b6ba62bbf404


// binding dom
let fileSelector = document.querySelector(".file-input");
let radio = document.querySelector(".control");
let messages = document.querySelector("#messages");
let btn = document.querySelector("button");
let form = document.querySelector("form");
let prog = document.querySelector("progress");
let notification = document.querySelector(".notification");
let selectedFilesText = document.querySelector('.file-name');
let codeText = document.querySelector('.code');
let copyBtn = document.querySelector('#copy');

// global vars :(
let fileList = [];
let entries = [];
let dim; // image dimensions old and new
let prePublii = '<div class="gallery" contenteditable="false" \
data-is-empty="false" data-columns="3">';
let postPublii = '</div>';



let getMaxAllowedImageSize = function () {
    return fileSelector.getAttribute("data-max-size") * 1024;
}

let getSelectedFormat = function () {
    return document.querySelector('input[name="format"]:checked').value;
}

//this is called multiple times
//it takes time to upload the img (async)
let upload = async function (file) {
    if (file.length) { // pointless?
        alert("Please Select files first")
        Promise.reject(new Error('No Files'));
        return; // to be able to interact with the ui again
    }
    if (file.size > getMaxAllowedImageSize()) {
        alert(file.name + " is too big.");
        Promise.reject(new Error('Too Big'));
        return;
    }

    if (sleepIsNeeded()) {
        // Imgur freq limit 50 Images/hour
        // Period = 1/50*60 mins = 1,2 mins = 72 secs
        await sleep(75);
    }

    // Begin file upload
    console.log("Uploading image to Imgur...");

    // Replace with your own API key
    var apiUrl = 'https://api.imgur.com/3/image';
    var apiKey = '28aaa2e823b03b1';

    var settings = {
        async: false,
        crossDomain: true,
        processData: false,
        contentType: false,
        type: 'POST',
        url: apiUrl,
        headers: {
            Authorization: 'Client-ID ' + apiKey,
            Accept: 'application/json'
        },
        mimeType: 'multipart/form-data'
    };

    var formData = new FormData();
    formData.append("image", file);
    settings.data = formData;

    // Response contains stringified JSON
    // Image URL available at response.data.link
    $.ajax(settings).done(async function (response) {
        let result = JSON.parse(response);
        entries.push(result);
        url = result.data.link;
        let message = "✅ " + file.name + " --- " + url;
        console.log(message);
        showMessage(message, url);
        progressAddOne();
        // return new Promise.resolve(url); // user has to switch format and then it works?
    }).fail(function (response) {
        let result = JSON.parse(response.responseText);
        let message = "❌ " + file.name + " --- " + result.data.error.message
        console.log(message);
        showMessage(message);
        Promise.reject(new Error('fail')).then(resolvedNotcalled, () => {
            console.debug(result);
        });
    });

    return new Promise((resolve, reject) => {
        resolve(url); // this is what whis function returns
        // with resolve we trigger the next ".then(funName(resolveParam))"
    })
}

let imageProcess = async function (url) {
    return new Promise((resolve, reject) => {
        dim = {
            old: {},
            new: {}
        }
        let img = new Image();
        let fixedWidth = 768; // Mansory Layout
        img.src = url;
        img.onload = () => {
            dim.old.width = img.width;
            dim.old.height = img.height;
            let ratio = img.height / img.width;
            dim.new.width = fixedWidth
            dim.new.height = Math.floor(ratio * dim.new.width)
            resolve();
        }
    })
}

//it takes time to load the img (async)
let formatPublii = async function (url) {

    await imageProcess(url);
    return new Promise((resolve, reject) => {
        code = '<figure class="gallery__item"><a href="' + url + '" data-size="' + dim
            .old.width +
            "x" + dim.old.height + '"><img src="' + url + '" alt="" width="' + dim.new
            .width +
            '" height="' + dim.new.height + '"></a></figure>';
        resolve(code);
    });
}

let formatMarkdown = async function (url) {
    return new Promise((resolve, reject) => {
        // ATTENTION this "\n" character is needed for NetlifyCMS to recognize the markdown entries as images
        resolve('![Imgur](' + url + ')\n');
    })
}

let appendPublii = function (code) {
    mid += code + '\n';
    codeText.value = prePublii + '\n' + mid + postPublii;

}

let append = async function (code) {
    codeText.value += code + '   \n';
}

let progressAddOne = function () {
    let val = parseInt(prog.getAttribute("value"));
    val = val + 1;
    prog.setAttribute("value", val);
    if ((val) >= prog.getAttribute("max")) {
        lock();
    }
}

let refreshUI = function () {
    if (notification.classList.contains('is-success')) {
        notification.classList.remove('is-success');
        notification.classList.add('is-warning');
    }
    if (fileList.length > 0) {
        btn.removeAttribute('disabled');
        prog.setAttribute("max", fileList.length);
    }
    prog.setAttribute("value", "0");
}

let createFileList = function () {
    fileList = [];
    // Notice how the fileList array is reset inside the change handler. 
    // This is in case the user selects files more than once.
    // We don't want to upload the same image multiple times
    for (let i = 0; i < fileSelector.files.length; i++) {
        fileList.push(fileSelector.files[i]);
    }
}

let showFileSelectorText = function () {
    if (fileSelector.files.length > 0) {
        let f = (fileSelector.files.length > 1) ? ' Files' : ' File'; // Plural
        selectedFilesText.innerHTML = fileSelector.files.length + f + ' Selected';
    }
}

let lock = function () {
    notification.classList.remove('is-warning');
    notification.classList.add('is-success');
    btnLock();
}

let btnLock = function () {
    btn.setAttribute('disabled', '');
}

let newCode = function (option) {
    codeText.value = '';
    // refreshUI();
    mid = ''; // for Publii
    if (entries.length <= 0) {
        return;
    }
    if (option == 'publii') {
        asyncForEach(entries,
            async function (entry) {
                await formatPublii(entry.data.link).then(appendPublii);
            });
    } else if (option == "markdown") {
        entries.forEach(function (entry) {
            formatMarkdown(entry.data.link).then(append);
        });
    } else {
        entries.forEach(function (entry) {
            append(entry.data.link);
        });
    }
}

// IMPORTANT classic forEach is not async compatible
async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array);
        // we dont use index or array
        // we only use arra[index]    (file)
    }
}

function sleep(sec) {
    let message = "💤  taking a nap for: " + sec + "secs... (Imgur Rate Limiting)";
    console.log(message);
    showMessage(message);
    return new Promise(resolve => setTimeout(resolve, sec * 1000));
}

let sleepIsNeeded = function () {
    if (fileList.length >= 50) {
        return true;
    } else {
        return false;
    }
}

let showMessage = function (message, url) {
    let text = document.createTextNode(message);
    let p = document.createElement("p");
    let a = document.createElement('a');
    a.href = url;
    a.target = "_blank"

    if (url) {
        a.appendChild(text);
        p.appendChild(a);
    } else {
        p.appendChild(text);
    }
    messages.appendChild(p);


}