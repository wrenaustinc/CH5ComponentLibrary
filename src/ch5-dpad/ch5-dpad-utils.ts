// Copyright (C) 2021 to the present, Crestron Electronics, Inc.
// All rights reserved.
// No part of this software may be reproduced in any form, machine
// or natural, without the express written consent of Crestron Electronics.
// Use of this source code is subject to the terms of the Crestron Software License Agreement
// under which you licensed this source code.

import { Ch5Signal, Ch5SignalFactory } from "../ch5-core";

export class CH5DpadUtils {

	// the join number is applied to the up button, join+1 applies to down,
	// join+2 applies to left, join+3 applies to right, join+4 to center
	public static readonly sendEventOnClickSigCountToAdd = {
		up: 0,
		down: 1,
		left: 2,
		right: 3,
		center: 4
	};

	public static readonly contractSuffix = {
		up: 'Up',
		down: 'Down',
		left: 'Left',
		right: 'Right',
		center: 'Center'
	};

	/**
	 * Function to return the attribute as a string
	 * @param thisRef 
	 * @param keyToCheck 
	 * @param defaultValue 
	 * @returns 
	 */
	public static getAttributeAsString(thisRef: any, keyToCheck: string, defaultValue: string = '') {
		let retVal = defaultValue;
		keyToCheck = keyToCheck.toLowerCase(); // precaution for attributes, to keep them lower cased
		if (!!thisRef && thisRef.hasAttribute([keyToCheck])) {
			retVal = thisRef.getAttribute([keyToCheck]) as string;
		}
		return retVal;
	}

	/**
	 * Function to return the attribute as a boolean
	 * @param thisRef 
	 * @param keyToCheck 
	 * @param defaultValue 
	 * @returns 
	 */
	public static getAttributeAsBool(thisRef: any, keyToCheck: string, defaultValue: boolean) {
		let retVal = defaultValue;
		keyToCheck = keyToCheck.toLowerCase(); // precaution for attributes, to keep them lower cased
		if (thisRef.hasAttribute([keyToCheck])) {
			retVal = (thisRef.getAttribute([keyToCheck]) === 'true' ||
				thisRef.getAttribute([keyToCheck]) === true);
		}
		return retVal;
	}

	/**
	 * Function to remove all child elements before creating them newly
	 * @param thisRef 
	 */
	public static clearComponentContent(thisRef: any) {
		const containers = thisRef.getElementsByClassName(thisRef.primaryCssClass);
		Array.from(containers as HTMLElement[]).forEach((container) => {
			container.remove();
		});
	}

	public static isNullOrUndefined(input: any) {
		return (typeof (input) === 'undefined' || input === null);
	}

	/**
	 * Function to set defaultValue to an attribute if it doesn't have one already
	 * @param thisRef html element
	 * @param attr attribute to check if its undefined, sets the default value
	 * @param defaultValue is set as attribute's value if it doesn't have one already
	 */
	public static setAttributeToElement(thisRef: any, attr: string, defaultValue: string) {
		attr = attr.toLowerCase();
		let val = (defaultValue === null) ? '' : defaultValue;
		if (!thisRef.hasAttribute(attr) && val.length > 0) {
			thisRef.setAttribute(attr, val);
		} else if (thisRef.hasAttribute(attr)) {
			val = thisRef.getAttribute(attr);
		}
		return val;
	}

	/**
	 * Function to convert string into boolean
	 * @param str input
	 * @returns boolean
	 */
	public static getBoolFromString(str: string) {
		return (!CH5DpadUtils.isNullOrUndefined(str) && (str === 'true'));
	}

	/**
	 * Function to return a 'span' tag to be placed as icon for dpad child btn
	 * @param imageUrl image url for icon
	 * @returns HTMLElement, a 'span' tag
	 */
	public static getImageContainer(imageUrl: string) {
		const retEle = document.createElement('span');
		retEle.classList.add('dpad-btn-icon');
		retEle.classList.add('image-url');
		retEle.setAttribute('data-img-url', imageUrl);
		return retEle;
	}

	/**
	 * Function to return an 'i' tag to be placed as icon for dpad child btn
	 * @param iconClass icon class for icon
	 * @returns HTMLElement, a 'i' tag
	 */
	public static getIconContainer() {
		const retEle = document.createElement('span');
		retEle.classList.add('dpad-btn-icon');
		// retEle.classList.add('icon-class');
		retEle.classList.add('fas');
		return retEle;
	}

	/**
	 * Function to return an 'span' tag to be placed as label for dpad child btn
	 * @param labelInput label instead of icon
	 * @returns HTMLElement, a 'span' tag
	 */
	public static getLabelContainer(labelClassName: string) {
		const retEle = document.createElement('span');
		retEle.classList.add(labelClassName);
		return retEle;
	}

	/**
	 * Function to clear subscription and value based on them
	 * @param csf ch5SignalFactory object
	 * @param obj source object
	 * @param receiveAttribute string
	 * @param signalReceiveAttribute string
	 */
	public static clearSignalValue(csf: Ch5SignalFactory, obj: any, receiveAttribute: string, signalReceiveAttribute: string) {
		if (obj[receiveAttribute] !== '' && obj[signalReceiveAttribute] !== '') {
			const receiveValueSigName: string = Ch5Signal.getSubscriptionSignalName(obj[signalReceiveAttribute]);
			const sigLabel: Ch5Signal<string> | null = csf.getStringSignal(receiveValueSigName);
			if (null !== sigLabel) {
				sigLabel.unsubscribe(obj[receiveAttribute]);
				obj[signalReceiveAttribute] = '';
			}
		}
	}

	/**
	 * Function to check and return the required value for a given params
	 * @param hasAttribute pre-existing attribute status
	 * @param valToAssign new value to assign
	 * @param defaultValue defaultvalue if required
	 * @returns final value assigned as attribute's value
	 */
	public static setAttributesBasedValue(hasAttribute: boolean, valToAssign: any, defaultValue: string) {
		if (hasAttribute) {
			return valToAssign;
		} else {
			return defaultValue;
		}
	}

	/**
	 * Function to check and assign value based on the attribute received
	 * @param thisRef the control for setting attribute value
	 * @param attrKey attribute key for the given control to set value 
	 * @param value actual value to be ste
	 * @param validValues valid values to be tested against before checking
	 */
	public static setAttributeValueOnControl(thisRef: any, attrKey: string, value: string,
		validValues: string[], callback: any) {
		const pvtAttrKey = '_' + attrKey;
		if (value !== thisRef[pvtAttrKey]) {
			if (validValues.indexOf(value) >= 0) {
				thisRef[pvtAttrKey] = value;
			} else {
				thisRef[pvtAttrKey] = validValues[0];
			}
			if (thisRef[pvtAttrKey] !== null) {
				thisRef.setAttribute(attrKey, thisRef[pvtAttrKey]);
			}
			if (callback !== null) {
				callback();
			}
		}
	}

	public static createIconTag(thisRef: any) {
		if (thisRef._icon.classList === undefined || thisRef._icon.classList.length <= 0) {
			thisRef._icon = document.createElement('span');
		}
	}
}