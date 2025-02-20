// Copyright (C) 2018 to the present, Crestron Electronics, Inc.
// All rights reserved.
// No part of this software may be reproduced in any form, machine
// or natural, without the express written consent of Crestron Electronics.
// Use of this source code is subject to the terms of the Crestron Software License Agreement
// under which you licensed this source code.

import {
	Ch5Signal,
	Ch5SignalFactory,
	Ch5TranslationUtility,
	Ch5Uid,
	languageChangedSignalName,
	subscribeInViewPortChange,
	Ch5Platform,
	ICh5PlatformInfo,
	publishEvent
} from '../ch5-core';

import { Subject } from 'rxjs';
import { Ch5Config } from './ch5-config';
import { Ch5MutationObserver } from './ch5-mutation-observer';
import { Ch5ImageUriModel } from "../ch5-image/ch5-image-uri-model";
import isEmpty from 'lodash/isEmpty';
import isNil from 'lodash/isNil';
import { Ch5CommonLog } from './ch5-common-log';
import { ICh5CommonAttributes, TCh5ShowType, TCh5ProcessUriParams, TCh5CreateReceiveStateSigParams } from './interfaces';
import { Ch5SignalElementAttributeRegistryEntries } from "../ch5-common/ch5-signal-attribute-registry";
import _ from 'lodash';

export interface ICh5AttributeAndPropertySettings {
	default: any;
	valueOnAttributeEmpty: any;
	variableName: string;
	attributeName: string;
	propertyName: string;
	removeAttributeOnNull: boolean;
	type: string;
	enumeratedValues: any[];
	componentReference: any;
	callback?: any;
};

export class Ch5Common extends HTMLElement implements ICh5CommonAttributes {

	//#region Variables

	public static DIRECTION: string[] = ['ltr', 'rtl'];

	/**
	 * The containing components will not be observed by MutationObserver
	 * @type {string[]}
	 */
	public static ELEMENTS_MO_EXCEPTION = ['swiper-wrapper'];

	protected static readonly SIGNAL_ATTRIBUTE_TYPES: Ch5SignalElementAttributeRegistryEntries = {
		receivestatecustomclass: { direction: "state", stringJoin: 1, contractName: true },
		receivestatecustomstyle: { direction: "state", stringJoin: 1, contractName: true },
		receivestateshow: { direction: "state", booleanJoin: 1, contractName: true },
		receivestateshowpulse: { direction: "state", booleanJoin: 1, contractName: true },
		receivestatehidepulse: { direction: "state", booleanJoin: 1, contractName: true },
		receivestateenable: { direction: "state", booleanJoin: 1, contractName: true },

		sendeventonshow: { direction: "event", booleanJoin: 1, contractName: true }
	};

	protected readonly COMMON_PROPERTIES: {
		SHOW: ICh5AttributeAndPropertySettings,
		DISABLED: ICh5AttributeAndPropertySettings
	} = {
			SHOW: {
				default: true,
				valueOnAttributeEmpty: true,
				variableName: "_show",
				attributeName: "show",
				propertyName: "show",
				type: "boolean",
				removeAttributeOnNull: true,
				enumeratedValues: ['true', 'false', '', true, false],
				componentReference: this,
				callback: this.updateForChangeInShowStatus.bind(this)
			},
			DISABLED: {
				default: false,
				valueOnAttributeEmpty: true,
				variableName: "_disabled",
				attributeName: "disabled",
				propertyName: "disabled",
				type: "boolean",
				removeAttributeOnNull: true,
				enumeratedValues: ['true', 'false', '', true, false],
				componentReference: this,
				callback: this.updateForChangeInDisabledStatus.bind(this)
			}
		};

	// The first value of the array is considered the default one	 
	private showTypes: TCh5ShowType[] = ['display', 'visibility', 'remove'];

	protected ignoreAttributes: string[] = [];
	public primaryCssClass: string = 'ch5-common';
	public cssClassPrefix: string = 'ch5-common';

	// Current language for each component
	public currentLanguage: string | null = '';

	public translatableObjects: any = {} as any;
	public childrenOfCurrentNode: [HTMLElement] | null = null;

	public _class: string = '';
	public _style: string = '';

	/**
	 * Standard html attribute.
	 */
	protected _id: string = '';

	/**
	 *
	 * Contains a list of classes that are applied to the component
	 *
	 * HTML attribute name: customClass or customclass
	 */
	protected _customClass: string = '';

	/**
	 * Used internally to store the previously added custom classes
	 */
	protected _prevAddedCustomClasses: string[] = [];
	/**
	 *
	 * Contains a list of space delimited style classes that are applied to the component
	 *
	 * HTML attribute name: customStyle or customstyle
	 */
	protected _customStyle: string = '';

	/**
	 * Used internally to store the previously added inline style
	 */
	protected _prevAddedStyle: string = '';

	/**
	 *
	 * boolean value that determines if the components is shown ( the visibility type is defined in noshowType )
	 */
	protected _show: boolean = true;

	/**
	 * Reflects the visibility type of the item
	 *
	 * HTML attribute: noshowType or noshowtype
	 * NOTE: when is set to 'remove' it cannot be shown again
	 */
	protected _noshowType: TCh5ShowType = 'display';

	/**
	 *  Standard HTML attribute, defaults to false
	 */
	protected _disabled: boolean = false;

	/**
	 * Reflects the gestureable ability of the components
	 */
	private _gestureable: boolean = false;

	/**
	 * Contains the name of a string signal. The value received on this string signal will be applied as a property on
	 * the customClass attribute.
	 * A change will remove the prior value and apply the new value
	 *
	 * HTML attribute name: receiveStateCustomClass or receivestatecustomclass
	 */
	protected _receiveStateCustomClass: string = '';

	/**
	 * The subscription key for the receiveStateCustomClass signal
	 */
	protected _subKeySigReceiveCustomClass: string = '';

	/**
	 * Contains the name of a string signal. The value received on this string signal will be applied as a property on
	 * the customStyle attribute.
	 * A change will remove the prior value and apply the new value
	 *
	 * HTML attribute name: receiveStateCustomStyle or receivestatecustomstyle
	 */
	protected _receiveStateCustomStyle: string = '';

	/**
	 * The subscription key for the receiveStateCustomStyle signal
	 */
	protected _subKeySigReceiveCustomStyle: string = '';

	/**
	 * Contains the name of a boolean signal.
	 * The value of this signal determines if the component is seen by the user. ( true = seen,visible )
	 *
	 * HTML attribute name: receiveStateShow or receivestateshow
	 */
	protected _receiveStateShow: string = '';

	/**
	 * The subscription key for the receiveStateShow signal
	 */
	protected _subKeySigReceiveShow: string = '';

	/**
	 *  Contains the name of a boolean signal.
	 *  Component is seen when the signal transitions from false to true
	 *
	 *  HTML attribute name: receiveStateShowPulse or receivestateshowpulse
	 */
	protected _receiveStateShowPulse: string = '';

	/**
	 * The subscription key for the receiveStateShowPulse signal
	 */
	protected _subKeySigReceiveShowPulse: string = '';

	/**
	 * Contains the name of a boolean signal.
	 * Component is hidden when the signal transitions from false to true
	 *
	 * HTML attribute name: receiveStateHidePulse or receivestatehidepulse
	 */
	protected _receiveStateHidePulse: string = '';

	protected _nextSiblingIndexInParentChildNodes: number = 0;

	/**
	 * The subscription key for the receiveStateHidePulse signal
	 */
	protected _subKeySigReceiveHidePulse: string = '';

	/**
	 * Contains the name of a boolean signal.
	 * When the value of this signal is true, the component is enabled. ( the disabled attribute is the opposite of this value )
	 *
	 * HTML attribute name: receiveStateEnable or receivestateenable
	 */
	protected _receiveStateEnable: string = '';

	/**
	 * The subscription key for the receiveStateEnable signal
	 */
	protected _subKeySigReceiveEnable: string = '';

	/**
	 * Contains the name of a boolean signal.
	 * This signal will be sent to the native app with a true value when the component is visible and a false value when
	 * the component is not visible.
	 * The component is considered visible even if completely covered by other visible elements.
	 *
	 * HTML attribute name: sendEventOnShow or sendeventonshow
	 */
	protected _sigNameSendOnShow: string = '';

	/**
	 * The subscription key for the sendEventOnShow signal
	 */
	protected _sigSendOnShow: Ch5Signal<boolean> | null = null;

	protected _onrelease: {} = {};

	protected _onpress: {} = {};

