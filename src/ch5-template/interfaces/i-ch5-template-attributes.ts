// Copyright (C) 2018 to the present, Crestron Electronics, Inc.
// All rights reserved.
// No part of this software may be reproduced in any form, machine
// or natural, without the express written consent of Crestron Electronics.
// Use of this source code is subject to the terms of the Crestron Software License Agreement
// under which you licensed this source code.

import { ICh5CommonAttributesWoReceiveStateEnable } from "../../ch5-common/interfaces/i-ch5-common-attributes-wo-receivestateenable";

/**
 * @ignore
 */
export interface ICh5TemplateAttributes extends ICh5CommonAttributesWoReceiveStateEnable {
    /**
     * @isattribute true
     * @documentation
     * [
     * "`templateid` attribute",
     * "***",
     * "The ID of the template to be instantiated."
     * ]
     * @name templateid
     * @attributeType "String"
     *
     */
    templateId: string;

    /**
     * @isattribute true
     * @documentation
     * [
     * "`context` attribute",
     * "***",
     *  "In the format of 'original:replacement;' original is the value to be replaced, and replacement ",
     *  "is the replacement value."
     * ]
     * @name context
     * @attributeType "String"
     */
    context: string;

    /**
     * @isattribute true
     * @documentation
     * [
     * "`contractName` attribute",
     * "***",
     *  "A name to be prefixed to all signal names in the template.  ",
     *  ""
     * ]
     * @name contractname
     * @attributeType "String"
     */
    contractName: string;

    /**
     * @isattribute true
     * @documentation
     * [
     * "`booleanJoinOffset` attribute",
     * "***",
     *  "A value to be added to all digital/boolean join numbers provided in the template.  ",
     *  ""
     * ]
     * @name booleanjoinoffset
     * @attributeType "String"
     */
    booleanJoinOffset: string;

    /**
     * @isattribute true
     * @documentation
     * [
     * "`numericJoinOffset` attribute",
     * "***",
     *  "A value to be added to all analog/numeric join numbers provided in the template.  ",
     *  ""
     * ]
     * @name numericjoinoffset
     * @attributeType "String"
     */
    numericJoinOffset: string;

    /**
     * @isattribute true
     * @documentation
     * [
     * "`stringJoinOffset` attribute",
     * "***",
     *  "A value to be added to all serial/string join numbers provided in the template.  ",
     *  ""
     * ]
     * @name stringjoinoffset
     * @attributeType "String"
     */
    stringJoinOffset: string;

}
