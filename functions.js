// https://javascript.info/async-await
// https://stackoverflow.com/questions/48617486/why-async-await-doesnt-work-in-my-case
// https://javascript.info/callbacks
// https://stackoverflow.com/questions/46399223/async-await-in-image-loading
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/then


// binding dom
let fileSelector = document.querySelector(".file-input");
let radio = document.querySelector(".control");
let mid = '';
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
let dummy = [
    "https://i.imgur.com/pydVVTv.jpg",
    "https://i.imgur.com/YAnGPpm.jpg",
    "https://i.imgur.com/o6KFtZn.jpg",
    "https://i.imgur.com/ENoNmxD.jpg",
    "https://i.imgur.com/PqprpDj.jpg",
    "https://i.imgur.com/uBRjFUp.jpg",
    "https://i.imgur.com/JGi1Kjg.jpg",
    "https://i.imgur.com/ib5ooka.jpg"
];

let getMaxAllowedImageSize = function () {
    return $('input[type=file]').data("max-size") * 1024;
}
var maxSize = getMaxAllowedImageSize();

let getSelectedFormat = function () {
    return document.querySelector('input[name="format"]:checked').value;
}


//this is called multiple times
//it takes time to upload the img (async)
let upload = async function (file) {
    if (file.length) {
        console.log("Please Select files first");
        return false;
    }
    // Reject big files
    if (file.size > $(this).data("max-size") * 1024) {
        console.log("Please select a smaller file");
        return false;
    }

    // Begin file upload
    console.log("Uploading file to Imgur...");

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
    return new Promise((resolve, reject) => {
        $.ajax(settings).done(function (response) {
            let result = JSON.parse(response);
            entries.push(result);
            url = result.data.link;
            console.debug("Resolve upload")
            progressAddOne();
            resolve(url);
        });
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
            console.debug("resolve imageProcess");
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
        console.debug("resolve format")
        resolve(code);
    });
}

let formatMarkdown = async function (url) {
    // console.log("formatMarkdown");
    return new Promise((resolve, reject) => {
        resolve('![Imgur](' + url + ')');
    })
}

let appendPublii = function (code) {
    console.debug("Appending...")
    mid += code + '\n';
    codeText.value = prePublii + mid + postPublii;

}

let append = function (code) {
    codeText.value += code + '   \n';
    //FIXME: why do all the uploads have to end for the appends to start?
    // let span = document.querySelector("#mid");
    // let p = document.createElement("p");
    // let text = document.createTextNode(code);
    // span.appendChild(p);
    // p.appendChild(text);
    
}

let progressAddOne = function () {
    let val = parseInt(prog.getAttribute("value"));
    val = val + 1;
    prog.setAttribute("value", val);
    // console.debug(val + " " + prog.getAttribute("max"));
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

let btnLock = function (){
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
        entries.forEach(function (entry) {
            formatPublii(entry.data.link).then(appendPublii);
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