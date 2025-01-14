// Copyright (C) 2018 to the present, Crestron Electronics, Inc.
// All rights reserved.
// No part of this software may be reproduced in any form, machine
// or natural, without the express written consent of Crestron Electronics.
// Use of this source code is subject to the terms of the Crestron Software License Agreement
// under which you licensed this source code.

export type TBoolAttribute = 'false' | 'true';

export type TCh5ShowType = 'visibility' | 'display' | 'remove';

export type TCh5ProcessUriParams = {
  protocol: string;
  user: string;
  password: string;
  url: string;
};

export type TCh5CreateReceiveStateSigParams = {
  caller: any;
  attrKey: string;
  value: string;
  callbackOnSignalReceived: (val: string | boolean) => void;
};
