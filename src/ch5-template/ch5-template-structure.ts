// Copyright (C) 2018 to the present, Crestron Electronics, Inc.
// All rights reserved.
// No part of this software may be reproduced in any form, machine
// or natural, without the express written consent of Crestron Electronics.
// Use of this source code is subject to the terms of the Crestron Software License Agreement
// under which you licensed this source code.

import { isEmpty, isNil } from 'lodash';
import { Ch5Template } from "./ch5-template";
import { Ch5AugmentVarSignalsNames } from '../ch5-common/ch5-augment-var-signals-names';

export class Ch5TemplateStructure {

    /**
     * The template of the component
     *
     * @private
     * @static
     * @memberof Ch5TemplateStructure
     * @type {Object}
     */
    private static _numInstances: { [key: string]: number; } = {};


    /**
     * ch5-template element
     *
     * @private
     * @memberof Ch5TemplateStructure
     * @type {Ch5Template}
     */
    private _element: Ch5Template = {} as Ch5Template;

    /**
     * The template of the component
     *
     * @private
     * @memberof Ch5TemplateStructure
     * @type {HTMLTemplateElement}
     */
    private _templateElement: HTMLTemplateElement = {} as HTMLTemplateElement;

    /**
     * Wrapper div for the ch5-template content
     */
    private _wrapperDiv: HTMLDivElement = {} as HTMLDivElement;

    /**
     * The id if created an instance of the template
     */
    private _instanceId: string | null = null;

    private _elementIds: string[] | null = null;

    /**
     * @private
     * @param templateIdentifier
     * @returns monotomic incrementing integer for given templateIdentifer
     */
    private static nextInstanceNum(templateIdentifier: string): number {
        const priorNumber = Ch5TemplateStructure._numInstances[templateIdentifier];
        const nextNumber: number = (priorNumber === undefined ? 1 : priorNumber + 1);
        Ch5TemplateStructure._numInstances[templateIdentifier] = nextNumber;
        return nextNumber;
    }

    constructor(element: Ch5Template) {
        this.element = element;
        this.templateElement = document.querySelector('template') as HTMLTemplateElement;
    }

    /**
     * Setter for element property
     *
     * @param {Ch5Template} element
     */
    public set element(element: Ch5Template) {
        if (!isNil(element)) {
            this._element = element;
        }
    }

    /**
     * Getter for element property
     *
     * @return {Ch5Template}
     */
    public get element(): Ch5Template {
        return this._element;
    }

    /**
     * Setter for templateElement property
     *
     * @param {HTMLTemplateElement} template
     */
    public set templateElement(template: HTMLTemplateElement) {
        if (!(isNil(template))) {
            this._templateElement = template;
        }
    }

    /**
     * Getter for templateElement property
     *
     * @return {HTMLTemplateElement}
     */
    public get templateElement(): HTMLTemplateElement {
        return this._templateElement;
    }

    public get instanceId(): string | null {
        return this._instanceId;
    }

    public get elementIds(): string[] | null {
        return this._elementIds;
    }

    // DELETE after 2.0.27
    // /**
    //  * Add default style to ch5-template
    //  */
    // private setDefaultElementStyle(): void {
    //     // set display style only if it was not set by another element (like the ch5-spinner)
    //     if (isEmpty(this.element.style.display)) {
    //         this.element.style.display = "inline";
    //     }
    // }

    private initializeWrapperDiv(): void {
        this._wrapperDiv = document.createElement("DIV") as HTMLDivElement;
        this._wrapperDiv.classList.add("ch5-template-content-wrapper");
    }

    // Get the contents of the template
    private getTemplateContent(templateId: string): HTMLElement {
        this.initializeWrapperDiv();
        let templateContent: HTMLElement;

        if (!isNil(this.templateElement.firstElementChild)) {
            // required for angular (content outside document-fragment)

            // Move all the ch5-template content to a wrapper div
            // The standalone template will be modified directly,
            // if it's used multiple times make sure the wrapper div is created only once
            if (!this.templateElement.children[0].classList.contains("ch5-template-content-wrapper")) {
                while (this.templateElement.children.length > 0) {
                    this._wrapperDiv.appendChild(this.templateElement.children[0]);
                }
                this.templateElement.appendChild(this._wrapperDiv);
            }

            templateContent = this.templateElement.firstElementChild.cloneNode(true) as HTMLElement;
        } else if (!isNil(this.templateElement.content.firstElementChild)) {
            // vanilla JavaScript (content inside document-fragment)
            if (!this.templateElement.content.children[0].classList.contains("ch5-template-content-wrapper")) {
                while (this.templateElement.content.children.length > 0) {
                    this._wrapperDiv.appendChild(this.templateElement.content.children[0]);
                }
                this.templateElement.content.appendChild(this._wrapperDiv);
            }

            templateContent = this.templateElement.content.firstElementChild.cloneNode(true) as HTMLElement;
        } else {
            throw new Error(`[ch5-template] Error: The provided template with the id: "${templateId}" has no content`);
        }
        return templateContent;
    }