	/**
	 * If this param is true then the component will display debug/info messages in the browser's console
	 */
	protected _isDebugEnabled: boolean = false;
	protected _isTraceEnabled: boolean = false;

	/**
	 * Is populated in constructor.
	 */
	protected _listOfAllPossibleComponentCssClasses: string[] = [];

	/**
	 * Ch5 internal unique ID
	 */
	protected _crId: string = '';

	/**
	 * Ch5 internal unique ID with Increment
	 */
	protected _ch5Id: number = 0;

	/**
	 * Css class name prefix for the visibility classes
	 */
	private readonly _visibilityCssClassPrefix = 'ch5';

	/**
	 * CSS class name for noshowtype = visibility
	 */
	private readonly _cssClassHideVisibility = this._visibilityCssClassPrefix + '-hide-vis';
	/**
	 * CSS class name for noshowtype = none
	 */
	private readonly _cssClassHideDisplay = this._visibilityCssClassPrefix + '-hide-dis';

	/**
	 * Cached parent element. Used in the case when noshowType is set to remove and the component has to be reattached to the DOM
	 */
	protected _cachedParentEl: Node | null = null;

	/**
	 * Cached sibling element. The one that immediately follows the current element. Used in the case when noshowType
	 * is set to remove and the component has to be reattached to the DOM
	 */
	protected _cachedNextSibling: Node | null = null;

	protected _isDetachedFromDom: boolean = false;
	/**
	 * When noshowType is 'remove' and the element was removed from the DOM this gets set to true
	 * If this is true then the component will not unsubscribe from signals on removal from DOM ( as a consequence of a show signal change)
	 */
	protected _keepListeningOnSignalsAfterRemoval = false;

	/**
	 * This will be the target element for adding css classes or css style ( except the classes related to show/hide )
	 */
	protected _targetElementForCssClassesAndStyle: HTMLElement | null = null;

	/**
	 * An RxJs observable for the gestureable property.
	 * Other classes cand subscribe to this and be notified when the gestureable property changes.
	 */
	public observableGestureableProperty: Subject<boolean>;

	protected _wasInstatiated: boolean = false;

	/**
	 * This property is set to true when the component is instantiated in viewport.
	 * For example the ch5-modal-dialog component at the render time may
	 * be hidden and then the size of the ch5-modal-dialog cannot be computed.
	 *
	 * This property is used to check if the component
	 * was instantiated in the viewport
	 *
	 * @protected
	 * @type {boolean}
	 */
	protected wasInstantiatedInViewport: boolean = false;

	/**
	 * string value - append/remove specified class when the element is/is not in viewport
	 */
	protected _appendClassWhenInViewPort: string = '';

	/**
	 * boolean value - element is present or not in viewport
	 */
	public elementIsInViewPort: boolean = true;

	/**
	 * Whenever the target meets a threshold specified for the IntersectionObserver,
	 * the callback is invoked. The callback receives a list of IntersectionObserverEntry objects
	 */
	public elementIntersectionEntry: IntersectionObserverEntry = {} as IntersectionObserverEntry;

	/**
	 * boolean value - element is visible or not
	 */
	public elementIsVisible: boolean = true;

	public logger: Ch5CommonLog;

	private _commonMutationObserver: Ch5MutationObserver = {} as Ch5MutationObserver;

	//#endregion

	//#region Setters and Getters

	public set customClass(value: string) {
		this.logger.log('set customClass(\'' + value + '\')');
		value = this._checkAndSetStringValue(value);
		if (value !== this._customClass) {
			this._customClass = value;
			this.setAttribute('customclass', value);
		}
	}
	public get customClass(): string {
		return this._customClass;
	}

	public set customStyle(value: string) {
		this.logger.log('set customStyle(\'' + value + '\')');
		value = this._checkAndSetStringValue(value);
		if (value !== this._customStyle) {
			this._prevAddedStyle = this._customStyle;
			this._customStyle = value;
			this.setAttribute('customstyle', value);
		}
	}
	public get customStyle(): string {
		return this._customStyle;
	}

	public set show(value: boolean) {
		this.logger.log('set show(\'' + value + '\')');
		if (_.isNil(this.receiveStateShow) || this.receiveStateShow === "") {
			this.setAttributeAndProperty(this.COMMON_PROPERTIES.SHOW, value);
		}
	}
	public get show(): boolean {
		return this._show;
	}

	public set noshowType(value: TCh5ShowType) {
		this.logger.log('set noshowType(\'' + value + '\')');
		value = this._checkAndSetStringValue(value, 'none') as TCh5ShowType;
		if (value !== this._noshowType) {
			if (this.showTypes.indexOf(value) > 0) {
				this._noshowType = value;
			} else {
				this._noshowType = this.showTypes[0];
			}
			this.setAttribute('noshowtype', this._noshowType);
		}
	}
	public get noshowType(): TCh5ShowType {
		return this._noshowType;
	}

	public set disabled(value: boolean) {
		this.logger.log('set disabled(\'' + value + '\')');
		if (_.isNil(this.receiveStateEnable) || this.receiveStateEnable === "") {
			this.setAttributeAndProperty(this.COMMON_PROPERTIES.DISABLED, value);
		}
	}
	public get disabled(): boolean {
		return this._disabled;
	}

	public set gestureable(value: boolean) {
		this.logger.log('set gestureable(\'' + value + '\')');
		const booleanValue = this.toBoolean(value);

		if (value !== this._gestureable) {
			this.observableGestureableProperty.next(booleanValue);
			this._gestureable = booleanValue;
			this.setAttribute('gestureable', booleanValue.toString());
		}
	}
	public get gestureable(): boolean {
		return this._gestureable;
	}

	public set receiveStateCustomClass(value: string) {
		this.logger.log('set receiveStateCustomClass(\'' + value + '\')');
		value = this._checkAndSetStringValue(value);
		if ('' === value || value === this._receiveStateCustomClass) {
			return;
		}

		this.clearStringSignalSubscription(this._receiveStateCustomClass, this._subKeySigReceiveCustomClass);

		this._receiveStateCustomClass = value;
		this.setAttribute('receivestatecustomclass', value);

		const recSigCustomClassName: string = Ch5Signal.getSubscriptionSignalName(this._receiveStateCustomClass);
		const recSig: Ch5Signal<string> | null = Ch5SignalFactory.getInstance().getStringSignal(recSigCustomClassName);

		if (null === recSig) {
			return;
		}
		let hasSignalChanged = false;

		this._subKeySigReceiveCustomClass = recSig.subscribe((newVal: string) => {
			this.logger.log('subs callback for signalReceiveCustomClass: ', this._receiveStateCustomClass, ' Signal has value ', newVal);
			if ('' !== newVal) {
				hasSignalChanged = true;
			}
			if (newVal !== this.customClass && hasSignalChanged) {
				// this.setAttribute('customclass', newVal);
				this.customClass = newVal;
			}
		});
	}

	public get receiveStateCustomClass(): string {
		// The internal property is changed if/when the element is removed from dom
		// Returning the attribute instead of the internal property preserves functionality
		return this._attributeValueAsString('receivestatecustomclass');
	}

	public set receiveStateCustomStyle(value: string) {
		this.logger.log('set receiveStateCustomStyle(\'' + value + '\')');
		value = this._checkAndSetStringValue(value);
		if ('' === value || value === this._receiveStateCustomStyle) {
			return;
		}

		this.clearStringSignalSubscription(this._receiveStateCustomStyle, this._subKeySigReceiveCustomStyle);

		this._receiveStateCustomStyle = value;
		this.setAttribute('receivestatecustomstyle', value);

		const recSigCustomStyleName: string = Ch5Signal.getSubscriptionSignalName(this._receiveStateCustomStyle);
		const recSig: Ch5Signal<string> | null = Ch5SignalFactory.getInstance().getStringSignal(recSigCustomStyleName);

		if (null === recSig) {
			return;
		}

		let hasSignalChanged = false;
		this._subKeySigReceiveCustomStyle = recSig.subscribe((newVal: string) => {
			this.logger.log(' subs callback for signalReceiveCustomStyle: ', this._subKeySigReceiveCustomStyle, ' Signal has value ', newVal);
			if ('' !== newVal) {
				hasSignalChanged = true;
			}
			if (newVal !== this.customStyle && hasSignalChanged) {
				this.setAttribute('customStyle', newVal);
			}
		});
	}
	public get receiveStateCustomStyle(): string {
		// The internal property is changed if/when the element is removed from dom
		// Returning the attribute instead of the internal property preserves functionality
		return this._attributeValueAsString('receivestatecustomstyle');
	}

