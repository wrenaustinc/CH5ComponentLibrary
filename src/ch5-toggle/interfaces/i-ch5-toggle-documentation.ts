// Copyright (C) 2018 to the present, Crestron Electronics, Inc.
// All rights reserved.
// No part of this software may be reproduced in any form, machine
// or natural, without the express written consent of Crestron Electronics.
// Use of this source code is subject to the terms of the Crestron Software License Agreement
// under which you licensed this source code.

import { ICh5ToggleAttributes } from ".";
import { ICh5Common } from "../../ch5-common/interfaces";

/**
 * @name Ch5 Toggle
 * @isattribute false
 * @tagName ch5-toggle
 * @role switch
 * @description Ch5 Toggle represents an input with two states behaving like a switch
 * @componentVersion 1.0.0
 * @documentation
 * [
 * "`ch5-toggle` element",
 * "***",
 * "Appears as a two-state switch with easy transition between states. The component has the ",
 * "functionality of an HTML checkbox-type input element."
 * ]
 * @snippets
 * [
 *   {
 *      "prefix": "ch5-toggle:label-on-off",
 *      "description": "Crestron Toggle (Default)",
 *       "body": [
 *         "<ch5-toggle label=\"${1:Alarm}\"",
 *        "\tvalue=\"${2:false}\"",
 *         "\tlabelon=\"${3:On}\"",
 *         "\tlabeloff=\"${4:Off}\"",
 *         "\tsendeventonclick=\"${5:send_switch_value}\"",
 *         "\treceivestatevalue=\"${5:receive_switch_value}\">",
 *         "</ch5-toggle>$0"
 *       ]
 *    },
 *    {
 *       "prefix": "ch5-toggle:icon-on-off",
 *       "description": "Crestron Toggle (Default)",
 *       "body": [
 *         "<ch5-toggle label=\"${1:Alarm}\"",
 *         "\tvalue=\"${2:false}\"",
 *         "\ticonon=\"${3:fas fa-bell}\"",
 *         "\ticonoff=\"${4:fas fa-bell-slash}\"",
 *         "\tsendeventonclick=\"${5:send_switch_value}\"",
 *         "\treceivestatevalue=\"${5:receive_switch_value}\">",
 *         "</ch5-toggle>$0"
 *       ]
 *    }
 * ]
 */
 export interface ICh5ToggleDocumentation extends ICh5Common, ICh5ToggleAttributes {
}