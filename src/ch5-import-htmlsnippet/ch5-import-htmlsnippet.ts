// Copyright (C) 2018 to the present, Crestron Electronics, Inc.
// All rights reserved.
// No part of this software may be reproduced in any form, machine
// or natural, without the express written consent of Crestron Electronics.
// Use of this source code is subject to the terms of the Crestron Software License Agreement
// under which you licensed this source code.

import _ from 'lodash';
import isNil from 'lodash/isNil';
import { Ch5Common } from "../ch5-common/ch5-common";
import { Ch5SignalElementAttributeRegistryEntries, Ch5SignalAttributeRegistry } from '../ch5-common/ch5-signal-attribute-registry';
import { Ch5Signal, Ch5SignalFactory, publishEvent } from "../ch5-core";
import { ICh5ImportHtmlSnippetAttributes } from './interfaces/i-ch5-import-htmlsnippet-attributes';

/**
 * HTML ATTRIBUTES
 *
 * - Url
 * - receiveStateShowPulse
 * - receiveStateHidePulse
 * - sendEventOnShow
 * - receiveStateShow
 * 
 */

export class Ch5ImportHtmlSnippet extends Ch5Common implements ICh5ImportHtmlSnippetAttributes {

	public static ELEMENT_NAME = 'ch5-import-htmlsnippet';

	public static readonly SIGNAL_ATTRIBUTE_TYPES: Ch5SignalElementAttributeRegistryEntries = {
		...Ch5Common.SIGNAL_ATTRIBUTE_TYPES
	};

	private _elContainer: HTMLElement = {} as HTMLElement;

	/**
	 * URL to load the content
	 *
	 * @type {string}
	 * @private
	 */
	private _url: string = '';

	/**
	 * To display the content based on the state
	 *
	 * HTML attribute name: receiveStateShow
	 */
	private _sigNameReceiveState: string = '';

	/**
	 * The subscription id for the receiveState signal
	 */
	private _subReceiveState: string = '';

	/**
	 * HTML attribute name: sendEventOnError or sendeventonerror
	 */
	private _sigNameSendOnError: string = '';

	/**
	 * EVENTS
	 * 
	 * error - inherited
	 */

	/**
	 * Event error: error on loading the HTML
	 */
	private errorEvent: Event;

	/**
	 *  Variables
	 */

	/**
	 * Send signal on load 
	 */
	private sigNameSendOnLoad: string = '';

	/**
	 * The name of the digital pulse signal that will be sent to native of current visible item on select
	 *
	 * HTML attribute name: sendEventOnShow or sendeventonshow
	 * @private
	 * @type {string}
	 */
	private _sendEventOnShowSigName: string = '';

	/**
	 * CONSTRUCTOR
	 */
	public constructor() {
		super();
		this._elContainer = document.createElement('div');
		// custom release event
		this.errorEvent = new CustomEvent("error", {
			bubbles: true,
			cancelable: false
		});
		// custom HTML load event
		this._onError = this._onError.bind(this);
	}

	public static registerSignalAttributeTypes() {
		Ch5SignalAttributeRegistry.instance.addElementAttributeEntries(Ch5ImportHtmlSnippet.ELEMENT_NAME, Ch5ImportHtmlSnippet.SIGNAL_ATTRIBUTE_TYPES);
	}

	/**
	 * Getter and Setter functions for each attribute.
	 */

	/**
	 * url - set and get
	 */
	public get url(): string {
		return this._url;
	}
	public set url(value: string) {
		this._url = value;
	}

	public get sendEventOnShow(): string {
		return this._sendEventOnShowSigName;
	}

	/**
	 * Setter sendEventOnShow
	 */
	public set sendEventOnShow(value: string) {
		this.info('set sendEventOnShow(\'' + value + '\')');

		if (value === '') {
			return;
		}

		if (this._sendEventOnShowSigName !== value) {
			this._sendEventOnShowSigName = value;
			this.setAttribute('sendeventonshow', value);
		}
	}

	/**
	 * Respond to attribute changes.
	 */
	public static get observedAttributes() {
		const commonAttributes = Ch5Common.observedAttributes;

		const ch5ImportHtmlSnippetAttributes = [
			// attributes
			'url'
		];

		return commonAttributes.concat(ch5ImportHtmlSnippetAttributes);
	}

	/**
	 * Called when an observed attribute has been added, removed, updated, or replaced
	 * @param attr 
	 * @param oldValue 
	 * @param newValue 
	 */
	public attributeChangedCallback(attr: string, oldValue: string, newValue: any) {
		switch (attr) {
			case 'url':
				if (this.hasAttribute('url') && !_.isNil(this.getAttribute('url')) && this.getAttribute('url') !== '' && this.url !== newValue) {
					this.url = newValue;
					this.loadHTMLContent(this.url);
				} else {
					this.url = '';
				}
				break;
			case 'sendeventonshow':
				if (this.hasAttribute('sendeventonshow')) {
					this.sendEventOnShow = newValue;
				} else {
					this.sendEventOnShow = '';
				}
				break;
			default:
				super.attributeChangedCallback(attr, oldValue, newValue);
				break;
		}
	}

	/**
	 * Unsubscribe signals
	 */
	public unsubscribeFromSignals() {
		super.unsubscribeFromSignals();
		const csf = Ch5SignalFactory.getInstance();
		if (!isNil(this._subReceiveState) && !isNil(this._sigNameReceiveState)) {
			const sigLabel: Ch5Signal<string> | null = csf.getStringSignal(this._sigNameReceiveState);
			if (sigLabel) {
				sigLabel.unsubscribe(this._subReceiveState);
				this._sigNameReceiveState = '';
			}
		}
	}