	public set receiveStateEnable(value: string) {
		this.logger.log('set receiveStateEnable(\'' + value + '\')');
		value = this._checkAndSetStringValue(value);
		if ('' === value || value === this._receiveStateEnable) {
			return;
		}

		this.clearBooleanSignalSubscription(this._receiveStateEnable, this._subKeySigReceiveEnable);

		this._receiveStateEnable = value;
		this.setAttribute('receivestateenable', value);

		const recSigEnableName: string = Ch5Signal.getSubscriptionSignalName(this._receiveStateEnable);
		const recSig: Ch5Signal<boolean> | null = Ch5SignalFactory.getInstance().getBooleanSignal(recSigEnableName);

		if (null === recSig) {
			return;
		}
		this._subKeySigReceiveEnable = recSig.subscribe((newValue: boolean) => {
			this.logger.log(' subs callback for signalReceiveEnable: ', this._subKeySigReceiveEnable, ' Signal has value ', newValue);
			if ((!this.disabled) !== newValue) {
				this.setAttributeAndProperty(this.COMMON_PROPERTIES.DISABLED, !newValue as unknown as boolean, true);
			}
		});
	}
	public get receiveStateEnable(): string {
		// The internal property is changed if/when the element is removed from dom
		// Returning the attribute instead of the internal property preserves functionality
		return this._attributeValueAsString('receivestateenable');
	}

	public set receiveStateHidePulse(value: string) {
		this.logger.log('set receiveStateHidePulse(\'' + value + '\')');
		value = this._checkAndSetStringValue(value);
		if ('' === value || value === this._receiveStateHidePulse) {
			return;
		}

		this.clearBooleanSignalSubscription(this._receiveStateHidePulse, this._subKeySigReceiveHidePulse);

		this._receiveStateHidePulse = value;
		this.setAttribute('receivestatehidepulse', value);

		const recSigHidePulseName: string = Ch5Signal.getSubscriptionSignalName(this._receiveStateHidePulse);
		const recSig: Ch5Signal<boolean> | null = Ch5SignalFactory.getInstance().getBooleanSignal(recSigHidePulseName);

		if (null === recSig) {
			return;
		}

		this._subKeySigReceiveHidePulse = recSig.subscribe((newVal: boolean) => {
			this.logger.log(' subs callback for signalReceiveHidePulse: ', this._subKeySigReceiveHidePulse, ' Signal has value ', newVal);
			if (null !== recSig) {
				if (false === recSig.prevValue && true === newVal) {
					this.setAttribute('show', 'false');
				}
			} else {
				this.logger.log(' subs callback for signalReceiveHidePulse: ', this._subKeySigReceiveHidePulse, ' recSig is null');
			}
		});
	}

	public get receiveStateHidePulse(): string {
		// The internal property is changed if/when the element is removed from dom
		// Returning the attribute instead of the internal property preserves functionality
		return this._attributeValueAsString('receivestatehidepulse');
	}

	public set receiveStateShowPulse(value: string) {
		this.logger.log('set receiveStateShowPulse(\'' + value + '\')');
		value = this._checkAndSetStringValue(value);
		if ('' === value || value === this._receiveStateShowPulse) {
			return;
		}

		this.clearBooleanSignalSubscription(this._receiveStateShowPulse, this._subKeySigReceiveShowPulse);

		this._receiveStateShowPulse = value;
		this.setAttribute('receivestateshowpulse', value);

		const recSigShowPulseName: string = Ch5Signal.getSubscriptionSignalName(this._receiveStateShowPulse);
		const recSig: Ch5Signal<boolean> | null = Ch5SignalFactory.getInstance().getBooleanSignal(recSigShowPulseName);

		if (null === recSig) {
			return;
		}

		this._subKeySigReceiveShowPulse = recSig.subscribe((newVal: boolean) => {
			this.logger.log(' subs callback for signalReceiveShowPulse: ', this._subKeySigReceiveShowPulse, ' Signal has value ', newVal);
			if (null !== recSig) {
				const _newVal = (newVal as never as { repeatdigital: boolean }).repeatdigital !== undefined ? (newVal as never as { repeatdigital: boolean }).repeatdigital : newVal;
				if ((recSig.prevValue as never as { repeatdigital: boolean }).repeatdigital !== undefined) {
					if (false === (recSig.prevValue as never as { repeatdigital: boolean }).repeatdigital && true === _newVal) {
						this.setAttribute('show', 'true');
					}
					return;
				}
				if (false === recSig.prevValue && true === _newVal) {
					this.setAttribute('show', 'true');
				}
			}
		});
	}
	public get receiveStateShowPulse(): string {
		// The internal property is changed if/when the element is removed from DOM
		// Returning the attribute instead of the internal property preserves functionality
		return this._attributeValueAsString('receivestateshowpulse');
	}

	public set receiveStateShow(value: string) {
		this.logger.log('set receiveStateShow(\'' + value + '\')');
		value = this._checkAndSetStringValue(value);
		if ('' === value || value === this._receiveStateShow) {
			return;
		}

		this.clearBooleanSignalSubscription(this._receiveStateShow, this._subKeySigReceiveShow);

		this._receiveStateShow = value;
		this.setAttribute('receivestateshow', value);

		const recSigShowName: string = Ch5Signal.getSubscriptionSignalName(this._receiveStateShow);
		const recSig: Ch5Signal<boolean> | null = Ch5SignalFactory.getInstance().getBooleanSignal(recSigShowName);

		if (null === recSig) {
			this.logger.log('recSig for signalReceiveShow is null');
			return;
		}

		this._subKeySigReceiveShow = recSig.subscribe((newValue: boolean) => {
			this.logger.log('subs callback for signalReceiveShow: ', this._subKeySigReceiveShow, ' Signal has value ', newValue, ' this.show', this.show);
			if (newValue !== this.show) {
				this.setAttributeAndProperty(this.COMMON_PROPERTIES.SHOW, newValue as unknown as boolean, true);
			}
		});
	}

	public get receiveStateShow(): string {
		// The internal property is changed if/when the element is removed from DOM
		// Returning the attribute instead of the internal property preserves functionality
		return this._attributeValueAsString('receivestateshow');
	}

	public set sendEventOnShow(value: string) {
		this.sigNameSendOnShow = value;
	}

	public get sendEventOnShow(): string {
		return this.sigNameSendOnShow;
	}

	public set sigNameSendOnShow(value: string) {
		this.logger.log('set sigNameSendOnShow(\'' + value + '\')');
		value = this._checkAndSetStringValue(value);
		if ('' === value || value === this._sigNameSendOnShow) {
			return;
		}

		this._sigNameSendOnShow = value;
		this.setAttribute('sendeventonshow', value);

		this._sigSendOnShow = Ch5SignalFactory.getInstance().getBooleanSignal(this._sigNameSendOnShow);

	}

	public get sigNameSendOnShow(): string {
		return this._sigNameSendOnShow;
	}

	public set onrelease(callback: {}) {
		this._onrelease = callback;
	}

	public get onrelease(): {} {
		return this._onrelease;
	}

	public set onpress(callback: {}) {
		this.logger.log("set onpress");
		this._onpress = callback;
	}

	public get onpress(): {} {
		this.logger.log("get onpress");
		return this._onpress;
	}

	public set appendClassWhenInViewPort(value: string) {
		if (value !== this._appendClassWhenInViewPort) {
			this._appendClassWhenInViewPort = value;
			this.setAttribute('appendClassWhenInViewPort', value.toString());
		}
	}

	public get appendClassWhenInViewport(): string {
		return this._appendClassWhenInViewPort;
	}

	//#endregion

	//#region Lifecycle Hooks

	public constructor() {
		super();
		this._crId = Ch5Uid.getUid();
		this.logger = new Ch5CommonLog(false, false, this._crId);
		const cssClasses: string[] = [];

		cssClasses.push(this.cssClassPrefix + '--disabled');

		this._listOfAllPossibleComponentCssClasses = cssClasses;
		this.observableGestureableProperty = new Subject<boolean>();

		const receiveSignal = Ch5SignalFactory.getInstance().getStringSignal(languageChangedSignalName);

		if (receiveSignal === null) {
			return;
		}

		receiveSignal.subscribe((newValue: string) => {
			if (newValue !== '' && newValue !== this.currentLanguage) {
				this.currentLanguage = newValue;
				Object.keys(this.translatableObjects).forEach((propertyToTranslate: string) => {
					let propertyReference: { [key: string]: string } = this as {};

					if (propertyReference[propertyToTranslate as string] === undefined && propertyReference['attrModel' as string] !== undefined) {
						propertyReference = propertyReference['attrModel' as string] as {};
					}

					if (propertyReference[propertyToTranslate.toString()] !== undefined && this.translatableObjects[propertyToTranslate.toString()] !== undefined) {
						propertyReference[propertyToTranslate.toString()] = this.translatableObjects[propertyToTranslate];
						this.translateCallback(propertyToTranslate.toString());
					}
				})
			}
		});
	}

