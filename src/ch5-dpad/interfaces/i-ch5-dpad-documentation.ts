// Copyright (C) 2021 to the present, Crestron Electronics, Inc.
// All rights reserved.
// No part of this software may be reproduced in any form, machine
// or natural, without the express written consent of Crestron Electronics.
// Use of this source code is subject to the terms of the Crestron Software License Agreement
// under which you licensed this source code.

import { ICh5Common } from "../../ch5-common/interfaces";
import { ICh5DpadAttributes } from "./index";

/**
 * @name Ch5 Dpad
 * @isattribute false
 * @tagName ch5-dpad
 * @role container
 * @description Ch5 Dpad offers a control set of 5 buttons to preform specific changes
 * @componentVersion 1.0.0
 * @childElements
 * [
 *   {
 *     "tagName": "ch5-dpad-button",
 *     "optional": true,
 *     "childElements": []
 *   }
 * ]
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
 *  {
 *    "prefix": "ch5-dpad:blank",
 *     "description": "Crestron Dpad",
 *     "body": [
 *       "<ch5-dpad>",
 *       "</ch5-dpad>$0"
 *     ]
 *  },
 *  {
 *    "prefix": "ch5-dpad:contractbased",
 *     "description": "Crestron Dpad",
 *     "body": [
 *       "<ch5-dpad id=\"btn_${0:id}\"",
 *       "\tcontractname=\"${1:Contract Name}\"",
 *        ">",
 *       "</ch5-dpad>"
 *     ]
 *  },
 *  {
 *    "prefix": "ch5-dpad:eventbased",
 *     "description": "Crestron Dpad",
 *     "body": [
 *       "<ch5-dpad id=\"btn_${0:id}\"",
 *       "\tsendeventonclickstart=\"${1:Event_Click_Index}\"",
 *        ">",
 *       "</ch5-dpad>"
 *     ]
 *  },
 *  {
 *    "prefix": "ch5-dpad:all-attributes",
 *     "description": "Crestron Dpad",
 *     "body": [
 *       "<ch5-dpad id=\"btn_${0:id}\"",
 *       "\tcontractname=\"${1:Contract Name}\"",
 *       "\tshape=\"${2:Shape}\"",
 *       "\ttype=\"${3:type}\"",
 *       "\tstretch=\"${4:stretch}\"",
 *       "\tusecontractforenable=\"${5:useContractForEnable}\"",
 *       "\tusecontractforshow=\"${6:useContractForShow}\"",
 *       "\tusecontractforcustomclass=\"${7:useContractForCustomClass}\"",
 *       "\tusecontractforcustomstyle=\"${8:useContractForCustomStyle}\"",
 *       "\tsendeventonclickstart=\"${9:sendEventOnClickStart}\"",
 *        ">",
 *       "</ch5-dpad>"
 *     ]
 *   }
 * ]
 * 
 */
export interface ICh5DpadDocumentation extends ICh5Common, ICh5DpadAttributes {
}