// Copyright (C) 2018 to the present, Crestron Electronics, Inc.
// All rights reserved.
// No part of this software may be reproduced in any form, machine
// or natural, without the express written consent of Crestron Electronics.
// Use of this source code is subject to the terms of the Crestron Software License Agreement
// under which you licensed this source code.

import { ICh5SliderAttributes } from ".";
import { ICh5Common } from "../../ch5-common/interfaces";

/**
 * @name Ch5 Slider
 * @isattribute false
 * @tagName ch5-slider
 * @role slider
 * @description Ch5 Slider inherits the default input range behavior but provides a lot of extra features.
 * @componentVersion 1.0.0
 * @documentation
 * [
 * "`ch5-slider` element",
 * "***",
 * "A component to provide input by dragging a handle. One or two numeric values can be ",
 * "visualized with this component. If two values are used, two handles are provided."
 * ]
 * @snippets
 * [
 *    {
 *       "prefix": "ch5-slider:blank",
 *       "description": "Crestron slider (Blank)",
 *       "body": [
 *           "<ch5-slider>",
 *           "</ch5-slider>$0"
 *       ]
 *    },
 *    {
 *       "prefix": "ch5-slider:default",
 *       "description": "Crestron slider (Default)",
 *       "body": [
 *           "<ch5-slider value=\"${1:20}\"",
 *           "\tmin=\"${2:0}\"",
 *           "\tmax=\"${3:100}\"",
 *           "\tstep=\"${4:20}\"",
 *           "\tsendeventonchange=\"${5:slider_value_on_change}\"",
 *           "\treceivestatevalue=\"${6:receive_slider_value}\">",
 *           "</ch5-slider>$0"
 *       ]
 *   },
 *   {
 *    "prefix": "ch5-slider:range",
 *        "description": "Crestron slider range(If true, we provide two handles to define two values.)",
 *        "body": [
 *            "<ch5-slider value=\"${1:20}\"",
 *            "\tvaluehigh=\"${2:80}\"",
 *            "\tmin=\"${3:0}\"",
 *            "\tmax=\"${4:100}\"",
 *            "\tstep=\"${5:20}\"",
 *            "\trange=\"${6:true}\"",
 *            "\tsendeventonchange=\"${7:slider_value_on_change}\"",
 *            "\treceivestatevalue=\"${8:receive_slider_value}\"",
 *            "\tsendeventonchangehigh=\"${9:slider_value_high_on_change}\"",
 *            "\treceivestatevaluehigh=\"${10:receive_slider_value_high}\">",
 *            "</ch5-slider>$0"
 *        ]
 *    },
 *    {
 *    "prefix": "ch5-slider:ticks",
 *        "description": "Crestron slider ticks(Defines the ticks on the slider, value should be a valid JSON.)",
 *        "body": [
 *            "<ch5-slider value=\"${1:40}\"",
 *            "\tshowtickvalues=\"${2:true}\"",
 *            "\tticks='${3:{\"0\":\"-60\", \"25\":\"-40\", \"50\":\"-20\", \"75\":\"-10\", \"100\": \"0\" }}'",
 *            "\tsendeventonchange=\"${4:slider_value_on_change}\"",
 *            "\treceivestatevalue=\"${5:receive_slider_value}\">",
 *            "</ch5-slider>$0"
 *        ]
 *    }
 * ]
 */
 export interface ICh5SliderDocumentation extends ICh5Common, ICh5SliderAttributes {
}