	//#endregion

	//#region Other Methods

	/**
	 * Getting the measurement unit from size (eg. 35px, returned value gonna be px)
	 *
	 * @return {string}
	 */
	public static getMeasurementUnitFromSizeValue(sizeValue: string): string {

		const pattern = new RegExp("^(?:[0-9]+)(\\w*|%)$");
		let measurementUnit: string = 'px';

		if (sizeValue !== null && sizeValue !== undefined) {

			const matchedValues = sizeValue.match(pattern);

			if (
				matchedValues !== null &&
				matchedValues[1] !== undefined &&
				matchedValues[1] !== ''
			) {
				measurementUnit = matchedValues[1];
			}
		}

		return measurementUnit;
	}

	/**
	 * Getting the measurement number value from size (eg. 35px, returned value gonna be 35)
	 *
	 * @return {number}
	 */
	public static extractMeasurementNumber(sizeValue: string): number {
		const pattern = new RegExp("^-?\\d+\\.?\\d*");
		let n: number = 0;
		if (sizeValue !== null && sizeValue !== undefined) {
			const matchedValues = sizeValue.match(pattern);

			if (matchedValues !== null && matchedValues[0] !== undefined) {
				n = Number(matchedValues[0]);
			}
		}
		return n;
	}

	/**
	 * Getting the measurement number value in px from size. If unit is not pixel, convert the value to px first
	 *
	 * @return {number}
	 */
	public static getMeasurementPxNumber(sizeValue: string): number {
		const actualUnit: string = Ch5Common.getMeasurementUnitFromSizeValue(sizeValue);
		return actualUnit !== 'px'
			? Ch5Common.convertAltUnitsToPx(sizeValue)
			: Math.round(Ch5Common.extractMeasurementNumber(sizeValue));
	}

	/**
	 * Convert alternative units such as vh,vw in px
	 *
	 * @param {string} sizeValue
	 */
	public static convertAltUnitsToPx(sizeValue: string): number {
		const measurementUnit = Ch5Common.getMeasurementUnitFromSizeValue(sizeValue);
		const size = parseFloat(sizeValue);
		let _size = size;

		switch (measurementUnit) {
			case 'vh':
				_size = Ch5Common.convertVhUnitsToPx(size);
				break;
			case 'vw':
				_size = Ch5Common.convertVwUnitsToPx(size);
				break;
		}

		return Math.round(_size);
	}

	public static convertPxUnitToAlt(px: number, measurementUnit: string): number {
		let altValue = px;
		switch (measurementUnit) {
			case 'vw':
				altValue = Ch5Common.convertPxUnitToVw(px);
				break;
			case 'vh':
				altValue = Ch5Common.convertPxUnitToVh(px);
				break;
		}
		return Math.ceil(altValue);
	}

	public static convertVhUnitsToPx(vh: number): number {
		const height = window.innerHeight || document.documentElement.clientHeight;
		return (vh * height) / 100;
	}

	public static convertVwUnitsToPx(vw: number): number {
		const width = window.innerWidth || document.documentElement.clientWidth;
		return (vw * width) / 100;
	}

	public static convertPxUnitToVh(px: number): number {
		const height = window.innerHeight || document.documentElement.clientHeight;
		return (px / height) * 100;
	}

	public static convertPxUnitToVw(px: number): number {
		const width = window.innerWidth || document.documentElement.clientWidth;
		return (px / width) * 100;
	}

	/**
	 * This method will ensure that the value which should be affected
	 * by a textTransform property is properly done.
	 *
	 * @param {string} textTransform
	 * @param {string} value
	 * @return {string}
	 */
	public static handlingTextTransformValue(value: string, textTransform: string): string {
		let processedValue = value;
		if (value === undefined || value === null) {
			return '';
		}

		switch (textTransform) {
			case 'capitalize':
				processedValue = processedValue.replace(
					/\b\w/g,
					(firstLetterOfWord) => firstLetterOfWord.toUpperCase());
				break;
			case 'uppercase':
				processedValue = processedValue.toUpperCase();
				break;
			case 'lowercase':
				processedValue = processedValue.toLowerCase();
				break;
			default:
				processedValue = processedValue;
				break;
		}

		return processedValue;
	}

	public static processUri(processUriParams: TCh5ProcessUriParams): void | string {
		let uriStr: string = "";
		const platformInfo = Ch5Platform.getInstance();
		platformInfo.registerUpdateCallback((info: ICh5PlatformInfo) => {
			if (processUriParams.protocol) {
				return;
			}

			// the http/https related protocols from platformInfo
			const { http, https } = info.capabilities.supportCredentialIntercept;

			// sent to the uri model
			const protocols = { http, https };

			// the url should not be replaced if one of this is not filled
			if (!http && !https) {
				return;
			}

			processUriParams.protocol = https ? https : http;

			const uri = new Ch5ImageUriModel(
				protocols,
				processUriParams.user,
				processUriParams.password,
				processUriParams.url,
			);

			// check if the current uri contains authentication information
			// and other details necessary for URI
			if (!uri.isValidAuthenticationUri()) {
				return;
			}
			uriStr = uri.toString();
		});
		return uriStr;
	}

	public _t(valueToTranslate: string) {
		let translatedValue = valueToTranslate;
		const translationUtility = Ch5TranslationUtility.getInstance();
		const identifiedValues = translationUtility.valuesToTranslation(valueToTranslate);

		if (identifiedValues && identifiedValues.length > 0) {
			identifiedValues.forEach(identifier => {
				const isTranslatable = translationUtility.isTranslationIdentifier(identifier);
				if (isTranslatable) {
					const characters = translationUtility.stripDownTranslationCharacters(identifier);
					const existTranslation = translationUtility.getTranslator().exists(characters);

					if (existTranslation) {
						const identifierTranslated = translationUtility.getTranslator().t(characters);
						translatedValue = translatedValue.replace(identifier, identifierTranslated);
					}
				}
			})
		}
		return translatedValue;
	}

	/**
	 * In Angular the content of the template element is not passed in
	 * a document-fragment. This can break functionalities of ch5-spinner / ch5-list when
	 * used inside ch5-template or any other component that should copy this component.
	 *
	 * @return {void}
	 */
	public resolveTemplateChildren(template: HTMLTemplateElement): void {
		if (!template) {
			return;
		}

		if (!isNil(template.content) && template.content.childElementCount === 0 && template.children.length > 0) {
			Array.from(template.children).forEach((child) => {
				template.content.appendChild(child);
			})
		}
	}

	public _getTranslatedValue(valueToSave: string, valueToTranslate: string) {

		const translationUtility = Ch5TranslationUtility.getInstance();

		let translationKey = valueToTranslate;;
		let _value = valueToTranslate;
		let savedValue = this.translatableObjects[valueToSave];

		if (savedValue === valueToTranslate) {
			translationKey = savedValue;
		}

		const isTranslatableValue = translationUtility.isTranslationIdentifier(translationKey);

		if (!isTranslatableValue) {
			return valueToTranslate;
		}

		if (typeof savedValue === 'undefined') {
			savedValue = valueToTranslate;
			_value = this._t(valueToTranslate);

		} else {
			const isTranslatableLabel = translationUtility.isTranslationIdentifier(savedValue);

			if (!isTranslatableLabel) {
				if (savedValue !== valueToTranslate) {
					savedValue = valueToTranslate;
				}
				_value = this._t(valueToTranslate)

			} else {
				if (this._t(savedValue) !== valueToTranslate && translationUtility.hasMultipleIdentifiers(savedValue)) {
					savedValue = valueToTranslate;
				}
				_value = this._t(savedValue);
			}

		}
		this.translatableObjects[valueToSave] = savedValue;

		return _value;
	}

	/**
	 *
	 */
	public static get observedAttributes() {
		return [
			'customclass',
			'customstyle',
			'show',
			'noshowtype',
			'disabled',
			'gestureable',
			'receivestatecustomclass',
			'receivestatecustomstyle',
			'receivestateshow',
			'receivestateshowpulse',
			'receivestatehidepulse',
			'receivestateenable',
			'sendeventonshow',
			'debug',
			'trace',
			'dir',
			'appendclasswheninviewport'
		]
	}