    /**
     * Build the ch5-template contents from the template
     * @param templateId
     * @param context
     */
    public generateTemplate(templateId: string, context: string) {
        this.element.info(`Ch5TemplateStructure.generateTemplate(templateId: ${templateId}, context: ${context})`);

        if (isEmpty(templateId)) {
            throw new Error('[ch5-template] Error: No templateId was provided');
        }

        const template = document.getElementById(templateId) as HTMLTemplateElement;
        let newElement: HTMLElement | null = null;

        if (!(isNil(template))) {
            this.templateElement = template as HTMLTemplateElement;
            this.element.info("Ch5TemplateStructure --- the following template will be used:", this.templateElement);
        } else {
            throw new Error(`[ch5-template] Error: No template with the id: "${templateId}" found`);
        }

        // get the "original" and "replacement" pairs from context
        // context attribute can be provided as empty / is optional - no rename will take place
        let contextPairs: string[] = [];
        if (isEmpty(context)) {
            this.element.info(`Context attribute is empty, nothing will be renamed`);
        } else {
            contextPairs = context.split(';');
            this.element.info(`Parsed context attribute: ${contextPairs}`);
        }

        const templateContent: HTMLElement | null = this.getTemplateContent(templateId);
        if (isNil(templateContent)) {
            return;
        }

        try {
            this.element.info("Ch5TemplateStructure.generateTemplate() --- Copying attributes");
            if (!(isNil(templateContent))) {
                // with provided replacement substring: ${parsedContext[1]}`);
                // copy the target template content
                let newInnerHtml: string = templateContent.innerHTML;
                this.element.info("Original template inner HTML before rename: ", newInnerHtml);

                for (let i = 0; i < contextPairs.length; i++) {
                    const parsedContext = contextPairs[i].split(':');

                    this.element.info(`Processing original:replacement pair: ${parsedContext}`);

                    if (parsedContext.length !== 2 || isEmpty(parsedContext[0]) || isEmpty(parsedContext[1])) {
                        console.warn(`[ch5-template] Warning: Invalid context pair structure, expected: "original:replacement", but received "${parsedContext}", moving to the next context pair`);
                        continue;
                    }
                    // remove leading or trailing spaces from context pair key
                    parsedContext[0] = parsedContext[0].trim();
                    this.element.info(`Ch5TemplateStructure --- Count: [${i + 1}/${parsedContext.length}] 
                    Replace original string: ${parsedContext[0]} 
                    with provided replacement string: ${parsedContext[1]}`);

                    const patternIdentifier = new RegExp(parsedContext[0], "g");
                    newInnerHtml = newInnerHtml.replace(patternIdentifier, parsedContext[1]);
                }

                templateContent.innerHTML = newInnerHtml as string;

                // update templateContent attributes to increment join numbers and prefix contract name
                Ch5AugmentVarSignalsNames.differentiateTmplElemsAttrs(templateContent, this.element.contractName, 
                    parseInt(this.element.booleanJoinOffset, 10) || 0, 
                    parseInt(this.element.numericJoinOffset, 10) || 0, 
                    parseInt(this.element.stringJoinOffset, 10) || 0);    
                
                if (this.element.isDebug()) {
                    this.element.info("After substitution and increment/prefix:", templateContent.innerHTML);
                }
            }

            // keep the ch5-template (parent) after its content has been added
            // angular fix for duplicate content
            if (!isNil(this.element.children) && this.element.children.length > 0) {
                this.element.info("Ch5TemplateStructure --- Removing children of: ", this.element);
                // @ts-ignore
                Array.from(this.element.children).forEach((element: HTMLElement) => element.remove())
            }
            if (!isNil(this.element)) {
                newElement = this.element.appendChild(templateContent) as HTMLElement;
            }
        } catch (e) {
            throw new Error(`[ch5-template] Error: Failed to generate content: ${e}`);
        } finally {
            // this.setDefaultElementStyle();
            if (newElement !== null && newElement.children) {
                // create unique id for each instance of this template
                const thisInstanceNum = Ch5TemplateStructure.nextInstanceNum(templateId);
                this._instanceId = `${templateId}:${thisInstanceNum}`;
                newElement.id = this._instanceId;
                // provide unique id for each first level element of the template unless it already has id
                this._elementIds = [];
                for (let childcnt = 0; childcnt < newElement.children.length; childcnt++) {
                    if (!newElement.children[childcnt].id) {
                        newElement.children[childcnt].id = `${this._instanceId}:${childcnt}`;
                    }
                    this._elementIds.push(newElement.children[childcnt].id);
                }

                this.element.info(`Ch5TemplateStructure --- [FINAL] Adding content to ChTemplate: ${this._instanceId}`, newElement);
                this.element = newElement as Ch5Template;

            }
        }
    }
}