	/**
	 * 	Called every time the element is inserted into the DOM. 
	 *  Useful for running setup code, such as fetching resources or rendering. 
	 */
	public connectedCallback() {
		this.info(`Ch5ImportHTMLSnippet.connectedCallback()`);
		this.initAttributes();
		customElements.whenDefined('ch5-import-htmlsnippet').then(() => {
			this.cacheComponentChildrens();
			if (this.firstChild !== this._elContainer) {
				this.appendChild(this._elContainer);
			}
			this._sendSignalValueOnShow();
			this.info(`ch5-import-htmlsnippet connectedCallback() - end`);
		});
	}

	/**
	 * Called every time the element is removed from the DOM. 
	 * Useful for running clean up code.
	 */
	public disconnectedCallback() {
		this.info(`Ch5ImportHTMLSnippet.disconnectedCallback()`);
		this.unsubscribeFromSignals();
	}

	/**
	 * It sends the value as a signal
	 * @param value 
	 */
	private sendValueOnLoadSignal(value: boolean): void {
		let sigLoad: Ch5Signal<boolean> | null = null;
		if (!isNil(this.sigNameSendOnLoad)) {
			sigLoad = Ch5SignalFactory.getInstance()
				.getBooleanSignal(this.sigNameSendOnLoad);
			if (sigLoad) {
				sigLoad.publish(value);
			}
		}
	}

	/**
	 * It initiates the signal and publish the signal
	 * @param finalValue 
	 */
	private onLoadAction(finalValue: string) {
		this.sigNameSendOnLoad = finalValue;
		let sigClick: Ch5Signal<boolean> | null = null;
		if (!isNil(this.sigNameSendOnLoad)) {
			sigClick = Ch5SignalFactory.getInstance()
				.getBooleanSignal(this.sigNameSendOnLoad);
			if (sigClick) {
				sigClick.publish(true);
				sigClick.publish(false);
			}
		}
		this.sendValueOnLoadSignal(false); // TODO: Test
	}

	/**
	 * Getting the HTML content
	 * @param url 
	 */
	private async loadHTMLContent(url: string) {
		try {
			const response: string = await this.asyncLoadContent(url);
			this._elContainer.innerHTML = response;
			publishEvent('object', `ch5-import-htmlsnippet:${this.id}`, { loaded: true, url, id: this.id });

		} catch (rejectionReason) {
			this.info(`ch5-import-htmlsnippet failed to load the URL: ${url}, ${rejectionReason}`);
		}
	}

	/**
	 * Getting the local file
	 * @param url 
	 * @return Promise with content from URL  
	 */
	private asyncLoadContent(url: string): Promise<string> {
		// Create new promise with the Promise() constructor;
		// This has as its argument a function
		// with two parameters, resolve and reject
		return new Promise((resolve, reject) => {
			// Standard XHR to load an image
			const request = new XMLHttpRequest();
			request.open("GET", url);
			// When the request loads, check whether it was successful
			request.onload = () => {
				if (request.status < 300 && request.response !== null
					&& (request.responseType === "" || request.responseType === "text")) {
					// If successful, resolve the promise by passing back the request response
					resolve(request.responseText);
				} else {
					// If it fails, reject the promise with a error message
					reject(`load failed with status ${request.status}, statusText ${request.statusText}, responseType ${request.responseType}`);
				}
			};
			request.onerror = () => {
				// Also deal with the case when the entire request fails to begin with
				// This is probably a network error, so reject the promise with an appropriate message
				reject("There was a network error.");
			};
			// Send the request
			request.send();
		});
	}



	/**
	 * Send digital pulse(boolean values) when component is selected|active
	 * @private
	 */
	private _sendSignalValueOnShow(): void {
		this.info('Ch5ImportHTMLSnippet._sendSignalValueOnShow()');

		let sigShow: Ch5Signal<boolean> | null = null;

		if (this._sendEventOnShowSigName !== ''
			&& this._sendEventOnShowSigName !== undefined
			&& this._sendEventOnShowSigName !== null) {

			sigShow = Ch5SignalFactory.getInstance()
				.getBooleanSignal(this._sendEventOnShowSigName);

			if (sigShow !== null) {
				sigShow.publish(true);
				sigShow.publish(false);
			}
		}
	}

	/**
	 *  EVENTS HANDLERS 
	 */
	private _onError(inEvent: Event): void {
		this.dispatchEvent(this.errorEvent);
		const message = `Error loading URL: ${this._url}`;
		this._sendValueForErrorSignal(message);
	}

	/**
	 * Send values for signal on Error
	 * @param errorMessage 
	 */
	private _sendValueForErrorSignal(errorMessage: string): void {
		let sigError: Ch5Signal<string> | null = null;
		if (!isNil(this._sigNameSendOnError)) {
			sigError = Ch5SignalFactory.getInstance()
				.getStringSignal(this._sigNameSendOnError);
			if (sigError) {
				sigError.publish(errorMessage);
			}
		}
	}

	/**
	 *  Called to initialize all attributes
	 */
	protected initAttributes(): void {
		super.initAttributes();
		if (this.hasAttribute('url')) {
			this._url = this.getAttribute('url') as string;
		}
	}
}

/**
 * Create a custom element
 */
if (typeof window === "object" && typeof window.customElements === "object"
	&& typeof window.customElements.define === "function") {
	window.customElements.define(Ch5ImportHtmlSnippet.ELEMENT_NAME, Ch5ImportHtmlSnippet);
}

Ch5ImportHtmlSnippet.registerSignalAttributeTypes();