	/**
	 * Returns the internal ch5 unique identifier assigned to the component
	 */
	public getCrId(): string {
		return this._crId;
	}

	/**
	 * Helper method.
	 * Allows writing debug/info messages using the console.
	 * The messages are displayed only if _isDebugEnabled is true
	 */
	public info(message?: any, ...optionalParams: any[]): void {
		this.logger.info(message, optionalParams);
	}

	public error(message: any, ...optionalParams: any[]): void {
		this.logger.error(message, optionalParams);
	}

	/**
	 * Returns true if debugging has been enabled on the component.
	 * When this returns true the info method will output messages on the console ( assuming there are 'info' calls in
	 * the component's code )
	 */
	public isDebug() {
		return this._isDebugEnabled;
	}

	public isTrace() {
		return this._isTraceEnabled;
	}

	public attributeChangedCallback(attr: string, oldValue: string, newValue: string) {
		if (oldValue === newValue || this.ignoreAttributes.includes(attr)) {
			return;
		}
		this.logger.log('ch5-common attributeChangedCallback("' + attr + '","' + oldValue + '","' + newValue + ')"');

		switch (attr) {
			case 'customclass':
				this.logger.log("CustomClass Set in Common");

				if (this.hasAttribute('customclass')) {
					this.customClass = this.getAttribute('customclass') as string;
				} else {
					this.customClass = '';
				}
				this.updateForChangeInCustomCssClass();
				break;
			case 'customstyle':
				if (this.hasAttribute('customstyle')) {
					this.customStyle = this.getAttribute('customstyle') as string;
				} else {
					this.customStyle = '';
				}
				this.updateForChangeInStyleCss();
				break;
			case 'show':
				this.show = newValue as unknown as boolean;
				break;
			case 'noshowtype':
				this.updateForChangeInShowStatus();
				break;
			case 'receivestatecustomclass':
				if (this.hasAttribute('receivestatecustomclass')) {
					this.receiveStateCustomClass = this.getAttribute('receivestatecustomclass') as string;
				} else {
					this.clearStringSignalSubscription(this._receiveStateCustomClass, this._subKeySigReceiveCustomClass);
					this._receiveStateCustomClass = '';
				}
				break;
			case 'receivestatecustomstyle':
				if (this.hasAttribute('receivestatecustomstyle')) {
					this.receiveStateCustomStyle = this.getAttribute('receivestatecustomstyle') as string;
				} else {
					this.clearStringSignalSubscription(this._receiveStateCustomStyle, this._subKeySigReceiveCustomStyle);
					this._receiveStateCustomStyle = '';
				}
				break;
			case 'receivestateshow':
				if (this.hasAttribute('receivestateshow')) {
					this.receiveStateShow = this.getAttribute('receivestateshow') as string;
				} else {
					this.clearBooleanSignalSubscription(this._receiveStateShow, this._subKeySigReceiveShow);
					this._sigNameSendOnShow = '';
				}
				break;
			case 'receivestateshowpulse':
				if (this.hasAttribute('receivestateshowpulse')) {
					this.receiveStateShowPulse = this.getAttribute('receivestateshowpulse') as string;
				} else {
					this.clearBooleanSignalSubscription(this._receiveStateShowPulse, this._subKeySigReceiveShowPulse);
					this._receiveStateShowPulse = '';
				}
				break;
			case 'receivestatehidepulse':
				if (this.hasAttribute('receivestatehidepulse')) {
					this.receiveStateHidePulse = this.getAttribute('receivestatehidepulse') as string;
				} else {
					this.clearBooleanSignalSubscription(this._receiveStateHidePulse, this._subKeySigReceiveHidePulse);
					this._receiveStateHidePulse = '';
				}
				break;
			case 'receivestateenable':
				if (this.hasAttribute('receivestateenable')) {
					this.receiveStateEnable = this.getAttribute('receivestateenable') as string;
				} else {
					this.clearBooleanSignalSubscription(this._receiveStateEnable, this._subKeySigReceiveEnable);
					this._receiveStateEnable = '';
				}
				break;
			case 'sendeventonshow':
				if (this.hasAttribute('sendeventonshow')) {
					this.sigNameSendOnShow = this.getAttribute('sendeventonshow') as string;
				} else {
					this._sigSendOnShow = null;
					this._sigNameSendOnShow = '';
				}
				break;
			case 'disabled':
				if (!this.hasAttribute('customclassdisabled')) {
					this.disabled = newValue as unknown as boolean;
				}
				break;
			case 'gestureable':
				if (this.hasAttribute('gestureable')) {
					this.gestureable = this.toBoolean(newValue);
				} else {
					this.gestureable = false;
				}
				break;
			case 'debug':
				if (this.hasAttribute('debug')) {
					// TODO - set similar to disabled
					this._isDebugEnabled = true;
				} else {
					this._isDebugEnabled = false;
				}
				this.logger.isDebugEnabled = this._isDebugEnabled;
				break;
			case 'trace':
				let _isTraceEnabled: boolean = false;
				if (this.hasAttribute('trace')) {
					// TODO - set similar to disabled
					_isTraceEnabled = true;
				} else {
					_isTraceEnabled = false;
				}
				this.logger.isTraceEnabled = _isTraceEnabled;
				break;
			case 'dir':
				const newDir = this.getAttribute('dir') || '';
				if (newDir !== this.dir) {
					this.dir = newDir;
				}
				break;
			case 'appendclasswheninviewport':
				if (this.hasAttribute('appendclasswheninviewport')) {
					this.appendClassWhenInViewPort = this.getAttribute('appendClassWhenInViewport') as string;
				}
				break;
			default:
				break;
		}
	}

	/**
	 * Storing the component defined template used on repainting to be able to
	 * restore the template initially defined again.
	 * This method should be called before any action is did on component template.
	 *
	 * @return {void}
	 */
	protected cacheComponentChildrens(): void {
		// Note:
		// * changed element:Element to element:any to fix typedoc issue with element.isConnected.
		// ( changing to element:Node did not work even though Node is the object that has the isConnected property
		// https://developer.mozilla.org/en-US/docs/Web/API/Node/isConnected )
		this.childrenOfCurrentNode = Array.from(this.children).filter((element: any) => {
			return element.isConnected;
		}) as [HTMLElement];
	}

	/**
	 * Repaint the component by detach the component from the DOM and
	 * attaching it again.
	 *
	 * @private
	 * @memberof Ch5Textinput
	 * @return {void}
	 */
	protected repaint(): void {
		try {
			const parentNode: HTMLElement = this.parentNode as HTMLElement;

			this._wasInstatiated = false;

			if (this.hasChildNodes() === true) {
				for (let i = this.childNodes.length; i--;) {

					let validToRemove = true;

					if (this.childrenOfCurrentNode && this.childrenOfCurrentNode.length > 0) {
						Array.from(this.childrenOfCurrentNode as [HTMLElement]).filter((element: HTMLElement) => {
							if (element !== null && Object.is(element, this.childNodes[i])) {
								validToRemove = false;
							}
						});
					}

					if (validToRemove === true) {
						this.removeChild(this.childNodes[i]);
					}
				}

				const _shortLifeElement = document.createElement('div');
				if (parentNode !== null) {
					parentNode.insertBefore(_shortLifeElement, this.nextSibling);
					this.remove();
					(_shortLifeElement.parentNode as HTMLElement).insertBefore(this, _shortLifeElement.nextSibling);
					_shortLifeElement.remove();
				}
			}
		} catch (e) {
			console.log('Error encountered during repaint ' + ' crId: ' + this.getCrId() + ' error ', e)
		}
	}

	/**
	 * Placeholder. Should be extended in child classes
	 */
	protected updateCssClasses(el?: HTMLElement) {
		this.logger.log("from common - updateCssClasses()");
		// placeholder;
	}

	protected updateForChangeInCustomCssClass() {
		const targetElement: HTMLElement = this.getTargetElementForCssClassesAndStyle();
		this.logger.start("updateForChangeInCustomCssClass()");
		this.logger.log("updateForChangeInCustomCssClass()", this._prevAddedCustomClasses);
		this.logger.log("from common - updateForChangeInCustomCssClass()", this.customClass);

		this._prevAddedCustomClasses.forEach((className: string) => {
			if ('' !== className) {
				targetElement.classList.remove(className);
			}
		});
		this._prevAddedCustomClasses = [];

		this.customClass.split(' ').forEach((className: string) => {
			if ('' !== className) {
				this._prevAddedCustomClasses.push(className);
				targetElement.classList.add(className);
			}
		});
		this.logger.stop();
	}

