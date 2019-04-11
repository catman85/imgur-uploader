// binding dom
let input = document.querySelector("input");
let pre = document.querySelector("#pre");
let span = document.querySelector("#mid");
let post = document.querySelector("#post");
let btn = document.querySelector("button");
let form = document.querySelector("form");
let prog = document.querySelector("progress");
let notification = document.querySelector(".notification");

let fileList = [];
let url;
let dim; // image dimensions old and new

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
// var $files = 0;

let getMaxAllowedImageSize = function () {
    return $('input[type=file]').data("max-size") * 1024;
}

var maxSize = getMaxAllowedImageSize();

//this is called multiple times
//it takes time to upload the img (async)
let upload = function (file) {
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

    // Replace ctrlq with your own API key
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
    // console.log(0);
    $.ajax(settings).done(function (response) {
        let result = JSON.parse(response);
        url = result.data.link;

        formatPublii();

        // redirect to the result
        // window.location.href = result.data.link;
        // append(result.data.link);
        // span.innerText = result.data.link

    });
}

//it takes time to load the img (async)
let formatPublii = function () {
    let img = new Image();
    dim = {
        old: {},
        new: {}
    }
    let fixedWidth = 768; // Mansory Layout
    img.src = url;

    //get image dimensions
    img.onload = function () { // takes time waits for the image to load
        dim.old.width = img.width;
        dim.old.height = img.height;
        let ratio = img.height / img.width;
        dim.new.width = fixedWidth
        dim.new.height = Math.floor(ratio * dim.new.width)

        let code = '<figure class="gallery__item"><a href="' + url + '" data-size="' + dim
            .old.width +
            "x" + dim.old.height + '"><img src="' + url + '" alt="" width="' + dim.new
            .width +
            '" height="' + dim.new.height + '"></a></figure>';
        // console.debug(dim); 
        
        append(code);        
    }

    
    

}

let append = function (inp) {
    let span = document.querySelector("#mid");
    let p = document.createElement("p");
    let text = document.createTextNode(inp);
    span.appendChild(p);
    p.appendChild(text);
    progressAddOne();
    // console.log(2);
}

let prepareCode = function () {
    pre.innerText =
        '<div class="gallery" contenteditable="false" data-is-empty="false" data-columns="3">';
    post.innerText = '</div>'
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

let refresh = function () {
    if (notification.classList.contains('is-success')) {
        notification.classList.remove('is-success');
        notification.classList.add('is-warning');
    }
    if (btn.getAttribute('disabled') != null) {
        btn.removeAttribute('disabled');
    }
    prog.setAttribute("max", fileList.length);
    prog.setAttribute("value", "0");
}

let lock = function () {
    notification.classList.remove('is-warning');
    notification.classList.add('is-success');
    btn.setAttribute('disabled', '');
}