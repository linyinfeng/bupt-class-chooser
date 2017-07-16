// ==UserScript==
// @name         Class Chooser
// @namespace    http://0yinf.cn/
// @version      0.0.1
// @description  Class Chooser for jwxt.bupt.edu.cn
// @author       Yinfeng Lin
// @match        http://jwxt.bupt.edu.cn/jwLoginAction.do
// @grant        none
// ==/UserScript==

(function () {
	'use strict';

	var html = document.getElementsByTagName('html')[0];
	var frameset = html.getElementsByTagName('frameset')[0];
	if (!frameset) return;
	frameset.setAttribute('rows', '48,*,200');

	var frame = document.createElement('frame');
	frameset.appendChild(frame);
	frame.scrolling = 'auto';
	frame.style.borderStyle = 'solid';
	frame.style.borderWidth = '0.125em 0 0 0';
	frame.setAttribute('id', 'user_script_frame');

	var userScriptDoc = frame.contentDocument;
	var body = userScriptDoc.getElementsByTagName('body')[0];
	body.style.font = '1em Monospace';
	body.style.lineHeight = '20%';
	body.style.margin = '0';

	body.innerHTML =`
		<div id="button_div" style="border-bottom: 1px dashed;">
			<button id="start_button" style="margin: 0.5em;">Start a new polling</button>
			<button id="refresh_button" style="margin: 0.5em;">Refresh data</button>
			<div id="interval_div" style="display: inline-block;">
				<input id="interval_input" type="number" value=10 min=1 style="width: 5em;">
				<span>ms</span>
			</div>
			<button id="stop_button" style="margin: 0.5em;">Stop all</button>
			<span>Waiting:</span>
			<span id="waiting-counter"></span>
		</div>
		<div id="info_div">
		</div>
	`;

	var info_div =  userScriptDoc.getElementById('info_div');
	var input = userScriptDoc.getElementById('interval_input');
	var waitingCounter = userScriptDoc.getElementById('waiting-counter');


	function Poller(name, url, data) {
		this.name = name;
		this.url = url || 'xkAction.do';
		this.data = data;
		this.selected = false;
		this.waitingCount = 0;
	}
	Poller.prototype.output = function(msg) {
		outputToElement(info_div, timeTag() + ' Poller ' + this.name + ': ' + msg);
	};
	Poller.prototype.updateWaitingCounter = function() {
		waitingCounter.innerText = this.waitingCount;
	};
	Poller.prototype.handleResponse = function(resp) {
		var msg = getMessage(resp);
		if (!this.selected) {
			this.output('Return: ' + msg);
		}
		if (msg.indexOf('成功') != -1) {
			this.stop();
			this.selected = true;
		}
	};
	Poller.prototype.start = function () {
		var int = getInvervalInputValue(input);
		this.selected = false;
		if (!this.data) {
			this.output('Error, form data is undefined');
		} else {
			this.output('Started');
			this.intervalIndicator = setInterval(function () {
				var http = new XMLHttpRequest();
				http.open('POST', this.url, true);
				http.onreadystatechange = function() {
					if(http.readyState == 4 ) {
						--this.waitingCount;
						this.updateWaitingCounter();
						if (http.status == 200)
							this.handleResponse(http.responseText);
					}
				}.bind(this);
				http.send(this.data);
				this.output('A new request sent');
				++this.waitingCount;
				this.updateWaitingCounter();
			}.bind(this), int);
		}
	};
	Poller.prototype.stop = function () {
		if (this.intervalIndicator) {
			clearInterval(this.intervalIndicator);
			delete this.intervalIndicator;
		}
		this.output('Stopped');
	};
	Poller.prototype.getData = function () {
		function getFrameEleByName(frame, name) {
			return frame.contentDocument.getElementsByName(name)[0];
		}

		var bottomFrame = document.getElementsByName('bottomFrame')[0];
		var mainFrame = getFrameEleByName(bottomFrame, 'mainFrame');
		var inforUpContent = getFrameEleByName(mainFrame, 'inforUpContent');
		var form;
		if (inforUpContent && (form = getFrameEleByName(inforUpContent, 'xkActionForm'))) {
			this.data =  new FormData(form);
			this.output('Data refreshed');
		} else {
			this.output('Error, Data refresh failed');
		}
	};

	var startButton = userScriptDoc.getElementById('start_button');
	var stopButton = userScriptDoc.getElementById('stop_button');
	var refreshButton = userScriptDoc.getElementById('refresh_button');

	var poller = new Poller('main');

	startButton.addEventListener('click', function () {
		poller.getData();
		poller.start();
	});
	refreshButton.addEventListener('click', function () {
		poller.getData();
	});
	stopButton.addEventListener('click', function () {
		poller.stop();
	});
}());

function getMessage(response) {
	const pattern = /xs\('(.*)'\);/;
	const allTagPattern = /<[^>]*>/g;

	var raw_msg = pattern.exec(response);
	if (raw_msg && raw_msg[1]) {
		var msg = raw_msg[1].replace(allTagPattern, '');
		return msg;
	} else {
		return 'Unknown response';
	}
}

function getInvervalInputValue(input) {
	var min = Number(input.getAttribute('min'));
	if (input.value < min)
		input.value = min;
	return input.value;
}

function timeTag() {
	var date = new Date();
	return '[' + date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds() + ']';
}

function outputToElement(parentElement, innerHTML, newElementTag) {
	newElementTag = newElementTag || 'p';

	var newElem = document.createElement(newElementTag);
	parentElement.insertBefore(newElem, parentElement.firstChild);
	newElem.innerHTML = innerHTML;
}