	protected updateForChangeInStyleCss() {
		const targetElement: HTMLElement = this.getTargetElementForCssClassesAndStyle();
		this.logger.log("from common - updateForChangeInStyleCss()");

		targetElement.style.cssText = this.customStyle;
	}

	protected updateForChangeInShowStatusOld() {
		const targetElement: HTMLElement = this;
		this.logger.log("from common - updateForChangeInShowStatus()");
		// show/hide
		if (false === this._show) {
			this.handleHide(targetElement);
		} else {
			this.handleShow(targetElement);
		}
	}

	protected updateForChangeInShowStatus() {
		const targetElement: HTMLElement = this;

		this.logger.log("from common - updateForChangeInShowStatus()");
		if (this.hasAttribute('noshowtype')) {
			this.noshowType = this.getAttribute('noshowtype') as TCh5ShowType;
		} else {
			this.noshowType = 'display';
		}

		// show/hide
		if (false === this._show) {
			this.handleHide(targetElement);
		} else {
			this.handleShow(targetElement);
		}
	}

	protected handleHide(targetElement: HTMLElement) {
		this.beforeHandlingHide();
		this.logger.log('handleHide');
		this.sendShowSignal(false);

		switch (this._noshowType) {
			case 'visibility':
				targetElement.classList.add(this._cssClassHideVisibility);
				targetElement.classList.remove(this._cssClassHideDisplay);
				break;
			case 'display':
				targetElement.classList.add(this._cssClassHideDisplay);
				targetElement.classList.remove(this._cssClassHideVisibility);
				break;
			case 'remove':
				targetElement.classList.remove(this._cssClassHideDisplay);
				targetElement.classList.remove(this._cssClassHideVisibility);
				if (null !== this.parentElement && undefined !== this.parentElement) {
					this._cachedParentEl = this.parentElement;
					this.logger.log(' removes element from DOM due to change in show signal, cached parent element')
					if (null !== this.nextElementSibling && undefined !== this.nextElementSibling) {
						this._nextSiblingIndexInParentChildNodes = (Array.from(this.parentElement.childNodes)).findIndex(item => item === this.nextElementSibling)
						this._cachedNextSibling = this.nextElementSibling;
						this.logger.log(' cached sibling element')
					}
					this._keepListeningOnSignalsAfterRemoval = true;
					this._isDetachedFromDom = true;
					this.parentElement.removeChild(this);
				}
				break;
		}
		this.afterHandlingHide();
	}

	protected handleShow(targetElement: HTMLElement) {
		this.beforeHandlingShow();
		this.logger.log('handleShow');
		targetElement.classList.remove(this._cssClassHideDisplay);
		targetElement.classList.remove(this._cssClassHideVisibility);

		if (null !== this._cachedParentEl && typeof this._cachedParentEl !== 'undefined') {
			const cp = this._cachedParentEl;
			this._cachedParentEl = null;

			if (null !== this._cachedNextSibling
				&& typeof this._cachedNextSibling !== 'undefined'
				&& cp === this._cachedNextSibling.parentElement) {
				const cs = this._cachedNextSibling;
				this._cachedNextSibling = null;
				cp.insertBefore(this, cs);
				this.logger.log(' inserted element before cached sibling due to change in show signal')
				this._keepListeningOnSignalsAfterRemoval = false;

			} else {
				if (this._nextSiblingIndexInParentChildNodes) {
					const cs = cp.childNodes[this._nextSiblingIndexInParentChildNodes];
					cp.insertBefore(this, cs);
				} else {
					cp.appendChild(this);
				}
				this.logger.log(' appended element to parent due to change in show signal')
				this._keepListeningOnSignalsAfterRemoval = false;
			}

			this._isDetachedFromDom = false;
		}

		this.sendShowSignal(true);
		this.afterHandlingShow();
	}

	/**
	 * Placeholder method. If needed can be overridden in child classes
	 */
	protected beforeHandlingShow() {
		// this.logger.log('common - beforeHandlingShow()');
		return;
	}

	/**
	 * Placeholder method. If needed can be overridden in child classes
	 */
	protected afterHandlingShow() {
		// this.logger.log('common - afterHandlingShow()');
		return;
	}

	/**
	 * Placeholder method. If needed can be overridden in child classes
	 */
	protected beforeHandlingHide() {
		// this.logger.log('common - beforeHandlingHide()');
		return;
	}

	/**
	 * Placeholder method. If needed can be overridden in child classes
	 */
	protected afterHandlingHide() {
		// this.logger.log('common - afterHandlingHide()');
		return;
	}

	protected updateForChangeInDisabledStatus() {
		const targetElement: HTMLElement = this.getTargetElementForCssClassesAndStyle();
		this.logger.log("from common - updateForChangeInDisabledStatus()");
		if (this._disabled === true) {
			targetElement.classList.add(this.getCssClassDisabled());
		} else {
			targetElement.classList.remove(this.getCssClassDisabled());
		}
	}

	protected getTargetElementForCssClassesAndStyle(): HTMLElement {
		return this as HTMLElement;
	}

	/**
	 * Initializes the values of the common attributes, taking into account the attribute values declared in the HTML
	 */
	protected initAttributes() {
		this.applyPreConfiguredAttributes();

		if (this.hasAttribute('disabled') && !this.hasAttribute('customclassdisabled') && this.ignoreAttributes.includes('disabled') === false) {
			this.disabled = this.getAttribute('disabled') as unknown as boolean;
		}
		if (this.hasAttribute('debug') && this.ignoreAttributes.includes('debug') === false) {
			this._isDebugEnabled = true;
		}
		if (this.hasAttribute('show') && this.ignoreAttributes.includes('show') === false) {
			this.show = this.getAttribute('show') as unknown as boolean;
		}

		if (this.hasAttribute('customclass') && this.ignoreAttributes.includes('customclass') === false) {
			this.customClass = this.getAttribute('customclass') as string;
			this.updateForChangeInCustomCssClass();
		}
		if (this.hasAttribute('customstyle') && this.ignoreAttributes.includes('customstyle') === false) {
			this.customStyle = this.getAttribute('customstyle') as string;
			this.updateForChangeInStyleCss();
		}
		if (this.hasAttribute('noshowtype') && this.ignoreAttributes.includes('noshowtype') === false) {
			this.noshowType = this.getAttribute('noshowtype') as TCh5ShowType;
		}
		if (this.hasAttribute('receivestatecustomclass') && this.ignoreAttributes.includes('receivestatecustomclass') === false) {
			this.receiveStateCustomClass = this.getAttribute('receivestatecustomclass') as string;
		}
		if (this.hasAttribute('receivestatecustomstyle') && this.ignoreAttributes.includes('receivestatecustomstyle') === false) {
			this.receiveStateCustomStyle = this.getAttribute('receivestatecustomstyle') as string;
		}
		if (this.hasAttribute('receivestateshow') && this.ignoreAttributes.includes('receivestateshow') === false) {
			this.receiveStateShow = this.getAttribute('receivestateshow') as string;
		}
		if (this.hasAttribute('receivestateshowpulse') && this.ignoreAttributes.includes('receivestateshowpulse') === false) {
			this.receiveStateShowPulse = this.getAttribute('receivestateshowpulse') as string;
		}
		if (this.hasAttribute('receivestatehidepulse') && this.ignoreAttributes.includes('receivestatehidepulse') === false) {
			this.receiveStateHidePulse = this.getAttribute('receivestatehidepulse') as string;
		}
		if (this.hasAttribute('receivestateenable') && this.ignoreAttributes.includes('receivestateenable') === false) {
			this.receiveStateEnable = this.getAttribute('receivestateenable') as string;
		}
		if (this.hasAttribute('sendeventonshow') && this.ignoreAttributes.includes('sendeventonshow') === false) {
			this.sigNameSendOnShow = this.getAttribute('sendeventonshow') as string;
		}
		if (this.hasAttribute('gestureable') && this.ignoreAttributes.includes('gestureable') === false) {
			this.gestureable = this.toBoolean(this.getAttribute('gestureable') as string);
		}
		this.dir = this.getAttribute('dir') || Ch5Common.DIRECTION[0];
		if (this.hasAttribute('appendclasswheninviewport') && this.ignoreAttributes.includes('appendclasswheninviewport') === false) {
			this.appendClassWhenInViewPort = this.getAttribute('appendclasswheninviewport') as string;
			subscribeInViewPortChange(this, (isInViewPort: boolean) => {
				this.updateElementVisibility(isInViewPort);
				this.updateInViewPortClass();
			});
		}
	}

