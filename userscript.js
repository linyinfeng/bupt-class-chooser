// ==UserScript==
// @name         Class Chooser
// @namespace    http://0yinf.cn/
// @version      0.1
// @description  Class Chooser for jwxt.bupt.edu.cn
// @author       Yinfeng Lin
// @match        http://jwxt.bupt.edu.cn/jwLoginAction.do
// @grant        none
// ==/UserScript==

let intervalIDs = [];

let log = function() {};

function req(form) {
    let http = new XMLHttpRequest();
    let url = 'xkAction.do';
    let data = new FormData(form);
    http.open('POST', url, true);

    http.onreadystatechange = function() {
        if(http.readyState == 4 && http.status == 200) {
            handleResponse(http.responseText);
        }
    };
    http.send(data);
    log('Reqest sent');
}

function handleResponse(response) {
    const pattern = /xs\('(.*)'\);/;
    const allTagPattern = /<br[^>]*>/g;

    let raw_msg = pattern.exec(response);
    if (raw_msg && raw_msg[1]) {
        let msg = raw_msg[1].replace(allTagPattern, '');
        log(msg);
        if (msg.search('成功') != -1) {
            stopAll();
        }
    } else {
        log('Unknown response');
    }
}

function poll() {
    let bottomFrame = document.getElementsByName('bottomFrame')[0];
    let mainFrame = getFrameEleByName(bottomFrame, 'mainFrame');
    let inforUpContent = getFrameEleByName(mainFrame, 'inforUpContent');
    let form;
    if (inforUpContent && (form = getFrameEleByName(inforUpContent, 'xkActionForm'))) {
        return setInterval(req.bind(null, form), getInvervalInputValue());
    } else {
        log('Unknown error');
    }
}

function getInvervalInputValue() {
    let input = document.getElementById('user_script_frame').contentDocument.
        getElementById('interval_input');
    if (input.value < Number(input.getAttribute('value')))
        input.value = 10;
    return input.value;
}

function getFrameEleByName(frame, name) {
    return frame.contentDocument.getElementsByName(name)[0];
}

function output(info_parent, str) {
    function genTimeTag() {
        let date = new Date();
        return '[' + date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds() + ']';
    }

    let p = document.createElement('p');
    info_parent.insertBefore(p, info_parent.firstChild);
    p.innerHTML = genTimeTag() + ' ' + str;
    return p;
}

function stopAll() {
    intervalIDs.map(function(x){clearInterval(x);});
    intervalIDs = [];
}

function startNew() {
    intervalIDs.push(poll());
}

(function() {
    'use strict';

    let html = document.getElementsByTagName('html')[0];
    let frameset = html.getElementsByTagName('frameset')[0];
    frameset.setAttribute('rows', '48,*,200');

    let frame = document.createElement('frame');
    frameset.appendChild(frame);
    frame.scrolling = 'auto';
    frame.style.borderStyle = 'solid';
    frame.style.borderWidth = '0.125em 0 0 0';
    frame.setAttribute('id', 'user_script_frame');

    let body = frame.contentDocument.getElementsByTagName('body')[0];
    body.style.font = '1em Monospace';
    body.style.lineHeight = '20%';
    body.style.margin = '0';

    let button_div = document.createElement('div');
    let info_div = document.createElement('div');
    body.appendChild(button_div);
    body.appendChild(info_div);
    button_div.style.borderBottom = '1px dashed';

    log = output.bind(null, info_div);

    let startButton = document.createElement('button');
    button_div.appendChild(startButton);
    startButton.innerHTML = 'Click to start a new polling';
    startButton.style.margin = '0.5em';
    startButton.addEventListener('click', startNew, false);

    let intervalInput = document.createElement('input');
    button_div.appendChild(intervalInput);
    intervalInput.setAttribute('type', 'number');
    intervalInput.setAttribute('value', '100');
    intervalInput.setAttribute('id', 'interval_input');
    intervalInput.setAttribute('min', '10');

    let stopButton = document.createElement('button');
    button_div.appendChild(stopButton);
    stopButton.innerHTML = 'Click to stop';
    stopButton.style.margin = '0.5em';
    stopButton.addEventListener ('click', stopAll, false);
})();