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

function output(str) {
	function genTimeTag() {
		let date = new Date();
		return '[' + date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds() + ']';
	}

	let p = document.createElement('p');
	this.insertBefore(p, this.firstChild);
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

function main() {
	'use strict';

	let html = document.getElementsByTagName('html')[0];
	let frameset = html.getElementsByTagName('frameset')[0];
	if (!frameset) return;
	frameset.setAttribute('rows', '48,*,200');

	let frame = document.createElement('frame');
	frameset.appendChild(frame);
	frame.scrolling = 'auto';
	frame.style.borderStyle = 'solid';
	frame.style.borderWidth = '0.125em 0 0 0';
	frame.setAttribute('id', 'user_script_frame');

	let userScriptDoc = frame.contentDocument;
	let body = userScriptDoc.getElementsByTagName('body')[0];
	body.style.font = '1em Monospace';
	body.style.lineHeight = '20%';
	body.style.margin = '0';

	body.innerHTML =`
		<div id="button_div" style="border-bottom: 1px dashed;">
			<button id="start_button" style="margin: 0.5em;">Start a new polling</button>
			<input id="interval_input" type="number" value=100 min=10>
			<button id="stop_button" style="margin: 0.5em;">Stop all</button>
		</div>
		<div id="info_div">
		</div>
	`;

	let info_div =  userScriptDoc.getElementById('info_div');
	log = output.bind(info_div);

	let startButton = userScriptDoc.getElementById('start_button');
	startButton.addEventListener('click', startNew, false);

	let stopButton = userScriptDoc.getElementById('stop_button');
	stopButton.addEventListener ('click', stopAll, false);
}

main();