	protected attachEventListeners() {
		// placeholder in case something will be needed in the future
	}
	protected removeEventListeners() {
		// placeholder in case something will be needed in the future
	}

	/**
	 * Helper method. For internal use.
	 */
	protected _checkAndSetStringValue(value: any, defaultValue: string = ''): string {
		if (isNil(value)) {
			value = defaultValue;
		}
		return value;
	}

	/**
	 * Helper method. For internal use.
	 */
	protected clearStringSignalSubscription(sigName: string | null | undefined, subscriptionKey: string) {
		let oldSig: Ch5Signal<string> | null = null;
		if (sigName) {
			const subSigName: string = Ch5Signal.getSubscriptionSignalName(sigName);
			oldSig = Ch5SignalFactory.getInstance().getStringSignal(subSigName);
		}
		if (null !== oldSig && '' !== subscriptionKey) {
			oldSig.unsubscribe(subscriptionKey);
		}
	}

	/**
	 * Helper method. For internal use.
	 */
	protected clearBooleanSignalSubscription(sigName: string | null | undefined, subscriptionKey: string) {
		let oldSig: Ch5Signal<boolean> | null = null;
		if (sigName) {
			const subSigName: string = Ch5Signal.getSubscriptionSignalName(sigName);
			oldSig = Ch5SignalFactory.getInstance().getBooleanSignal(subSigName);
		}
		if (null !== oldSig && '' !== subscriptionKey) {
			oldSig.unsubscribe(subscriptionKey);
		}
	}

	/**
	 * Helper method. For internal use.
	 */
	protected clearNumberSignalSubscription(sigName: string | null | undefined, subscriptionKey: string) {
		let oldSig: Ch5Signal<number> | null = null;
		if ('' !== sigName
			&& null !== sigName
			&& undefined !== sigName) {
			const subSigName: string = Ch5Signal.getSubscriptionSignalName(sigName);
			oldSig = Ch5SignalFactory.getInstance().getNumberSignal(subSigName);
		}
		if (null !== oldSig && '' !== subscriptionKey) {
			oldSig.unsubscribe(subscriptionKey);
		}
	}

	protected sendShowSignal(value: boolean) {
		this.logger.log('sendShowSignal ' + value + ' ' + this._sigNameSendOnShow);
		if ('' !== this._sigNameSendOnShow) {
			const sig = Ch5SignalFactory.getInstance().getBooleanSignal(this._sigNameSendOnShow);

			if (null !== sig) {
				sig.publish(value);
			}
		}
	}

	protected attributeChangeHandler(attr: string, oldValue: string, newValue: string): string {
		let attributeValue = '';
		if (this.hasAttribute(attr)) {
			if (oldValue !== newValue) {
				attributeValue = newValue;
			} else {
				attributeValue = oldValue;
			}
		}
		return attributeValue;
	}

	/**
	 * applies pre-configured attributes to the current element if those attributes are not already present
	 */
	protected applyPreConfiguredAttributes(): void {
		const preConfiguredAttributes = Ch5Config.getAttributesForElement(this);

		for (const attrName in preConfiguredAttributes) {
			if (preConfiguredAttributes.hasOwnProperty(attrName)) {
				if (!this.hasAttribute(attrName)) {
					this.setAttribute(attrName, preConfiguredAttributes[attrName]);
				}
			}
		}
	}

	protected _attributeValueAsString(attrName: string) {
		let attributeValue = '';
		attrName = attrName.toLowerCase();
		if (this.hasAttribute(attrName)) {
			attributeValue = '' + this.getAttribute(attrName); // convert to string
		}
		return attributeValue;
	}

	/**
	 * Clean the component content
	 * To avoid items duplication when a component is cloned
	 *
	 * @return {void}
	 */
	protected contentCleanUp(): void {
		if (this.children.length) {
			const children = Array.from(this.children);
			children.forEach(item => item.nodeName !== 'TEMPLATE' && item.remove());
		}
	}

	/**
	 * Override this method to replace the default value 'ch5-disabled' with a more appropriate one (e.g. ch5-button--disabled)
	 */
	public getCssClassDisabled() {
		return 'ch5-disabled';
	}

	protected unsubscribeFromSignals() {
		if (false === this._keepListeningOnSignalsAfterRemoval) {
			this.clearBooleanSignalSubscription(this._receiveStateEnable, this._subKeySigReceiveEnable);
			this._receiveStateEnable = '';
			this.clearBooleanSignalSubscription(this._receiveStateShow, this._subKeySigReceiveShow);
			this._receiveStateShow = '';
			this.clearBooleanSignalSubscription(this._receiveStateShowPulse, this._subKeySigReceiveShowPulse);
			this._receiveStateShowPulse = '';
			this.clearBooleanSignalSubscription(this._receiveStateHidePulse, this._subKeySigReceiveHidePulse);
			this._receiveStateHidePulse = '';
			this.clearStringSignalSubscription(this._receiveStateCustomStyle, this._subKeySigReceiveCustomStyle);
			this._receiveStateCustomStyle = '';
			this.clearStringSignalSubscription(this._receiveStateCustomClass, this._subKeySigReceiveCustomClass);
			this._receiveStateCustomClass = '';
		}
	}

	/**
	 * Invoke an incompatibility warning when an attribute cannot work as
	 * expected because of the component definition.
	 *
	 * A good example in this case is `pagedSwipe` attribute which cannot work
	 * properly when the list size doesn't correspond to at least two pages.
	 *
	 * @param {string} attribute the attribute name to invoke incompatibility
	 */
	protected invokePropIncompatibility(attribute: string): void {
		switch (attribute) {
			case 'pagedSwipe':
				console.warn(this.definePropIncompatibilityInfo(
					attribute,
					[
						'size',
						'endless'
					]
				));
				break;
		}
	}

	// Returns a function, that, as long as it continues to be invoked, will not
	// be triggered. The function will be called after it stops being called for
	// `wait` milliseconds.
	public debounce = (func: any, wait: number) => {
		let timeout: any;
		return function executedFunction(...args: any[]) {
			const later = () => {
				window.clearTimeout(timeout);
				func(...args);
			};
			// if (timeout) {
			window.clearTimeout(timeout);
			// }
			timeout = window.setTimeout(later, wait);
		};
	};

	/**
	 * Converts value to boolean
	 * Applicable for 'true', 'false', and null
	 * @private
	 * @param {string|boolean} str
	 * @returns {boolean}
	 */
	protected toBoolean(val: any, isEmptyValueEqualToTrue = false): boolean {
		const str = String(val).toLowerCase().trim();
		switch (str) {
			case "true": case "yes": case "1":
				return true;
			case "false": case "no": case "0":
				return false;
			case "": case null: case undefined: case "null": case "undefined":
				if (isEmptyValueEqualToTrue === true) {
					return true;
				} else {
					return false;
				}
			default:
				return false;
		}
	}

	/**
	 * Used after the language is changed when special actions has to be done
	 * For example when translating you have to parse the component children or some other actions
	 * @param {string} section
	 * @return {void}
	 */
	protected translateCallback(section: string): void {
		// if custom actions has to be done on translation
	}

	protected componentLoadedEvent(elementName: string, idValue: string) {
		publishEvent('object', elementName, { loaded: true, id: idValue });
		// publishEvent('object', `ch5-list:${this.id}`, { loaded: true, id: this.id });
	}
	protected updateInViewPortClass() {
		const targetElement: HTMLElement = this.getTargetElementForCssClassesAndStyle();
		this.logger.log("from common - updateInViewPortClass()");

		if (this._appendClassWhenInViewPort !== '') {
			if (this.elementIsInViewPort) {
				targetElement.classList.add(this._appendClassWhenInViewPort);
			} else {
				targetElement.classList.remove(this._appendClassWhenInViewPort);
			}
		}
	}

	/**
	 * Defines the information to be logged on
	 *
	 * @param {string} attribute
	 * @param {string[]} reasons
	 */
	private definePropIncompatibilityInfo(attribute: string, reasons: string[]): string {
		const reasonsList = reasons.join(',');
		return `For element #${this.id} - ${attribute} doesn't work as expected. See(${reasonsList})`;
	}

	public updateElementVisibility(visible: boolean) {
		this.elementIsVisible = visible;
	}

