// Copyright (C) 2018 to the present, Crestron Electronics, Inc.
// All rights reserved.
// No part of this software may be reproduced in any form, machine
// or natural, without the express written consent of Crestron Electronics.
// Use of this source code is subject to the terms of the Crestron Software License Agreement
// under which you licensed this source code.

import { ICh5CommonAttributes } from "../../ch5-common/interfaces";
import { TCh5DpadShape, TCh5DpadStretch, TCh5DpadType } from "./t-ch5-dpad";

/**
 * @name Ch5 Dpad
 * @isattribute false
 * @tagName ch5-Dpad
 * @role container
 * @description Ch5 Dpad offers a control set of 5 buttons to preform specific changes
 * @componentVersion 1.0.0
 * @documentation
 * [
 * "`ch5-dpad` element",
 * "***",
 * "DPad <ch5-dpad> component consists of up, down, left, right and center buttons arranged in a grid. ",
 * "The DPad has a default theme associated with it. The center button can contain customizable text. ",
 * "Each button can send signals on click / touch events."
 * ]
 * @snippets
 * [
 * ]
 * 
 */

export interface ICh5DpadAttributes extends ICh5CommonAttributes {
    /**
     * @documentation
     * [
     * "`contractName` attribute",
     * "***",
     * "Defines the primary contract name to derive the component's contract details."
     * ]
     * @name contractName
     */
    contractName: string;

    /**
     * @documentation
     * [
     * "`type` attribute",
     * "***",
     * "Overrides the appearance of each of the buttons inside <ch5-dpad> with alternative CSS ",
     * "defined in classes defined with ch5-dpad--type where type is the value of the property. "​,
     * "If no "type" is provided, type of 'default' is used."
     * ]
     * @name type
     * @default default
     */
    type: TCh5DpadType;

    /**
     * @documentation
     * [
     * "`type` shape",
     * "***",
     * "Sets the overall <ch5-dpad> component shape to plus or circle."
     * ]
     * @name shape
     * @default plus
     */
    shape: TCh5DpadShape;

    /**
     * @documentation
     * [
     * "`type` stretch",
     * "***",
     * "When the stretch property is set, the component inherits the width or/and height of the container. ",
     * "If stretch by height is used, the <ch5-dpad> will be responsive based on the width of the container. ",
     * "If stretch width is applied, the <ch5-dpad> will be responsive based on the height of the container. ",
     * "This implies that the container height is picked for width and container width is picked for height ",
     * "to ensure that the overall shape of the component is a 'square' in nature (equal in width and height ",
     * "for the shapes of plus and circle)."
     * ]
     * @name stretch
     */
    stretch: TCh5DpadStretch;

    /**
     * @documentation
     * [
     * "`type` useContractforEnable",
     * "***",
     * "If the contract name exists, by default this becomes true. ",
     * "If the contract name does not exist, by default this becomes false. ",
     * "If this value is set to true then the value received from the contract will be considered to enable ",
     * "<ch5-dpad> tag and also to enable the buttons under <ch5-dpad> component i.e. <ch5-dpad-button-left>, ",
     * "<ch5-dpad-button-right>, <ch5-dpad-button-top>, <ch5-dpad-button-bottom>, <ch5-dpad-button-center>. ",
     * "The names from the contract will be different for each of the buttons and the overall <ch5-dpad> component. ",
     * "The details can be seen in the table above."
     * ]
     * @name useContractforEnable
     * @default false
     */
    useContractforEnable: boolean;

    /**
     * @documentation
     * [
     * "`type` useContractForShow",
     * "***",
     * "If the contract name exists, by default this becomes true. ",
     * "If the contract name does not exist, by default this becomes false. ",
     * "If this value is set to true then the value received from the contract will be considered to show / hide ",
     * "<ch5-dpad> tag. The names from the contract will be different for each of the buttons and the overall ",
     * "<ch5-dpad> component. The details can be seen in the table above."
     * ]
     * @name useContractForShow
     * @default false
     */
    useContractForShow: boolean;

    /**
     * @documentation
     * [
     * "`type` useContractForCustomClass",
     * "***",
     * "If the contract name exists, by default this becomes true. ",
     * "If the contract name does not exist, by default this becomes false. ",
     * "If this value is set to true then the value received from the contract will be considered for remaining ",
     * "ch5-dpad button as a custom class."
     * ]
     * @name useContractForCustomClass 
     * @default false
     */
    useContractForCustomClass: boolean;

    /**
     * @documentation
     * [
     * "`type` useContractForCustomStyle",
     * "***",
     * "If the contract name exists, by default this becomes true. ",
     * "If the contract name does not exist, by default this becomes false. ",
     * "If this value is set to true then the value received from the contract will be considered ",
     * "for the custom style."
     * ]
     * @name useContractForCustomStyle
     * @default false
     */
    useContractForCustomStyle: boolean;

    /**
     * @documentation
     * [
     * "`type` sendEventOnClickStart",
     * "***",
     * "Only applies if contractName is not provided, if this parameter is supplied,",
     * " the join number is applied to the top button, join+1 applies to bottom, ",
     * "join+2 applies to left, join+3 applies to right, join+4 to center ."
     * ]
     * @name sendEventOnClickStart
     */
    sendEventOnClickStart: string;
}