	/**
	 * Initialize common mutation observer used in each component for checking component visibility
	 *
	 * @param element
	 */
	public initCommonMutationObserver(element: Ch5Common) {
		this._commonMutationObserver = new Ch5MutationObserver(this);
		this._commonMutationObserver.isConnected = true;

		let target = element as HTMLElement;
		while (Ch5MutationObserver.checkElementValidity(target)) {
			this._commonMutationObserver.observe(target);
			target = target.parentNode as HTMLElement;
		}
	}

	public updateElementVisibilityInViewport(visibility: boolean) {
		this.elementIsInViewPort = visibility;
		this.updateInViewPortClass();
	}

	public disconnectCommonMutationObserver() {
		if (!isNil(this._commonMutationObserver) && !isEmpty(this._commonMutationObserver)) {
			this._commonMutationObserver.disconnectObserver();
		}
	}

	/**
	 * Function to check if the input string is truey or not
	 * @param str input string to check if its truey or not
	 * @returns boolean
	 */
	public checkIfValueIsTruey(str: string = '') {
		return (!!str && str.length > 0 && str !== 'false' && str !== '0' && str !== null);
	}

	/**
	 * (Generic) Function to set the value of a given attribute and perform the callback if required
	 * DEVNOTE:
	 * 1. Refer ch5-dpad-button.ts for usage example
	 * 2. The "attrKeyPvt" and "attrKeyPvt" are actual variables to be existing in the same manner within the caller class
	 * @param caller the dpad child component
	 * @param attrKey receiveState* for the child component
	 * @param value to set
	 * @returns
	 */
	public setValueForReceiveStateString(params: TCh5CreateReceiveStateSigParams) {
		const { caller, attrKey, value, callbackOnSignalReceived } = params;
		this.logger.log(`set ${attrKey}(\'' + ${value} + ')`);

		const attrKeyPvt = '_' + attrKey;
		const attrKeySigName = '_' + attrKey + 'SignalValue';
		if (!value || caller[attrKeyPvt] === value) {
			return;
		}

		this.clearStringSignalSubscription(caller[attrKeyPvt], caller[attrKeySigName]);

		caller[attrKeyPvt] = value;

		const recSigShowPulseName: string = Ch5Signal.getSubscriptionSignalName(caller[attrKeyPvt]);
		const recSig: Ch5Signal<string> | null = Ch5SignalFactory.getInstance().getStringSignal(recSigShowPulseName);

		if (null === recSig) {
			return;
		}

		caller[attrKeySigName] = recSig.subscribe((newValue: string) => {
			if (callbackOnSignalReceived !== null) {
				callbackOnSignalReceived(newValue);
			}
		});
	}

	/**
	 * (Generic) Function to set the value of a given attribute and perform the callback if required
	 * DEVNOTE:
	 * 1. Refer ch5-dpad-button.ts for usage example
	 * 2. The "attrKeyPvt" and "attrKeyPvt" are actual variables to be existing in the same manner within the caller class
	 * @param caller the dpad child component
	 * @param attrKey receiveState* for the child component
	 * @param value to set
	 * @returns
	 */
	public setValueForReceiveStateBoolean(params: TCh5CreateReceiveStateSigParams) {
		const { caller, attrKey, value, callbackOnSignalReceived } = params;
		this.logger.log(`set ${attrKey}(\'' + ${value} + ')`);

		const attrKeyPvt = '_' + attrKey;
		const attrKeySigName = '_' + attrKey + 'SignalValue';
		if (!value || caller[attrKeyPvt] === value) {
			return;
		}

		this.clearBooleanSignalSubscription(caller[attrKeyPvt], caller[attrKeySigName]);

		caller[attrKeyPvt] = value;

		const recSigShowPulseName: string = Ch5Signal.getSubscriptionSignalName(caller[attrKeyPvt]);
		const recSig: Ch5Signal<boolean> | null = Ch5SignalFactory.getInstance().getBooleanSignal(recSigShowPulseName);

		if (null === recSig) {
			return;
		}

		caller[attrKeySigName] = recSig.subscribe((newValue: boolean) => {
			if (callbackOnSignalReceived !== null) {
				callbackOnSignalReceived(newValue);
			}
		});
	}

	// protected setCommonBooleanProperty(property: any, value: boolean) {
	// 	const attribute = property.attributeName.toLowerCase();
	// 	const thisRef = property.componentReference;

	// 	// this[property.variableName + "Initialized"] !== true is for first time - variable isn't declared and is not required
	// 	// This variable is required only for checking first time and making changes when the default value is true
	// 	if (thisRef[property.propertyName] !== value || thisRef[property.variableName + "Initialized"] !== true) {
	// 		thisRef[property.variableName] = value;
	// 		thisRef[property.variableName + "Initialized"] = true;
	// 		if (thisRef.hasAttribute(attribute) === true && (['true', 'false'].indexOf(String(thisRef.getAttribute(attribute))) < 0) && thisRef[property.propertyName] === property.defaultValue) {
	// 			// Remove only for thisRef[property.propertyName] === defaultValue cos it must still show up for its opposite
	// 			thisRef.removeAttribute(attribute);
	// 		} else {
	// 			thisRef.setAttribute(attribute, thisRef[property.propertyName].toString());
	// 		}
	// 		if (property.callback !== null) {
	// 			property.callback();
	// 		}
	// 	}
	// }

	protected setAttributeAndProperty(property: ICh5AttributeAndPropertySettings, value: any, setFromSignal: boolean = false) {
		this.logger.log('setAttributeAndProperty: ' + property.attributeName + ' - "' + value + '"');
		const attribute = property.attributeName.toLowerCase();
		const thisRef = property.componentReference;

		if (property.type === "boolean") {

			let valueToSet: boolean = false;
			if (typeof value === property.type) {
				valueToSet = value;
			} else {
				if (this.hasAttribute(attribute)) {
					let tempVal = value;
					if ([true, false, "true", "false", "0", "1", 0, 1, '', null].indexOf(tempVal) < 0) {
						tempVal = property.default;
					}
					valueToSet = this.toBoolean(tempVal, property.valueOnAttributeEmpty);
				} else {
					valueToSet = property.default;
				}
			}

			if (thisRef[property.propertyName] !== valueToSet || setFromSignal === true || thisRef[property.variableName + "Initialized"] !== true || String(value) !== String(valueToSet)) {

				// this[property.variableName + "Initialized"] !== true is for first time - variable isn't declared and is not required
				// This variable is required only for checking first time and making changes when the default value is true
				thisRef[property.variableName] = valueToSet;
				thisRef[property.variableName + "Initialized"] = true;
				// enumeratedValues is always present for boolean.
				if (property.enumeratedValues && property.enumeratedValues.length > 0 && property.enumeratedValues.indexOf(String(thisRef.getAttribute(value))) < 0) {
					if (property.removeAttributeOnNull === true) {
						if (!this.hasAttribute(attribute)) {
							if (setFromSignal === true) {
								thisRef.setAttribute(attribute, valueToSet.toString());
							} else {
								thisRef.removeAttribute(attribute);
							}
						} else {
							thisRef.setAttribute(attribute, valueToSet.toString());
						}
					} else {
						thisRef.setAttribute(attribute, valueToSet.toString());
					}
				} else {
					thisRef.setAttribute(attribute, valueToSet.toString());
				}

				if (!_.isNil(property.callback)) {
					property.callback();
				}
			}
		} else if (property.type === "enum") {

			if (thisRef[attribute] !== value) {
				// Implies that the content has to be an enumerated value ONLY
				if (property.enumeratedValues.indexOf(value) >= 0) {
					thisRef.setAttribute(attribute, String(value));
					thisRef[property.variableName] = String(value);
				} else {
					if (!_.isNil(property.default)) {
						thisRef.setAttribute(attribute, String(property.default));
						thisRef[property.variableName] = String(property.default);
					} else {
						thisRef.removeAttribute(attribute);
						thisRef[property.variableName] = String(property.default);
					}
				}

				if (!_.isNil(property.callback)) {
					property.callback();
				}
			}

		} else if (property.type === "string") {

			if (thisRef[attribute] !== value) {
				if (_.isNil(value) || String(value).trim() === "") {
					thisRef.removeAttribute(attribute);
					thisRef[property.variableName] = String(property.default);
				} else {
					thisRef.setAttribute(attribute, String(value));
					thisRef[property.variableName] = String(value);
				}

				if (!_.isNil(property.callback)) {
					property.callback();
				}
			}
		}
	}

	//#endregion

}
